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

export class TimeScale {
  private _options: TimeScaleOptions;
  /** Canvas width in pixels. */
  private _width: number = 0;
  /** Total number of data bars. */
  private _dataLength: number = 0;
  /**
   * Scroll offset in bars from the right edge.
   * Positive = scrolled left (older data visible).
   */
  private _scrollOffset: number = 0;

  constructor(options?: Partial<TimeScaleOptions>) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
  }

  setOptions(options: Partial<TimeScaleOptions>): void {
    this._options = { ...this._options, ...options };
    this._clampBarSpacing();
  }

  setWidth(width: number): void {
    this._width = width;
  }

  setDataLength(length: number): void {
    const oldLength = this._dataLength;
    this._dataLength = length;

    // Auto-scroll: if user hasn't scrolled away from the right edge,
    // keep the latest data in view as new bars arrive.
    if (length > oldLength && Math.abs(this._scrollOffset) < 1) {
      this._scrollOffset = 0;
    }
  }

  get barSpacing(): number {
    return this._options.barSpacing;
  }

  // ── Visible range ──────────────────────────────────────────────────────────

  /**
   * Compute the visible bar index range from current state.
   * The rightmost visible bar index is: dataLength - 1 - rightOffset - scrollOffset.
   * The leftmost is: rightmost - barsInView + 1.
   * Results are clamped to [0, dataLength-1].
   */
  visibleRange(): VisibleRange {
    if (this._dataLength === 0 || this._width === 0) {
      return { fromIdx: 0, toIdx: 0 };
    }

    const barsInView = this._width / this._options.barSpacing;
    const rightmostIdx =
      this._dataLength - 1 - this._options.rightOffset - this._scrollOffset;
    const leftmostIdx = rightmostIdx - barsInView + 1;

    const fromIdx = Math.max(0, Math.floor(leftmostIdx));
    const toIdx = Math.min(this._dataLength - 1, Math.ceil(rightmostIdx));

    return { fromIdx, toIdx };
  }

  // ── Coordinate conversion ─────────────────────────────────────────────────

  /**
   * Convert a bar index to the x-pixel of its center.
   * The rightmost bar in the data sits at:
   *   x = width - (rightOffset + scrollOffset) * barSpacing
   * Each bar to the left is barSpacing pixels further left.
   */
  indexToX(index: number): number {
    const { barSpacing, rightOffset } = this._options;
    const rightBarX = this._width - (rightOffset + this._scrollOffset) * barSpacing;
    return rightBarX - (this._dataLength - 1 - index) * barSpacing;
  }

  /** Convert an x-pixel coordinate back to the nearest bar index (not clamped). */
  xToIndex(x: number): number {
    const { barSpacing, rightOffset } = this._options;
    const rightBarX = this._width - (rightOffset + this._scrollOffset) * barSpacing;
    const fromRight = (rightBarX - x) / barSpacing;
    return Math.round(this._dataLength - 1 - fromRight);
  }

  // ── Scrolling ─────────────────────────────────────────────────────────────

  scrollByPixels(deltaX: number): void {
    this._scrollOffset += deltaX / this._options.barSpacing;
  }

  /** Scroll so the last bar is visible at the right edge (no rightOffset). */
  scrollToEnd(): void {
    this._scrollOffset = 0;
  }

  /** Set scroll offset directly in bars. */
  scrollToPosition(position: number): void {
    this._scrollOffset = position;
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────

  /**
   * Zoom the bar spacing by `factor`, keeping the bar under cursor `x` stable.
   */
  zoomAt(x: number, factor: number): void {
    const oldSpacing = this._options.barSpacing;
    const newSpacing = Math.min(
      this._options.maxBarSpacing,
      Math.max(this._options.minBarSpacing, oldSpacing * factor),
    );
    if (newSpacing === oldSpacing) return;

    // The bar index under the cursor must stay at x after the zoom.
    // indexToX(idx) = rightBarX - (dataLength-1-idx) * spacing
    // => rightBarX = x + (dataLength-1-idx) * spacing
    // We need to adjust scrollOffset so that the new rightBarX satisfies this.
    const { rightOffset } = this._options;
    const rightBarX = this._width - (rightOffset + this._scrollOffset) * oldSpacing;
    const barsFromRight = (rightBarX - x) / oldSpacing;
    // After zoom the cursor should still be barsFromRight bars from the right bar
    // x = newRightBarX - barsFromRight * newSpacing
    // newRightBarX = x + barsFromRight * newSpacing
    // newRightBarX = width - (rightOffset + newScrollOffset) * newSpacing
    // => newScrollOffset = (width - newRightBarX) / newSpacing - rightOffset
    const newRightBarX = x + barsFromRight * newSpacing;
    const newScrollOffset = (this._width - newRightBarX) / newSpacing - rightOffset;

    this._options = { ...this._options, barSpacing: newSpacing };
    this._scrollOffset = newScrollOffset;
  }

  // ── Fit content ───────────────────────────────────────────────────────────

  /** Adjust barSpacing so all data bars fit exactly in the current width. */
  fitContent(): void {
    if (this._dataLength === 0 || this._width === 0) return;
    const spacing = this._width / this._dataLength;
    this._options = {
      ...this._options,
      barSpacing: Math.min(
        this._options.maxBarSpacing,
        Math.max(this._options.minBarSpacing, spacing),
      ),
    };
    this._scrollOffset = 0;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _clampBarSpacing(): void {
    const { barSpacing, minBarSpacing, maxBarSpacing } = this._options;
    this._options.barSpacing = Math.min(maxBarSpacing, Math.max(minBarSpacing, barSpacing));
  }
}
