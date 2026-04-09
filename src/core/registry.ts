/**
 * Registry system for modular chart components.
 *
 * Renderers, indicators, and drawings register themselves via typed objects.
 * Consumers import registration modules (e.g., '@itssumitrai/fin-charter/series/candlestick')
 * which auto-register on import. Only imported modules end up in the bundle.
 */

import type { ColumnStore, SeriesType, VisibleRange, IRenderTarget } from './types';

// ─── Series Registration ───────────────────────────────────────────────────

/** A renderer that can draw a series type on a canvas. */
export interface ISeriesRenderer {
  applyOptions(options: Record<string, unknown>): void;
  options?(): Record<string, unknown>;
  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
    barWidth?: number,
  ): void;
}

/** Registration object for a series type (e.g., candlestick, line, area). */
export interface SeriesRegistration {
  type: SeriesType;
  /** Create a new renderer instance, optionally applying initial options. */
  createRenderer(options: Record<string, unknown>): ISeriesRenderer;
  /** Aliases that also map to this series type (e.g., 'heikin-ashi' → candlestick renderer). */
  aliases?: SeriesType[];
}

// ─── Indicator Registration ────────────────────────────────────────────────

/** Registration object for an indicator type (e.g., SMA, RSI, MACD). */
export interface IndicatorRegistration {
  type: string;
  /** Compute the indicator values from the primary series data. */
  compute(
    store: ColumnStore,
    params: Record<string, number>,
  ): Record<string, Float64Array>;
  /** Whether this indicator overlays on the main price pane (vs. a separate pane). */
  overlay: boolean;
  /** Default parameter values. */
  defaultParams: Record<string, number>;
  /** Map output keys to default colors. */
  colorMap(primaryColor: string): Record<string, string>;
  /** Settings fields for the HUD settings dialog. */
  settingsFields?(options: Record<string, unknown>): Array<{ key: string; label: string; type: string; value: string | number; min?: number; max?: number; step?: number }>;
}

// ─── Drawing Registration ──────────────────────────────────────────────────

/** Registration object for a drawing type. */
export interface DrawingRegistration {
  type: string;
  /** Number of anchor points required. */
  requiredPoints: number;
  /** Factory to create the drawing primitive. */
  create(id: string, points: Array<{ time: number; price: number }>, options: Record<string, unknown>): unknown;
}

// ─── Global Registry ───────────────────────────────────────────────────────

const _seriesRegistry = new Map<string, SeriesRegistration>();
const _indicatorRegistry = new Map<string, IndicatorRegistration>();
const _drawingRegistry = new Map<string, DrawingRegistration>();

export function registerSeries(reg: SeriesRegistration): void {
  _seriesRegistry.set(reg.type, reg);
  if (reg.aliases) {
    for (const alias of reg.aliases) {
      _seriesRegistry.set(alias, reg);
    }
  }
}

export function registerIndicator(reg: IndicatorRegistration): void {
  _indicatorRegistry.set(reg.type, reg);
}

export function registerDrawing(reg: DrawingRegistration): void {
  _drawingRegistry.set(reg.type, reg);
}

export function getSeriesRegistration(type: string): SeriesRegistration | undefined {
  return _seriesRegistry.get(type);
}

export function getIndicatorRegistration(type: string): IndicatorRegistration | undefined {
  return _indicatorRegistry.get(type);
}

export function getDrawingRegistration(type: string): DrawingRegistration | undefined {
  return _drawingRegistry.get(type);
}

export function getRegisteredSeriesTypes(): string[] {
  return [...new Set(_seriesRegistry.keys())];
}

export function getRegisteredIndicatorTypes(): string[] {
  return [..._indicatorRegistry.keys()];
}

export function getRegisteredDrawingTypes(): string[] {
  return [..._drawingRegistry.keys()];
}

/** Register multiple series types at once. */
export function registerAll(options: {
  series?: SeriesRegistration[];
  indicators?: IndicatorRegistration[];
  drawings?: DrawingRegistration[];
}): void {
  if (options.series) options.series.forEach(registerSeries);
  if (options.indicators) options.indicators.forEach(registerIndicator);
  if (options.drawings) options.drawings.forEach(registerDrawing);
}
