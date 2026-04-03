export const VERSION = '0.1.0';

// ─── API layer ──────────────────────────────────────────────────────────────
export { createChart } from './api/chart-api';
export type { IChartApi, CrosshairMoveCallback, ClickCallback } from './api/chart-api';
export type { ISeriesApi } from './api/series-api';
export type { IPaneApi } from './api/pane-api';

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
