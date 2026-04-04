export const VERSION = '0.1.0';

// ─── API layer ──────────────────────────────────────────────────────────────
export { createChart } from './api/chart-api';
export type { IChartApi, CrosshairMoveCallback, ClickCallback } from './api/chart-api';
export type { ISeriesApi, DataChangedCallback } from './api/series-api';
export type { IPaneApi } from './api/pane-api';
export type { IIndicatorApi } from './api/indicator-api';

export { DARK_THEME, LIGHT_THEME, COLORFUL_THEME } from './api/options';

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
