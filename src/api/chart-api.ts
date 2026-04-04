import type {
  Bar,
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
import type { SeriesMarker } from '../core/series-markers';
import { type ChartState, CHART_STATE_VERSION, validateChartState } from '../core/chart-state';
import { Pane } from '../core/pane';
import { PaneDivider, DIVIDER_HEIGHT } from '../core/pane-divider';
import { EventRouter } from '../interactions/event-router';
import { PanZoomHandler } from '../interactions/pan-zoom';
import { CrosshairHandler } from '../interactions/crosshair';
import { ContextMenuHandler } from '../interactions/context-menu-handler';
import type { ContextMenuCallbacks } from '../interactions/context-menu-handler';

import { DrawingHandler } from '../interactions/drawing-handler';
import type { AnchorPoint, DrawingOptions, SerializedDrawing, DrawingPrimitive, DrawingContext } from '../drawings/index';
import { DRAWING_REGISTRY, createBuiltinDrawing, BaseDrawing } from '../drawings/index';
import type { ISeriesPrimitive } from '../core/types';

import { HudManager } from '../ui/hud';
import type { SettingsField } from '../ui/settings-popup';

import { CandlestickRenderer } from '../renderers/candlestick';
import { LineRenderer } from '../renderers/line';
import { AreaRenderer } from '../renderers/area';
import { BarOHLCRenderer } from '../renderers/bar-ohlc';
import { BaselineRenderer } from '../renderers/baseline';
import { HollowCandleRenderer } from '../renderers/hollow-candle';
import { HistogramRenderer } from '../renderers/histogram';
import { StepLineRenderer } from '../renderers/step-line';
import { ColoredLineRenderer } from '../renderers/colored-line';
import { ColoredMountainRenderer } from '../renderers/colored-mountain';
import { HLCAreaRenderer } from '../renderers/hlc-area';
import { HighLowRenderer } from '../renderers/high-low';
import { ColumnRenderer } from '../renderers/column';
import { VolumeCandleRenderer } from '../renderers/volume-candle';
import { BaselineDeltaMountainRenderer } from '../renderers/baseline-delta-mountain';
import { RenkoRenderer } from '../renderers/renko';
import { KagiRenderer } from '../renderers/kagi';
import { LineBreakRenderer } from '../renderers/line-break';
import { PointFigureRenderer } from '../renderers/point-figure';

import type { ISeriesApi } from './series-api';
import { SeriesApi } from './series-api';
import type { IPaneApi } from './pane-api';
import { PaneApi } from './pane-api';
import type { IIndicatorApi } from './indicator-api';
import { IndicatorApi } from './indicator-api';
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
  type SeriesOptions,
  type IndicatorType,
  type IndicatorOptions,
  DEFAULT_CHART_OPTIONS,
  DEFAULT_INDICATOR_PARAMS,
  OVERLAY_INDICATORS,
  DARK_THEME,
  LIGHT_THEME,
  COLORFUL_THEME,
  mergeOptions,
} from './options';

import { computeSMA } from '../indicators/sma';
import { computeEMA } from '../indicators/ema';
import { computeRSI } from '../indicators/rsi';
import { computeHeikinAshi } from '../transforms/heikin-ashi';
import { computeMACD } from '../indicators/macd';
import { computeBollinger } from '../indicators/bollinger';
import { computeVWAP } from '../indicators/vwap';
import { computeStochastic } from '../indicators/stochastic';
import { computeATR } from '../indicators/atr';
import { computeADX } from '../indicators/adx';
import { computeOBV } from '../indicators/obv';
import { computeWilliamsR } from '../indicators/williams-r';
import { computeIchimoku } from '../indicators/ichimoku';
import { computeParabolicSAR } from '../indicators/parabolic-sar';
import { computeKeltner } from '../indicators/keltner';
import { computeDonchian } from '../indicators/donchian';
import { computeCCI } from '../indicators/cci';
import { computePivotPoints } from '../indicators/pivot-points';
import { computeAroon } from '../indicators/aroon';
import { computeAwesomeOscillator } from '../indicators/awesome-oscillator';
import { computeChaikinMF } from '../indicators/chaikin-mf';
import { computeCoppock } from '../indicators/coppock';
import { computeElderForce } from '../indicators/elder-force';
import { computeTRIX } from '../indicators/trix';
import { computeSupertrend } from '../indicators/supertrend';
import { computeVWMA } from '../indicators/vwma';
import { computeChoppiness } from '../indicators/choppiness';
import { computeMFI } from '../indicators/mfi';
import { computeROC } from '../indicators/roc';
import { computeLinearRegression } from '../indicators/linear-regression';
import type { Periodicity } from '../core/periodicity';
import type { MarketSession } from '../core/market-session';

import { createPriceFormatter } from '../formatting/price-formatter';
import { createTimeFormatter } from '../formatting/time-formatter';
import { formatVolume } from '../formatting/volume-formatter';

// ─── Axis constants ────────────────────────────────────────────────────────

const PRICE_AXIS_WIDTH = 60;
const TIME_AXIS_HEIGHT = 28;

// ─── Crosshair event callback type ─────────────────────────────────────────

export type CrosshairMoveCallback = (state: CrosshairState | null) => void;
export type ClickCallback = (state: { x: number; y: number; time: number; price: number }) => void;
export type DblClickCallback = (state: { x: number; y: number; time: number; price: number }) => void;

// ─── IChartApi ──────────────────────────────────────────────────────────────

export type VisibleRangeChangeCallback = (range: { from: number; to: number } | null) => void;

// ─── Event callback types ─────────────────────────────────────────────────

export type DrawingEventType = 'created' | 'modified' | 'removed';
export type DrawingEventCallback = (event: { type: DrawingEventType; drawingId: string; drawingType: string }) => void;

export type IndicatorEventType = 'added' | 'removed';
export type IndicatorEventCallback = (event: { type: IndicatorEventType; indicatorId: string; indicatorType: string; paneId: string }) => void;

export type ResizeCallback = (size: { width: number; height: number }) => void;

export type SymbolChangeCallback = (symbol: { previous: string; current: string }) => void;

export type ChartTypeChangeCallback = (chartType: { seriesType: SeriesType }) => void;

export type PreferencesChangeCallback = (options: DeepPartial<ChartOptions>) => void;

export type LayoutChangeAction = 'pane-added' | 'pane-removed';
export type LayoutChangeCallback = (event: { action: LayoutChangeAction; paneId: string }) => void;

// ─── IDrawingApi ──────────────────────────────────────────────────────────────

export interface IDrawingApi {
  readonly id: string;
  drawingType(): string;
  points(): AnchorPoint[];
  applyOptions(options: Partial<DrawingOptions>): void;
  options(): DrawingOptions;
  remove(): void;
}

export interface IChartApi {
  /** Add a series using a unified options object with a `type` discriminator. */
  addSeries(options: SeriesOptions): ISeriesApi<SeriesType>;
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
  // ── Feature 1: Range Switcher ─────────────────────────────────────────────
  /** Set the visible time range by Unix timestamps (seconds). Adjusts barSpacing and rightOffset. */
  setVisibleRange(from: number, to: number): void;
  /** Set the visible range by bar indices directly. */
  setVisibleLogicalRange(from: number, to: number): void;
  // ── Feature 2: Go to Realtime ─────────────────────────────────────────────
  /** Reset the view so the latest bar is at the right edge. */
  scrollToRealTime(): void;
  // ── Feature 3: Infinite History Loading ──────────────────────────────────
  subscribeVisibleRangeChange(callback: VisibleRangeChangeCallback): void;
  unsubscribeVisibleRangeChange(callback: VisibleRangeChangeCallback): void;
  // ── Feature 4: Fit Content & Screenshot ──────────────────────────────────
  fitContent(): void;
  takeScreenshot(): HTMLCanvasElement;
  // ── Feature 5: Indicator API ────────────────────────────────────────────
  addIndicator(type: IndicatorType, options: IndicatorOptions): IIndicatorApi;
  removeIndicator(indicator: IIndicatorApi): void;
  // ── Feature 6: Comparison Mode ───────────────────────────────────────────
  /** Enable/disable comparison mode. When on, the Y-axis shows percentage change from the first visible bar. */
  setComparisonMode(enabled: boolean): void;
  isComparisonMode(): boolean;
  // ── Feature 8: Drawing Tools ──────────────────────────────────────────
  addDrawing(type: string, points: AnchorPoint[], options?: DrawingOptions): IDrawingApi;
  removeDrawing(drawing: IDrawingApi): void;
  getDrawings(): IDrawingApi[];
  setActiveDrawingTool(type: string | null): void;
  registerDrawingType(type: string, factory: (id: string, points: AnchorPoint[], options: DrawingOptions) => ISeriesPrimitive & DrawingPrimitive): void;
  serializeDrawings(): SerializedDrawing[];
  deserializeDrawings(data: SerializedDrawing[]): void;
  // ── Feature 9/10: Chart State Save/Restore ────────────────────────────────
  /** Export the current chart configuration (no bar data) as a serializable state object. */
  exportState(): ChartState;
  /** Restore a previously exported chart state, loading bar data via the provided loader. */
  importState(state: ChartState, dataLoader: (seriesId: string) => Promise<Bar[]>): Promise<void>;
  // ── Feature 11b: Periodicity ──────────────────────────────────────────────
  setPeriodicity(periodicity: Periodicity): void;
  getPeriodicity(): Periodicity;
  subscribePeriodicityChange(handler: (p: Periodicity) => void): void;
  unsubscribePeriodicityChange(handler: (p: Periodicity) => void): void;
  // ── Event Subscriptions ──────────────────────────────────────────────────
  subscribeDblClick(callback: DblClickCallback): void;
  unsubscribeDblClick(callback: DblClickCallback): void;
  subscribeDrawingEvent(callback: DrawingEventCallback): void;
  unsubscribeDrawingEvent(callback: DrawingEventCallback): void;
  subscribeIndicatorEvent(callback: IndicatorEventCallback): void;
  unsubscribeIndicatorEvent(callback: IndicatorEventCallback): void;
  subscribeResize(callback: ResizeCallback): void;
  unsubscribeResize(callback: ResizeCallback): void;
  subscribeSymbolChange(callback: SymbolChangeCallback): void;
  unsubscribeSymbolChange(callback: SymbolChangeCallback): void;
  subscribeChartTypeChange(callback: ChartTypeChangeCallback): void;
  unsubscribeChartTypeChange(callback: ChartTypeChangeCallback): void;
  subscribePreferencesChange(callback: PreferencesChangeCallback): void;
  unsubscribePreferencesChange(callback: PreferencesChangeCallback): void;
  subscribeLayoutChange(callback: LayoutChangeCallback): void;
  unsubscribeLayoutChange(callback: LayoutChangeCallback): void;
  // ── Feature 11c: Market Sessions ──────────────────────────────────────────
  setMarketSessions(sessions: MarketSession[]): void;
  getMarketSessions(): MarketSession[];
  setSessionFilter(filter: 'regular' | 'extended' | 'all'): void;
  getSessionFilter(): string;
}

// ─── Internal series entry ──────────────────────────────────────────────────

/**
 * Tracks animated display values for the last bar of a series.
 * Display values chase the actual store values via exponential lerp.
 */
interface LastBarAnimState {
  /** The bar index we're tracking — reset animation if this changes. */
  lastIdx: number;
  /** Current display values (what gets rendered). */
  open: number;
  high: number;
  low: number;
  close: number;
  /** True while display values are converging toward actual values. */
  animating: boolean;
}

/** Lerp factor for last-bar OHLC animation. */
const LAST_BAR_LERP = 0.3;
/** Snap threshold relative to price range. */
const LAST_BAR_SNAP = 0.0005;

interface SeriesEntry {
  api: SeriesApi<SeriesType>;
  renderer:
    | CandlestickRenderer
    | LineRenderer
    | AreaRenderer
    | BarOHLCRenderer
    | BaselineRenderer
    | HollowCandleRenderer
    | HistogramRenderer
    | StepLineRenderer
    | ColoredLineRenderer
    | ColoredMountainRenderer
    | HLCAreaRenderer
    | HighLowRenderer
    | ColumnRenderer
    | VolumeCandleRenderer
    | BaselineDeltaMountainRenderer
    | RenkoRenderer
    | KagiRenderer
    | LineBreakRenderer
    | PointFigureRenderer;
  type: SeriesType;
  paneId: string;
  /** Cached Heikin-Ashi transformed store (invalidated when data length changes). */
  _haCache?: { length: number; store: import('../core/types').ColumnStore };
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
  private _paneContainer: HTMLDivElement;
  private _timeAxisCanvas: HTMLCanvasElement;
  private _timeAxisCtx: CanvasRenderingContext2D;
  private _tooltipEl: HTMLDivElement;

  private _timeScale: TimeScale;
  private _crosshair: Crosshair;
  private _mask: InvalidateMask;

  // Per-pane system
  private _paneMap: Map<string, Pane> = new Map();
  private _paneOrder: string[] = []; // ordered list of pane ids (main first)
  private _paneApis: Map<string, PaneApi> = new Map();
  private _dividers: PaneDivider[] = [];
  /** Cleanup functions for pointer listeners attached to indicator pane overlays. */
  private _panePointerCleanup: Map<string, () => void> = new Map();

  private _eventRouter: EventRouter;
  private _panZoomHandler: PanZoomHandler;
  private _crosshairHandler: CrosshairHandler | null = null;
  private _contextMenuHandler: ContextMenuHandler | null = null;

  private _series: SeriesEntry[] = [];

  private _rafId: number | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _removed: boolean = false;

  private _crosshairMoveCallbacks: CrosshairMoveCallback[] = [];
  private _clickCallbacks: ClickCallback[] = [];
  private _dblClickCallbacks: DblClickCallback[] = [];
  private _visibleRangeChangeCallbacks: VisibleRangeChangeCallback[] = [];
  private _drawingEventCallbacks: DrawingEventCallback[] = [];
  private _indicatorEventCallbacks: IndicatorEventCallback[] = [];
  private _resizeCallbacks: ResizeCallback[] = [];
  private _symbolChangeCallbacks: SymbolChangeCallback[] = [];
  private _chartTypeChangeCallbacks: ChartTypeChangeCallback[] = [];
  private _preferencesChangeCallbacks: PreferencesChangeCallback[] = [];
  private _layoutChangeCallbacks: LayoutChangeCallback[] = [];
  private _lastVisibleRangeFrom: number | null = null;
  private _lastVisibleRangeTo: number | null = null;

  private _width: number;
  private _height: number;

  // ── Tooltip/Legend caching ──────────────────────────────────────────────
  private _lastTooltipBarIdx: number = -1;
  private _tooltipWidth: number = 140;
  private _tooltipHeight: number = 80;
  private _priceFormat!: (price: number) => string;
  private _timeFormat!: (ts: number, tick: 'year' | 'month' | 'day' | 'time', crosshair?: boolean) => string;

  // Pre-created tooltip child elements
  private _tooltipDateEl!: HTMLDivElement;
  private _tooltipOHEl!: HTMLDivElement;
  private _tooltipLCEl!: HTMLDivElement;
  private _tooltipVEl!: HTMLDivElement;

  // HUD management (per-pane heads-up display)
  private _huds: Map<string, HudManager> = new Map();

  // The "primary" pane id for the mask
  private readonly _mainPaneId = 'main';

  // Track next pane id
  private _nextPaneId = 0;

  // Indicator management
  private _indicators: IndicatorApi[] = [];
  private _nextIndicatorId = 0;

  // Comparison mode
  private _comparisonMode: boolean = false;
  private _basisPrices: Map<SeriesApi<SeriesType>, number> = new Map(); // series -> basis price (first visible bar's close)

  // Drawing tools
  private _drawings: (ISeriesPrimitive & DrawingPrimitive)[] = [];
  private _drawingApis: Map<string, DrawingApiImpl> = new Map();
  private _drawingHandler: DrawingHandler | null = null;
  private _nextDrawingId = 0;

  // Periodicity
  private _periodicity: Periodicity = { interval: 1, unit: 'day' };
  private _periodicityCallbacks: ((p: Periodicity) => void)[] = [];

  // Market sessions
  private _marketSessions: MarketSession[] = [];
  private _sessionFilter: string = 'all';

  // Animation state for smooth streaming updates
  private _lastBarAnims: Map<SeriesApi<SeriesType>, LastBarAnimState> = new Map();

  private get _chartWidth(): number {
    const leftScaleW = this._options.leftPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    const rightScaleW = this._options.rightPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    return this._width - leftScaleW - rightScaleW;
  }

  /** Get the main Pane instance. */
  private get _mainPane(): Pane {
    return this._paneMap.get(this._mainPaneId)!;
  }

  constructor(container: HTMLElement, options: ChartOptions) {
    this._options = options;
    this._container = container;
    this._width = options.width;
    this._height = options.height;
    this._initFormatters();

    // ── DOM setup ──────────────────────────────────────────────────────────
    this._wrapper = document.createElement('div');
    this._wrapper.style.position = 'relative';
    this._wrapper.style.overflow = 'hidden';
    this._wrapper.style.width = `${this._width}px`;
    this._wrapper.style.height = `${this._height}px`;
    this._wrapper.style.backgroundColor = options.layout.backgroundColor;

    // Pane container (flex column holds all pane rows + dividers)
    this._paneContainer = document.createElement('div');
    this._paneContainer.style.display = 'flex';
    this._paneContainer.style.flexDirection = 'column';
    this._paneContainer.style.width = '100%';

    // Create main pane
    const mainPaneHeight = this._height - TIME_AXIS_HEIGHT;
    const mainPane = new Pane(this._mainPaneId, mainPaneHeight);
    this._paneMap.set(this._mainPaneId, mainPane);
    this._paneOrder.push(this._mainPaneId);
    this._paneContainer.appendChild(mainPane.row);

    this._wrapper.appendChild(this._paneContainer);

    // Time axis canvas — below all panes
    this._timeAxisCanvas = document.createElement('canvas');
    this._timeAxisCanvas.style.position = 'absolute';
    this._timeAxisCanvas.style.left = '0';
    this._timeAxisCanvas.style.zIndex = '1';
    this._wrapper.appendChild(this._timeAxisCanvas);

    // HUD overlay for main pane
    this._createHudForPane(this._mainPaneId, mainPane);

    // Tooltip overlay (DOM-based)
    this._tooltipEl = document.createElement('div');
    this._tooltipEl.style.cssText =
      `position:absolute;z-index:20;pointer-events:none;display:none;` +
      `background:rgba(0,0,0,0.78);color:${options.layout.textColor};border-radius:4px;padding:6px 10px;` +
      `font-size:${options.layout.fontSize}px;font-family:${options.layout.fontFamily};` +
      `line-height:1.5;white-space:nowrap;`;
    // Pre-create tooltip child elements
    this._tooltipDateEl = document.createElement('div');
    this._tooltipDateEl.style.marginBottom = '2px';
    this._tooltipDateEl.style.color = '#999';
    this._tooltipOHEl = document.createElement('div');
    this._tooltipLCEl = document.createElement('div');
    this._tooltipVEl = document.createElement('div');
    this._tooltipEl.appendChild(this._tooltipDateEl);
    this._tooltipEl.appendChild(this._tooltipOHEl);
    this._tooltipEl.appendChild(this._tooltipLCEl);
    this._tooltipEl.appendChild(this._tooltipVEl);

    this._wrapper.appendChild(this._tooltipEl);

    container.appendChild(this._wrapper);

    // Get contexts
    this._timeAxisCtx = this._timeAxisCanvas.getContext('2d')!;

    // Layout panes and canvases
    this._layoutPanes();

    // ── Core model ─────────────────────────────────────────────────────────
    this._timeScale = new TimeScale(options.timeScale);
    const leftScaleW = options.leftPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    const rightScaleW = options.rightPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    this._timeScale.setWidth(this._width - leftScaleW - rightScaleW);

    this._crosshair = new Crosshair();

    this._mask = new InvalidateMask();
    this._mask.addPane(this._mainPaneId);

    // ── Interactions ───────────────────────────────────────────────────────
    this._eventRouter = new EventRouter();
    this._panZoomHandler = new PanZoomHandler(this._timeScale, () =>
      this.requestRepaint(InvalidationLevel.Full),
    );
    this._eventRouter.addHandler(this._panZoomHandler);
    this._eventRouter.attach(mainPane.canvases.overlayCanvas);

    // ── Context Menu ───────────────────────────────────────────────────────
    this._contextMenuHandler = new ContextMenuHandler({
      getDrawings: () => this._drawings
        .filter((d): d is BaseDrawing => d instanceof BaseDrawing)
        .map(d => ({ drawing: d, id: d.id })),
      getIndicatorAtPane: (paneId: string) => {
        const ind = this._indicators.find(i => i.paneId() === paneId);
        return ind ? { id: `indicator-${ind.id}`, label: ind.label() } : null;
      },
      getPaneAtY: (y: number) => {
        let cumY = 0;
        for (const paneId of this._paneOrder) {
          const pane = this._paneMap.get(paneId)!;
          if (y >= cumY && y < cumY + pane.height) return paneId;
          cumY += pane.height;
        }
        return null;
      },
      mainPaneId: this._mainPaneId,
      editDrawing: (id) => {
        const drawing = this._drawings.find(d => d instanceof BaseDrawing && d.id === id) as BaseDrawing | undefined;
        if (drawing) { drawing.selected = true; this.requestRepaint(InvalidationLevel.Full); }
      },
      removeDrawing: (id) => {
        const api = this._drawingApis.get(id);
        if (api) this.removeDrawing(api);
      },
      duplicateDrawing: (id) => {
        const drawing = this._drawings.find(d => d instanceof BaseDrawing && d.id === id) as BaseDrawing | undefined;
        if (!drawing) return;
        const s = drawing.serialize();
        // Offset both time (+1 bar) and price (+1% of price range) so duplicate is visible
        const priceRange = this._mainPane.priceScale.priceRange;
        const priceOffset = (priceRange.max - priceRange.min) * 0.02;
        const offsetPoints = s.points.map(p => ({ time: p.time + 1, price: p.price + priceOffset }));
        this._addDrawingByIndex(s.type, offsetPoints, s.options);
      },
      bringDrawingToFront: (id) => {
        const idx = this._drawings.findIndex(d => d instanceof BaseDrawing && d.id === id);
        if (idx !== -1 && idx < this._drawings.length - 1) {
          const [d] = this._drawings.splice(idx, 1);
          this._drawings.push(d);
          this.requestRepaint(InvalidationLevel.Full);
        }
      },
      sendDrawingToBack: (id) => {
        const idx = this._drawings.findIndex(d => d instanceof BaseDrawing && d.id === id);
        if (idx > 0) {
          const [d] = this._drawings.splice(idx, 1);
          this._drawings.unshift(d);
          this.requestRepaint(InvalidationLevel.Full);
        }
      },
      openIndicatorSettings: (id) => {
        // Find the indicator's pane HUD and programmatically trigger its gear button
        const ind = this._indicators.find(i => `indicator-${i.id}` === id);
        if (ind) {
          const hud = this._huds.get(ind.paneId());
          if (hud) {
            // Click the gear button for this indicator's HUD row
            hud.triggerSettings?.(id);
          }
        }
      },
      toggleIndicatorVisibility: (id) => {
        const ind = this._indicators.find(i => `indicator-${i.id}` === id);
        if (ind) {
          const newVis = !ind.isVisible();
          ind.applyOptions({ visible: newVis });
          for (const s of (ind as any).internalSeries) { s.applyOptions({ visible: newVis }); }
          this.requestRepaint(InvalidationLevel.Full);
        }
      },
      removeIndicator: (id) => {
        const ind = this._indicators.find(i => `indicator-${i.id}` === id);
        if (ind) this.removeIndicator(ind);
      },
      fitContent: () => { this._timeScale.fitContent(); this.requestRepaint(InvalidationLevel.Full); },
      scrollToRealTime: () => this.scrollToRealTime(),
      toggleCrosshair: () => {
        if (this._crosshairHandler) {
          this._eventRouter.removeHandler(this._crosshairHandler);
          this._crosshairHandler = null;
          this._crosshair.hide();
        } else if (this._series.length > 0) {
          this._crosshairHandler = new CrosshairHandler(
            this._crosshair, this._series[0].api.getDataLayer(),
            this._timeScale, this._mainPane.priceScale,
            () => this.requestRepaint(InvalidationLevel.Cursor),
            this._mainPaneId,
          );
          this._eventRouter.addHandler(this._crosshairHandler);
        }
        this.requestRepaint(InvalidationLevel.Full);
      },
      theme: {
        bg: this._options.layout.backgroundColor,
        text: this._options.layout.textColor,
        border: this._options.layout.backgroundColor === '#131722' ? '#2a2e39' : '#e0e3eb',
      },
      localToScreen: (x, y) => {
        const rect = this._wrapper.getBoundingClientRect();
        return { x: rect.left + x, y: rect.top + y };
      },
    });
    this._eventRouter.addHandler(this._contextMenuHandler);

    // ── Click detection via overlay canvas ─────────────────────────────────
    mainPane.canvases.overlayCanvas.addEventListener('click', this._handleClick);
    mainPane.canvases.overlayCanvas.addEventListener('dblclick', this._handleDblClick);

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

  // ── Formatters ──────────────────────────────────────────────────────────

  private _initFormatters(): void {
    this._priceFormat = this._options.priceFormatter
      ?? createPriceFormatter({
        locale: this._options.locale,
        decimals: 2,
        currency: this._options.currency,
      });

    const customTickFormatter = this._options.timeScale.tickMarkFormatter;
    this._timeFormat = customTickFormatter
      ? (ts: number, tick: 'year' | 'month' | 'day' | 'time', _crosshair?: boolean) => customTickFormatter(ts, tick)
      : createTimeFormatter({
        timezone: this._options.timezone,
        locale: this._options.locale,
      });
  }

  private _formatPrice(price: number): string {
    return this._priceFormat(price);
  }

  // ── Series management ───────────────────────────────────────────────────

  addSeries(options: SeriesOptions): ISeriesApi<SeriesType> {
    const { type, ...rest } = options;
    return this._addSeries(type, rest as DeepPartial<SeriesOptionsMap[typeof type]>);
  }

  removeSeries(series: ISeriesApi<SeriesType>): void {
    const idx = this._series.findIndex((e) => e.api === series);
    if (idx !== -1) {
      const entry = this._series[idx];

      // Remove HUD row for this series
      const hudRowId = `series-${entry.type}-${idx}`;
      const hud = this._huds.get(entry.paneId);
      if (hud) {
        hud.removeRow(hudRowId);
      }

      this._series.splice(idx, 1);
      this._lastBarAnims.delete(entry.api);

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
            this._mainPane.priceScale,
            () => this.requestRepaint(InvalidationLevel.Cursor),
            this._mainPaneId,
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
    const defaultHeight = options?.height ?? 150;
    const pane = new Pane(id, defaultHeight);
    this._paneMap.set(id, pane);
    this._paneOrder.push(id);

    // Create divider between the previous last pane and this new one
    const prevPaneId = this._paneOrder[this._paneOrder.length - 2];
    const prevPane = this._paneMap.get(prevPaneId)!;
    const divider = new PaneDivider(
      () => prevPane.height,
      (h) => { prevPane.height = h; },
      () => pane.height,
      (h) => { pane.height = h; },
      () => this._layoutPanes(),
    );
    this._dividers.push(divider);

    // Append divider and pane row to container
    this._paneContainer.appendChild(divider.el);
    this._paneContainer.appendChild(pane.row);

    this._mask.addPane(id);
    this._createHudForPane(id, pane);

    const paneApi = new PaneApi(id, pane, () =>
      this.requestRepaint(InvalidationLevel.Full),
    );
    this._paneApis.set(id, paneApi);

    // Attach pointer listeners so the crosshair works on indicator panes
    this._attachPanePointerListeners(id, pane);

    // Recalculate main pane height to accommodate new pane
    this._layoutPanes();
    this.requestRepaint(InvalidationLevel.Full);

    for (const cb of this._layoutChangeCallbacks) cb({ action: 'pane-added', paneId: id });

    return paneApi;
  }

  removePane(pane: IPaneApi): void {
    const paneId = pane.id;
    if (paneId === this._mainPaneId) return; // Can't remove main pane

    const orderIdx = this._paneOrder.indexOf(paneId);
    if (orderIdx === -1) return;

    // Remove the pane and its preceding divider
    const internalPane = this._paneMap.get(paneId)!;
    internalPane.row.remove();

    // The divider before this pane (divider index = orderIdx - 1 since main has no preceding divider)
    const dividerIdx = orderIdx - 1;
    if (dividerIdx >= 0 && dividerIdx < this._dividers.length) {
      const divider = this._dividers[dividerIdx];
      divider.el.remove();
      divider.destroy();
      this._dividers.splice(dividerIdx, 1);
    }

    this._paneMap.delete(paneId);
    this._paneOrder.splice(orderIdx, 1);
    this._paneApis.delete(paneId);
    this._mask.removePane(paneId);

    // Clean up pointer listeners for this pane
    const cleanup = this._panePointerCleanup.get(paneId);
    if (cleanup) {
      cleanup();
      this._panePointerCleanup.delete(paneId);
    }

    // If the crosshair is currently pointing at the removed pane, reset it
    if (this._crosshair.sourcePaneId === paneId) {
      this._crosshair.hide();
      if (this._crosshairHandler) {
        this._crosshairHandler.setSourcePaneId(this._mainPaneId);
        this._crosshairHandler.setPriceScale(this._mainPane.priceScale);
      }
    }

    // Destroy HUD for this pane
    const hud = this._huds.get(paneId);
    if (hud) {
      hud.destroy();
      this._huds.delete(paneId);
    }

    // Remove series assigned to this pane
    this._series = this._series.filter((s) => s.paneId !== paneId);

    this._layoutPanes();
    this.requestRepaint(InvalidationLevel.Full);

    for (const cb of this._layoutChangeCallbacks) cb({ action: 'pane-removed', paneId });
  }

  /**
   * Attach lightweight pointer listeners to an indicator pane's overlay canvas
   * so the crosshair works when hovering over non-main panes.
   */
  private _attachPanePointerListeners(paneId: string, pane: Pane): void {
    const overlay = pane.canvases.overlayCanvas;
    overlay.style.touchAction = 'none';

    const onPointerMove = (e: PointerEvent) => {
      if (!this._crosshairHandler || this._series.length === 0) return;
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update crosshair handler to use this pane's price scale and pane ID
      this._crosshairHandler.setSourcePaneId(paneId);
      this._crosshairHandler.setPriceScale(pane.priceScale);
      this._crosshairHandler.onPointerMove(x, y, e.pointerId);
    };

    const onPointerLeave = () => {
      if (!this._crosshairHandler) return;
      // Restore main pane context and hide crosshair
      this._crosshairHandler.setSourcePaneId(this._mainPaneId);
      this._crosshairHandler.setPriceScale(this._mainPane.priceScale);
      this._crosshairHandler.onPointerUp(0);
    };

    overlay.addEventListener('pointermove', onPointerMove);
    overlay.addEventListener('pointerleave', onPointerLeave);

    this._panePointerCleanup.set(paneId, () => {
      overlay.removeEventListener('pointermove', onPointerMove);
      overlay.removeEventListener('pointerleave', onPointerLeave);
    });
  }

  // ── Scale access ────────────────────────────────────────────────────────

  timeScale(): TimeScale {
    return this._timeScale;
  }

  priceScale(id?: string): PriceScale {
    if (id) {
      // Check if it's a pane id
      const pane = this._paneMap.get(id);
      if (pane) return pane.priceScale;
      // Check if it's 'left' for the main pane
      if (id === 'left') return this._mainPane.leftPriceScale;
    }
    return this._mainPane.priceScale;
  }

  // ── Options ─────────────────────────────────────────────────────────────

  applyOptions(options: DeepPartial<ChartOptions>): void {
    const prevSymbol = this._options.symbol;
    this._options = mergeOptions(this._options, options);
    this._initFormatters();

    // Emit symbol change if symbol was updated
    if (options.symbol !== undefined && options.symbol !== prevSymbol) {
      for (const cb of this._symbolChangeCallbacks) cb({ previous: prevSymbol ?? '', current: options.symbol ?? '' });
    }

    if (options.layout?.backgroundColor) {
      this._wrapper.style.backgroundColor = this._options.layout.backgroundColor;
    }

    if (options.timeScale) {
      this._timeScale.setOptions(this._options.timeScale);
    }

    // Re-layout canvases if scale visibility changed
    if (options.leftPriceScale !== undefined || options.rightPriceScale !== undefined ||
        options.width !== undefined || options.height !== undefined) {
      this.resize(this._options.width, this._options.height);
    } else {
      this.requestRepaint(InvalidationLevel.Full);
    }

    for (const cb of this._preferencesChangeCallbacks) cb(options);
  }

  options(): ChartOptions {
    return { ...this._options };
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;

    this._wrapper.style.width = `${width}px`;
    this._wrapper.style.height = `${height}px`;

    const leftScaleWidthR = this._options.leftPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    const rightScaleWidthR = this._options.rightPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    this._timeScale.setWidth(width - leftScaleWidthR - rightScaleWidthR);

    this._options.width = width;
    this._options.height = height;

    this._layoutPanes();
    this.requestRepaint(InvalidationLevel.Full);

    for (const cb of this._resizeCallbacks) cb({ width, height });
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
    this._mainPane.canvases.overlayCanvas.removeEventListener('click', this._handleClick);
    this._mainPane.canvases.overlayCanvas.removeEventListener('dblclick', this._handleDblClick);

    // Clean up all indicator pane pointer listeners
    for (const cleanup of this._panePointerCleanup.values()) cleanup();
    this._panePointerCleanup.clear();

    // Clean up all indicator pane pointer listeners
    for (const cleanup of this._panePointerCleanup.values()) cleanup();
    this._panePointerCleanup.clear();

    // Clean up HUDs
    for (const hud of this._huds.values()) hud.destroy();
    this._huds.clear();

    // Clean up dividers
    for (const d of this._dividers) d.destroy();
    this._dividers.length = 0;

    this._visibleRangeChangeCallbacks.length = 0;
    this._crosshairMoveCallbacks.length = 0;
    this._clickCallbacks.length = 0;
    this._dblClickCallbacks.length = 0;
    this._drawingEventCallbacks.length = 0;
    this._indicatorEventCallbacks.length = 0;
    this._resizeCallbacks.length = 0;
    this._symbolChangeCallbacks.length = 0;
    this._chartTypeChangeCallbacks.length = 0;
    this._preferencesChangeCallbacks.length = 0;
    this._layoutChangeCallbacks.length = 0;

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

  subscribeDblClick(callback: DblClickCallback): void {
    this._dblClickCallbacks.push(callback);
  }

  unsubscribeDblClick(callback: DblClickCallback): void {
    const idx = this._dblClickCallbacks.indexOf(callback);
    if (idx !== -1) this._dblClickCallbacks.splice(idx, 1);
  }

  subscribeDrawingEvent(callback: DrawingEventCallback): void {
    this._drawingEventCallbacks.push(callback);
  }

  unsubscribeDrawingEvent(callback: DrawingEventCallback): void {
    const idx = this._drawingEventCallbacks.indexOf(callback);
    if (idx !== -1) this._drawingEventCallbacks.splice(idx, 1);
  }

  subscribeIndicatorEvent(callback: IndicatorEventCallback): void {
    this._indicatorEventCallbacks.push(callback);
  }

  unsubscribeIndicatorEvent(callback: IndicatorEventCallback): void {
    const idx = this._indicatorEventCallbacks.indexOf(callback);
    if (idx !== -1) this._indicatorEventCallbacks.splice(idx, 1);
  }

  subscribeResize(callback: ResizeCallback): void {
    this._resizeCallbacks.push(callback);
  }

  unsubscribeResize(callback: ResizeCallback): void {
    const idx = this._resizeCallbacks.indexOf(callback);
    if (idx !== -1) this._resizeCallbacks.splice(idx, 1);
  }

  subscribeSymbolChange(callback: SymbolChangeCallback): void {
    this._symbolChangeCallbacks.push(callback);
  }

  unsubscribeSymbolChange(callback: SymbolChangeCallback): void {
    const idx = this._symbolChangeCallbacks.indexOf(callback);
    if (idx !== -1) this._symbolChangeCallbacks.splice(idx, 1);
  }

  subscribeChartTypeChange(callback: ChartTypeChangeCallback): void {
    this._chartTypeChangeCallbacks.push(callback);
  }

  unsubscribeChartTypeChange(callback: ChartTypeChangeCallback): void {
    const idx = this._chartTypeChangeCallbacks.indexOf(callback);
    if (idx !== -1) this._chartTypeChangeCallbacks.splice(idx, 1);
  }

  subscribePreferencesChange(callback: PreferencesChangeCallback): void {
    this._preferencesChangeCallbacks.push(callback);
  }

  unsubscribePreferencesChange(callback: PreferencesChangeCallback): void {
    const idx = this._preferencesChangeCallbacks.indexOf(callback);
    if (idx !== -1) this._preferencesChangeCallbacks.splice(idx, 1);
  }

  subscribeLayoutChange(callback: LayoutChangeCallback): void {
    this._layoutChangeCallbacks.push(callback);
  }

  unsubscribeLayoutChange(callback: LayoutChangeCallback): void {
    const idx = this._layoutChangeCallbacks.indexOf(callback);
    if (idx !== -1) this._layoutChangeCallbacks.splice(idx, 1);
  }

  // ── Feature 1: Range Switcher ─────────────────────────────────────────

  setVisibleRange(from: number, to: number): void {
    if (this._series.length === 0) return;
    const dl = this._series[0].api.getDataLayer();
    if (dl.store.length === 0) return;

    // Find bar indices corresponding to the timestamps using binary search
    const fromIdx = dl.findIndex(from);
    const toIdx = dl.findIndex(to);
    this.setVisibleLogicalRange(fromIdx, toIdx);
  }

  setVisibleLogicalRange(from: number, to: number): void {
    // Sync dataLength from primary series in case this is called before first paint
    if (this._series.length > 0) {
      const store = this._series[0].api.getDataLayer().store;
      this._timeScale.setDataLength(store.length);
    }

    const barsToShow = to - from + 1;
    if (barsToShow <= 0) return;

    const chartW = this._chartWidth;
    if (chartW <= 0) return;

    // Set barSpacing so exactly barsToShow bars fit in the chart width.
    // setOptions() internally clamps to [minBarSpacing, maxBarSpacing].
    const newBarSpacing = chartW / barsToShow;
    this._timeScale.setOptions({ barSpacing: newBarSpacing });

    // Compute rightOffset so that `to` sits at the right edge.
    // rightBorder = baseIndex + rightOffset = to  ->  rightOffset = to - baseIndex
    const baseIndex = this._timeScale.dataLength > 0
      ? this._timeScale.dataLength - 1
      : 0;
    const newRightOffset = to - baseIndex;

    this._timeScale.setRightOffset(newRightOffset);
    this.requestRepaint(InvalidationLevel.Full);
  }

  // ── Feature 2: Go to Realtime ─────────────────────────────────────────

  scrollToRealTime(): void {
    this._timeScale.scrollToEnd();
    this.requestRepaint(InvalidationLevel.Full);
  }

  // ── Feature 4: Fit Content & Screenshot ───────────────────────────────

  fitContent(): void {
    this._timeScale.fitContent();
    this.requestRepaint(InvalidationLevel.Full);
  }

  takeScreenshot(): HTMLCanvasElement {
    // Force a synchronous paint so canvases are up to date
    this._paint();

    const pixelRatio = window.devicePixelRatio || 1;
    const totalW = Math.round(this._width * pixelRatio);
    const totalH = Math.round(this._height * pixelRatio);

    const offscreen = document.createElement('canvas');
    offscreen.width = totalW;
    offscreen.height = totalH;
    const ctx = offscreen.getContext('2d')!;

    const leftScaleW = this._options.leftPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    const rightScaleW = this._options.rightPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    const chartW = this._chartWidth;

    let yOffset = 0;

    for (const paneId of this._paneOrder) {
      const pane = this._paneMap.get(paneId)!;
      const paneH = Math.round(pane.height * pixelRatio);
      const cvs = pane.canvases;

      // Left price axis
      if (this._options.leftPriceScale.visible) {
        ctx.drawImage(cvs.leftPriceAxisCanvas, 0, yOffset);
      }

      // Chart canvas
      ctx.drawImage(cvs.chartCanvas, Math.round(leftScaleW * pixelRatio), yOffset);

      // Overlay canvas (same position, layered on top)
      ctx.drawImage(cvs.overlayCanvas, Math.round(leftScaleW * pixelRatio), yOffset);

      // Right price axis
      if (this._options.rightPriceScale.visible) {
        ctx.drawImage(cvs.rightPriceAxisCanvas, Math.round((leftScaleW + chartW) * pixelRatio), yOffset);
      }

      yOffset += paneH;

      // Account for divider between panes (4px logical = DIVIDER_HEIGHT)
      if (paneId !== this._paneOrder[this._paneOrder.length - 1]) {
        yOffset += Math.round(DIVIDER_HEIGHT * pixelRatio);
      }
    }

    // Draw time axis at the bottom
    ctx.drawImage(this._timeAxisCanvas, Math.round(leftScaleW * pixelRatio), yOffset);

    return offscreen;
  }

  // ── Feature 5: Indicator API ────────────────────────────────────────────

  addIndicator(type: IndicatorType, options: IndicatorOptions): IIndicatorApi {
    const id = `indicator-${this._nextIndicatorId++}`;

    // 1. Resolve params
    const defaults = DEFAULT_INDICATOR_PARAMS[type] ?? {};
    const params = { ...defaults, ...(options.params ?? {}) };

    // 2. Determine pane
    let paneId: string;
    let autoCreatedPaneId: string | null = null;
    if (options.paneId) {
      paneId = options.paneId;
    } else if (OVERLAY_INDICATORS.has(type)) {
      paneId = this._mainPaneId;
    } else {
      const newPane = this.addPane({ height: 150 });
      paneId = newPane.id;
      autoCreatedPaneId = paneId;
    }

    // 3. Read source series data
    const sourceApi = options.source as SeriesApi<SeriesType>;
    const store = sourceApi.getDataLayer().store;

    // 4. Compute indicator
    const result = this._computeIndicator(type, store, params);

    // 5-6. Create internal series
    const color = options.color ?? '#2962ff';
    const lineWidth = options.lineWidth ?? 2;
    const customColors = options.colors;
    const histUpColor = options.histogramUpColor ?? 'rgba(34, 171, 148, 0.4)';
    const histDownColor = options.histogramDownColor ?? 'rgba(247, 82, 95, 0.4)';

    const indicator = new IndicatorApi(id, type, options, paneId, () => {
      this.removeIndicator(indicator);
    });
    indicator.autoCreatedPaneId = autoCreatedPaneId;

    this._createIndicatorSeries(indicator, result, store, paneId, color, lineWidth, customColors, histUpColor, histDownColor);

    // 7. Subscribe to source's dataChanged for auto-recompute
    const dataChangedCallback = (): void => {
      const updatedStore = sourceApi.getDataLayer().store;
      const updatedResult = this._computeIndicator(type, updatedStore, params);

      // Remove old internal series
      for (const s of indicator.internalSeries) {
        this.removeSeries(s);
      }
      indicator.internalSeries = [];

      // Recreate with updated data
      this._createIndicatorSeries(indicator, updatedResult, updatedStore, paneId, color, lineWidth, customColors, histUpColor, histDownColor);
    };
    indicator._dataChangedCallback = dataChangedCallback;
    options.source.subscribeDataChanged(dataChangedCallback);

    this._indicators.push(indicator);

    // Register HUD row for this indicator
    this._registerIndicatorHudRow(indicator, options);

    for (const cb of this._indicatorEventCallbacks) cb({ type: 'added', indicatorId: id, indicatorType: type, paneId });

    return indicator;
  }

  removeIndicator(indicator: IIndicatorApi): void {
    const impl = indicator as IndicatorApi;
    const idx = this._indicators.indexOf(impl);
    if (idx === -1) return;

    // Remove HUD row for this indicator
    const hud = this._huds.get(impl.paneId());
    if (hud) {
      hud.removeRow(`indicator-${impl.id}`);
    }

    // 1. Remove all internal series
    for (const s of impl.internalSeries) {
      this.removeSeries(s);
    }
    impl.internalSeries = [];

    // 2. If auto-created pane and no other series/indicators use it, remove the pane
    if (impl.autoCreatedPaneId) {
      const autoPaneId = impl.autoCreatedPaneId;
      const otherSeriesInPane = this._series.some(s => s.paneId === autoPaneId);
      const otherIndicatorsInPane = this._indicators.some(
        (ind, i) => i !== idx && ind.paneId() === autoPaneId,
      );
      if (!otherSeriesInPane && !otherIndicatorsInPane) {
        const paneApi = this._paneApis.get(autoPaneId);
        if (paneApi) {
          this.removePane(paneApi);
        }
      }
    }

    // 3. Unsubscribe from source dataChanged
    if (impl._dataChangedCallback) {
      impl.options().source.unsubscribeDataChanged(impl._dataChangedCallback);
      impl._dataChangedCallback = null;
    }

    // 4. Remove from _indicators array
    const removedType = impl.indicatorType();
    const removedPaneId = impl.paneId();
    this._indicators.splice(idx, 1);

    for (const cb of this._indicatorEventCallbacks) cb({ type: 'removed', indicatorId: impl.id, indicatorType: removedType, paneId: removedPaneId });
  }

  private _computeIndicator(
    type: IndicatorType,
    store: ColumnStore,
    params: Record<string, number>,
  ): Record<string, Float64Array> {
    const len = store.length;
    const close = store.close;
    const high = store.high;
    const low = store.low;
    const volume = store.volume;

    switch (type) {
      case 'sma':
        return { value: computeSMA(close, len, params.period) };
      case 'ema':
        return { value: computeEMA(close, len, params.period) };
      case 'rsi':
        return { value: computeRSI(close, len, params.period) };
      case 'macd': {
        const r = computeMACD(close, len, params.fastPeriod, params.slowPeriod, params.signalPeriod);
        return { macd: r.macd, signal: r.signal, histogram: r.histogram };
      }
      case 'bollinger': {
        const r = computeBollinger(close, len, params.period, params.stdDev);
        return { upper: r.upper, middle: r.middle, lower: r.lower };
      }
      case 'vwap':
        return { value: computeVWAP(high, low, close, volume, len) };
      case 'stochastic': {
        const r = computeStochastic(high, low, close, len, params.kPeriod, params.dPeriod);
        return { k: r.k, d: r.d };
      }
      case 'atr':
        return { value: computeATR(high, low, close, len, params.period) };
      case 'adx': {
        const r = computeADX(high, low, close, len, params.period);
        return { adx: r.adx, plusDI: r.plusDI, minusDI: r.minusDI };
      }
      case 'obv':
        return { value: computeOBV(close, volume, len) };
      case 'williams-r':
        return { value: computeWilliamsR(high, low, close, len, params.period) };
      case 'ichimoku': {
        const r = computeIchimoku(high, low, close, len, params.tenkanPeriod, params.kijunPeriod, params.senkouPeriod);
        return { tenkan: r.tenkan, kijun: r.kijun, senkouA: r.senkouA, senkouB: r.senkouB, chikou: r.chikou };
      }
      case 'parabolic-sar':
        return { value: computeParabolicSAR(high, low, len, params.afStep, params.afMax) };
      case 'keltner': {
        const r = computeKeltner(close, high, low, len, params.emaPeriod, params.atrPeriod, params.multiplier);
        return { upper: r.upper, middle: r.middle, lower: r.lower };
      }
      case 'donchian': {
        const r = computeDonchian(high, low, len, params.period);
        return { upper: r.upper, middle: r.middle, lower: r.lower };
      }
      case 'cci':
        return { value: computeCCI(high, low, close, len, params.period) };
      case 'pivot-points': {
        const r = computePivotPoints(high, low, close, len);
        return { pp: r.pp, r1: r.r1, r2: r.r2, r3: r.r3, s1: r.s1, s2: r.s2, s3: r.s3 };
      }
      case 'aroon': {
        const r = computeAroon(high, low, len, params.period ?? 25);
        return { up: r.up, down: r.down };
      }
      case 'awesome-oscillator':
        return { histogram: computeAwesomeOscillator(high, low, len, params.fastPeriod ?? 5, params.slowPeriod ?? 34) };
      case 'chaikin-mf':
        return { value: computeChaikinMF(high, low, close, volume, len, params.period ?? 20) };
      case 'coppock':
        return { value: computeCoppock(close, len, params.wmaPeriod ?? 10, params.longROC ?? 14, params.shortROC ?? 11) };
      case 'elder-force':
        return { value: computeElderForce(close, volume, len, params.period ?? 13) };
      case 'trix': {
        const r = computeTRIX(close, len, params.period ?? 15, params.signalPeriod ?? 9);
        return { trix: r.trix, signal: r.signal };
      }
      case 'supertrend': {
        const r = computeSupertrend(high, low, close, len, params.period ?? 10, params.multiplier ?? 3);
        return { value: r.value };
      }
      case 'vwma':
        return { value: computeVWMA(close, volume, len, params.period ?? 20) };
      case 'choppiness':
        return { value: computeChoppiness(high, low, close, len, params.period ?? 14) };
      case 'mfi':
        return { value: computeMFI(high, low, close, volume, len, params.period ?? 14) };
      case 'roc':
        return { value: computeROC(close, len, params.period ?? 12) };
      case 'linear-regression':
        return { value: computeLinearRegression(close, len, params.period ?? 20) };
      default:
        throw new Error(`Unknown indicator type: ${type}`);
    }
  }

  private _createIndicatorSeries(
    indicator: IndicatorApi,
    result: Record<string, Float64Array>,
    store: ColumnStore,
    paneId: string,
    primaryColor: string,
    lineWidth: number,
    customColors?: Record<string, string>,
    histUpColor: string = 'rgba(34, 171, 148, 0.4)',
    histDownColor: string = 'rgba(247, 82, 95, 0.4)',
  ): void {
    const type = indicator.indicatorType();

    // Color map for multi-output indicators — custom overrides take precedence
    const defaultColorMap = this._getIndicatorColorMap(type, primaryColor);
    const colorMap = customColors ? { ...defaultColorMap, ...customColors } : defaultColorMap;

    // Draw histogram series first so line series render on top
    const sortedKeys = Object.keys(result).sort((a, b) =>
      (a === 'histogram' ? -1 : 0) - (b === 'histogram' ? -1 : 0),
    );
    for (const key of sortedKeys) {
      const values = result[key];
      const color = colorMap[key] ?? primaryColor;

      // Build Bar[] data from time + indicator values
      const bars: Bar[] = [];
      for (let i = 0; i < store.length; i++) {
        const v = values[i];
        if (isNaN(v)) continue;
        bars.push({
          time: store.time[i],
          open: v,
          high: v,
          low: v,
          close: v,
          volume: 0,
        });
      }

      let series: ISeriesApi<SeriesType>;
      if (key === 'histogram') {
        series = this._addSeries('histogram', {
          paneId,
          data: bars,
          upColor: histUpColor,
          downColor: histDownColor,
        }, true);
      } else {
        series = this._addSeries('line', {
          paneId,
          data: bars,
          color,
          lineWidth,
        }, true);
      }

      indicator.internalSeries.push(series);
    }
  }

  private _getIndicatorColorMap(
    type: IndicatorType,
    primaryColor: string,
  ): Record<string, string> {
    switch (type) {
      case 'macd':
        return { macd: '#2962ff', signal: '#ff6d00', histogram: '#22AB94' };
      case 'bollinger':
        return { upper: '#42a5f5', middle: primaryColor, lower: '#42a5f5' };
      case 'stochastic':
        return { k: primaryColor, d: '#ff6d00' };
      case 'adx':
        return { adx: primaryColor, plusDI: '#22AB94', minusDI: '#F7525F' };
      case 'ichimoku':
        return { tenkan: '#2962ff', kijun: '#F7525F', senkouA: '#22AB94', senkouB: '#ee6823', chikou: '#9c27b0' };
      case 'keltner':
        return { upper: '#42a5f5', middle: primaryColor, lower: '#42a5f5' };
      case 'donchian':
        return { upper: '#42a5f5', middle: primaryColor, lower: '#42a5f5' };
      case 'pivot-points':
        return { pp: primaryColor, r1: '#F7525F', r2: '#F7525F', r3: '#F7525F', s1: '#22AB94', s2: '#22AB94', s3: '#22AB94' };
      case 'aroon':
        return { up: '#22AB94', down: '#F7525F' };
      case 'trix':
        return { trix: primaryColor, signal: '#ff6d00' };
      default:
        return { value: primaryColor };
    }
  }

  // ── Feature 6: Comparison Mode ───────────────────────────────────────────

  setComparisonMode(enabled: boolean): void {
    this._comparisonMode = enabled;
    this._basisPrices.clear();
    for (const pane of this._paneMap.values()) {
      pane.priceScale.setComparisonMode(enabled);
    }
    this.requestRepaint(InvalidationLevel.Full);
  }

  isComparisonMode(): boolean {
    return this._comparisonMode;
  }

  // ── Feature 8: Drawing Tools ──────────────────────────────────────────────

  addDrawing(type: string, points: AnchorPoint[], options: DrawingOptions = {}): IDrawingApi {
    // Public API: convert timestamp-based AnchorPoints to bar-index-based points.
    // Internally, drawings store time as a bar index, but callers provide Unix
    // timestamps matching the underlying series data.
    let resolvedPoints = points;
    if (this._series.length > 0) {
      const dl = this._series[0].api.getDataLayer();
      if (dl.store.length > 0) {
        resolvedPoints = points.map(p => ({
          ...p,
          time: dl.findIndex(p.time),
        }));
      }
    }
    return this._addDrawingByIndex(type, resolvedPoints, options);
  }

  /** @internal Add a drawing with points already expressed as bar indices. */
  _addDrawingByIndex(type: string, points: AnchorPoint[], options: DrawingOptions = {}): IDrawingApi {
    const id = `drawing_${this._nextDrawingId++}`;
    const drawing = createBuiltinDrawing(type, id, points, options);
    if (!drawing) throw new Error(`Unknown drawing type: ${type}`);
    if (drawing instanceof BaseDrawing) {
      drawing.setContext(this._getDrawingContext());
    }
    this._drawings.push(drawing);
    const api = new DrawingApiImpl(id, drawing, this);
    this._drawingApis.set(id, api);
    this.requestRepaint(InvalidationLevel.Full);

    for (const cb of this._drawingEventCallbacks) cb({ type: 'created', drawingId: id, drawingType: type });

    return api;
  }

  removeDrawing(drawingApi: IDrawingApi): void {
    const idx = this._drawings.findIndex(d => {
      if (d instanceof BaseDrawing) return d.id === drawingApi.id;
      return false;
    });
    if (idx !== -1) {
      const drawingType = drawingApi.drawingType();
      this._drawings.splice(idx, 1);
      this._drawingApis.delete(drawingApi.id);
      this.requestRepaint(InvalidationLevel.Full);

      for (const cb of this._drawingEventCallbacks) cb({ type: 'removed', drawingId: drawingApi.id, drawingType });
    }
  }

  getDrawings(): IDrawingApi[] {
    return Array.from(this._drawingApis.values());
  }

  setActiveDrawingTool(type: string | null): void {
    this._ensureDrawingHandler();
    this._drawingHandler!.setActiveToolType(type);
  }

  registerDrawingType(
    type: string,
    factory: (id: string, points: AnchorPoint[], options: DrawingOptions) => ISeriesPrimitive & DrawingPrimitive,
  ): void {
    DRAWING_REGISTRY.set(type, factory);
  }

  serializeDrawings(): SerializedDrawing[] {
    return this._drawings.map(d => d.serialize());
  }

  deserializeDrawings(data: SerializedDrawing[]): void {
    // Remove all existing
    this._drawings.length = 0;
    this._drawingApis.clear();
    for (const entry of data) {
      const drawing = createBuiltinDrawing(entry.type, entry.id, entry.points, entry.options);
      if (!drawing) continue;
      if (drawing instanceof BaseDrawing) {
        drawing.setContext(this._getDrawingContext());
      }
      this._drawings.push(drawing);
      const api = new DrawingApiImpl(entry.id, drawing, this);
      this._drawingApis.set(entry.id, api);
    }
    this.requestRepaint(InvalidationLevel.Full);
  }

  exportState(): ChartState {
    // Collect series configs (no bar data)
    const seriesEntries = this._series.map((entry, idx) => ({
      id: `series-${idx}`,
      type: entry.type,
      options: entry.api.options() as unknown as Record<string, unknown>,
    }));

    // Collect indicator configs
    const indicatorEntries = this._indicators.map((ind) => {
      const opts = ind.options();
      return {
        type: ind.indicatorType(),
        sourceSeriesId: 'series-0', // primary series
        params: (opts.params ?? {}) as Record<string, number>,
        color: opts.color,
      };
    });

    // Collect pane heights
    const paneEntries = this._paneOrder.map((paneId) => {
      const pane = this._paneMap.get(paneId)!;
      return { id: paneId, height: pane.height };
    });

    // Collect visible range (time values)
    const visibleRange = this._timeScale.visibleRange();
    let visibleRangeTs: { from: number; to: number } | undefined;
    if (visibleRange) {
      const store = this._series[0]?.api.getDataLayer().store;
      if (store && store.length > 0) {
        const fromIdx = Math.max(0, Math.min(Math.floor(visibleRange.fromIdx), store.length - 1));
        const toIdx = Math.max(0, Math.min(Math.floor(visibleRange.toIdx), store.length - 1));
        visibleRangeTs = { from: store.time[fromIdx], to: store.time[toIdx] };
      }
    }

    return {
      version: CHART_STATE_VERSION,
      options: this._options as unknown as import('../core/types').DeepPartial<ChartOptions>,
      comparisonMode: this._comparisonMode,
      timeScale: {
        barSpacing: this._timeScale.barSpacing,
        rightOffset: this._timeScale.rightOffset,
      },
      series: seriesEntries,
      indicators: indicatorEntries,
      panes: paneEntries,
      drawings: this.serializeDrawings(),
      visibleRange: visibleRangeTs,
    };
  }

  async importState(state: ChartState, dataLoader: (seriesId: string) => Promise<Bar[]>): Promise<void> {
    if (!validateChartState(state)) {
      throw new Error('Invalid chart state: failed validation');
    }

    // Apply options
    this.applyOptions(state.options as DeepPartial<ChartOptions>);

    // Apply comparison mode
    if (state.comparisonMode !== undefined) {
      this.setComparisonMode(state.comparisonMode);
    }

    // Apply time scale
    this._timeScale.setOptions({
      barSpacing: state.timeScale.barSpacing,
    });
    this._timeScale.setRightOffset(state.timeScale.rightOffset);

    // Remove existing series
    for (const entry of [...this._series]) {
      this.removeSeries(entry.api);
    }

    // Remove existing indicators
    for (const ind of [...this._indicators]) {
      this.removeIndicator(ind);
    }

    // Re-create series (without data)
    const createdSeries: Map<string, ISeriesApi<SeriesType>> = new Map();
    for (const sEntry of state.series) {
      const api = this.addSeries({ type: sEntry.type, ...sEntry.options } as SeriesOptions);
      createdSeries.set(sEntry.id, api);
    }

    // Load data in parallel
    const loadPromises = state.series.map(async (sEntry) => {
      const api = createdSeries.get(sEntry.id);
      if (!api) return;
      const bars = await dataLoader(sEntry.id);
      api.setData(bars);
    });
    await Promise.all(loadPromises);

    // Re-create indicators
    for (const indEntry of state.indicators) {
      const sourceSeries = createdSeries.get(indEntry.sourceSeriesId);
      if (!sourceSeries) continue;
      this.addIndicator(indEntry.type, {
        source: sourceSeries,
        params: indEntry.params,
        color: indEntry.color,
      });
    }

    // Restore drawings
    if (state.drawings.length > 0) {
      this.deserializeDrawings(state.drawings);
    }

    // Restore viewport
    if (state.visibleRange) {
      this.setVisibleRange(state.visibleRange.from, state.visibleRange.to);
    }

    this.requestRepaint(InvalidationLevel.Full);
  }

  // ── Feature 11b: Periodicity ──────────────────────────────────────────────

  setPeriodicity(periodicity: Periodicity): void {
    this._periodicity = periodicity;
    for (const cb of this._periodicityCallbacks) {
      cb(periodicity);
    }
    this.requestRepaint(InvalidationLevel.Full);
  }

  getPeriodicity(): Periodicity {
    return this._periodicity;
  }

  subscribePeriodicityChange(handler: (p: Periodicity) => void): void {
    this._periodicityCallbacks.push(handler);
  }

  unsubscribePeriodicityChange(handler: (p: Periodicity) => void): void {
    const idx = this._periodicityCallbacks.indexOf(handler);
    if (idx !== -1) this._periodicityCallbacks.splice(idx, 1);
  }

  // ── Feature 11c: Market Sessions ──────────────────────────────────────────

  setMarketSessions(sessions: MarketSession[]): void {
    this._marketSessions = sessions;
    this.requestRepaint(InvalidationLevel.Full);
  }

  getMarketSessions(): MarketSession[] {
    return this._marketSessions;
  }

  setSessionFilter(filter: 'regular' | 'extended' | 'all'): void {
    this._sessionFilter = filter;
    this.requestRepaint(InvalidationLevel.Full);
  }

  getSessionFilter(): string {
    return this._sessionFilter;
  }

  /** @internal */
  _getDrawingContext(): DrawingContext {
    const mainPane = this._mainPane;
    return {
      timeScale: this._timeScale,
      priceScale: mainPane.priceScale,
      chartWidth: this._chartWidth,
      chartHeight: mainPane.height,
      requestUpdate: () => this.requestRepaint(InvalidationLevel.Full),
    };
  }

  private _ensureDrawingHandler(): void {
    if (this._drawingHandler) return;
    const self = this;
    this._drawingHandler = new DrawingHandler({
      getDrawings: () => self._drawings,
      getDrawingContext: () => self._getDrawingContext(),
      onDrawingCreated(drawing) {
        if (drawing instanceof BaseDrawing) {
          drawing.setContext(self._getDrawingContext());
        }
        self._drawings.push(drawing);
        const id = (drawing as BaseDrawing).id;
        const api = new DrawingApiImpl(id, drawing, self);
        self._drawingApis.set(id, api);
        self.requestRepaint(InvalidationLevel.Full);
      },
      onDrawingUpdated(drawing) {
        self.requestRepaint(InvalidationLevel.Full);
        if (drawing && drawing instanceof BaseDrawing) {
          for (const cb of self._drawingEventCallbacks) cb({ type: 'modified', drawingId: drawing.id, drawingType: drawing.drawingType });
        }
      },
      xToTime(x: number): number {
        return self._timeScale.xToIndex(x);
      },
      yToPrice(y: number): number {
        return self._mainPane.priceScale.yToPrice(y);
      },
    });
    // Insert drawing handler BEFORE pan-zoom so it gets first crack at events
    this._eventRouter.addHandler(this._drawingHandler);
  }

  /**
   * Returns the basis price (first visible bar's close) for a given series entry,
   * computing and caching it on first call for each series per paint cycle.
   */
  private _getBasisPrice(entry: SeriesEntry, range: VisibleRange): number {
    if (this._basisPrices.has(entry.api)) {
      return this._basisPrices.get(entry.api)!;
    }
    const store = entry.api.getDataLayer().store;
    const fromIdx = Math.max(0, Math.min(range.fromIdx, store.length - 1));
    const basis = store.close[fromIdx] ?? 0;
    this._basisPrices.set(entry.api, basis);
    return basis;
  }

  // ── Feature 3: Visible Range Change Subscription ──────────────────────

  subscribeVisibleRangeChange(callback: VisibleRangeChangeCallback): void {
    this._visibleRangeChangeCallbacks.push(callback);
  }

  unsubscribeVisibleRangeChange(callback: VisibleRangeChangeCallback): void {
    const idx = this._visibleRangeChangeCallbacks.indexOf(callback);
    if (idx !== -1) this._visibleRangeChangeCallbacks.splice(idx, 1);
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

  // ── Layout panes ─────────────────────────────────────────────────────

  private _layoutPanes(): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const leftScaleW = this._options.leftPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
    const rightScaleVisible = this._options.rightPriceScale.visible;
    const leftScaleVisible = this._options.leftPriceScale.visible;
    const chartW = this._chartWidth;

    // Calculate total available height for panes
    const totalDividerHeight = this._dividers.length * DIVIDER_HEIGHT;
    const totalAvailable = this._height - TIME_AXIS_HEIGHT - totalDividerHeight;

    // Sum of indicator pane heights (all except main)
    let indicatorPanesHeight = 0;
    for (const paneId of this._paneOrder) {
      if (paneId === this._mainPaneId) continue;
      indicatorPanesHeight += this._paneMap.get(paneId)!.height;
    }

    // Main pane gets the remainder
    const mainPaneHeight = Math.max(50, totalAvailable - indicatorPanesHeight);
    this._mainPane.height = mainPaneHeight;

    // Layout each pane
    for (const paneId of this._paneOrder) {
      const pane = this._paneMap.get(paneId)!;
      pane.layout(chartW, leftScaleW, PRICE_AXIS_WIDTH, rightScaleVisible, leftScaleVisible, pixelRatio);
    }

    // Position time axis below all panes
    const timeAxisTop = this._height - TIME_AXIS_HEIGHT;
    this._timeAxisCanvas.width = Math.round(chartW * pixelRatio);
    this._timeAxisCanvas.height = Math.round(TIME_AXIS_HEIGHT * pixelRatio);
    this._timeAxisCanvas.style.width = `${chartW}px`;
    this._timeAxisCanvas.style.height = `${TIME_AXIS_HEIGHT}px`;
    this._timeAxisCanvas.style.left = `${leftScaleW}px`;
    this._timeAxisCanvas.style.top = `${timeAxisTop}px`;
  }

  // ── Paint ─────────────────────────────────────────────────────────────

  private _paint(): void {
    if (this._removed) return;

    // Clear cached basis prices so they are recomputed for the new visible range each paint
    if (this._comparisonMode) {
      this._basisPrices.clear();
    }

    // Sync dataLength from primary series
    if (this._series.length > 0) {
      const primaryStore = this._series[0].api.getDataLayer().store;
      this._timeScale.setDataLength(primaryStore.length);
    }

    for (const paneId of this._paneOrder) {
      const pane = this._paneMap.get(paneId)!;
      const level = this._mask.level(paneId);
      const seriesForPane = this._series.filter(s => s.paneId === paneId);

      if (level >= InvalidationLevel.Light) {
        this._paintPane(pane, seriesForPane);
        this._paintPanePriceAxis(pane, seriesForPane);
        this._paintPaneLeftPriceAxis(pane, seriesForPane);
      }
      if (level >= InvalidationLevel.Cursor) {
        this._paintPaneOverlay(pane);
        // Redraw axes on cursor move too (for crosshair labels) -- axes are tiny, very cheap
        this._paintPanePriceAxis(pane, seriesForPane);
        this._paintPaneLeftPriceAxis(pane, seriesForPane);
      }
    }

    // Shared time axis
    this._paintTimeAxis();

    // Emit crosshair callbacks
    this._emitCrosshairCallbacks();

    this._updateHud();
    this._updateTooltip();

    // Emit visible range change callbacks (Feature 3)
    if (this._visibleRangeChangeCallbacks.length > 0) {
      this._emitVisibleRangeChange();
    }

    this._mask.reset();

    // Continue animation loop if any price scale or last bar is still animating
    if (this._isAnimating()) {
      this.requestRepaint(InvalidationLevel.Light);
    }
  }

  /**
   * Tick the last bar animation for a series. Returns the animation state
   * (with interpolated display values), or null if no animation is needed.
   */
  private _tickLastBarAnim(
    api: SeriesApi<SeriesType>,
    store: ColumnStore,
    lastIdx: number,
  ): LastBarAnimState | null {
    const anim = this._lastBarAnims.get(api);
    const actualOpen = store.open[lastIdx];
    const actualHigh = store.high[lastIdx];
    const actualLow = store.low[lastIdx];
    const actualClose = store.close[lastIdx];

    if (!anim || anim.lastIdx !== lastIdx) {
      // First time seeing this bar, or bar index changed — snap, no animation
      this._lastBarAnims.set(api, {
        lastIdx,
        open: actualOpen,
        high: actualHigh,
        low: actualLow,
        close: actualClose,
        animating: false,
      });
      return null;
    }

    // Check if actual values have changed from what we're displaying
    const range = Math.abs(actualHigh - actualLow) || 1;
    const eps = range * LAST_BAR_SNAP;
    const diffO = Math.abs(anim.open - actualOpen);
    const diffH = Math.abs(anim.high - actualHigh);
    const diffL = Math.abs(anim.low - actualLow);
    const diffC = Math.abs(anim.close - actualClose);

    if (diffO < eps && diffH < eps && diffL < eps && diffC < eps) {
      // Already converged
      anim.open = actualOpen;
      anim.high = actualHigh;
      anim.low = actualLow;
      anim.close = actualClose;
      anim.animating = false;
      return anim;
    }

    // Lerp toward actual values
    anim.open += (actualOpen - anim.open) * LAST_BAR_LERP;
    anim.high += (actualHigh - anim.high) * LAST_BAR_LERP;
    anim.low += (actualLow - anim.low) * LAST_BAR_LERP;
    anim.close += (actualClose - anim.close) * LAST_BAR_LERP;
    anim.animating = true;

    return anim;
  }

  /** Returns true if any animation (price scale or last bar) is still running. */
  private _isAnimating(): boolean {
    // Check price scales
    for (const paneId of this._paneOrder) {
      const pane = this._paneMap.get(paneId)!;
      if (pane.priceScale.isAnimating || pane.leftPriceScale.isAnimating) {
        return true;
      }
    }
    // Check last bar animations
    for (const anim of this._lastBarAnims.values()) {
      if (anim.animating) return true;
    }
    return false;
  }

  private _emitCrosshairCallbacks(): void {
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
  }

  private _emitVisibleRangeChange(): void {
    if (this._series.length === 0) {
      if (this._lastVisibleRangeFrom !== null || this._lastVisibleRangeTo !== null) {
        this._lastVisibleRangeFrom = null;
        this._lastVisibleRangeTo = null;
        for (const cb of this._visibleRangeChangeCallbacks) cb(null);
      }
      return;
    }

    const store = this._series[0].api.getDataLayer().store;
    if (store.length === 0) {
      if (this._lastVisibleRangeFrom !== null || this._lastVisibleRangeTo !== null) {
        this._lastVisibleRangeFrom = null;
        this._lastVisibleRangeTo = null;
        for (const cb of this._visibleRangeChangeCallbacks) cb(null);
      }
      return;
    }

    const range = this._timeScale.visibleRange();
    const fromTime = store.time[Math.max(0, range.fromIdx)];
    const toTime = store.time[Math.min(store.length - 1, range.toIdx)];

    if (fromTime !== this._lastVisibleRangeFrom || toTime !== this._lastVisibleRangeTo) {
      this._lastVisibleRangeFrom = fromTime;
      this._lastVisibleRangeTo = toTime;
      const payload = { from: fromTime, to: toTime };
      for (const cb of this._visibleRangeChangeCallbacks) cb(payload);
    }
  }

  private _paintPane(pane: Pane, seriesForPane: SeriesEntry[]): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = pane.canvases.chartCtx;
    const chartW = this._chartWidth;
    const chartH = pane.height;
    const isMain = pane.id === this._mainPaneId;

    // Clear chart canvas
    ctx.clearRect(0, 0, Math.round(chartW * pixelRatio), Math.round(chartH * pixelRatio));

    if (seriesForPane.length === 0 && !isMain) return;

    // For the main pane (or any pane with series), find the primary series for data length & visible range
    const primaryEntry = this._series.length > 0 ? this._series[0] : null;
    const primaryStore = primaryEntry ? primaryEntry.api.getDataLayer().store : null;

    if (primaryStore) {
      this._timeScale.setDataLength(primaryStore.length);
    }

    const range = this._timeScale.visibleRange();

    if (!primaryStore || range.fromIdx > range.toIdx || primaryStore.length === 0) {
      if (seriesForPane.length === 0) return;
    }

    // Auto-scale price from visible data (only series assigned to this pane)
    this._updatePaneDataRange(pane, seriesForPane, range);

    // Advance price scale animations (smooth Y-axis transitions)
    pane.priceScale.tick();
    pane.leftPriceScale.tick();

    if (isMain) {
      // Draw watermark BEFORE grid/series so it appears behind everything
      this._drawWatermark(ctx, chartW, chartH, pixelRatio);
    }

    if (isMain && primaryStore) {
      // Draw grid (within chart area only)
      this._drawGrid(ctx, chartW, chartH, range, primaryStore, pane.priceScale, pixelRatio);
    }

    // Clip series rendering to chart area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, Math.round(chartW * pixelRatio), Math.round(chartH * pixelRatio));
    ctx.clip();

    // Draw each series
    const target = this._createRenderTarget(pane.canvases.chartCanvas, ctx, chartW, chartH, pixelRatio);
    const indexToX = (i: number) => this._timeScale.indexToX(i);

    // Primary priceToY for this pane (used for markers, price lines, last close line).
    // In comparison mode it is keyed to the first visible series in this pane.
    const primaryEntryForPane = seriesForPane.find(e => e.api.isVisible()) ?? null;
    const primaryPriceToY: (p: number) => number = this._comparisonMode && primaryEntryForPane
      ? (() => {
          const basis = this._getBasisPrice(primaryEntryForPane, range);
          return (price: number) => {
            const pct = basis === 0 ? 0 : ((price - basis) / basis) * 100;
            return pane.priceScale.priceToY(pct);
          };
        })()
      : (p: number) => pane.priceScale.priceToY(p);

    // Volume overlay (main pane only) — drawn before series so it appears behind
    if (isMain && this._options.volume.visible) {
      this._drawVolumeOverlay(ctx, chartW, chartH, range, pixelRatio);
    }

    for (const entry of seriesForPane) {
      if (!entry.api.isVisible()) continue;

      const rawStore = entry.api.getDataLayer().store;
      const store = this._getEffectiveStore(entry, rawStore);
      let priceToY: (p: number) => number;
      if (this._comparisonMode) {
        const basis = this._getBasisPrice(entry, range);
        priceToY = (price: number) => {
          const pct = basis === 0 ? 0 : ((price - basis) / basis) * 100;
          return pane.priceScale.priceToY(pct);
        };
      } else {
        priceToY = (p: number) => pane.priceScale.priceToY(p);
      }
      this._drawSeries(entry, target, store, range, indexToX, priceToY);
    }

    // Markers (main pane only)
    if (isMain) {
      for (const entry of seriesForPane) {
        if (!entry.api.isVisible()) continue;
        const markers = entry.api.getMarkers();
        if (markers.length > 0) {
          const dataLayer = entry.api.getDataLayer();
          this._drawMarkers(ctx, markers, dataLayer, range, indexToX, primaryPriceToY, pixelRatio);
        }
      }
    }

    // Price lines (main pane only)
    if (isMain) {
      for (const entry of seriesForPane) {
        if (!entry.api.isVisible()) continue;
        const priceLines = entry.api.getPriceLines();
        if (priceLines.length > 0) {
          this._drawPriceLines(ctx, priceLines, chartW, primaryPriceToY, pixelRatio);
        }
      }
    }

    // Last close price line (main pane only)
    if (isMain && this._options.lastPriceLine.visible && primaryStore && primaryStore.length > 0) {
      const lastClose = primaryStore.close[primaryStore.length - 1];
      const lastOpen = primaryStore.open[primaryStore.length - 1];
      const isUp = lastClose >= lastOpen;
      const lineColor = isUp ? '#22AB94' : '#F7525F';
      const lastY = Math.round(primaryPriceToY(lastClose) * pixelRatio);

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

    // ── Last bar animation: interpolate OHLC for smooth streaming ────────
    const lastIdx = store.length - 1;
    let saved: { o: number; h: number; l: number; c: number } | null = null;

    if (lastIdx >= 0 && lastIdx >= range.fromIdx && lastIdx <= range.toIdx) {
      const anim = this._tickLastBarAnim(entry.api, store, lastIdx);
      if (anim && anim.animating) {
        // Temporarily write interpolated values into the store for rendering
        saved = {
          o: store.open[lastIdx],
          h: store.high[lastIdx],
          l: store.low[lastIdx],
          c: store.close[lastIdx],
        };
        store.open[lastIdx] = anim.open;
        store.high[lastIdx] = anim.high;
        store.low[lastIdx] = anim.low;
        store.close[lastIdx] = anim.close;
      }
    }

    switch (entry.type) {
      case 'candlestick':
      case 'heikin-ashi':
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

    // Restore original store values after rendering
    if (saved !== null) {
      store.open[lastIdx] = saved.o;
      store.high[lastIdx] = saved.h;
      store.low[lastIdx] = saved.l;
      store.close[lastIdx] = saved.c;
    }
  }

  private _paintPaneOverlay(pane: Pane): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = pane.canvases.overlayCtx;
    const chartW = this._chartWidth;
    const chartH = pane.height;
    const isMain = pane.id === this._mainPaneId;

    // Overlay canvas is sized to chart area only
    ctx.clearRect(0, 0, Math.round(chartW * pixelRatio), Math.round(chartH * pixelRatio));

    // Render drawings on overlay canvas (main pane only for now)
    if (isMain && this._drawings.length > 0) {
      const target = {
        canvas: pane.canvases.overlayCanvas,
        context: ctx,
        width: Math.round(chartW * pixelRatio),
        height: Math.round(chartH * pixelRatio),
        pixelRatio,
      };
      for (const drawing of this._drawings) {
        const views = drawing.paneViews?.();
        if (!views) continue;
        for (const view of views) {
          const renderer = view.renderer();
          renderer?.drawBackground?.(target);
        }
      }
      for (const drawing of this._drawings) {
        const views = drawing.paneViews?.();
        if (!views) continue;
        for (const view of views) {
          const renderer = view.renderer();
          renderer?.draw(target);
        }
      }
    }

    if (!this._crosshair.visible) return;

    const opts = this._options.crosshair;

    // Vertical crosshair line draws on ALL panes (shared X)
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

    // Horizontal crosshair line on the pane where the pointer is
    if (pane.id === this._crosshair.sourcePaneId) {
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
  }

  // ── Grid ──────────────────────────────────────────────────────────────

  private _drawGrid(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    range: VisibleRange,
    store: ColumnStore,
    priceScale: PriceScale,
    pixelRatio: number,
  ): void {
    const gridOpts = this._options.grid;

    ctx.save();
    ctx.lineWidth = Math.max(1, Math.round(pixelRatio));

    // Horizontal price grid lines
    if (gridOpts.horzLinesVisible) {
      ctx.strokeStyle = gridOpts.horzLinesColor;
      const priceRange = priceScale.priceRange;
      const pRange = priceRange.max - priceRange.min;
      const targetHorzSteps = Math.max(2, Math.floor(h / 60));
      const step = niceStep(pRange, targetHorzSteps);

      const firstPrice = Math.ceil(priceRange.min / step) * step;
      for (let price = firstPrice; price <= priceRange.max; price += step) {
        const y = Math.round(priceScale.priceToY(price) * pixelRatio);
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

  // ── Price axis per-pane ───────────────────────────────────────────────

  private _paintPanePriceAxis(pane: Pane, seriesForPane: SeriesEntry[]): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = pane.canvases.rightPriceAxisCtx;
    const chartH = pane.height;
    const axisW = PRICE_AXIS_WIDTH;
    const isMain = pane.id === this._mainPaneId;

    ctx.clearRect(0, 0, Math.round(axisW * pixelRatio), Math.round(chartH * pixelRatio));

    const layout = this._options.layout;
    const priceRange = pane.priceScale.priceRange;
    const pRange = priceRange.max - priceRange.min;
    const targetSteps = Math.max(2, Math.floor(chartH / 60));
    const step = niceStep(pRange, targetSteps);

    // Label formatter — percentage format in comparison mode
    const formatAxisLabel = this._comparisonMode
      ? (value: number) => {
          const sign = value > 0 ? '+' : '';
          return `${sign}${value.toFixed(1)}%`;
        }
      : (value: number) => this._formatPrice(value);

    ctx.save();
    ctx.font = `${Math.round(layout.fontSize * pixelRatio)}px ${layout.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const axisRight = Math.round(axisW * pixelRatio);
    const padding = Math.round(6 * pixelRatio);
    const labelHeight = Math.round(layout.fontSize * 1.6 * pixelRatio);

    const firstPrice = Math.ceil(priceRange.min / step) * step;
    for (let price = firstPrice; price <= priceRange.max; price += step) {
      const y = Math.round(pane.priceScale.priceToY(price) * pixelRatio);
      if (y < labelHeight / 2 || y > Math.round(chartH * pixelRatio) - labelHeight / 2) continue;

      const text = formatAxisLabel(price);

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

    // Current price label (last close) — main pane only
    if (isMain && this._options.lastPriceLine.visible && this._series.length > 0) {
      const primaryEntry = this._series[0];
      const store = primaryEntry.api.getDataLayer().store;
      if (store.length > 0) {
        const lastClose = store.close[store.length - 1];
        const lastOpen = store.open[store.length - 1];
        const isUp = lastClose >= lastOpen;
        const bgColor = isUp ? '#22AB94' : '#F7525F';
        // In comparison mode, map last close to percent space for Y position
        let labelY: number;
        let priceText: string;
        if (this._comparisonMode) {
          const range = this._timeScale.visibleRange();
          const basis = this._getBasisPrice(primaryEntry, range);
          const pct = basis === 0 ? 0 : ((lastClose - basis) / basis) * 100;
          labelY = Math.round(pane.priceScale.priceToY(pct) * pixelRatio);
          priceText = formatAxisLabel(pct);
        } else {
          labelY = Math.round(pane.priceScale.priceToY(lastClose) * pixelRatio);
          priceText = this._formatPrice(lastClose);
        }
        const lh = Math.round(layout.fontSize * 1.8 * pixelRatio);

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, labelY - lh / 2, axisRight, lh);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(layout.fontSize * pixelRatio)}px ${layout.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceText, axisRight - padding, labelY);
      }
    }

    // Price line labels on axis (main pane only)
    if (isMain) {
      for (const entry of seriesForPane) {
        if (!entry.api.isVisible()) continue;
        for (const pl of entry.api.getPriceLines()) {
          if (!pl.options.axisLabelVisible) continue;
          const plY = Math.round(pane.priceScale.priceToY(pl.options.price) * pixelRatio);
          if (plY < labelHeight / 2 || plY > Math.round(chartH * pixelRatio) - labelHeight / 2) continue;
          const plText = formatAxisLabel(pl.options.price);
          const plLh = Math.round(layout.fontSize * 1.8 * pixelRatio);

          ctx.fillStyle = pl.options.axisLabelColor ?? pl.options.color;
          ctx.fillRect(0, plY - plLh / 2, axisRight, plLh);

          ctx.fillStyle = pl.options.axisLabelTextColor ?? '#ffffff';
          ctx.font = `bold ${Math.round(layout.fontSize * pixelRatio)}px ${layout.fontFamily}`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(plText, axisRight - padding, plY);
        }
      }
    }

    // Crosshair price label on the pane the pointer is over
    if (pane.id === this._crosshair.sourcePaneId && this._crosshair.visible) {
      const hy = Math.round(this._crosshair.y * pixelRatio);
      // In comparison mode, crosshair.price is still a raw price; convert to pct for display
      let priceText: string;
      if (this._comparisonMode && this._series.length > 0) {
        const primaryEntry = this._series[0];
        const range = this._timeScale.visibleRange();
        const basis = this._getBasisPrice(primaryEntry, range);
        const pct = basis === 0 ? 0 : ((this._crosshair.price - basis) / basis) * 100;
        priceText = formatAxisLabel(pct);
      } else {
        priceText = this._formatPrice(this._crosshair.price);
      }
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

  // ── Tick type helper ─────────────────────────────────────────────────

  private _getTickType(store: ColumnStore): 'year' | 'month' | 'day' | 'time' {
    if (store.length < 2) return 'day';
    const interval = store.time[1] - store.time[0];
    if (interval < 86400) return 'time';
    if (interval < 86400 * 28) return 'day';
    if (interval < 86400 * 365) return 'month';
    return 'year';
  }

  // ── Time axis (on its own canvas) ─────────────────────────────────────

  private _paintTimeAxis(): void {
    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = this._timeAxisCtx;
    const chartW = this._chartWidth;

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

    const tickType = this._getTickType(primaryStore);

    for (let i = range.fromIdx; i <= range.toIdx; i += barStep) {
      if (i >= primaryStore.length) break;
      const x = Math.round(this._timeScale.indexToX(i) * pixelRatio);
      if (x < 0 || x > Math.round(chartW * pixelRatio)) continue;

      const timestamp = primaryStore.time[i];
      const label = this._timeFormat(timestamp, tickType);

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

        const crosshairTickType = this._getTickType(store);
        const timeLabel = this._timeFormat(timestamp, crosshairTickType, true);

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

  // ── Auto-scale price range (per-pane) ─────────────────────────────────

  private _updatePaneDataRange(pane: Pane, seriesForPane: SeriesEntry[], range: VisibleRange): void {
    let rightMin = Infinity;
    let rightMax = -Infinity;
    let leftMin = Infinity;
    let leftMax = -Infinity;

    for (const entry of seriesForPane) {
      if (!entry.api.isVisible()) continue;
      const rawStore = entry.api.getDataLayer().store;
      const store = this._getEffectiveStore(entry, rawStore);
      const to = Math.min(range.toIdx, store.length - 1);

      const isLeft = entry.api.options().priceScaleId === 'left';

      if (this._comparisonMode) {
        // In comparison mode auto-scale in percent space
        const basis = this._getBasisPrice(entry, range);
        for (let i = range.fromIdx; i <= to; i++) {
          const loPct = basis === 0 ? 0 : ((store.low[i] - basis) / basis) * 100;
          const hiPct = basis === 0 ? 0 : ((store.high[i] - basis) / basis) * 100;
          if (isLeft) {
            if (loPct < leftMin) leftMin = loPct;
            if (hiPct > leftMax) leftMax = hiPct;
          } else {
            if (loPct < rightMin) rightMin = loPct;
            if (hiPct > rightMax) rightMax = hiPct;
          }
        }
      } else {
        for (let i = range.fromIdx; i <= to; i++) {
          const lo = store.low[i];
          const hi = store.high[i];
          if (isLeft) {
            if (lo < leftMin) leftMin = lo;
            if (hi > leftMax) leftMax = hi;
          } else {
            if (lo < rightMin) rightMin = lo;
            if (hi > rightMax) rightMax = hi;
          }
        }
      }
    }

    if (rightMin < Infinity && rightMax > -Infinity) {
      pane.priceScale.autoScale(rightMin, rightMax);
    }
    if (leftMin < Infinity && leftMax > -Infinity) {
      pane.leftPriceScale.autoScale(leftMin, leftMax);
    }
  }

  // ── Watermark ─────────────────────────────────────────────────────────

  private _drawWatermark(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    pixelRatio: number,
  ): void {
    const wm = this._options.watermark;
    if (!wm.visible || !wm.text) return;

    ctx.save();
    ctx.font = `bold ${Math.round(wm.fontSize * pixelRatio)}px ${this._options.layout.fontFamily}`;
    ctx.fillStyle = wm.color;

    let x: number;
    if (wm.horzAlign === 'left') {
      ctx.textAlign = 'left';
      x = Math.round(20 * pixelRatio);
    } else if (wm.horzAlign === 'right') {
      ctx.textAlign = 'right';
      x = Math.round((w - 20) * pixelRatio);
    } else {
      ctx.textAlign = 'center';
      x = Math.round((w / 2) * pixelRatio);
    }

    let y: number;
    if (wm.vertAlign === 'top') {
      ctx.textBaseline = 'top';
      y = Math.round(20 * pixelRatio);
    } else if (wm.vertAlign === 'bottom') {
      ctx.textBaseline = 'bottom';
      y = Math.round((h - 20) * pixelRatio);
    } else {
      ctx.textBaseline = 'middle';
      y = Math.round((h / 2) * pixelRatio);
    }

    ctx.fillText(wm.text, x, y);
    ctx.restore();
  }

  // ── Volume overlay ───────────────────────────────────────────────────

  private _drawVolumeOverlay(
    ctx: CanvasRenderingContext2D,
    chartW: number,
    chartH: number,
    range: VisibleRange,
    pixelRatio: number,
  ): void {
    const volOpts = this._options.volume;

    // Gather volume data from all visible series (use primary for OHLC coloring)
    const primaryStore = this._series[0].api.getDataLayer().store;
    if (!primaryStore.volume) return;
    const to = Math.min(range.toIdx, primaryStore.length - 1);
    if (to < range.fromIdx) return;

    // Find max volume in visible range
    let maxVol = 0;
    for (let i = range.fromIdx; i <= to; i++) {
      const v = primaryStore.volume[i];
      if (v > maxVol) maxVol = v;
    }
    if (maxVol === 0) return;

    // Volume occupies the area from scaleMarginTop*chartH to chartH
    const volTop = Math.round(volOpts.scaleMarginTop * chartH * pixelRatio);
    const volBottom = Math.round(chartH * pixelRatio);
    const volHeight = volBottom - volTop;

    const barWidth = this._timeScale.barSpacing * 0.8;
    const halfBar = Math.max(1, Math.round((barWidth * pixelRatio) / 2));

    ctx.save();
    for (let i = range.fromIdx; i <= to; i++) {
      const vol = primaryStore.volume[i];
      if (vol === 0) continue;

      const isUp = primaryStore.close[i] >= primaryStore.open[i];
      ctx.fillStyle = isUp ? volOpts.upColor : volOpts.downColor;

      const cx = Math.round(this._timeScale.indexToX(i) * pixelRatio);
      const barH = Math.max(1, Math.round((vol / maxVol) * volHeight));
      const topY = volBottom - barH;

      ctx.fillRect(cx - halfBar, topY, halfBar * 2, barH);
    }
    ctx.restore();
  }

  // ── Series markers ───────────────────────────────────────────────────

  private _drawMarkers(
    ctx: CanvasRenderingContext2D,
    markers: readonly SeriesMarker[],
    dataLayer: DataLayer,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (p: number) => number,
    pixelRatio: number,
  ): void {
    const store = dataLayer.store;
    if (store.length === 0) return;

    ctx.save();
    const layout = this._options.layout;

    for (const marker of markers) {
      // Binary search for bar index matching marker time
      const idx = dataLayer.findIndex(marker.time);
      if (idx < range.fromIdx || idx > range.toIdx) continue;
      if (idx >= store.length) continue;

      const x = Math.round(indexToX(idx) * pixelRatio);
      const size = (marker.size ?? 1) * 8 * pixelRatio;
      const offset = size + 4 * pixelRatio;

      let y: number;
      if (marker.position === 'aboveBar') {
        y = Math.round(priceToY(store.high[idx]) * pixelRatio) - offset;
      } else if (marker.position === 'belowBar') {
        y = Math.round(priceToY(store.low[idx]) * pixelRatio) + offset;
      } else {
        y = Math.round(priceToY(store.close[idx]) * pixelRatio);
      }

      ctx.fillStyle = marker.color;

      switch (marker.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 'square':
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
          break;
        case 'arrowUp': {
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x - size, y + size);
          ctx.lineTo(x + size, y + size);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'arrowDown': {
          ctx.beginPath();
          ctx.moveTo(x, y + size);
          ctx.lineTo(x - size, y - size);
          ctx.lineTo(x + size, y - size);
          ctx.closePath();
          ctx.fill();
          break;
        }
      }

      // Draw text label if provided
      if (marker.text) {
        ctx.fillStyle = marker.color;
        ctx.font = `${Math.round(10 * pixelRatio)}px ${layout.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = marker.position === 'belowBar' ? 'top' : 'bottom';
        const textY = marker.position === 'belowBar'
          ? y + size + 2 * pixelRatio
          : y - size - 2 * pixelRatio;
        ctx.fillText(marker.text, x, textY);
      }
    }

    ctx.restore();
  }

  // ── Price lines ──────────────────────────────────────────────────────

  private _drawPriceLines(
    ctx: CanvasRenderingContext2D,
    priceLines: readonly import('../core/price-line').PriceLine[],
    chartW: number,
    priceToY: (p: number) => number,
    pixelRatio: number,
  ): void {
    ctx.save();
    for (const pl of priceLines) {
      const y = Math.round(priceToY(pl.options.price) * pixelRatio);

      ctx.strokeStyle = pl.options.color;
      ctx.lineWidth = pl.options.lineWidth * pixelRatio;

      switch (pl.options.lineStyle) {
        case 'dashed':
          ctx.setLineDash([6 * pixelRatio, 4 * pixelRatio]);
          break;
        case 'dotted':
          ctx.setLineDash([2 * pixelRatio, 2 * pixelRatio]);
          break;
        default:
          ctx.setLineDash([]);
          break;
      }

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(Math.round(chartW * pixelRatio), y);
      ctx.stroke();

      // Draw title text if provided
      if (pl.options.title) {
        ctx.fillStyle = pl.options.color;
        ctx.font = `${Math.round(10 * pixelRatio)}px ${this._options.layout.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(pl.options.title, Math.round(4 * pixelRatio), y - Math.round(2 * pixelRatio));
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Tooltip ──────────────────────────────────────────────────────────

  private _updateTooltip(): void {
    if (!this._options.tooltip.enabled || this._series.length === 0) {
      this._tooltipEl.style.display = 'none';
      return;
    }

    if (!this._crosshair.visible) {
      this._tooltipEl.style.display = 'none';
      return;
    }

    const primaryEntry = this._series[0];
    const rawStore = primaryEntry.api.getDataLayer().store;
    const store = this._getEffectiveStore(primaryEntry, rawStore);
    const idx = this._crosshair.barIndex;
    if (idx < 0 || idx >= store.length) {
      this._tooltipEl.style.display = 'none';
      return;
    }

    // Only rebuild content when barIndex changes
    if (idx !== this._lastTooltipBarIdx) {
      this._lastTooltipBarIdx = idx;

      const o = store.open[idx];
      const h = store.high[idx];
      const l = store.low[idx];
      const c = store.close[idx];
      const v = rawStore.volume ? rawStore.volume[idx] : 0;
      const timestamp = store.time[idx];
      const tooltipTickType = this._getTickType(store);
      const dateStr = this._timeFormat(timestamp, tooltipTickType, true);

      const isUp = c >= o;
      const color = isUp ? '#22AB94' : '#F7525F';

      this._tooltipDateEl.textContent = dateStr;
      this._tooltipOHEl.textContent = `O ${this._formatPrice(o)} H ${this._formatPrice(h)}`;
      this._tooltipOHEl.style.color = color;
      this._tooltipLCEl.textContent = `L ${this._formatPrice(l)} C ${this._formatPrice(c)}`;
      this._tooltipLCEl.style.color = color;
      this._tooltipVEl.textContent = `V ${formatVolume(v, this._options.locale)}`;
      this._tooltipVEl.style.color = '#999';

      // Re-measure cached dimensions only when content changes
      this._tooltipWidth = this._tooltipEl.offsetWidth || 140;
      this._tooltipHeight = this._tooltipEl.offsetHeight || 80;
    }

    // Position tooltip near cursor, ensuring it doesn't overflow
    const chartW = this._chartWidth;
    const chartH = this._mainPane.height;
    const cursorX = this._crosshair.snappedX;
    const cursorY = this._crosshair.y;
    const tooltipW = this._tooltipWidth;
    const tooltipH = this._tooltipHeight;

    let tx = cursorX + 16;
    let ty = cursorY - tooltipH - 8;

    // Keep within chart bounds
    if (tx + tooltipW > chartW) tx = cursorX - tooltipW - 16;
    if (tx < 0) tx = 4;
    if (ty < 0) ty = cursorY + 16;
    if (ty + tooltipH > chartH) ty = chartH - tooltipH - 4;

    this._tooltipEl.style.left = `${Math.round(tx)}px`;
    this._tooltipEl.style.top = `${Math.round(ty)}px`;
    this._tooltipEl.style.display = 'block';
  }

  // ── HUD ───────────────────────────────────────────────────────────────

  private _createHudForPane(paneId: string, pane: Pane): void {
    const hud = new HudManager(pane.row, {
      bg: this._options.layout.backgroundColor,
      text: this._options.layout.textColor,
      border: this._options.grid.horzLinesColor,
      fontFamily: this._options.layout.fontFamily,
    });
    this._huds.set(paneId, hud);

    // Wire cross-pane sync: collapsing the main pane HUD collapses all others
    if (paneId === this._mainPaneId) {
      hud.onGlobalCollapseToggle = () => {
        const collapsed = hud.isGlobalCollapsed;
        for (const [id, otherHud] of this._huds) {
          if (id !== this._mainPaneId) {
            otherHud.setGlobalCollapsed(collapsed);
          }
        }
      };
    }
  }

  private _getCrosshairBarIndex(): number {
    if (this._series.length === 0) return -1;
    const store = this._series[0].api.getDataLayer().store;
    if (store.length === 0) return -1;

    if (this._crosshair.visible && this._crosshair.barIndex >= 0 && this._crosshair.barIndex < store.length) {
      return this._crosshair.barIndex;
    }
    return store.length - 1;
  }

  private _updateHud(): void {
    const barIndex = this._getCrosshairBarIndex();
    for (const hud of this._huds.values()) {
      hud.updateValues(barIndex);
    }
  }

  private _getSeriesColor(type: SeriesType, options: Record<string, unknown>): string {
    switch (type) {
      case 'candlestick':
      case 'bar':
      case 'hollow-candle':
        return (options.upColor as string) ?? '#22AB94';
      case 'line':
        return (options.color as string) ?? '#2196F3';
      case 'area':
        return (options.lineColor as string) ?? '#2196F3';
      case 'baseline':
        return (options.topLineColor as string) ?? '#22AB94';
      case 'histogram':
        return (options.upColor as string) ?? '#22AB94';
      default:
        return '#2196F3';
    }
  }

  private _getSeriesValues(api: SeriesApi<SeriesType>, barIndex: number): string {
    const rawStore = api.getDataLayer().store;
    if (barIndex < 0 || barIndex >= rawStore.length) return '';

    const type = api.seriesType();
    const isOHLC = type === 'candlestick' || type === 'bar' || type === 'hollow-candle' || type === 'heikin-ashi';

    if (isOHLC) {
      // For heikin-ashi, use the transformed store via the series entry cache
      const entry = this._series.find(e => e.api === (api as SeriesApi<SeriesType>));
      const store = entry ? this._getEffectiveStore(entry, rawStore) : rawStore;
      const o = store.open[barIndex];
      const h = store.high[barIndex];
      const l = store.low[barIndex];
      const c = store.close[barIndex];
      const v = rawStore.volume ? rawStore.volume[barIndex] : 0;
      return `O ${this._formatPrice(o)}  H ${this._formatPrice(h)}  L ${this._formatPrice(l)}  C ${this._formatPrice(c)}  V ${formatVolume(v, this._options.locale)}`;
    }

    const c = rawStore.close[barIndex];
    return this._formatPrice(c);
  }

  private _getIndicatorValues(indicator: IndicatorApi, barIndex: number): string {
    const parts: string[] = [];
    for (const s of indicator.internalSeries) {
      const impl = s as SeriesApi<SeriesType>;
      const store = impl.getDataLayer().store;
      if (barIndex >= 0 && barIndex < store.length) {
        const val = store.close[barIndex];
        if (!isNaN(val)) {
          parts.push(this._formatPrice(val));
        }
      }
    }
    return parts.join('  ');
  }

  private _getSeriesSettingsFields(type: SeriesType, options: Record<string, unknown>): SettingsField[] {
    const fields: SettingsField[] = [];
    switch (type) {
      case 'candlestick':
        fields.push({ key: 'upColor', label: 'Up Color', type: 'color', value: (options.upColor as string) ?? '#22AB94' });
        fields.push({ key: 'downColor', label: 'Down Color', type: 'color', value: (options.downColor as string) ?? '#F7525F' });
        break;
      case 'line':
        fields.push({ key: 'color', label: 'Color', type: 'color', value: (options.color as string) ?? '#2196F3' });
        fields.push({ key: 'lineWidth', label: 'Width', type: 'number', value: (options.lineWidth as number) ?? 2, min: 1, max: 5, step: 1 });
        break;
      case 'area':
        fields.push({ key: 'lineColor', label: 'Line Color', type: 'color', value: (options.lineColor as string) ?? '#2196F3' });
        fields.push({ key: 'topColor', label: 'Top Color', type: 'color', value: (options.topColor as string) ?? 'rgba(33,150,243,0.4)' });
        fields.push({ key: 'bottomColor', label: 'Bottom Color', type: 'color', value: (options.bottomColor as string) ?? 'rgba(33,150,243,0)' });
        break;
      case 'bar':
      case 'hollow-candle':
        fields.push({ key: 'upColor', label: 'Up Color', type: 'color', value: (options.upColor as string) ?? '#22AB94' });
        fields.push({ key: 'downColor', label: 'Down Color', type: 'color', value: (options.downColor as string) ?? '#F7525F' });
        break;
      case 'histogram':
        fields.push({ key: 'upColor', label: 'Up Color', type: 'color', value: (options.upColor as string) ?? '#22AB94' });
        fields.push({ key: 'downColor', label: 'Down Color', type: 'color', value: (options.downColor as string) ?? '#F7525F' });
        break;
      case 'baseline':
        fields.push({ key: 'topLineColor', label: 'Top Color', type: 'color', value: (options.topLineColor as string) ?? '#22AB94' });
        fields.push({ key: 'bottomLineColor', label: 'Bottom Color', type: 'color', value: (options.bottomLineColor as string) ?? '#F7525F' });
        fields.push({ key: 'basePrice', label: 'Base Price', type: 'number', value: (options.basePrice as number) ?? 0, step: 0.01 });
        break;
    }
    return fields;
  }

  private _getIndicatorSettingsFields(indicator: IndicatorApi): SettingsField[] {
    const fields: SettingsField[] = [];
    const opts = indicator.options();

    // Color field
    fields.push({ key: 'color', label: 'Color', type: 'color', value: opts.color ?? '#2962ff' });

    // Params
    const params = opts.params ?? {};
    for (const [key, val] of Object.entries(params)) {
      fields.push({ key, label: key, type: 'number', value: val as number, min: 1, step: 1 });
    }

    return fields;
  }

  private _registerSeriesHudRow(
    api: SeriesApi<SeriesType>,
    type: SeriesType,
    resolvedOptions: Record<string, unknown>,
    paneId: string,
    seriesIndex: number,
  ): void {
    const hud = this._huds.get(paneId);
    if (!hud) return;

    const hudRowId = `series-${type}-${seriesIndex}`;
    hud.addRow({
      id: hudRowId,
      label: (resolvedOptions.label as string) || this._options.symbol || 'Symbol',
      color: this._getSeriesColor(type, resolvedOptions),
      getValues: (barIndex: number) => this._getSeriesValues(api, barIndex),
      onToggleVisible: () => {
        const newVis = !api.isVisible();
        api.applyOptions({ visible: newVis } as never);
        return newVis;
      },
      onRemove: () => { this.removeSeries(api); },
      getSettingsFields: () => this._getSeriesSettingsFields(type, api.options() as unknown as Record<string, unknown>),
      onSettingsApply: (values) => { api.applyOptions(values as never); },
    });
  }

  private _registerIndicatorHudRow(indicator: IndicatorApi, options: IndicatorOptions): void {
    const hud = this._huds.get(indicator.paneId());
    if (!hud) return;

    hud.addRow({
      id: `indicator-${indicator.id}`,
      label: indicator.label(),
      color: options.color ?? '#2962ff',
      getValues: (barIndex: number) => this._getIndicatorValues(indicator, barIndex),
      onToggleVisible: () => {
        const newVis = !indicator.isVisible();
        indicator.applyOptions({ visible: newVis });
        // Toggle visibility of all internal series
        for (const s of indicator.internalSeries) {
          s.applyOptions({ visible: newVis } as never);
        }
        return newVis;
      },
      onRemove: () => { this.removeIndicator(indicator); },
      getSettingsFields: () => this._getIndicatorSettingsFields(indicator),
      onSettingsApply: (values) => {
        // Separate color from params
        const { color, ...paramValues } = values;
        if (color !== undefined) {
          indicator.applyOptions({ color: color as string });
        }
        if (Object.keys(paramValues).length > 0) {
          // Recompute with new params
          const numParams: Record<string, number> = {};
          for (const [k, v] of Object.entries(paramValues)) {
            numParams[k] = v as number;
          }
          indicator.applyOptions({ params: numParams });
        }
      },
    });
  }

  // ── Left Price axis per-pane ────────────────────────────────────────────

  private _paintPaneLeftPriceAxis(pane: Pane, seriesForPane: SeriesEntry[]): void {
    if (!this._options.leftPriceScale.visible) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const ctx = pane.canvases.leftPriceAxisCtx;
    const chartH = pane.height;
    const axisW = PRICE_AXIS_WIDTH;
    const isMain = pane.id === this._mainPaneId;

    ctx.clearRect(0, 0, Math.round(axisW * pixelRatio), Math.round(chartH * pixelRatio));

    // Left scale auto-scales independently in _updatePaneDataRange() based on series with priceScaleId: 'left'.
    // Fall back to right scale range if no series are assigned to the left scale.
    const leftRange = pane.leftPriceScale.priceRange;
    if (leftRange.min === leftRange.max) {
      pane.leftPriceScale.autoScale(pane.priceScale.priceRange.min, pane.priceScale.priceRange.max);
    }

    const layout = this._options.layout;
    const priceRange = pane.leftPriceScale.priceRange;
    const pRange = priceRange.max - priceRange.min;
    const targetSteps = Math.max(2, Math.floor(chartH / 60));
    const step = niceStep(pRange, targetSteps);

    ctx.save();
    ctx.font = `${Math.round(layout.fontSize * pixelRatio)}px ${layout.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const padding = Math.round(6 * pixelRatio);
    const labelHeight = Math.round(layout.fontSize * 1.6 * pixelRatio);

    const firstPrice = Math.ceil(priceRange.min / step) * step;
    for (let price = firstPrice; price <= priceRange.max; price += step) {
      const y = Math.round(pane.leftPriceScale.priceToY(price) * pixelRatio);
      if (y < labelHeight / 2 || y > Math.round(chartH * pixelRatio) - labelHeight / 2) continue;

      const text = this._formatPrice(price);

      ctx.fillStyle = layout.backgroundColor;
      ctx.fillRect(0, y - labelHeight / 2, Math.round(axisW * pixelRatio), labelHeight);

      ctx.fillStyle = layout.textColor;
      ctx.fillText(text, padding, y);
    }

    // Draw right separator line
    ctx.strokeStyle = this._options.grid.horzLinesColor;
    ctx.lineWidth = Math.max(1, Math.round(pixelRatio));
    ctx.beginPath();
    ctx.moveTo(Math.round(axisW * pixelRatio) - 1, 0);
    ctx.lineTo(Math.round(axisW * pixelRatio) - 1, Math.round(chartH * pixelRatio));
    ctx.stroke();

    // Crosshair price label on left axis for the pane the pointer is over
    if (pane.id === this._crosshair.sourcePaneId && this._crosshair.visible) {
      const hy = Math.round(this._crosshair.y * pixelRatio);
      const priceText = this._formatPrice(this._crosshair.price);
      const lh = Math.round(layout.fontSize * 1.8 * pixelRatio);

      ctx.fillStyle = this._options.crosshair.horzLineColor;
      ctx.fillRect(0, hy - lh / 2, Math.round(axisW * pixelRatio), lh);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(priceText, padding, hy);
    }

    // Suppress unused variable warning
    void seriesForPane;

    ctx.restore();
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private _createRenderTarget(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pixelRatio: number,
  ): IRenderTarget {
    return {
      canvas,
      context: ctx,
      width,
      height,
      pixelRatio,
    };
  }

  private _addSeries<T extends SeriesType>(
    type: T,
    options: DeepPartial<SeriesOptionsMap[T]>,
    _internal: boolean = false,
  ): ISeriesApi<T> {
    const dataLayer = new DataLayer();
    const resolvedOptions = (options ?? {}) as SeriesOptionsMap[T];

    // Determine which pane this series belongs to
    const paneId = (resolvedOptions as { paneId?: string }).paneId ?? this._mainPaneId;
    const pane = this._paneMap.get(paneId);
    if (!pane) {
      throw new Error(`Pane "${paneId}" not found. Create it first with addPane().`);
    }

    const renderer = this._createRenderer(type, resolvedOptions as unknown as Record<string, unknown>);
    const api = new SeriesApi<T>(type, dataLayer, pane.priceScale, resolvedOptions, () =>
      this.requestRepaint(InvalidationLevel.Full),
    );

    this._series.push({ api: api as SeriesApi<SeriesType>, renderer, type, paneId });

    // Register HUD row for user-visible (non-internal) series
    if (!_internal) {
      this._registerSeriesHudRow(
        api as SeriesApi<SeriesType>,
        type,
        resolvedOptions as unknown as Record<string, unknown>,
        paneId,
        this._series.length - 1,
      );
    }

    // Set up crosshair handler on first series added
    if (this._series.length === 1 && this._crosshairHandler === null) {
      this._crosshairHandler = new CrosshairHandler(
        this._crosshair,
        dataLayer,
        this._timeScale,
        this._mainPane.priceScale,
        () => this.requestRepaint(InvalidationLevel.Cursor),
        this._mainPaneId,
      );
      this._eventRouter.addHandler(this._crosshairHandler);
    }

    this.requestRepaint(InvalidationLevel.Full);

    if (!_internal) {
      for (const cb of this._chartTypeChangeCallbacks) cb({ seriesType: type });
    }

    return api;
  }

  private _getEffectiveStore(entry: SeriesEntry, rawStore: ColumnStore): ColumnStore {
    if (entry.type !== 'heikin-ashi') return rawStore;
    const cache = entry._haCache;
    if (cache && cache.length === rawStore.length) return cache.store;
    const haStore = computeHeikinAshi(rawStore);
    entry._haCache = { length: rawStore.length, store: haStore };
    return haStore;
  }

  private _createRenderer(
    type: SeriesType,
    options: Record<string, unknown>,
  ): SeriesEntry['renderer'] {
    // Extract renderer-relevant options (exclude BaseSeriesOptions fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _d, priceScaleId: _p, visible: _v, paneId: _pi, label: _l, ...rendererOpts } = options;

    switch (type) {
      case 'candlestick':
      case 'heikin-ashi': {
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
      case 'step-line': {
        const r = new StepLineRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'colored-line': {
        const r = new ColoredLineRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'colored-mountain': {
        const r = new ColoredMountainRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'hlc-area': {
        const r = new HLCAreaRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'high-low': {
        const r = new HighLowRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'column': {
        const r = new ColumnRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'volume-candle': {
        const r = new VolumeCandleRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'baseline-delta-mountain': {
        const r = new BaselineDeltaMountainRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'renko': {
        const r = new RenkoRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'kagi': {
        const r = new KagiRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'line-break': {
        const r = new LineBreakRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      case 'point-figure': {
        const r = new PointFigureRenderer();
        if (Object.keys(rendererOpts).length > 0) r.applyOptions(rendererOpts as never);
        return r;
      }
      default:
        throw new Error(`Unknown series type: ${type}`);
    }
  }

  private _getClickState(e: MouseEvent): { x: number; y: number; time: number; price: number } {
    const rect = this._mainPane.canvases.overlayCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const price = this._mainPane.priceScale.yToPrice(y);

    let time = 0;
    if (this._series.length > 0) {
      const store = this._series[0].api.getDataLayer().store;
      if (store.length > 0) {
        const idx = Math.max(0, Math.min(store.length - 1, this._timeScale.xToIndex(x)));
        time = store.time[idx];
      }
    }
    return { x, y, time, price };
  }

  private _handleClick = (e: MouseEvent): void => {
    if (this._clickCallbacks.length === 0) return;
    const state = this._getClickState(e);
    for (const cb of this._clickCallbacks) cb(state);
  };

  private _handleDblClick = (e: MouseEvent): void => {
    if (this._dblClickCallbacks.length === 0) return;
    const state = this._getClickState(e);
    for (const cb of this._dblClickCallbacks) cb(state);
  };
}

// ─── DrawingApiImpl ─────────────────────────────────────────────────────────

class DrawingApiImpl implements IDrawingApi {
  readonly id: string;
  private _drawing: ISeriesPrimitive & DrawingPrimitive;
  private _chart: ChartApi;

  constructor(id: string, drawing: ISeriesPrimitive & DrawingPrimitive, chart: ChartApi) {
    this.id = id;
    this._drawing = drawing;
    this._chart = chart;
  }

  drawingType(): string {
    return this._drawing.drawingType;
  }

  points(): AnchorPoint[] {
    return this._drawing.points.map(p => ({ ...p }));
  }

  applyOptions(opts: Partial<DrawingOptions>): void {
    Object.assign(this._drawing.options, opts);
    this._chart.requestRepaint(InvalidationLevel.Full);
  }

  options(): DrawingOptions {
    return { ...this._drawing.options };
  }

  remove(): void {
    this._chart.removeDrawing(this);
  }
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
    } else if (theme === 'colorful') {
      resolved = mergeOptions(mergeOptions(DEFAULT_CHART_OPTIONS, COLORFUL_THEME), options);
    } else {
      resolved = mergeOptions(DEFAULT_CHART_OPTIONS, options);
    }
  } else {
    resolved = { ...DEFAULT_CHART_OPTIONS };
  }
  return new ChartApi(container, resolved);
}
