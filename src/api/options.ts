import type { Bar, ColumnData, DeepPartial } from '../core/types';
import type { CandlestickRendererOptions } from '../renderers/candlestick';
import type { LineRendererOptions } from '../renderers/line';
import type { AreaRendererOptions } from '../renderers/area';
import type { BarOHLCRendererOptions } from '../renderers/bar-ohlc';
import type { BaselineRendererOptions } from '../renderers/baseline';
import type { HollowCandleRendererOptions } from '../renderers/hollow-candle';
import type { HistogramRendererOptions } from '../renderers/histogram';

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

export interface TooltipOptions {
  enabled: boolean;
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

export interface ChartOptions {
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
  theme?: 'dark' | 'light';
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
    minBarSpacing: 2,
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
    upColor: 'rgba(38,166,154,0.3)',
    downColor: 'rgba(239,83,80,0.3)',
    scaleMarginTop: 0.7,
  },
};

// ─── Series options ─────────────────────────────────────────────────────────

export interface BaseSeriesOptions {
  data?: Bar[] | ColumnData;
  priceScaleId?: string;
  visible?: boolean;
}

export type CandlestickSeriesOptions = BaseSeriesOptions & Partial<CandlestickRendererOptions>;
export type LineSeriesOptions = BaseSeriesOptions & Partial<LineRendererOptions>;
export type AreaSeriesOptions = BaseSeriesOptions & Partial<AreaRendererOptions>;
export type BarSeriesOptions = BaseSeriesOptions & Partial<BarOHLCRendererOptions>;
export type BaselineSeriesOptions = BaseSeriesOptions & Partial<BaselineRendererOptions>;
export type HollowCandleSeriesOptions = BaseSeriesOptions & Partial<HollowCandleRendererOptions>;
export type HistogramSeriesOptions = BaseSeriesOptions & Partial<HistogramRendererOptions>;

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
}

// ─── Utility ────────────────────────────────────────────────────────────────

/** Deep merge `overrides` into a copy of `defaults`. */
export function mergeOptions<T extends Record<string, unknown>>(
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
