import type { Bar, ColumnData, DeepPartial } from '../core/types';
import type { SerializedDrawing } from '../drawings/index';
import type { CandlestickRendererOptions } from '../renderers/candlestick';
import type { LineRendererOptions } from '../renderers/line';
import type { AreaRendererOptions } from '../renderers/area';
import type { BarOHLCRendererOptions } from '../renderers/bar-ohlc';
import type { BaselineRendererOptions } from '../renderers/baseline';
import type { HollowCandleRendererOptions } from '../renderers/hollow-candle';
import type { HistogramRendererOptions } from '../renderers/histogram';
import type { StepLineRendererOptions } from '../renderers/step-line';
import type { ColoredLineRendererOptions } from '../renderers/colored-line';
import type { ColoredMountainRendererOptions } from '../renderers/colored-mountain';
import type { HLCAreaRendererOptions } from '../renderers/hlc-area';
import type { HighLowRendererOptions } from '../renderers/high-low';
import type { ColumnRendererOptions } from '../renderers/column';
import type { VolumeCandleRendererOptions } from '../renderers/volume-candle';
import type { BaselineDeltaMountainRendererOptions } from '../renderers/baseline-delta-mountain';
import type { RenkoRendererOptions } from '../renderers/renko';
import type { KagiRendererOptions } from '../renderers/kagi';
import type { LineBreakRendererOptions } from '../renderers/line-break';
import type { PointFigureRendererOptions } from '../renderers/point-figure';

// ─── Layout ─────────────────────────────────────────────────────────────────

export interface LayoutOptions {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
}

// ─── TimeScale ──────────────────────────────────────────────────────────────

export interface TimeScaleApiOptions {
  barSpacing: number;
  rightOffset: number;
  minBarSpacing: number;
  maxBarSpacing: number;
  tickMarkFormatter?: (time: number, tickType: 'year' | 'month' | 'day' | 'time') => string;
}

// ─── Crosshair ──────────────────────────────────────────────────────────────

export interface CrosshairOptions {
  vertLineColor: string;
  vertLineWidth: number;
  vertLineDash: number[];
  horzLineColor: string;
  horzLineWidth: number;
  horzLineDash: number[];
}

// ─── Grid ───────────────────────────────────────────────────────────────────

export interface GridOptions {
  vertLinesVisible: boolean;
  vertLinesColor: string;
  horzLinesVisible: boolean;
  horzLinesColor: string;
}

// ─── Chart ──────────────────────────────────────────────────────────────────

export interface LastPriceLineOptions {
  visible: boolean;
}

/** Data passed to custom tooltip formatters. */
export interface TooltipData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Formatted date string. */
  dateStr: string;
  /** Whether close >= open. */
  isUp: boolean;
  /** Bar index in the data store. */
  barIndex: number;
}

export interface TooltipOptions {
  enabled: boolean;
  /**
   * Custom tooltip formatter. Return an HTML string or HTMLElement.
   * When provided, replaces the default OHLCV tooltip content.
   * The tooltip container (positioning, background) is still managed by the chart.
   */
  formatter?: (data: TooltipData) => string | HTMLElement;
}

export interface WatermarkOptions {
  visible: boolean;
  text: string;
  color: string;
  fontSize: number;
  horzAlign: 'left' | 'center' | 'right';
  vertAlign: 'top' | 'center' | 'bottom';
}

export interface VolumeOverlayOptions {
  visible: boolean;
  upColor: string;
  downColor: string;
  scaleMarginTop: number;
}

export interface PriceScaleOptions {
  visible: boolean;
  /** Scale mode: 'linear' (default) or 'logarithmic'. */
  mode?: import('../core/price-scale').PriceScaleMode;
}

export interface TimeGapsOptions {
  visible: boolean;
}

export type RendererType = 'canvas2d' | 'webgl';

export interface ChartOptions {
  symbol?: string;
  width: number;
  height: number;
  autoSize: boolean;
  layout: LayoutOptions;
  timeScale: TimeScaleApiOptions;
  crosshair: CrosshairOptions;
  grid: GridOptions;
  lastPriceLine: LastPriceLineOptions;
  tooltip: TooltipOptions;
  watermark: WatermarkOptions;
  volume: VolumeOverlayOptions;
  rightPriceScale: PriceScaleOptions;
  leftPriceScale: PriceScaleOptions;
  timeGaps: TimeGapsOptions;
  priceFormatter?: (price: number) => string;
  theme?: 'dark' | 'light' | 'colorful';
  locale?: string;       // BCP 47 locale tag, e.g. 'en-US', 'de-DE'
  timezone?: string;     // IANA timezone, e.g. 'America/New_York', 'UTC'
  currency?: string;     // ISO 4217 currency code, e.g. 'USD', 'EUR'
  /** Text direction: 'ltr' (default) or 'rtl'. Set to 'auto' to detect from locale. */
  direction?: import('../core/rtl').TextDirection | 'auto';
  /** Auto-downsampling options for large datasets. */
  dataGrouping?: {
    enabled: boolean;
    /** Maximum number of visible bars before downsampling kicks in. Default: 2000. */
    maxBars?: number;
  };
  /**
   * Rendering backend. `'webgl'` uses WebGL2 for supported series types
   * (candlestick, line, area) and falls back to Canvas 2D for the rest.
   * Automatically falls back to `'canvas2d'` when WebGL is unavailable.
   *
   * **Note:** Only honored at chart creation time; cannot be changed via
   * `applyOptions()` after the chart is created.
   */
  renderer?: RendererType;
}

export const DARK_THEME: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: '#1a1a2e',
    textColor: '#d1d4dc',
  },
  crosshair: {
    vertLineColor: '#758696',
    horzLineColor: '#758696',
  },
  grid: {
    vertLinesColor: 'rgba(255, 255, 255, 0.06)',
    horzLinesColor: 'rgba(255, 255, 255, 0.06)',
  },
};

export const COLORFUL_THEME: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: '#0f0e17',
    textColor: '#a7a9be',
  },
  grid: {
    vertLinesColor: 'rgba(255, 255, 255, 0.03)',
    horzLinesColor: 'rgba(255, 255, 255, 0.03)',
  },
  crosshair: {
    vertLineColor: '#ff8906',
    horzLineColor: '#ff8906',
  },
};

export const LIGHT_THEME: DeepPartial<ChartOptions> = {
  layout: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
  },
  crosshair: {
    vertLineColor: '#9598A1',
    horzLineColor: '#9598A1',
  },
  grid: {
    vertLinesColor: 'rgba(0, 0, 0, 0.06)',
    horzLinesColor: 'rgba(0, 0, 0, 0.06)',
  },
};

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  width: 800,
  height: 400,
  autoSize: false,
  layout: {
    backgroundColor: '#1a1a2e',
    textColor: '#d1d4dc',
    fontSize: 11,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  timeScale: {
    barSpacing: 6,
    rightOffset: 0,
    minBarSpacing: 4,
    maxBarSpacing: 50,
  },
  crosshair: {
    vertLineColor: '#758696',
    vertLineWidth: 1,
    vertLineDash: [4, 4],
    horzLineColor: '#758696',
    horzLineWidth: 1,
    horzLineDash: [4, 4],
  },
  grid: {
    vertLinesVisible: true,
    vertLinesColor: 'rgba(255, 255, 255, 0.06)',
    horzLinesVisible: true,
    horzLinesColor: 'rgba(255, 255, 255, 0.06)',
  },
  lastPriceLine: {
    visible: true,
  },
  tooltip: {
    enabled: true,
  },
  watermark: {
    visible: false,
    text: '',
    color: 'rgba(255,255,255,0.06)',
    fontSize: 48,
    horzAlign: 'center',
    vertAlign: 'center',
  },
  volume: {
    visible: false,
    upColor: 'rgba(0,227,150,0.24)',
    downColor: 'rgba(255,59,92,0.24)',
    scaleMarginTop: 0.7,
  },
  rightPriceScale: {
    visible: true,
  },
  leftPriceScale: {
    visible: false,
  },
  timeGaps: {
    visible: false,
  },
  dataGrouping: {
    enabled: false,
    maxBars: 2000,
  },
};

// ─── Annotation Export ──────────────────────────────────────────────────────

export interface AnnotationExport {
  version: number;
  drawings: SerializedDrawing[];
  textLabels: Array<{ time: number; price: number; text: string; options?: Record<string, unknown> }>;
  alertLines: Array<{ price: number; color: string; title: string; triggerMode: string }>;
}

// ─── Series options ─────────────────────────────────────────────────────────

export interface BaseSeriesOptions {
  data?: Bar[] | ColumnData;
  priceScaleId?: string;
  visible?: boolean;
  paneId?: string;
  label?: string;
}

export type CandlestickSeriesOptions = BaseSeriesOptions & Partial<CandlestickRendererOptions>;
export type LineSeriesOptions = BaseSeriesOptions & Partial<LineRendererOptions>;
export type AreaSeriesOptions = BaseSeriesOptions & Partial<AreaRendererOptions>;
export type BarSeriesOptions = BaseSeriesOptions & Partial<BarOHLCRendererOptions>;
export type BaselineSeriesOptions = BaseSeriesOptions & Partial<BaselineRendererOptions>;
export type HollowCandleSeriesOptions = BaseSeriesOptions & Partial<HollowCandleRendererOptions>;
export type HistogramSeriesOptions = BaseSeriesOptions & Partial<HistogramRendererOptions>;
export type StepLineSeriesOptions = BaseSeriesOptions & Partial<StepLineRendererOptions>;
export type ColoredLineSeriesOptions = BaseSeriesOptions & Partial<ColoredLineRendererOptions>;
export type ColoredMountainSeriesOptions = BaseSeriesOptions & Partial<ColoredMountainRendererOptions>;
export type HLCAreaSeriesOptions = BaseSeriesOptions & Partial<HLCAreaRendererOptions>;
export type HighLowSeriesOptions = BaseSeriesOptions & Partial<HighLowRendererOptions>;
export type ColumnSeriesOptions = BaseSeriesOptions & Partial<ColumnRendererOptions>;
export type VolumeCandleSeriesOptions = BaseSeriesOptions & Partial<VolumeCandleRendererOptions>;
export type BaselineDeltaMountainSeriesOptions = BaseSeriesOptions & Partial<BaselineDeltaMountainRendererOptions>;
export type RenkoSeriesOptions = BaseSeriesOptions & Partial<RenkoRendererOptions>;
export type KagiSeriesOptions = BaseSeriesOptions & Partial<KagiRendererOptions>;
export type LineBreakSeriesOptions = BaseSeriesOptions & Partial<LineBreakRendererOptions>;
export type PointFigureSeriesOptions = BaseSeriesOptions & Partial<PointFigureRendererOptions>;

export interface PaneOptions {
  height?: number;
}

export interface SeriesOptionsMap {
  candlestick: CandlestickSeriesOptions;
  bar: BarSeriesOptions;
  line: LineSeriesOptions;
  area: AreaSeriesOptions;
  histogram: HistogramSeriesOptions;
  baseline: BaselineSeriesOptions;
  'hollow-candle': HollowCandleSeriesOptions;
  'heikin-ashi': CandlestickSeriesOptions;
  'step-line': StepLineSeriesOptions;
  'colored-line': ColoredLineSeriesOptions;
  'colored-mountain': ColoredMountainSeriesOptions;
  'hlc-area': HLCAreaSeriesOptions;
  'high-low': HighLowSeriesOptions;
  column: ColumnSeriesOptions;
  'volume-candle': VolumeCandleSeriesOptions;
  'baseline-delta-mountain': BaselineDeltaMountainSeriesOptions;
  renko: RenkoSeriesOptions;
  kagi: KagiSeriesOptions;
  'line-break': LineBreakSeriesOptions;
  'point-figure': PointFigureSeriesOptions;
}

/** Discriminated union for the unified addSeries() API. */
export type SeriesOptions =
  | ({ type: 'candlestick' } & Partial<CandlestickSeriesOptions>)
  | ({ type: 'line' } & Partial<LineSeriesOptions>)
  | ({ type: 'area' } & Partial<AreaSeriesOptions>)
  | ({ type: 'bar' } & Partial<BarSeriesOptions>)
  | ({ type: 'baseline' } & Partial<BaselineSeriesOptions>)
  | ({ type: 'hollow-candle' } & Partial<HollowCandleSeriesOptions>)
  | ({ type: 'histogram' } & Partial<HistogramSeriesOptions>)
  | ({ type: 'heikin-ashi' } & Partial<CandlestickSeriesOptions>)
  | ({ type: 'step-line' } & Partial<StepLineSeriesOptions>)
  | ({ type: 'colored-line' } & Partial<ColoredLineSeriesOptions>)
  | ({ type: 'colored-mountain' } & Partial<ColoredMountainSeriesOptions>)
  | ({ type: 'hlc-area' } & Partial<HLCAreaSeriesOptions>)
  | ({ type: 'high-low' } & Partial<HighLowSeriesOptions>)
  | ({ type: 'column' } & Partial<ColumnSeriesOptions>)
  | ({ type: 'volume-candle' } & Partial<VolumeCandleSeriesOptions>)
  | ({ type: 'baseline-delta-mountain' } & Partial<BaselineDeltaMountainSeriesOptions>)
  | ({ type: 'renko' } & Partial<RenkoSeriesOptions>)
  | ({ type: 'kagi' } & Partial<KagiSeriesOptions>)
  | ({ type: 'line-break' } & Partial<LineBreakSeriesOptions>)
  | ({ type: 'point-figure' } & Partial<PointFigureSeriesOptions>);

// ─── Indicators ────────────────────────────────────────────────────────────

export type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger'
  | 'vwap' | 'stochastic' | 'atr' | 'adx' | 'obv' | 'williams-r'
  | 'ichimoku' | 'parabolic-sar' | 'keltner' | 'donchian' | 'cci' | 'pivot-points'
  | 'aroon' | 'awesome-oscillator' | 'chaikin-mf' | 'coppock' | 'elder-force'
  | 'trix' | 'supertrend' | 'vwma' | 'choppiness' | 'mfi' | 'roc' | 'linear-regression';

export interface IndicatorOptions {
  source: import('./series-api').ISeriesApi<import('../core/types').SeriesType>;
  params?: Record<string, number>;
  paneId?: string;
  color?: string;
  lineWidth?: number;
  visible?: boolean;
  label?: string;
  /** Per-output color overrides, e.g. { upper: '#ff0', middle: '#0f0', lower: '#ff0' }. */
  colors?: Record<string, string>;
  /** Histogram up-bar color override (default: green). */
  histogramUpColor?: string;
  /** Histogram down-bar color override (default: red). */
  histogramDownColor?: string;
  /** Fill color between upper and lower bands for band indicators (bollinger, keltner, donchian)
   *  and Ichimoku cloud (senkouA/senkouB).
   *  Set to 'transparent' or '' to disable. Defaults to a semi-transparent version of the band color. */
  bandFillColor?: string;
}

export const OVERLAY_INDICATORS: Set<IndicatorType> = new Set([
  'sma', 'ema', 'bollinger', 'vwap',
  'ichimoku', 'parabolic-sar', 'keltner', 'donchian',
  'supertrend', 'vwma', 'linear-regression',
]);

export const DEFAULT_INDICATOR_PARAMS: Record<IndicatorType, Record<string, number>> = {
  sma: { period: 20 },
  ema: { period: 20 },
  rsi: { period: 14 },
  macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  bollinger: { period: 20, stdDev: 2 },
  stochastic: { kPeriod: 14, dPeriod: 3 },
  atr: { period: 14 },
  adx: { period: 14 },
  obv: {},
  vwap: {},
  'williams-r': { period: 14 },
  ichimoku: { tenkanPeriod: 9, kijunPeriod: 26, senkouPeriod: 52 },
  'parabolic-sar': { afStep: 0.02, afMax: 0.20 },
  keltner: { emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
  donchian: { period: 20 },
  cci: { period: 20 },
  'pivot-points': {},
  aroon: { period: 25 },
  'awesome-oscillator': { fastPeriod: 5, slowPeriod: 34 },
  'chaikin-mf': { period: 20 },
  coppock: { wmaPeriod: 10, longROC: 14, shortROC: 11 },
  'elder-force': { period: 13 },
  trix: { period: 15, signalPeriod: 9 },
  supertrend: { period: 10, multiplier: 3 },
  vwma: { period: 20 },
  choppiness: { period: 14 },
  mfi: { period: 14 },
  roc: { period: 12 },
  'linear-regression': { period: 20 },
};

// ─── Utility ────────────────────────────────────────────────────────────────

/** Deep merge `overrides` into a copy of `defaults`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeOptions<T extends object>(
  defaults: T,
  overrides: DeepPartial<T>,
): T {
  const result = { ...defaults } as Record<string, unknown>;
  for (const key of Object.keys(overrides)) {
    const val = (overrides as Record<string, unknown>)[key];
    if (
      val !== undefined &&
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      !(val instanceof Float64Array)
    ) {
      result[key] = mergeOptions(
        (result[key] ?? {}) as Record<string, unknown>,
        val as DeepPartial<Record<string, unknown>>,
      );
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result as T;
}
