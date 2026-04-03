import type {
  ColumnStore,
  DeepPartial,
  IRenderTarget,
  SeriesType,
  VisibleRange,
} from '../core/types';
import { InvalidationLevel } from '../core/types';
import { TimeScale } from '../core/time-scale';
import { PriceScale } from '../core/price-scale';
import { Crosshair, type CrosshairState } from '../core/crosshair';
import { InvalidateMask } from '../core/invalidation';
import { DataLayer } from '../core/data-layer';
import { EventRouter } from '../interactions/event-router';
import { PanZoomHandler } from '../interactions/pan-zoom';
import { CrosshairHandler } from '../interactions/crosshair';

import { CandlestickRenderer } from '../renderers/candlestick';
import { LineRenderer } from '../renderers/line';
import { AreaRenderer } from '../renderers/area';
import { BarOHLCRenderer } from '../renderers/bar-ohlc';
import { BaselineRenderer } from '../renderers/baseline';
import { HollowCandleRenderer } from '../renderers/hollow-candle';
import { HistogramRenderer } from '../renderers/histogram';

import type { ISeriesApi } from './series-api';
import { SeriesApi } from './series-api';
import type { IPaneApi } from './pane-api';
import { PaneApi } from './pane-api';
import {
  type ChartOptions,
  type CandlestickSeriesOptions,
  type LineSeriesOptions,
  type AreaSeriesOptions,
  type BarSeriesOptions,
  type BaselineSeriesOptions,
  type HollowCandleSeriesOptions,
  type HistogramSeriesOptions,
  type PaneOptions,
  type SeriesOptionsMap,
  DEFAULT_CHART_OPTIONS,
  DARK_THEME,
  LIGHT_THEME,
  mergeOptions,
} from './options';

// ─── Axis constants ────────────────────────────────────────────────────────

const PRICE_AXIS_WIDTH = 60;
const TIME_AXIS_HEIGHT = 28;

// ─── Crosshair event callback type ─────────────────────────────────────────

export type CrosshairMoveCallback = (state: CrosshairState | null) => void;
export type ClickCallback = (state: { x: number; y: number; time: number; price: number }) => void;

// ─── IChartApi ──────────────────────────────────────────────────────────────

export interface IChartApi {
  addCandlestickSeries(options?: DeepPartial<CandlestickSeriesOptions>): ISeriesApi<'candlestick'>;
  addLineSeries(options?: DeepPartial<LineSeriesOptions>): ISeriesApi<'line'>;
  addAreaSeries(options?: DeepPartial<AreaSeriesOptions>): ISeriesApi<'area'>;
  addBarSeries(options?: DeepPartial<BarSeriesOptions>): ISeriesApi<'bar'>;
  addBaselineSeries(options?: DeepPartial<BaselineSeriesOptions>): ISeriesApi<'baseline'>;
  addHollowCandleSeries(options?: DeepPartial<HollowCandleSeriesOptions>): ISeriesApi<'hollow-candle'>;
  addHistogramSeries(options?: DeepPartial<HistogramSeriesOptions>): ISeriesApi<'histogram'>;
  removeSeries(series: ISeriesApi<SeriesType>): void;
  addPane(options?: PaneOptions): IPaneApi;
  removePane(pane: IPaneApi): void;
  timeScale(): TimeScale;
  priceScale(id?: string): PriceScale;
  applyOptions(options: DeepPartial<ChartOptions>): void;
  options(): ChartOptions;
  resize(width: number, height: number): void;
  remove(): void;
  subscribeCrosshairMove(callback: CrosshairMoveCallback): void;
  unsubscribeCrosshairMove(callback: CrosshairMoveCallback): void;
  subscribeClick(callback: ClickCallback): void;
  unsubscribeClick(callback: ClickCallback): void;
}

// ─── Internal series entry ──────────────────────────────────────────────────

interface SeriesEntry {
  api: SeriesApi<SeriesType>;
  renderer:
    | CandlestickRenderer
    | LineRenderer
    | AreaRenderer
    | BarOHLCRenderer
    | BaselineRenderer
    | HollowCandleRenderer
    | HistogramRenderer;
  type: SeriesType;
}

// ─── niceStep utility ───────────────────────────────────────────────────────

function niceStep(range: number, targetSteps: number): number {
  if (range <= 0 || targetSteps <= 0) return 1;
  const rawStep = range / targetSteps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalised = rawStep / magnitude;
  let niceNormalised: number;
  if (normalised <= 1.5) niceNormalised = 1;
  else if (normalised <= 3.5) niceNormalised = 2;
  else if (normalised <= 7.5) niceNormalised = 5;
  else niceNormalised = 10;
  return niceNormalised * magnitude;
}

// ─── ChartApi ───────────────────────────────────────────────────────────────

class ChartApi implements IChartApi {
  private _options: ChartOptions;
  private _container: HTMLElement;
  private _wrapper: HTMLDivElement;
  private _chartCanvas: HTMLCanvasElement;
  private _overlayCanvas: HTMLCanvasElement;
  private _priceAxisCanvas: HTMLCanvasElement;
  private _timeAxisCanvas: HTMLCanvasElement;
  private _chartCtx: CanvasRenderingContext2D;
  private _overlayCtx: CanvasRenderingContext2D;
  private _priceAxisCtx: CanvasRenderingContext2D;
  private _timeAxisCtx: CanvasRenderingContext2D;
  private _legendEl: HTMLDivElement;

  private _timeScale: TimeScale;
  private _priceScale: PriceScale;
  private _crosshair: Crosshair;
  private _mask: InvalidateMask;

  private _eventRouter: EventRouter;
  private _panZoomHandler: PanZoomHandler;
  private _crosshairHandler: CrosshairHandler | null = null;

  private _series: SeriesEntry[] = [];
  private _panes: PaneApi[] = [];

  private _rafId: number | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _removed: boolean = false;

  private _crosshairMoveCallbacks: CrosshairMoveCallback[] = [];
  private _clickCallbacks: ClickCallback[] = [];

  private _width: number;
  private _height: number;

  // The "primary" pane id for the mask
  private readonly _mainPaneId = 'main';

  // Track next pane id
  private _nextPaneId = 0;

  constructor(container: HTMLElement, options: ChartOptions) {
    this._options = options;
    this._container = container;
    this._width = options.width;
    this._height = options.height;

    // ── DOM setup ──────────────────────────────────────────────────────────
    this._wrapper = document.createElement('div');
    this._wrapper.style.position = 'relative';
    this._wrapper.style.overflow = 'hidden';
    this._wrapper.style.width = `${this._width}px`;
    this._wrapper.style.height = `${this._height}px`;
    this._wrapper.style.backgroundColor = options.layout.backgroundColor;

    // Chart canvas (series + grid) — top-left
    this._chartCanvas = document.createElement('canvas');
    this._chartCanvas.style.position = 'absolute';
    this._chartCanvas.style.left = '0';
    this._chartCanvas.style.top = '0';
    this._chartCanvas.style.zIndex = '1';

    // Overlay canvas (crosshair only) — same position as chart canvas, z+1
    this._overlayCanvas = document.createElement('canvas');
    this._overlayCanvas.style.position = 'absolute';
    this._overlayCanvas.style.left = '0';
    this._overlayCanvas.style.top = '0';
    this._overlayCanvas.style.zIndex = '2';

    // Price axis canvas — top-right
    this._priceAxisCanvas = document.createElement('canvas');
    this._priceAxisCanvas.style.position = 'absolute';
    this._priceAxisCanvas.style.top = '0';
    this._priceAxisCanvas.style.zIndex = '1';

    // Time axis canvas — bottom-left
    this._timeAxisCanvas = document.createElement('canvas');
    this._timeAxisCanvas.style.position = 'absolute';
    this._timeAxisCanvas.style.left = '0';
    this._timeAxisCanvas.style.zIndex = '1';

    this._wrapper.appendChild(this._chartCanvas);
    this._wrapper.appendChild(this._overlayCanvas);
    this._wrapper.appendChild(this._priceAxisCanvas);
    this._wrapper.appendChild(this._timeAxisCanvas);

    // Legend overlay (DOM-based)
    this._legendEl = document.createElement('div');
    this._legendEl.style.cssText = 'position:absolute;top:4px;left:8px;z-index:10;font-size:11px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;gap:8px;pointer-events:none;color:' + options.layout.textColor;
    this._wrapper.appendChild(this._legendEl);

    container.appendChild(this._wrapper);

    const pixelRatio = window.devicePixelRatio || 1;
    this._setCanvasSize(this._width, this._height, pixelRatio);

    this._chartCtx = this._chartCanvas.getContext('2d')!;
    this._overlayCtx = this._overlayCanvas.getContext('2d')!;
    this._priceAxisCtx = this._priceAxisCanvas.getContext('2d')!;
    this._timeAxisCtx = this._timeAxisCanvas.getContext('2d')!;

    // ── Core model ─────────────────────────────────────────────────────────
    this._timeScale = new TimeScale(options.timeScale);
    this._timeScale.setWidth(this._width - PRICE_AXIS_WIDTH);

    this._priceScale = new PriceScale('right');
    this._priceScale.setHeight(this._height - TIME_AXIS_HEIGHT);

    this._crosshair = new Crosshair();

    this._mask = new InvalidateMask();
    this._mask.addPane(this._mainPaneId);

    // ── Interactions ───────────────────────────────────────────────────────
    this._eventRouter = new EventRouter();
    this._panZoomHandler = new PanZoomHandler(this._timeScale, () =>
      this.requestRepaint(InvalidationLevel.Full),
    );
    this._eventRouter.addHandler(this._panZoomHandler);
    this._eventRouter.attach(this._overlayCanvas);

    // ── Click detection via overlay canvas ─────────────────────────────────
    this._overlayCanvas.addEventListener('click', this._handleClick);

    // ── AutoSize ───────────────────────────────────────────────────────────
    if (options.autoSize) {
      this._resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            this.resize(Math.round(width), Math.round(height));
          }
        }
      });
      this._resizeObserver.observe(container);
    }
  }

  // ── Series management ───────────────────────────────────────────────────

  addCandlestickSeries(options?: DeepPartial<CandlestickSeriesOptions>): ISeriesApi<'candlestick'> {
    return this._addSeries('candlestick', options ?? {});
  }

  addLineSeries(options?: DeepPartial<LineSeriesOptions>): ISeriesApi<'line'> {
    return this._addSeries('line', options ?? {});
  }

  addAreaSeries(options?: DeepPartial<AreaSeriesOptions>): ISeriesApi<'area'> {
    return this._addSeries('area', options ?? {});
  }

  addBarSeries(options?: DeepPartial<BarSeriesOptions>): ISeriesApi<'bar'> {
    return this._addSeries('bar', options ?? {});
  }

  addBaselineSeries(options?: DeepPartial<BaselineSeriesOptions>): ISeriesApi<'baseline'> {
    return this._addSeries('baseline', options ?? {});
  }

  addHollowCandleSeries(options?: DeepPartial<HollowCandleSeriesOptions>): ISeriesApi<'hollow-candle'> {
    return this._addSeries('hollow-candle', options ?? {});
  }

  addHistogramSeries(options?: DeepPartial<HistogramSeriesOptions>): ISeriesApi<'histogram'> {
    return this._addSeries('histogram', options ?? {});
  }

  removeSeries(series: ISeriesApi<SeriesType>): void {
    const idx = this._series.findIndex((e) => e.api === series);
    if (idx !== -1) {
      this._series.splice(idx, 1);

      // If we removed the primary (first) series the crosshair handler holds a
      // reference to its DataLayer. Reset it so the handler is recreated with
      // the correct DataLayer the next time a series is added, or replaced with
      // one pointing at the new primary series if any remain.
      if (idx === 0 && this._crosshairHandler !== null) {
        this._eventRouter.removeHandler(this._crosshairHandler);
        this._crosshairHandler = null;

        if (this._series.length > 0) {
          this._crosshairHandler = new CrosshairHandler(
            this._crosshair,
            this._series[0].api.getDataLayer(),
            this._timeScale,
            this._priceScale,
            () => this.requestRepaint(InvalidationLevel.Cursor),
          );
          this._eventRouter.addHandler(this._crosshairHandler);
        }
      }

      this.requestRepaint(InvalidationLevel.Full);
    }
  }

  // ── Pane management ─────────────────────────────────────────────────────

  addPane(options?: PaneOptions): IPaneApi {
    const id = `pane-${this._nextPaneId++}`;
    const pane = new PaneApi(id, options?.height ?? 100, () =>
      this.requestRepaint(InvalidationLevel.Full),
    );
    this._panes.push(pane);
    this._mask.addPane(id);
    return pane;
  }

  removePane(pane: IPaneApi): void {
    const idx = this._panes.findIndex((p) => p.id === pane.id);
    if (idx !== -1) {
      this._panes.splice(idx, 1);
      this._mask.removePane(pane.id);
      this.requestRepaint(InvalidationLevel.Full);
    }
  }

  // ── Scale access ────────────────────────────────────────────────────────

  timeScale(): TimeScale {
    return this._timeScale;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  priceScale(_id?: string): PriceScale {
    return this._priceScale;
  }

  // ── Options ─────────────────────────────────────────────────────────────

  applyOptions(options: DeepPartial<ChartOptions>): void {
    this._options = mergeOptions(this._options, options);

    if (options.layout?.backgroundColor) {
      this._wrapper.style.backgroundColor = this._options.layout.backgroundColor;
    }

    if (options.timeScale) {
      this._timeScale.setOptions(this._options.timeScale);
    }

    if (options.width !== undefined || options.height !== undefined) {
      this.resize(this._options.width, this._options.height);
    } else {
      this.requestRepaint(InvalidationLevel.Full);
    }
  }

  options(): ChartOptions {
    return { ...this._options };
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;

    const pixelRatio = window.devicePixelRatio || 1;
    this._setCanvasSize(width, height, pixelRatio);

    this._wrapper.style.width = `${width}px`;
    this._wrapper.style.height = `${height}px`;

    this._timeScale.setWidth(width - PRICE_AXIS_WIDTH);
    this._priceScale.setHeight(height - TIME_AXIS_HEIGHT);

    this._options.width = width;
    this._options.height = height;

    this.requestRepaint(InvalidationLevel.Full);
  }

  remove(): void {
    if (this._removed) return;
    this._removed = true;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    this._resizeObserver?.disconnect();
    this._eventRouter.detach();
    this._panZoomHandler.destroy();
    this._overlayCanvas.removeEventListener('click', this._handleClick);

    this._wrapper.remove();
  }

  // ── Events ──────────────────────────────────────────────────────────────

  subscribeCrosshairMove(callback: CrosshairMoveCallback): void {
    this._crosshairMoveCallbacks.push(callback);
  }

  unsubscribeCrosshairMove(callback: CrosshairMoveCallback): void {
    const idx = this._crosshairMoveCallbacks.indexOf(callback);
    if (idx !== -1) this._crosshairMoveCallbacks.splice(idx, 1);
  }

  subscribeClick(callback: ClickCallback): void {
    this._clickCallbacks.push(callback);
  }

  unsubscribeClick(callback: ClickCallback): void {
    const idx = this._clickCallbacks.indexOf(callback);
    if (idx !== -1) this._clickCallbacks.splice(idx, 1);
  }

  // ── Repaint scheduling ────────────────────────────────────────────────

  requestRepaint(level: number): void {
    this._mask.invalidateAll(level as 0 | 1 | 2 | 3);
    if (this._rafId === null && !this._removed) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        this._paint();
      });
    }
  }

  // ── Paint ─────────────────────────────────────────────────────────────

  private _paint(): void {
    if (this._removed) return;

    const level = this._mask.level(this._mainPaneId);
    if (level >= InvalidationLevel.Light) {
      this._paintMain();
      this._paintPriceAxis();
      this._paintTimeAxis();
    }
    if (level >= InvalidationLevel.Cursor) {
      this._paintOverlay();
      // Redraw axes on cursor move too (for crosshair labels) — axes are tiny, very cheap
      this._paintPriceAxis();
      this._paintTimeAxis();
    }

    // Emit crosshair callbacks
    if (this._crosshair.visible) {
      const state: CrosshairState = {
        x: this._crosshair.x,
        y: this._crosshair.y,
        barIndex: this._crosshair.barIndex,
        price: this._crosshair.price,
        time: this._crosshair.time,
        snappedX: this._crosshair.snappedX,
      };
      for (const cb of this._crosshairMoveCallbacks) cb(state);
    } else {
      for (const cb of this._crosshairMoveCallbacks) cb(null);
    }

    this._updateLegend();
    this._mask.reset();
  }

  private _paintMain(): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = this._chartCtx;
    const chartW = this._width - PRICE_AXIS_WIDTH;
    const chartH = this._height - TIME_AXIS_HEIGHT;

    // Clear chart canvas
    ctx.clearRect(0, 0, Math.round(chartW * pixelRatio), Math.round(chartH * pixelRatio));

    if (this._series.length === 0) return;

    // Find the primary series (first one) for data length & visible range
    const primaryEntry = this._series[0];
    const primaryStore = primaryEntry.api.getDataLayer().store;

    this._timeScale.setDataLength(primaryStore.length);
    const range = this._timeScale.visibleRange();

    if (range.fromIdx > range.toIdx || primaryStore.length === 0) return;

    // Auto-scale price from visible data (scan all series)
    this._updateDataRange(range);

    // Draw grid (within chart area only)
    this._drawGrid(ctx, chartW, chartH, range, primaryStore, pixelRatio);

    // Clip series rendering to chart area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.round(chartW * pixelRatio), Math.round(chartH * pixelRatio));
    ctx.clip();

    // Draw each series
    const target = this._createRenderTarget(this._chartCanvas, ctx, pixelRatio);
    const indexToX = (i: number) => this._timeScale.indexToX(i);
    const priceToY = (p: number) => this._priceScale.priceToY(p);

    for (const entry of this._series) {
      if (!entry.api.isVisible()) continue;

      const store = entry.api.getDataLayer().store;
      // Re-set data length for secondary series
      if (entry !== primaryEntry) {
        // For now use the same time scale range
      }

      this._drawSeries(entry, target, store, range, indexToX, priceToY);
    }

    // Draw last close price line
    if (this._options.lastPriceLine.visible && primaryStore.length > 0) {
      const lastClose = primaryStore.close[primaryStore.length - 1];
      const lastOpen = primaryStore.open[primaryStore.length - 1];
      const isUp = lastClose >= lastOpen;
      const lineColor = isUp ? '#26a69a' : '#ef5350';
      const lastY = Math.round(priceToY(lastClose) * pixelRatio);

      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = pixelRatio;
      ctx.setLineDash([4 * pixelRatio, 4 * pixelRatio]);
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(Math.round(chartW * pixelRatio), lastY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Draw separator lines on chart canvas edges
    ctx.save();
    ctx.strokeStyle = this._options.grid.horzLinesColor;
    ctx.lineWidth = Math.max(1, Math.round(pixelRatio));
    // Right edge separator (chart area | price axis)
    ctx.beginPath();
    ctx.moveTo(Math.round(chartW * pixelRatio) - 1, 0);
    ctx.lineTo(Math.round(chartW * pixelRatio) - 1, Math.round(chartH * pixelRatio));
    ctx.stroke();
    // Bottom edge separator (chart area / time axis)
    ctx.beginPath();
    ctx.moveTo(0, Math.round(chartH * pixelRatio) - 1);
    ctx.lineTo(Math.round(chartW * pixelRatio), Math.round(chartH * pixelRatio) - 1);
    ctx.stroke();
    ctx.restore();
  }

  private _drawSeries(
    entry: SeriesEntry,
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (p: number) => number,
  ): void {
    const barWidth = this._timeScale.barSpacing * 0.8;

    switch (entry.type) {
      case 'candlestick':
        (entry.renderer as CandlestickRenderer).draw(target, store, range, indexToX, priceToY, barWidth);
        break;
      case 'line':
        (entry.renderer as LineRenderer).draw(target, store, range, indexToX, priceToY);
        break;
      case 'area':
        (entry.renderer as AreaRenderer).draw(target, store, range, indexToX, priceToY);
        break;
      case 'bar':
        (entry.renderer as BarOHLCRenderer).draw(target, store, range, indexToX, priceToY, barWidth);
        break;
      case 'baseline':
        (entry.renderer as BaselineRenderer).draw(target, store, range, indexToX, priceToY);
        break;
      case 'hollow-candle':
        (entry.renderer as HollowCandleRenderer).draw(target, store, range, indexToX, priceToY, barWidth);
        break;
      case 'histogram':
        (entry.renderer as HistogramRenderer).draw(target, store, range, indexToX, priceToY, barWidth);
        break;
    }
  }

  private _paintOverlay(): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = this._overlayCtx;
    const chartW = this._width - PRICE_AXIS_WIDTH;
    const chartH = this._height - TIME_AXIS_HEIGHT;

    // Overlay canvas is sized to chart area only
    ctx.clearRect(0, 0, Math.round(chartW * pixelRatio), Math.round(chartH * pixelRatio));

    if (!this._crosshair.visible) return;

    const opts = this._options.crosshair;

    // Vertical line (snapped to bar center) — clipped to chart area
    const vx = Math.round(this._crosshair.snappedX * pixelRatio);
    ctx.save();
    ctx.strokeStyle = opts.vertLineColor;
    ctx.lineWidth = opts.vertLineWidth * pixelRatio;
    ctx.setLineDash(opts.vertLineDash.map((d) => d * pixelRatio));
    ctx.beginPath();
    ctx.moveTo(vx, 0);
    ctx.lineTo(vx, Math.round(chartH * pixelRatio));
    ctx.stroke();
    ctx.restore();

    // Horizontal line — clipped to chart area
    const hy = Math.round(this._crosshair.y * pixelRatio);
    ctx.save();
    ctx.strokeStyle = opts.horzLineColor;
    ctx.lineWidth = opts.horzLineWidth * pixelRatio;
    ctx.setLineDash(opts.horzLineDash.map((d) => d * pixelRatio));
    ctx.beginPath();
    ctx.moveTo(0, hy);
    ctx.lineTo(Math.round(chartW * pixelRatio), hy);
    ctx.stroke();
    ctx.restore();
  }

  // ── Grid ──────────────────────────────────────────────────────────────

  private _drawGrid(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    range: VisibleRange,
    store: ColumnStore,
    pixelRatio: number,
  ): void {
    const gridOpts = this._options.grid;

    ctx.save();
    ctx.lineWidth = Math.max(1, Math.round(pixelRatio));

    // Horizontal price grid lines
    if (gridOpts.horzLinesVisible) {
      ctx.strokeStyle = gridOpts.horzLinesColor;
      const priceRange = this._priceScale.priceRange;
      const pRange = priceRange.max - priceRange.min;
      const targetHorzSteps = Math.max(2, Math.floor(h / 60));
      const step = niceStep(pRange, targetHorzSteps);

      const firstPrice = Math.ceil(priceRange.min / step) * step;
      for (let price = firstPrice; price <= priceRange.max; price += step) {
        const y = Math.round(this._priceScale.priceToY(price) * pixelRatio);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(Math.round(w * pixelRatio), y);
        ctx.stroke();
      }
    }

    // Vertical time grid lines
    if (gridOpts.vertLinesVisible && store.length > 0) {
      ctx.strokeStyle = gridOpts.vertLinesColor;
      const barsInRange = range.toIdx - range.fromIdx + 1;
      const targetVertSteps = Math.max(2, Math.floor(w / 100));
      const barStep = Math.max(1, Math.round(barsInRange / targetVertSteps));

      for (let i = range.fromIdx; i <= range.toIdx; i += barStep) {
        const x = Math.round(this._timeScale.indexToX(i) * pixelRatio);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, Math.round(h * pixelRatio));
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ── Price axis (on its own canvas) ─────────────────────────────────────

  private _paintPriceAxis(): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = this._priceAxisCtx;
    const chartH = this._height - TIME_AXIS_HEIGHT;
    const axisW = PRICE_AXIS_WIDTH;

    ctx.clearRect(0, 0, Math.round(axisW * pixelRatio), Math.round(chartH * pixelRatio));

    const layout = this._options.layout;
    const priceRange = this._priceScale.priceRange;
    const pRange = priceRange.max - priceRange.min;
    const targetSteps = Math.max(2, Math.floor(chartH / 60));
    const step = niceStep(pRange, targetSteps);

    ctx.save();
    ctx.font = `${Math.round(layout.fontSize * pixelRatio)}px ${layout.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const axisRight = Math.round(axisW * pixelRatio);
    const padding = Math.round(6 * pixelRatio);
    const labelHeight = Math.round(layout.fontSize * 1.6 * pixelRatio);

    const firstPrice = Math.ceil(priceRange.min / step) * step;
    for (let price = firstPrice; price <= priceRange.max; price += step) {
      const y = Math.round(this._priceScale.priceToY(price) * pixelRatio);
      if (y < labelHeight / 2 || y > Math.round(chartH * pixelRatio) - labelHeight / 2) continue;

      const text = price.toFixed(2);

      // Draw background rect
      ctx.fillStyle = this._options.layout.backgroundColor;
      ctx.fillRect(0, y - labelHeight / 2, axisRight, labelHeight);

      // Draw text
      ctx.fillStyle = layout.textColor;
      ctx.fillText(text, axisRight - padding, y);
    }

    // Draw left separator line
    ctx.strokeStyle = this._options.grid.horzLinesColor;
    ctx.lineWidth = Math.max(1, Math.round(pixelRatio));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, Math.round(chartH * pixelRatio));
    ctx.stroke();

    // Current price label (last close)
    if (this._options.lastPriceLine.visible && this._series.length > 0) {
      const store = this._series[0].api.getDataLayer().store;
      if (store.length > 0) {
        const lastClose = store.close[store.length - 1];
        const lastOpen = store.open[store.length - 1];
        const isUp = lastClose >= lastOpen;
        const bgColor = isUp ? '#26a69a' : '#ef5350';
        const y = Math.round(this._priceScale.priceToY(lastClose) * pixelRatio);
        const priceText = lastClose.toFixed(2);
        const lh = Math.round(layout.fontSize * 1.8 * pixelRatio);

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, y - lh / 2, axisRight, lh);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(layout.fontSize * pixelRatio)}px ${layout.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceText, axisRight - padding, y);
      }
    }

    // Crosshair price label
    if (this._crosshair.visible) {
      const hy = Math.round(this._crosshair.y * pixelRatio);
      const priceText = this._crosshair.price.toFixed(2);
      const lh = Math.round(layout.fontSize * 1.8 * pixelRatio);

      ctx.fillStyle = this._options.crosshair.horzLineColor;
      ctx.fillRect(0, hy - lh / 2, axisRight, lh);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(priceText, axisRight - padding, hy);
    }

    ctx.restore();
  }

  // ── Time axis (on its own canvas) ─────────────────────────────────────

  private _paintTimeAxis(): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = this._timeAxisCtx;
    const chartW = this._width - PRICE_AXIS_WIDTH;

    ctx.clearRect(0, 0, Math.round(chartW * pixelRatio), Math.round(TIME_AXIS_HEIGHT * pixelRatio));

    if (this._series.length === 0) return;

    const primaryEntry = this._series[0];
    const primaryStore = primaryEntry.api.getDataLayer().store;
    if (primaryStore.length === 0) return;

    this._timeScale.setDataLength(primaryStore.length);
    const range = this._timeScale.visibleRange();
    if (range.fromIdx > range.toIdx) return;

    const layout = this._options.layout;
    const barsInRange = range.toIdx - range.fromIdx + 1;
    const targetSteps = Math.max(2, Math.floor(chartW / 100));
    const barStep = Math.max(1, Math.round(barsInRange / targetSteps));

    ctx.save();
    ctx.font = `${Math.round(layout.fontSize * pixelRatio)}px ${layout.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = layout.textColor;

    const textY = Math.round(8 * pixelRatio);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    for (let i = range.fromIdx; i <= range.toIdx; i += barStep) {
      if (i >= primaryStore.length) break;
      const x = Math.round(this._timeScale.indexToX(i) * pixelRatio);
      if (x < 0 || x > Math.round(chartW * pixelRatio)) continue;

      const timestamp = primaryStore.time[i];
      const date = new Date(timestamp * 1000);

      let label: string;
      if (primaryStore.length >= 2 && (primaryStore.time[1] - primaryStore.time[0]) < 86400) {
        const hh = date.getUTCHours().toString().padStart(2, '0');
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        label = `${hh}:${mm}`;
      } else {
        label = `${months[date.getUTCMonth()]} ${date.getUTCDate().toString().padStart(2, '0')}`;
      }

      ctx.fillText(label, x, textY);
    }

    // Draw top separator line
    ctx.strokeStyle = this._options.grid.horzLinesColor;
    ctx.lineWidth = Math.max(1, Math.round(pixelRatio));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.round(chartW * pixelRatio), 0);
    ctx.stroke();

    // Crosshair time label
    if (this._crosshair.visible && this._series.length > 0) {
      const store = this._series[0].api.getDataLayer().store;
      if (store.length > 0 && this._crosshair.barIndex >= 0 && this._crosshair.barIndex < store.length) {
        const vx = Math.round(this._crosshair.snappedX * pixelRatio);
        const timestamp = store.time[this._crosshair.barIndex];
        const date = new Date(timestamp * 1000);

        let timeLabel: string;
        if (store.length >= 2 && (store.time[1] - store.time[0]) < 86400) {
          const hh = date.getUTCHours().toString().padStart(2, '0');
          const mm = date.getUTCMinutes().toString().padStart(2, '0');
          timeLabel = `${hh}:${mm}`;
        } else {
          timeLabel = `${months[date.getUTCMonth()]} ${date.getUTCDate().toString().padStart(2, '0')}`;
        }

        const lh = Math.round(layout.fontSize * 1.8 * pixelRatio);
        const tw = Math.round(50 * pixelRatio);

        ctx.fillStyle = this._options.crosshair.vertLineColor;
        ctx.fillRect(vx - tw / 2, 0, tw, lh);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(timeLabel, vx, Math.round(2 * pixelRatio));
      }
    }

    ctx.restore();
  }

  // ── Auto-scale price range ────────────────────────────────────────────

  private _updateDataRange(range: VisibleRange): void {
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const entry of this._series) {
      if (!entry.api.isVisible()) continue;
      const store = entry.api.getDataLayer().store;
      const to = Math.min(range.toIdx, store.length - 1);

      for (let i = range.fromIdx; i <= to; i++) {
        const lo = store.low[i];
        const hi = store.high[i];
        if (lo < minPrice) minPrice = lo;
        if (hi > maxPrice) maxPrice = hi;
      }
    }

    if (minPrice < Infinity && maxPrice > -Infinity) {
      this._priceScale.autoScale(minPrice, maxPrice);
    }
  }

  // ── Legend ────────────────────────────────────────────────────────────

  private _updateLegend(): void {
    if (this._series.length === 0) { this._legendEl.innerHTML = ''; return; }

    const primaryEntry = this._series[0];
    const store = primaryEntry.api.getDataLayer().store;

    // Use crosshair bar if visible, otherwise last bar
    let idx = store.length - 1;
    if (this._crosshair.visible && this._crosshair.barIndex >= 0 && this._crosshair.barIndex < store.length) {
      idx = this._crosshair.barIndex;
    }
    if (idx < 0 || idx >= store.length) { this._legendEl.innerHTML = ''; return; }

    const o = store.open[idx];
    const h = store.high[idx];
    const l = store.low[idx];
    const c = store.close[idx];
    const v = store.volume[idx];
    const isUp = c >= o;
    const color = isUp ? '#26a69a' : '#ef5350';

    this._legendEl.innerHTML =
      `<span style="color:${this._options.layout.textColor}">O</span><span style="color:${color}">${o.toFixed(2)}</span>` +
      `<span style="color:${this._options.layout.textColor}">H</span><span style="color:${color}">${h.toFixed(2)}</span>` +
      `<span style="color:${this._options.layout.textColor}">L</span><span style="color:${color}">${l.toFixed(2)}</span>` +
      `<span style="color:${this._options.layout.textColor}">C</span><span style="color:${color}">${c.toFixed(2)}</span>` +
      `<span style="color:${this._options.layout.textColor}">V</span><span style="color:${this._options.layout.textColor}">${v.toLocaleString()}</span>`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private _createRenderTarget(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    pixelRatio: number,
  ): IRenderTarget {
    return {
      canvas,
      context: ctx,
      width: this._width - PRICE_AXIS_WIDTH,
      height: this._height - TIME_AXIS_HEIGHT,
      pixelRatio,
    };
  }

  private _setCanvasSize(width: number, height: number, pixelRatio: number): void {
    const chartW = width - PRICE_AXIS_WIDTH;
    const chartH = height - TIME_AXIS_HEIGHT;

    // Chart + overlay canvases: chart area only
    for (const canvas of [this._chartCanvas, this._overlayCanvas]) {
      canvas.width = Math.round(chartW * pixelRatio);
      canvas.height = Math.round(chartH * pixelRatio);
      canvas.style.width = `${chartW}px`;
      canvas.style.height = `${chartH}px`;
    }

    // Price axis canvas — positioned top-right
    this._priceAxisCanvas.width = Math.round(PRICE_AXIS_WIDTH * pixelRatio);
    this._priceAxisCanvas.height = Math.round(chartH * pixelRatio);
    this._priceAxisCanvas.style.width = `${PRICE_AXIS_WIDTH}px`;
    this._priceAxisCanvas.style.height = `${chartH}px`;
    this._priceAxisCanvas.style.left = `${chartW}px`;

    // Time axis canvas — positioned bottom-left
    this._timeAxisCanvas.width = Math.round(chartW * pixelRatio);
    this._timeAxisCanvas.height = Math.round(TIME_AXIS_HEIGHT * pixelRatio);
    this._timeAxisCanvas.style.width = `${chartW}px`;
    this._timeAxisCanvas.style.height = `${TIME_AXIS_HEIGHT}px`;
    this._timeAxisCanvas.style.top = `${chartH}px`;
  }

  private _addSeries<T extends SeriesType>(
    type: T,
    options: DeepPartial<SeriesOptionsMap[T]>,
  ): ISeriesApi<T> {
    const dataLayer = new DataLayer();
    const resolvedOptions = (options ?? {}) as SeriesOptionsMap[T];

    const renderer = this._createRenderer(type, resolvedOptions);
    const api = new SeriesApi<T>(type, dataLayer, this._priceScale, resolvedOptions, () =>
      this.requestRepaint(InvalidationLevel.Full),
    );

    this._series.push({ api: api as SeriesApi<SeriesType>, renderer, type });

    // Set up crosshair handler on first series added
    if (this._series.length === 1 && this._crosshairHandler === null) {
      this._crosshairHandler = new CrosshairHandler(
        this._crosshair,
        dataLayer,
        this._timeScale,
        this._priceScale,
        () => this.requestRepaint(InvalidationLevel.Cursor),
      );
      this._eventRouter.addHandler(this._crosshairHandler);
    }

    this.requestRepaint(InvalidationLevel.Full);
    return api;
  }

  private _createRenderer(
    type: SeriesType,
    options: Record<string, unknown>,
  ): SeriesEntry['renderer'] {
    // Extract renderer-relevant options (exclude BaseSeriesOptions fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _d, priceScaleId: _p, visible: _v, ...rendererOpts } = options;

    switch (type) {
      case 'candlestick': {
        const r = new CandlestickRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'line': {
        const r = new LineRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'area': {
        const r = new AreaRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'bar': {
        const r = new BarOHLCRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'baseline': {
        const r = new BaselineRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'hollow-candle': {
        const r = new HollowCandleRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'histogram': {
        const r = new HistogramRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      default:
        throw new Error(`Unknown series type: ${type}`);
    }
  }

  private _handleClick = (e: MouseEvent): void => {
    if (this._clickCallbacks.length === 0) return;
    const rect = this._overlayCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const price = this._priceScale.yToPrice(y);

    // Get time from nearest bar
    let time = 0;
    if (this._series.length > 0) {
      const store = this._series[0].api.getDataLayer().store;
      if (store.length > 0) {
        const idx = Math.max(0, Math.min(store.length - 1, this._timeScale.xToIndex(x)));
        time = store.time[idx];
      }
    }

    for (const cb of this._clickCallbacks) {
      cb({ x, y, time, price });
    }
  };
}

// ─── Factory function ───────────────────────────────────────────────────────

export function createChart(
  container: HTMLElement,
  options?: DeepPartial<ChartOptions>,
): IChartApi {
  let resolved: ChartOptions;
  if (options) {
    // If a theme is specified, merge theme defaults first, then user options on top
    const theme = options.theme;
    if (theme === 'light') {
      resolved = mergeOptions(mergeOptions(DEFAULT_CHART_OPTIONS, LIGHT_THEME), options);
    } else if (theme === 'dark') {
      resolved = mergeOptions(mergeOptions(DEFAULT_CHART_OPTIONS, DARK_THEME), options);
    } else {
      resolved = mergeOptions(DEFAULT_CHART_OPTIONS, options);
    }
  } else {
    resolved = { ...DEFAULT_CHART_OPTIONS };
  }
  return new ChartApi(container, resolved);
}
