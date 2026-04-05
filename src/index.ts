export const VERSION = '0.1.0';

// ─── API layer ──────────────────────────────────────────────────────────────
export { createChart } from './api/chart-api';
export type {
  IChartApi, IDrawingApi,
  CrosshairMoveCallback, ClickCallback, DblClickCallback,
  VisibleRangeChangeCallback,
  DrawingEventType, DrawingEventCallback,
  IndicatorEventType, IndicatorEventCallback,
  ResizeCallback,
  SymbolChangeCallback,
  ChartTypeChangeCallback,
  PreferencesChangeCallback,
  LayoutChangeAction,
  LayoutChangeCallback,
} from './api/chart-api';
export type { ISeriesApi, DataChangedCallback, VisibilityChangeCallback } from './api/series-api';
export type { IPaneApi } from './api/pane-api';
export type { IIndicatorApi } from './api/indicator-api';

export { DARK_THEME, LIGHT_THEME, COLORFUL_THEME } from './api/options';
export type { RendererType } from './api/options';

// ─── WebGL ──────────────────────────────────────────────────────────
export { isWebGLAvailable } from './renderers/webgl/index';

// ─── Export ─────────────────────────────────────────────────────────
export type { CSVExportOptions, PDFExportOptions } from './api/export';

// ─── Periodicity ──────────────────────────────────────────────────────
export type { Periodicity } from './core/periodicity';
export { periodicityToSeconds, periodicityToLabel } from './core/periodicity';

// ─── Market Sessions ──────────────────────────────────────────────────
export type { MarketSession } from './core/market-session';
export { US_EQUITY_SESSIONS, isInSession, getSessionForTime, timestampToMinuteOfDay } from './core/market-session';

// ─── Chart State ──────────────────────────────────────────────────────
export type { ChartState } from './core/chart-state';
export { CHART_STATE_VERSION, validateChartState } from './core/chart-state';

// ─── Chart Events ─────────────────────────────────────────────────────
export type { ChartEvent, EventType } from './core/series-markers';

// ─── Series markers ────────────────────────────────────────────────────
export type {
  MarkerShape,
  MarkerPosition,
  SeriesMarker,
} from './core/series-markers';

// ─── Price lines ───────────────────────────────────────────────────────
export { PriceLine } from './core/price-line';
export type { PriceLineOptions } from './core/price-line';

// ─── Streaming Adapters ─────────────────────────────────────────────
export { WebSocketAdapter, PollingAdapter, TickBuffer } from './core/streaming-adapter';
export type { IStreamingAdapter, WebSocketAdapterOptions, PollingAdapterOptions } from './core/streaming-adapter';

// ─── Touch Gestures ─────────────────────────────────────────────────
export { TouchGestureHandler } from './interactions/touch-gestures';
export type { TouchGestureOptions } from './interactions/touch-gestures';

// ─── RTL ────────────────────────────────────────────────────────────
export { detectDirection, mirrorX, resolveTextAlign } from './core/rtl';
export type { TextDirection } from './core/rtl';

// ─── Replay ─────────────────────────────────────────────────────────
export { ReplayManager } from './core/replay';
export type { ReplaySpeed, ReplayEvent, ReplayBarEvent, ReplayControlEvent, ReplayEventCallback, ReplayOptions } from './core/replay';

// ─── Text Labels ────────────────────────────────────────────────────
export { TextLabel, createTextLabels } from './core/text-label';
export type { TextLabelOptions } from './core/text-label';

// ─── Plugin API ─────────────────────────────────────────────────────
export { PluginManager } from './core/plugin';
export type { IPlugin, PluginChartApi, PluginPaintContext } from './core/plugin';

// ─── Storage & Persistence ──────────────────────────────────────────
export { LocalStorageAdapter, IndexedDBAdapter, DrawingPersistence } from './core/storage-adapter';
export type { IStorageAdapter } from './core/storage-adapter';

// ─── Custom Indicators ──────────────────────────────────────────────
export { CustomIndicatorRegistry } from './core/custom-indicator';
export type {
  CustomIndicatorDescriptor,
  IndicatorOutput,
  IndicatorParam,
  IndicatorComputeFn,
} from './core/custom-indicator';

// ─── CSS Theme ──────────────────────────────────────────────────────
export { CSS_VARS, readCSSTheme, generateCSSTheme, applyCSSTheme } from './core/css-theme';

// ─── Data Feed ──────────────────────────────────────────────────────
export { DataFeedManager } from './core/data-feed';
export type { IDataFeed, DataFeedManagerOptions } from './core/data-feed';

// ─── Price Scale ────────────────────────────────────────────────────
export type { PriceScaleMode } from './core/price-scale';

// ─── Undo/Redo ──────────────────────────────────────────────────────
export { UndoRedoManager } from './core/undo-redo';
export type { Command, UndoRedoChangeCallback } from './core/undo-redo';

// ─── Segment Tree (large dataset optimization) ──────────────────────
export { MinMaxSegmentTree } from './core/segment-tree';

// ─── Range Selection & Measure ───────────────────────────────────────
export type {
  RangeSelectionStats,
  RangeSelectionCallback,
  MeasureResult,
  MeasureCallback,
} from './interactions/range-selection';

// ─── Alert lines ──────────────────────────────────────────────────────
export { AlertLine } from './core/alert-line';
export type { AlertLineOptions, AlertTriggerMode, AlertLineCallback } from './core/alert-line';

// ─── Symbol Resolution ─────────────────────────────────────────────────────
export { SimpleSymbolResolver } from './core/symbol-resolver';
export type { SymbolInfo, ISymbolResolver } from './core/symbol-resolver';

// ─── Option types ───────────────────────────────────────────────────────────
export type {
  ChartOptions,
  LayoutOptions,
  TimeScaleApiOptions,
  CrosshairOptions,
  GridOptions,
  CandlestickSeriesOptions,
  LineSeriesOptions,
  AreaSeriesOptions,
  BarSeriesOptions,
  BaselineSeriesOptions,
  HollowCandleSeriesOptions,
  HistogramSeriesOptions,
  PaneOptions,
  BaseSeriesOptions,
  SeriesOptionsMap,
  TooltipOptions,
  WatermarkOptions,
  VolumeOverlayOptions,
  PriceScaleOptions,
  TimeGapsOptions,
  IndicatorType,
  IndicatorOptions,
} from './api/options';

// ─── Core types ─────────────────────────────────────────────────────────────
export type {
  Bar,
  ColumnData,
  SeriesType,
  DeepPartial,
  ISeriesPrimitive,
  IPanePrimitive,
  IPaneView,
  IPaneRenderer,
  IRenderTarget,
  VisibleRange,
  TimeRange,
} from './core/types';

export { InvalidationLevel } from './core/types';

// ─── Drawing tools ────────────────────────────────────────────────────
export type {
  AnchorPoint,
  DrawingOptions,
  SerializedDrawing,
  DrawingPrimitive,
  DrawingHitTestResult,
  DrawingFactory,
} from './drawings/index';
export { DRAWING_REGISTRY, createBuiltinDrawing, distToSegment, pointInRect } from './drawings/index';

// ─── i18n ────────────────────────────────────────────────────────────
export { t, setLocale, getLocale, registerLocale, loadLocale, enLocale } from './i18n';
export type { Translations } from './i18n';

// ─── Timezone ────────────────────────────────────────────────────────
export { timestampToDateParts, formatInTimezone, getTimezoneOffsetMinutes } from './timezone';
export type { DateParts } from './timezone';

// ─── Formatting ──────────────────────────────────────────────────────
export { createPriceFormatter, createTimeFormatter, formatVolume } from './formatting';
export type { PriceFormatterOptions, TimeFormatterOptions } from './formatting';

// ─── Currency ────────────────────────────────────────────────────────
export { getCurrencyInfo, formatCurrency, CURRENCIES } from './currency';
export type { CurrencyInfo } from './currency';

// ─── Market Definitions ─────────────────────────────────────────────
export {
  getMarket, registerMarket, getMarketForExchange, registerExchange,
  isMarketDate, getNextOpen, isEarlyClose,
  US_MARKET, UK_MARKET, JP_MARKET, DE_MARKET, AU_MARKET, CRYPTO_MARKET,
} from './market';
export type { MarketDefinition, MarketHoliday } from './market';
