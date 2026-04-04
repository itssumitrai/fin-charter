import type { Bar, ColumnData, SeriesType, ISeriesPrimitive, AttachedParams } from '../core/types';
import { DataLayer } from '../core/data-layer';
import type { PriceScale } from '../core/price-scale';
import type { SeriesMarker, ChartEvent } from '../core/series-markers';
import { PriceLine, type PriceLineOptions } from '../core/price-line';
import type { SeriesOptionsMap } from './options';

export type DataChangedCallback = () => void;
export type VisibilityChangeCallback = (visible: boolean) => void;

// ─── ISeriesApi ─────────────────────────────────────────────────────────────

export interface ISeriesApi<T extends SeriesType> {
  /** Replace all data on this series. */
  setData(data: Bar[] | ColumnData): void;
  /** Append or update a single bar (real-time). */
  update(bar: Bar): void;
  /** Attach a custom series primitive (plugin). */
  attachPrimitive(primitive: ISeriesPrimitive): void;
  /** Detach a previously attached primitive. */
  detachPrimitive(primitive: ISeriesPrimitive): void;
  /** Update the series options. */
  applyOptions(options: Partial<SeriesOptionsMap[T]>): void;
  /** Return the current series options. */
  options(): SeriesOptionsMap[T];
  /** Return the associated price scale. */
  priceScale(): PriceScale;
  /** Return the bar at the given index, or null. */
  dataByIndex(index: number): Bar | null;
  /** The series type. */
  seriesType(): T;
  /** Set markers on this series. */
  setMarkers(markers: SeriesMarker[]): void;
  /** Get current markers. */
  getMarkers(): readonly SeriesMarker[];
  /** Set chart events on this series. */
  setEvents(events: ChartEvent[]): void;
  /** Get current chart events. */
  getEvents(): readonly ChartEvent[];
  /** Create a horizontal price line on this series. */
  createPriceLine(options: PriceLineOptions): PriceLine;
  /** Remove a price line. */
  removePriceLine(line: PriceLine): void;
  /** Get all price lines. */
  getPriceLines(): readonly PriceLine[];
  /** Prepend historical bars to the beginning of the series (for pagination). */
  prependData(data: Bar[] | ColumnData): void;
  /**
   * Return metadata about how many bars fall outside the given logical index range.
   * Useful for deciding when to load more historical data.
   */
  barsInLogicalRange(range: { from: number; to: number }): {
    barsBefore: number;
    barsAfter: number;
    from: number;
    to: number;
  };
  /** Subscribe to data changes (setData / update). */
  subscribeDataChanged(callback: DataChangedCallback): void;
  /** Unsubscribe from data changes. */
  unsubscribeDataChanged(callback: DataChangedCallback): void;
  /** Subscribe to visibility changes. */
  subscribeVisibilityChange(callback: VisibilityChangeCallback): void;
  /** Unsubscribe from visibility changes. */
  unsubscribeVisibilityChange(callback: VisibilityChangeCallback): void;
}

// ─── SeriesApi ──────────────────────────────────────────────────────────────

export class SeriesApi<T extends SeriesType> implements ISeriesApi<T> {
  private _type: T;
  private _dataLayer: DataLayer;
  private _priceScale: PriceScale;
  private _options: SeriesOptionsMap[T];
  private _primitives: ISeriesPrimitive[] = [];
  private _markers: SeriesMarker[] = [];
  private _events: ChartEvent[] = [];
  private _priceLines: PriceLine[] = [];
  private _requestRepaint: () => void;
  private _visible: boolean = true;
  private _dataChangedCallbacks: Set<DataChangedCallback> = new Set();
  private _visibilityChangeCallbacks: Set<VisibilityChangeCallback> = new Set();

  constructor(
    type: T,
    dataLayer: DataLayer,
    priceScale: PriceScale,
    options: SeriesOptionsMap[T],
    requestRepaint: () => void,
  ) {
    this._type = type;
    this._dataLayer = dataLayer;
    this._priceScale = priceScale;
    this._options = options;
    this._requestRepaint = requestRepaint;
    this._visible = options.visible !== false;

    // Load initial data if provided
    if (options.data) {
      this._dataLayer.setData(options.data);
    }
  }

  setData(data: Bar[] | ColumnData): void {
    this._dataLayer.setData(data);
    this._notifyPrimitives('full');
    this._requestRepaint();
    this._emitDataChanged();
  }

  update(bar: Bar): void {
    this._dataLayer.update(bar);
    this._notifyPrimitives('update');
    this._requestRepaint();
    this._emitDataChanged();
  }

  prependData(data: Bar[] | ColumnData): void {
    this._dataLayer.prepend(data);
    this._notifyPrimitives('full');
    this._requestRepaint();
    this._emitDataChanged();
  }

  barsInLogicalRange(range: { from: number; to: number }): {
    barsBefore: number;
    barsAfter: number;
    from: number;
    to: number;
  } {
    const store = this._dataLayer.store;
    const fromIdx = Math.max(0, Math.floor(range.from));
    const toIdx = Math.min(store.length - 1, Math.ceil(range.to));
    return {
      barsBefore: fromIdx,
      barsAfter: Math.max(0, store.length - 1 - toIdx),
      from:
        store.length > 0 && fromIdx < store.length ? store.time[fromIdx] : 0,
      to:
        store.length > 0 && toIdx >= 0 && toIdx < store.length
          ? store.time[toIdx]
          : 0,
    };
  }

  attachPrimitive(primitive: ISeriesPrimitive): void {
    this._primitives.push(primitive);
    const params: AttachedParams = {
      requestUpdate: () => this._requestRepaint(),
    };
    primitive.attached?.(params);
  }

  detachPrimitive(primitive: ISeriesPrimitive): void {
    const idx = this._primitives.indexOf(primitive);
    if (idx !== -1) {
      this._primitives.splice(idx, 1);
      primitive.detached?.();
    }
  }

  applyOptions(options: Partial<SeriesOptionsMap[T]>): void {
    const prevVisible = this._visible;
    this._options = { ...this._options, ...options };
    if (options.visible !== undefined) {
      this._visible = options.visible !== false;
    }
    if (options.data) {
      this._dataLayer.setData(options.data);
    }
    this._requestRepaint();

    if (options.visible !== undefined && this._visible !== prevVisible) {
      for (const cb of this._visibilityChangeCallbacks) cb(this._visible);
    }
  }

  options(): SeriesOptionsMap[T] {
    return { ...this._options };
  }

  priceScale(): PriceScale {
    return this._priceScale;
  }

  dataByIndex(index: number): Bar | null {
    return this._dataLayer.barAt(index);
  }

  seriesType(): T {
    return this._type;
  }

  setMarkers(markers: SeriesMarker[]): void {
    this._markers = [...markers].sort((a, b) => a.time - b.time);
    this._requestRepaint();
  }

  getMarkers(): readonly SeriesMarker[] {
    return [...this._markers];
  }

  setEvents(events: ChartEvent[]): void {
    this._events = [...events].sort((a, b) => a.time - b.time);
    this._requestRepaint();
  }

  getEvents(): readonly ChartEvent[] {
    return [...this._events];
  }

  createPriceLine(options: PriceLineOptions): PriceLine {
    const line = new PriceLine(options, this._requestRepaint);
    this._priceLines.push(line);
    this._requestRepaint();
    return line;
  }

  removePriceLine(line: PriceLine): void {
    const idx = this._priceLines.indexOf(line);
    if (idx !== -1) {
      this._priceLines.splice(idx, 1);
      this._requestRepaint();
    }
  }

  getPriceLines(): readonly PriceLine[] {
    return [...this._priceLines];
  }

  subscribeDataChanged(callback: DataChangedCallback): void {
    this._dataChangedCallbacks.add(callback);
  }

  unsubscribeDataChanged(callback: DataChangedCallback): void {
    this._dataChangedCallbacks.delete(callback);
  }

  subscribeVisibilityChange(callback: VisibilityChangeCallback): void {
    this._visibilityChangeCallbacks.add(callback);
  }

  unsubscribeVisibilityChange(callback: VisibilityChangeCallback): void {
    this._visibilityChangeCallbacks.delete(callback);
  }

  // ── Internal accessors ────────────────────────────────────────────────────

  getDataLayer(): DataLayer {
    return this._dataLayer;
  }

  getPrimitives(): readonly ISeriesPrimitive[] {
    return this._primitives;
  }

  isVisible(): boolean {
    return this._visible;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _notifyPrimitives(_scope: 'full' | 'update'): void {
    for (const p of this._primitives) {
      p.updateAllViews?.();
    }
  }

  private _emitDataChanged(): void {
    for (const cb of this._dataChangedCallbacks) cb();
  }
}
