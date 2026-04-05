import type { EventHandler } from './event-router';
import type { TimeScale } from '../core/time-scale';
import type { PriceScale } from '../core/price-scale';
import type { ColumnStore } from '../core/types';

export interface RangeSelectionStats {
  fromTime: number;
  toTime: number;
  fromPrice: number;
  toPrice: number;
  high: number;
  low: number;
  priceChange: number;
  percentChange: number;
  barCount: number;
  totalVolume: number;
}

export type RangeSelectionCallback = (stats: RangeSelectionStats | null) => void;

/**
 * RangeSelectionHandler — allows users to drag-select a time range on the
 * chart and see summary statistics (high, low, change, volume).
 *
 * Activated by setting `active = true`. When active, pointer-down starts a
 * selection; pointer-move extends it; pointer-up finalizes and fires the
 * callback.
 */
export class RangeSelectionHandler implements EventHandler {
  private _active = false;
  private _selecting = false;
  private _startX = 0;
  private _startY = 0;
  private _endX = 0;
  private _endY = 0;
  private _timeScale: TimeScale;
  private _priceScale: PriceScale;
  private _getStore: () => ColumnStore | null;
  private _requestRepaint: () => void;
  private _callbacks: RangeSelectionCallback[] = [];

  constructor(
    timeScale: TimeScale,
    priceScale: PriceScale,
    getStore: () => ColumnStore | null,
    requestRepaint: () => void,
  ) {
    this._timeScale = timeScale;
    this._priceScale = priceScale;
    this._getStore = getStore;
    this._requestRepaint = requestRepaint;
  }

  get active(): boolean { return this._active; }
  set active(value: boolean) {
    this._active = value;
    if (!value) this.clear();
  }

  get selecting(): boolean { return this._selecting; }
  get startX(): number { return this._startX; }
  get startY(): number { return this._startY; }
  get endX(): number { return this._endX; }
  get endY(): number { return this._endY; }

  onRangeSelected(callback: RangeSelectionCallback): void {
    this._callbacks.push(callback);
  }

  offRangeSelected(callback: RangeSelectionCallback): void {
    const idx = this._callbacks.indexOf(callback);
    if (idx >= 0) this._callbacks.splice(idx, 1);
  }

  clear(): void {
    this._selecting = false;
    this._requestRepaint();
    for (const cb of this._callbacks) cb(null);
  }

  onPointerDown(x: number, y: number): boolean | void {
    if (!this._active) return;
    this._selecting = true;
    this._startX = x;
    this._startY = y;
    this._endX = x;
    this._endY = y;
    this._requestRepaint();
    return true;
  }

  onPointerMove(x: number, y: number): boolean | void {
    if (!this._selecting) return;
    this._endX = x;
    this._endY = y;
    this._requestRepaint();
    return true;
  }

  onPointerUp(): boolean | void {
    if (!this._selecting) return;
    this._selecting = false;

    const stats = this._computeStats();
    if (stats) {
      for (const cb of this._callbacks) cb(stats);
    }
  }

  onKeyDown(key: string): boolean | void {
    if (key === 'Escape' && this._selecting) {
      this.clear();
      return true;
    }
  }

  private _computeStats(): RangeSelectionStats | null {
    const store = this._getStore();
    if (!store || store.length === 0) return null;

    // Convert pixel X to bar index
    let fromIdx = Math.round(this._timeScale.xToIndex(Math.min(this._startX, this._endX)));
    let toIdx = Math.round(this._timeScale.xToIndex(Math.max(this._startX, this._endX)));
    fromIdx = Math.max(0, Math.min(store.length - 1, fromIdx));
    toIdx = Math.max(0, Math.min(store.length - 1, toIdx));

    if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];
    if (fromIdx === toIdx) return null;

    let high = -Infinity;
    let low = Infinity;
    let totalVolume = 0;

    for (let i = fromIdx; i <= toIdx; i++) {
      if (store.high[i] > high) high = store.high[i];
      if (store.low[i] < low) low = store.low[i];
      totalVolume += store.volume[i];
    }

    const fromPrice = store.close[fromIdx];
    const toPrice = store.close[toIdx];
    const priceChange = toPrice - fromPrice;
    const percentChange = fromPrice !== 0 ? (priceChange / fromPrice) * 100 : 0;

    return {
      fromTime: store.time[fromIdx],
      toTime: store.time[toIdx],
      fromPrice,
      toPrice,
      high,
      low,
      priceChange,
      percentChange,
      barCount: toIdx - fromIdx + 1,
      totalVolume,
    };
  }
}

// ─── Measure Tool ───────────────────────────────────────────────────────────

export interface MeasureResult {
  fromTime: number;
  toTime: number;
  fromPrice: number;
  toPrice: number;
  priceChange: number;
  percentChange: number;
  barCount: number;
  timeElapsed: number;
}

export type MeasureCallback = (result: MeasureResult | null) => void;

/**
 * MeasureHandler — click two points to see price change, % change, bar count,
 * and time elapsed between them.
 */
export class MeasureHandler implements EventHandler {
  private _active = false;
  private _firstPoint: { x: number; y: number } | null = null;
  private _secondPoint: { x: number; y: number } | null = null;
  private _hovering = false;
  private _hoverX = 0;
  private _hoverY = 0;
  private _timeScale: TimeScale;
  private _priceScale: PriceScale;
  private _getStore: () => ColumnStore | null;
  private _requestRepaint: () => void;
  private _callbacks: MeasureCallback[] = [];

  constructor(
    timeScale: TimeScale,
    priceScale: PriceScale,
    getStore: () => ColumnStore | null,
    requestRepaint: () => void,
  ) {
    this._timeScale = timeScale;
    this._priceScale = priceScale;
    this._getStore = getStore;
    this._requestRepaint = requestRepaint;
  }

  get active(): boolean { return this._active; }
  set active(value: boolean) {
    this._active = value;
    if (!value) this.clear();
  }

  get firstPoint(): { x: number; y: number } | null { return this._firstPoint; }
  get secondPoint(): { x: number; y: number } | null { return this._secondPoint; }
  get hovering(): boolean { return this._hovering; }
  get hoverX(): number { return this._hoverX; }
  get hoverY(): number { return this._hoverY; }

  onMeasure(callback: MeasureCallback): void {
    this._callbacks.push(callback);
  }

  offMeasure(callback: MeasureCallback): void {
    const idx = this._callbacks.indexOf(callback);
    if (idx >= 0) this._callbacks.splice(idx, 1);
  }

  clear(): void {
    this._firstPoint = null;
    this._secondPoint = null;
    this._hovering = false;
    this._requestRepaint();
    for (const cb of this._callbacks) cb(null);
  }

  onPointerDown(x: number, y: number): boolean | void {
    if (!this._active) return;

    if (!this._firstPoint) {
      this._firstPoint = { x, y };
      this._secondPoint = null;
      this._requestRepaint();
      return true;
    }

    // Second click — compute result
    this._secondPoint = { x, y };
    this._hovering = false;
    this._requestRepaint();

    const result = this._computeResult();
    if (result) {
      for (const cb of this._callbacks) cb(result);
    }
    return true;
  }

  onPointerMove(x: number, y: number): boolean | void {
    if (!this._active || !this._firstPoint || this._secondPoint) return;
    this._hovering = true;
    this._hoverX = x;
    this._hoverY = y;
    this._requestRepaint();
    return true;
  }

  onKeyDown(key: string): boolean | void {
    if (key === 'Escape' && this._active) {
      this.clear();
      return true;
    }
  }

  private _computeResult(): MeasureResult | null {
    if (!this._firstPoint || !this._secondPoint) return null;
    const store = this._getStore();
    if (!store || store.length === 0) return null;

    const idx1 = Math.max(0, Math.min(store.length - 1,
      Math.round(this._timeScale.xToIndex(this._firstPoint.x))));
    const idx2 = Math.max(0, Math.min(store.length - 1,
      Math.round(this._timeScale.xToIndex(this._secondPoint.x))));

    const fromIdx = Math.min(idx1, idx2);
    const toIdx = Math.max(idx1, idx2);

    const fromPrice = this._priceScale.yToPrice(this._firstPoint.y);
    const toPrice = this._priceScale.yToPrice(this._secondPoint.y);
    const priceChange = toPrice - fromPrice;
    const percentChange = fromPrice !== 0 ? (priceChange / fromPrice) * 100 : 0;

    return {
      fromTime: store.time[fromIdx],
      toTime: store.time[toIdx],
      fromPrice,
      toPrice,
      priceChange,
      percentChange,
      barCount: toIdx - fromIdx + 1,
      timeElapsed: store.time[toIdx] - store.time[fromIdx],
    };
  }
}
