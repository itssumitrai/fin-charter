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

/**
 * Read CSS custom properties from a container element and return
 * a partial ChartOptions object. Undefined properties (not set in CSS)
 * are omitted so mergeOptions will skip them.
 */
export function readCSSTheme(container: HTMLElement): DeepPartial<ChartOptions> {
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

  return opts;
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
