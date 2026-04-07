import type { DeepPartial } from './types';
import type { ChartOptions } from '../api/options';

/**
 * CSS custom property names used by fin-charter.
 * All prefixed with --fc- to avoid collisions.
 */
export const CSS_VARS = {
  // Layout
  bg: '--fc-bg',
  text: '--fc-text',
  fontSize: '--fc-font-size',
  fontFamily: '--fc-font-family',

  // Grid
  gridHorzColor: '--fc-grid-horz-color',
  gridVertColor: '--fc-grid-vert-color',

  // Crosshair
  crosshairVertColor: '--fc-crosshair-vert-color',
  crosshairHorzColor: '--fc-crosshair-horz-color',

  // Series – legacy / area / line
  lineColor: '--fc-line-color',
  areaTopColor: '--fc-area-top',
  areaBottomColor: '--fc-area-bottom',
  areaLineColor: '--fc-area-line',

  // Candlestick (specific)
  candleBodyUp: '--fc-candle-body-up',
  candleBodyDown: '--fc-candle-body-down',
  candleWickUp: '--fc-candle-wick-up',
  candleWickDown: '--fc-candle-wick-down',
  candleBorderUp: '--fc-candle-border-up',
  candleBorderDown: '--fc-candle-border-down',
  // Backward-compat aliases (kept for existing CSS)
  candleUpColor: '--fc-candle-up',
  candleDownColor: '--fc-candle-down',

  // Bar
  barUp: '--fc-bar-up',
  barDown: '--fc-bar-down',

  // Baseline
  baselineTopLine: '--fc-baseline-top-line',
  baselineTopFill: '--fc-baseline-top-fill',
  baselineBottomLine: '--fc-baseline-bottom-line',
  baselineBottomFill: '--fc-baseline-bottom-fill',

  // Hollow candle
  hollowCandleUp: '--fc-hollow-candle-up',
  hollowCandleDown: '--fc-hollow-candle-down',
  hollowCandleWick: '--fc-hollow-candle-wick',

  // Step line
  stepLineColor: '--fc-step-line-color',

  // Colored line
  coloredLineUp: '--fc-colored-line-up',
  coloredLineDown: '--fc-colored-line-down',

  // Colored mountain
  coloredMountainUp: '--fc-colored-mountain-up',
  coloredMountainDown: '--fc-colored-mountain-down',
  coloredMountainFillUp: '--fc-colored-mountain-fill-up',
  coloredMountainFillDown: '--fc-colored-mountain-fill-down',

  // HLC area
  hlcAreaHigh: '--fc-hlc-area-high',
  hlcAreaLow: '--fc-hlc-area-low',
  hlcAreaFill: '--fc-hlc-area-fill',

  // High-low
  highLowUp: '--fc-high-low-up',
  highLowDown: '--fc-high-low-down',

  // Column
  columnUp: '--fc-column-up',
  columnDown: '--fc-column-down',

  // Volume candle
  volumeCandleUp: '--fc-volume-candle-up',
  volumeCandleDown: '--fc-volume-candle-down',
  volumeCandleWickUp: '--fc-volume-candle-wick-up',
  volumeCandleWickDown: '--fc-volume-candle-wick-down',

  // Histogram
  histogramUp: '--fc-histogram-up',
  histogramDown: '--fc-histogram-down',

  // Baseline delta mountain
  bdmTopLine: '--fc-bdm-top-line',
  bdmTopFill: '--fc-bdm-top-fill',
  bdmBottomLine: '--fc-bdm-bottom-line',
  bdmBottomFill: '--fc-bdm-bottom-fill',

  // Renko
  renkoUp: '--fc-renko-up',
  renkoDown: '--fc-renko-down',

  // Kagi
  kagiYang: '--fc-kagi-yang',
  kagiYin: '--fc-kagi-yin',

  // Line break
  lineBreakUp: '--fc-line-break-up',
  lineBreakDown: '--fc-line-break-down',

  // Point figure
  pointFigureUp: '--fc-point-figure-up',
  pointFigureDown: '--fc-point-figure-down',

  // Last price
  lastPriceUp: '--fc-last-price-up',
  lastPriceDown: '--fc-last-price-down',

  // Band fill
  bandFill: '--fc-band-fill',

  // Volume
  volumeUpColor: '--fc-volume-up',
  volumeDownColor: '--fc-volume-down',

  // Watermark
  watermarkColor: '--fc-watermark-color',
} as const;

export interface CSSSeriesDefaults {
  candlestick?: { upColor?: string; downColor?: string; wickUpColor?: string; wickDownColor?: string; borderUpColor?: string; borderDownColor?: string };
  bar?: { upColor?: string; downColor?: string };
  baseline?: { topLineColor?: string; topFillColor?: string; bottomLineColor?: string; bottomFillColor?: string };
  'hollow-candle'?: { upColor?: string; downColor?: string; wickColor?: string };
  line?: { color?: string };
  area?: { lineColor?: string; topColor?: string; bottomColor?: string };
  histogram?: { upColor?: string; downColor?: string };
  'step-line'?: { color?: string };
  'colored-line'?: { upColor?: string; downColor?: string };
  'colored-mountain'?: { upColor?: string; downColor?: string; upFillColor?: string; downFillColor?: string };
  'hlc-area'?: { highLineColor?: string; lowLineColor?: string; fillColor?: string };
  'high-low'?: { upColor?: string; downColor?: string };
  column?: { upColor?: string; downColor?: string };
  'volume-candle'?: { upColor?: string; downColor?: string; wickUpColor?: string; wickDownColor?: string };
  'baseline-delta-mountain'?: { topLineColor?: string; topFillColor?: string; bottomLineColor?: string; bottomFillColor?: string };
  renko?: { upColor?: string; downColor?: string };
  kagi?: { yangColor?: string; yinColor?: string };
  'line-break'?: { upColor?: string; downColor?: string };
  'point-figure'?: { upColor?: string; downColor?: string };
  lastPriceLine?: { upColor?: string; downColor?: string };
  bandFill?: { color?: string };
}

export interface CSSThemeResult {
  chartOptions: DeepPartial<ChartOptions>;
  seriesDefaults: CSSSeriesDefaults;
}

/**
 * Read CSS custom properties from a container element and return
 * a CSSThemeResult containing chart options and per-series-type color defaults.
 * Undefined properties (not set in CSS) are omitted so mergeOptions will skip them.
 */
export function readCSSTheme(container: HTMLElement): CSSThemeResult {
  const style = getComputedStyle(container);
  const get = (name: string): string | undefined => {
    const val = style.getPropertyValue(name).trim();
    return val || undefined;
  };

  const bg = get(CSS_VARS.bg);
  const text = get(CSS_VARS.text);
  const fontSizeStr = get(CSS_VARS.fontSize);
  const fontFamily = get(CSS_VARS.fontFamily);

  const opts: DeepPartial<ChartOptions> = {};

  if (bg || text || fontSizeStr || fontFamily) {
    opts.layout = {};
    if (bg) opts.layout.backgroundColor = bg;
    if (text) opts.layout.textColor = text;
    if (fontSizeStr) opts.layout.fontSize = parseInt(fontSizeStr, 10);
    if (fontFamily) opts.layout.fontFamily = fontFamily;
  }

  const gridH = get(CSS_VARS.gridHorzColor);
  const gridV = get(CSS_VARS.gridVertColor);
  if (gridH || gridV) {
    opts.grid = {};
    if (gridH) opts.grid.horzLinesColor = gridH;
    if (gridV) opts.grid.vertLinesColor = gridV;
  }

  const chV = get(CSS_VARS.crosshairVertColor);
  const chH = get(CSS_VARS.crosshairHorzColor);
  if (chV || chH) {
    opts.crosshair = {};
    if (chV) opts.crosshair.vertLineColor = chV;
    if (chH) opts.crosshair.horzLineColor = chH;
  }

  const volUp = get(CSS_VARS.volumeUpColor);
  const volDown = get(CSS_VARS.volumeDownColor);
  if (volUp || volDown) {
    opts.volume = {};
    if (volUp) opts.volume.upColor = volUp;
    if (volDown) opts.volume.downColor = volDown;
  }

  const wmColor = get(CSS_VARS.watermarkColor);
  if (wmColor) {
    opts.watermark = { color: wmColor };
  }

  // ─── Series defaults ──────────────────────────────────────────────────────
  const seriesDefaults: CSSSeriesDefaults = {};

  // Candlestick: specific vars take priority; fall back to legacy aliases
  const candleBodyUp = get(CSS_VARS.candleBodyUp) ?? get(CSS_VARS.candleUpColor);
  const candleBodyDown = get(CSS_VARS.candleBodyDown) ?? get(CSS_VARS.candleDownColor);
  const candleWickUp = get(CSS_VARS.candleWickUp);
  const candleWickDown = get(CSS_VARS.candleWickDown);
  const candleBorderUp = get(CSS_VARS.candleBorderUp);
  const candleBorderDown = get(CSS_VARS.candleBorderDown);
  if (candleBodyUp || candleBodyDown || candleWickUp || candleWickDown || candleBorderUp || candleBorderDown) {
    seriesDefaults.candlestick = {};
    if (candleBodyUp) seriesDefaults.candlestick.upColor = candleBodyUp;
    if (candleBodyDown) seriesDefaults.candlestick.downColor = candleBodyDown;
    if (candleWickUp) seriesDefaults.candlestick.wickUpColor = candleWickUp;
    if (candleWickDown) seriesDefaults.candlestick.wickDownColor = candleWickDown;
    if (candleBorderUp) seriesDefaults.candlestick.borderUpColor = candleBorderUp;
    if (candleBorderDown) seriesDefaults.candlestick.borderDownColor = candleBorderDown;
  }

  // Bar
  const barUp = get(CSS_VARS.barUp);
  const barDown = get(CSS_VARS.barDown);
  if (barUp || barDown) {
    seriesDefaults.bar = {};
    if (barUp) seriesDefaults.bar.upColor = barUp;
    if (barDown) seriesDefaults.bar.downColor = barDown;
  }

  // Baseline
  const baselineTopLine = get(CSS_VARS.baselineTopLine);
  const baselineTopFill = get(CSS_VARS.baselineTopFill);
  const baselineBottomLine = get(CSS_VARS.baselineBottomLine);
  const baselineBottomFill = get(CSS_VARS.baselineBottomFill);
  if (baselineTopLine || baselineTopFill || baselineBottomLine || baselineBottomFill) {
    seriesDefaults.baseline = {};
    if (baselineTopLine) seriesDefaults.baseline.topLineColor = baselineTopLine;
    if (baselineTopFill) seriesDefaults.baseline.topFillColor = baselineTopFill;
    if (baselineBottomLine) seriesDefaults.baseline.bottomLineColor = baselineBottomLine;
    if (baselineBottomFill) seriesDefaults.baseline.bottomFillColor = baselineBottomFill;
  }

  // Hollow candle
  const hollowUp = get(CSS_VARS.hollowCandleUp);
  const hollowDown = get(CSS_VARS.hollowCandleDown);
  const hollowWick = get(CSS_VARS.hollowCandleWick);
  if (hollowUp || hollowDown || hollowWick) {
    seriesDefaults['hollow-candle'] = {};
    if (hollowUp) seriesDefaults['hollow-candle'].upColor = hollowUp;
    if (hollowDown) seriesDefaults['hollow-candle'].downColor = hollowDown;
    if (hollowWick) seriesDefaults['hollow-candle'].wickColor = hollowWick;
  }

  // Line
  const lineColor = get(CSS_VARS.lineColor);
  if (lineColor) {
    seriesDefaults.line = { color: lineColor };
  }

  // Area
  const areaLine = get(CSS_VARS.areaLineColor);
  const areaTop = get(CSS_VARS.areaTopColor);
  const areaBottom = get(CSS_VARS.areaBottomColor);
  if (areaLine || areaTop || areaBottom) {
    seriesDefaults.area = {};
    if (areaLine) seriesDefaults.area.lineColor = areaLine;
    if (areaTop) seriesDefaults.area.topColor = areaTop;
    if (areaBottom) seriesDefaults.area.bottomColor = areaBottom;
  }

  // Histogram
  const histUp = get(CSS_VARS.histogramUp);
  const histDown = get(CSS_VARS.histogramDown);
  if (histUp || histDown) {
    seriesDefaults.histogram = {};
    if (histUp) seriesDefaults.histogram.upColor = histUp;
    if (histDown) seriesDefaults.histogram.downColor = histDown;
  }

  // Step line
  const stepLine = get(CSS_VARS.stepLineColor);
  if (stepLine) {
    seriesDefaults['step-line'] = { color: stepLine };
  }

  // Colored line
  const coloredLineUp = get(CSS_VARS.coloredLineUp);
  const coloredLineDown = get(CSS_VARS.coloredLineDown);
  if (coloredLineUp || coloredLineDown) {
    seriesDefaults['colored-line'] = {};
    if (coloredLineUp) seriesDefaults['colored-line'].upColor = coloredLineUp;
    if (coloredLineDown) seriesDefaults['colored-line'].downColor = coloredLineDown;
  }

  // Colored mountain
  const cmUp = get(CSS_VARS.coloredMountainUp);
  const cmDown = get(CSS_VARS.coloredMountainDown);
  const cmFillUp = get(CSS_VARS.coloredMountainFillUp);
  const cmFillDown = get(CSS_VARS.coloredMountainFillDown);
  if (cmUp || cmDown || cmFillUp || cmFillDown) {
    seriesDefaults['colored-mountain'] = {};
    if (cmUp) seriesDefaults['colored-mountain'].upColor = cmUp;
    if (cmDown) seriesDefaults['colored-mountain'].downColor = cmDown;
    if (cmFillUp) seriesDefaults['colored-mountain'].upFillColor = cmFillUp;
    if (cmFillDown) seriesDefaults['colored-mountain'].downFillColor = cmFillDown;
  }

  // HLC area
  const hlcHigh = get(CSS_VARS.hlcAreaHigh);
  const hlcLow = get(CSS_VARS.hlcAreaLow);
  const hlcFill = get(CSS_VARS.hlcAreaFill);
  if (hlcHigh || hlcLow || hlcFill) {
    seriesDefaults['hlc-area'] = {};
    if (hlcHigh) seriesDefaults['hlc-area'].highLineColor = hlcHigh;
    if (hlcLow) seriesDefaults['hlc-area'].lowLineColor = hlcLow;
    if (hlcFill) seriesDefaults['hlc-area'].fillColor = hlcFill;
  }

  // High-low
  const hlUp = get(CSS_VARS.highLowUp);
  const hlDown = get(CSS_VARS.highLowDown);
  if (hlUp || hlDown) {
    seriesDefaults['high-low'] = {};
    if (hlUp) seriesDefaults['high-low'].upColor = hlUp;
    if (hlDown) seriesDefaults['high-low'].downColor = hlDown;
  }

  // Column
  const colUp = get(CSS_VARS.columnUp);
  const colDown = get(CSS_VARS.columnDown);
  if (colUp || colDown) {
    seriesDefaults.column = {};
    if (colUp) seriesDefaults.column.upColor = colUp;
    if (colDown) seriesDefaults.column.downColor = colDown;
  }

  // Volume candle
  const vcUp = get(CSS_VARS.volumeCandleUp);
  const vcDown = get(CSS_VARS.volumeCandleDown);
  const vcWickUp = get(CSS_VARS.volumeCandleWickUp);
  const vcWickDown = get(CSS_VARS.volumeCandleWickDown);
  if (vcUp || vcDown || vcWickUp || vcWickDown) {
    seriesDefaults['volume-candle'] = {};
    if (vcUp) seriesDefaults['volume-candle'].upColor = vcUp;
    if (vcDown) seriesDefaults['volume-candle'].downColor = vcDown;
    if (vcWickUp) seriesDefaults['volume-candle'].wickUpColor = vcWickUp;
    if (vcWickDown) seriesDefaults['volume-candle'].wickDownColor = vcWickDown;
  }

  // Baseline delta mountain
  const bdmTopLine = get(CSS_VARS.bdmTopLine);
  const bdmTopFill = get(CSS_VARS.bdmTopFill);
  const bdmBottomLine = get(CSS_VARS.bdmBottomLine);
  const bdmBottomFill = get(CSS_VARS.bdmBottomFill);
  if (bdmTopLine || bdmTopFill || bdmBottomLine || bdmBottomFill) {
    seriesDefaults['baseline-delta-mountain'] = {};
    if (bdmTopLine) seriesDefaults['baseline-delta-mountain'].topLineColor = bdmTopLine;
    if (bdmTopFill) seriesDefaults['baseline-delta-mountain'].topFillColor = bdmTopFill;
    if (bdmBottomLine) seriesDefaults['baseline-delta-mountain'].bottomLineColor = bdmBottomLine;
    if (bdmBottomFill) seriesDefaults['baseline-delta-mountain'].bottomFillColor = bdmBottomFill;
  }

  // Renko
  const renkoUp = get(CSS_VARS.renkoUp);
  const renkoDown = get(CSS_VARS.renkoDown);
  if (renkoUp || renkoDown) {
    seriesDefaults.renko = {};
    if (renkoUp) seriesDefaults.renko.upColor = renkoUp;
    if (renkoDown) seriesDefaults.renko.downColor = renkoDown;
  }

  // Kagi
  const kagiYang = get(CSS_VARS.kagiYang);
  const kagiYin = get(CSS_VARS.kagiYin);
  if (kagiYang || kagiYin) {
    seriesDefaults.kagi = {};
    if (kagiYang) seriesDefaults.kagi.yangColor = kagiYang;
    if (kagiYin) seriesDefaults.kagi.yinColor = kagiYin;
  }

  // Line break
  const lbUp = get(CSS_VARS.lineBreakUp);
  const lbDown = get(CSS_VARS.lineBreakDown);
  if (lbUp || lbDown) {
    seriesDefaults['line-break'] = {};
    if (lbUp) seriesDefaults['line-break'].upColor = lbUp;
    if (lbDown) seriesDefaults['line-break'].downColor = lbDown;
  }

  // Point figure
  const pfUp = get(CSS_VARS.pointFigureUp);
  const pfDown = get(CSS_VARS.pointFigureDown);
  if (pfUp || pfDown) {
    seriesDefaults['point-figure'] = {};
    if (pfUp) seriesDefaults['point-figure'].upColor = pfUp;
    if (pfDown) seriesDefaults['point-figure'].downColor = pfDown;
  }

  // Last price
  const lpUp = get(CSS_VARS.lastPriceUp);
  const lpDown = get(CSS_VARS.lastPriceDown);
  if (lpUp || lpDown) {
    seriesDefaults.lastPriceLine = {};
    if (lpUp) seriesDefaults.lastPriceLine.upColor = lpUp;
    if (lpDown) seriesDefaults.lastPriceLine.downColor = lpDown;
  }

  // Band fill
  const bandFillColor = get(CSS_VARS.bandFill);
  if (bandFillColor) {
    seriesDefaults.bandFill = { color: bandFillColor };
  }

  return { chartOptions: opts, seriesDefaults };
}

/**
 * Generate a CSS string that sets all custom properties for a theme.
 * Can be applied to a container element via `element.style.cssText` or
 * inserted into a <style> block.
 */
export function generateCSSTheme(options: DeepPartial<ChartOptions>): string {
  const vars: string[] = [];

  if (options.layout?.backgroundColor) vars.push(`${CSS_VARS.bg}: ${options.layout.backgroundColor}`);
  if (options.layout?.textColor) vars.push(`${CSS_VARS.text}: ${options.layout.textColor}`);
  if (options.layout?.fontSize) vars.push(`${CSS_VARS.fontSize}: ${options.layout.fontSize}px`);
  if (options.layout?.fontFamily) vars.push(`${CSS_VARS.fontFamily}: ${options.layout.fontFamily}`);

  if (options.grid?.horzLinesColor) vars.push(`${CSS_VARS.gridHorzColor}: ${options.grid.horzLinesColor}`);
  if (options.grid?.vertLinesColor) vars.push(`${CSS_VARS.gridVertColor}: ${options.grid.vertLinesColor}`);

  if (options.crosshair?.vertLineColor) vars.push(`${CSS_VARS.crosshairVertColor}: ${options.crosshair.vertLineColor}`);
  if (options.crosshair?.horzLineColor) vars.push(`${CSS_VARS.crosshairHorzColor}: ${options.crosshair.horzLineColor}`);

  if (options.volume?.upColor) vars.push(`${CSS_VARS.volumeUpColor}: ${options.volume.upColor}`);
  if (options.volume?.downColor) vars.push(`${CSS_VARS.volumeDownColor}: ${options.volume.downColor}`);

  if (options.watermark?.color) vars.push(`${CSS_VARS.watermarkColor}: ${options.watermark.color}`);

  return vars.join(';\n');
}

/**
 * Apply CSS custom properties for a theme directly to an element.
 */
export function applyCSSTheme(element: HTMLElement, options: DeepPartial<ChartOptions>): void {
  if (options.layout?.backgroundColor) element.style.setProperty(CSS_VARS.bg, options.layout.backgroundColor);
  if (options.layout?.textColor) element.style.setProperty(CSS_VARS.text, options.layout.textColor);
  if (options.layout?.fontSize) element.style.setProperty(CSS_VARS.fontSize, `${options.layout.fontSize}px`);
  if (options.layout?.fontFamily) element.style.setProperty(CSS_VARS.fontFamily, options.layout.fontFamily);

  if (options.grid?.horzLinesColor) element.style.setProperty(CSS_VARS.gridHorzColor, options.grid.horzLinesColor);
  if (options.grid?.vertLinesColor) element.style.setProperty(CSS_VARS.gridVertColor, options.grid.vertLinesColor);

  if (options.crosshair?.vertLineColor) element.style.setProperty(CSS_VARS.crosshairVertColor, options.crosshair.vertLineColor);
  if (options.crosshair?.horzLineColor) element.style.setProperty(CSS_VARS.crosshairHorzColor, options.crosshair.horzLineColor);

  if (options.volume?.upColor) element.style.setProperty(CSS_VARS.volumeUpColor, options.volume.upColor);
  if (options.volume?.downColor) element.style.setProperty(CSS_VARS.volumeDownColor, options.volume.downColor);

  if (options.watermark?.color) element.style.setProperty(CSS_VARS.watermarkColor, options.watermark.color);
}
