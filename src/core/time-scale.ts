import type { VisibleRange } from './types';

export interface TimeScaleOptions {
  barSpacing: number;
  rightOffset: number;
  minBarSpacing: number;
  maxBarSpacing: number;
}

const DEFAULT_OPTIONS: TimeScaleOptions = {
  barSpacing: 6,
  rightOffset: 0,
  minBarSpacing: 2,
  maxBarSpacing: 50,
};

/**
 * TimeScale following TradingView lightweight-charts' model.
 *
 * - `_rightOffset` = bars of empty space to the right of the last bar.
 *   Default 0 means the last bar sits at the right edge.
 * - `_barSpacing` controls zoom level.
 * - Visible range: rightBorder = baseIndex + rightOffset,
 *   leftBorder = rightBorder - width/barSpacing + 1
 * - indexToCoordinate: deltaFromRight = baseIndex + rightOffset - index;
 *   x = width - (deltaFromRight + 0.5) * barSpacing
 * - Scrolling modifies rightOffset.
 * - Auto-scroll on new data: rightOffset stays constant, so new bars
 *   naturally appear if the last bar was visible.
 */
export class TimeScale {
  // Minimum visible bars before can't scroll further
  private static readonly MIN_VISIBLE_BARS = 2;

  private _options: TimeScaleOptions;
  /** Canvas width in pixels. */
  private _width: number = 0;
  /** Total number of data bars. */
  private _dataLength: number = 0;
  /** Bars of space to the right of the last bar. */
  private _rightOffset: number = 0;
  /** Bar spacing (zoom level). Stored separately from options so zoomAt can mutate it without cloning options. */
  private _barSpacing: number;

  constructor(options?: Partial<TimeScaleOptions>) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
    this._barSpacing = this._options.barSpacing;
    this._rightOffset = this._options.rightOffset;
  }

  // baseIndex = last bar index = dataLength - 1
  private get _baseIndex(): number {
    return this._dataLength - 1;
  }

  setOptions(options: Partial<TimeScaleOptions>): void {
    this._options = { ...this._options, ...options };
    if (options.barSpacing !== undefined) {
      this._barSpacing = options.barSpacing;
    }
    this._clampBarSpacing();
  }

  setWidth(width: number): void {
    this._width = width;
  }

  /**
   * Set data length.
   * Auto-scroll: rightOffset stays constant, so if the last bar was visible
   * before new data arrived, the new bar naturally appears.
   */
  setDataLength(length: number): void {
    this._dataLength = length;
  }

  get barSpacing(): number {
    return this._barSpacing;
  }

  get rightOffset(): number {
    return this._rightOffset;
  }

  // ── Visible range ──────────────────────────────────────────────────────────

  /**
   * Compute the visible bar index range.
   * rightBorder = baseIndex + rightOffset
   * leftBorder = rightBorder - width/barSpacing + 1
   */
  visibleRange(): VisibleRange {
    if (this._dataLength === 0 || this._width === 0) {
      return { fromIdx: 0, toIdx: 0 };
    }

    const barsInView = this._width / this._barSpacing;
    const rightBorder = this._baseIndex + this._rightOffset;
    const leftBorder = rightBorder - barsInView + 1;

    return {
      fromIdx: Math.max(0, Math.ceil(leftBorder)),
      toIdx: Math.min(this._dataLength - 1, Math.floor(rightBorder)),
    };
  }

  // ── Coordinate conversion ─────────────────────────────────────────────────

  /**
   * Convert a bar index to the x-pixel of its center.
   * deltaFromRight = baseIndex + rightOffset - index
   * x = width - (deltaFromRight + 0.5) * barSpacing
   */
  indexToX(index: number): number {
    const deltaFromRight = this._baseIndex + this._rightOffset - index;
    return this._width - (deltaFromRight + 0.5) * this._barSpacing;
  }

  /**
   * Convert an x-pixel coordinate back to the nearest bar index (not clamped).
   * Inverse of indexToX.
   */
  xToIndex(x: number): number {
    const deltaFromRight = (this._width - x) / this._barSpacing - 0.5;
    return Math.round(this._baseIndex + this._rightOffset - deltaFromRight);
  }

  /**
   * Return the fractional (float) index at an x coordinate.
   * Used internally for zoom stabilization.
   */
  private _floatIndexAtX(x: number): number {
    const deltaFromRight = (this._width - x) / this._barSpacing - 0.5;
    return this._baseIndex + this._rightOffset - deltaFromRight;
  }

  // ── Scrolling ─────────────────────────────────────────────────────────────

  /**
   * Called by the pan handler. Computes the shift in logical bars from the
   * start position and applies it to the saved right offset.
   *
   * Dragging right → x increases → shift is negative → rightOffset decreases
   * → chart moves toward future/recent data.
   */
  scrollTo(startX: number, currentX: number, savedRightOffset: number): void {
    const shift = (startX - currentX) / this._barSpacing;
    this._rightOffset = savedRightOffset + shift;
    this.correctOffset();
  }

  /** Direct offset setter for kinetic scrolling etc. */
  setRightOffset(offset: number): void {
    this._rightOffset = offset;
    this.correctOffset();
  }

  /** Scroll so the last bar is visible at the right edge (reset to configured rightOffset). */
  scrollToEnd(): void {
    this._rightOffset = this._options.rightOffset;
  }

  /**
   * Scroll by pixel amount. Kept for backwards compatibility with
   * axis-drag, keyboard-nav, and kinetic scrolling.
   *
   * Positive deltaX → rightOffset increases → chart shifts to show older data.
   */
  scrollByPixels(deltaX: number): void {
    this._rightOffset += deltaX / this._barSpacing;
    this.correctOffset();
  }

  /**
   * Set scroll offset directly in bars.
   * Kept for backwards compatibility with keyboard-nav (Home key).
   */
  scrollToPosition(position: number): void {
    this._rightOffset = position;
    this.correctOffset();
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────

  /**
   * Zoom keeping the point under cursor stable.
   * TV model: record float index under cursor, change barSpacing by
   * `scale * (barSpacing / 10)`, then adjust rightOffset so that index
   * stays at the same screen x.
   */
  zoomAt(x: number, scale: number): void {
    const oldIdx = this._floatIndexAtX(x);
    const newSpacing = Math.max(
      this._options.minBarSpacing,
      Math.min(this._options.maxBarSpacing, this._barSpacing + scale * (this._barSpacing / 10)),
    );
    if (newSpacing === this._barSpacing) return;
    this._barSpacing = newSpacing;
    const newIdx = this._floatIndexAtX(x);
    this._rightOffset += oldIdx - newIdx;
    this.correctOffset();
  }

  // ── Fit content ───────────────────────────────────────────────────────────

  /** Adjust barSpacing so all data bars fit exactly in the current width. */
  fitContent(): void {
    if (this._dataLength === 0 || this._width === 0) return;
    this._barSpacing = Math.max(
      this._options.minBarSpacing,
      Math.min(this._options.maxBarSpacing, this._width / this._dataLength),
    );
    this._rightOffset = this._options.rightOffset;
  }

  // ── Offset clamping ───────────────────────────────────────────────────────

  correctOffset(): void {
    if (this._dataLength === 0) return;

    const barsInView = this._width / this._barSpacing;

    // Max rightOffset: can't scroll so far left that fewer than MIN_VISIBLE_BARS are visible on the right
    const maxRightOffset = barsInView - TimeScale.MIN_VISIBLE_BARS;
    if (this._rightOffset > maxRightOffset) {
      this._rightOffset = maxRightOffset;
    }

    // Min rightOffset: can't scroll so far right that fewer than MIN_VISIBLE_BARS are visible on the left
    const minRightOffset = -(this._dataLength - TimeScale.MIN_VISIBLE_BARS);
    if (this._rightOffset < minRightOffset) {
      this._rightOffset = minRightOffset;
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _clampBarSpacing(): void {
    this._barSpacing = Math.min(
      this._options.maxBarSpacing,
      Math.max(this._options.minBarSpacing, this._barSpacing),
    );
  }
}
