export const VERSION = '0.1.0';

// ─── API layer ──────────────────────────────────────────────────────────────
export { createChart } from './api/chart-api';
export type { IChartApi, IDrawingApi, CrosshairMoveCallback, ClickCallback } from './api/chart-api';
export type { ISeriesApi, DataChangedCallback } from './api/series-api';
export type { IPaneApi } from './api/pane-api';
export type { IIndicatorApi } from './api/indicator-api';

export { DARK_THEME, LIGHT_THEME, COLORFUL_THEME } from './api/options';

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
