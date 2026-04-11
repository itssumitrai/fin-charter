import { describe, it, expect } from 'vitest';
import { generateCSSTheme, applyCSSTheme, readCSSTheme, CSS_VARS } from '@/core/css-theme';

describe('generateCSSTheme - volume and watermark', () => {
  it('includes volume up/down colors', () => {
    const css = generateCSSTheme({ volume: { upColor: '#00ff00', downColor: '#ff0000' } });
    expect(css).toContain('--fc-volume-up: #00ff00');
    expect(css).toContain('--fc-volume-down: #ff0000');
  });

  it('includes watermark color', () => {
    const css = generateCSSTheme({ watermark: { color: '#aabbcc' } });
    expect(css).toContain('--fc-watermark-color: #aabbcc');
  });

  it('includes crosshair colors', () => {
    const css = generateCSSTheme({ crosshair: { vertLineColor: '#111', horzLineColor: '#222' } });
    expect(css).toContain('--fc-crosshair-vert-color: #111');
    expect(css).toContain('--fc-crosshair-horz-color: #222');
  });

  it('includes font size in px', () => {
    const css = generateCSSTheme({ layout: { fontSize: 14 } });
    expect(css).toContain('--fc-font-size: 14px');
  });

  it('includes font family', () => {
    const css = generateCSSTheme({ layout: { fontFamily: 'Arial, sans-serif' } });
    expect(css).toContain('--fc-font-family: Arial, sans-serif');
  });
});

describe('applyCSSTheme - volume, watermark, crosshair', () => {
  it('sets volume up/down properties', () => {
    const el = document.createElement('div');
    applyCSSTheme(el, { volume: { upColor: '#00ee00', downColor: '#ee0000' } });
    expect(el.style.getPropertyValue(CSS_VARS.volumeUpColor)).toBe('#00ee00');
    expect(el.style.getPropertyValue(CSS_VARS.volumeDownColor)).toBe('#ee0000');
  });

  it('sets watermark color', () => {
    const el = document.createElement('div');
    applyCSSTheme(el, { watermark: { color: '#aaaaaa' } });
    expect(el.style.getPropertyValue(CSS_VARS.watermarkColor)).toBe('#aaaaaa');
  });

  it('sets crosshair vert and horz colors', () => {
    const el = document.createElement('div');
    applyCSSTheme(el, { crosshair: { vertLineColor: '#abcdef', horzLineColor: '#fedcba' } });
    expect(el.style.getPropertyValue(CSS_VARS.crosshairVertColor)).toBe('#abcdef');
    expect(el.style.getPropertyValue(CSS_VARS.crosshairHorzColor)).toBe('#fedcba');
  });

  it('sets font size and family', () => {
    const el = document.createElement('div');
    applyCSSTheme(el, { layout: { fontSize: 12, fontFamily: 'Roboto' } });
    expect(el.style.getPropertyValue(CSS_VARS.fontSize)).toBe('12px');
    expect(el.style.getPropertyValue(CSS_VARS.fontFamily)).toBe('Roboto');
  });
});

describe('readCSSTheme - series-level tokens', () => {
  it('reads baseline top/bottom line and fill colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-baseline-top-line', '#00cc00');
    el.style.setProperty('--fc-baseline-top-fill', '#aaffaa');
    el.style.setProperty('--fc-baseline-bottom-line', '#cc0000');
    el.style.setProperty('--fc-baseline-bottom-fill', '#ffaaaa');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.baseline?.topLineColor).toBe('#00cc00');
    expect(seriesDefaults.baseline?.topFillColor).toBe('#aaffaa');
    expect(seriesDefaults.baseline?.bottomLineColor).toBe('#cc0000');
    expect(seriesDefaults.baseline?.bottomFillColor).toBe('#ffaaaa');
    document.body.removeChild(el);
  });

  it('reads hollow-candle up/down/wick colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-hollow-candle-up', '#00ffaa');
    el.style.setProperty('--fc-hollow-candle-down', '#ff00aa');
    el.style.setProperty('--fc-hollow-candle-wick', '#888888');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['hollow-candle']?.upColor).toBe('#00ffaa');
    expect(seriesDefaults['hollow-candle']?.downColor).toBe('#ff00aa');
    expect(seriesDefaults['hollow-candle']?.wickColor).toBe('#888888');
    document.body.removeChild(el);
  });

  it('reads line color', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-line-color', '#2962ff');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.line?.color).toBe('#2962ff');
    document.body.removeChild(el);
  });

  it('reads area line/top/bottom colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-area-line', '#0000ff');
    el.style.setProperty('--fc-area-top', '#aaaaff');
    el.style.setProperty('--fc-area-bottom', '#ffffff00');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.area?.lineColor).toBe('#0000ff');
    expect(seriesDefaults.area?.topColor).toBe('#aaaaff');
    expect(seriesDefaults.area?.bottomColor).toBe('#ffffff00');
    document.body.removeChild(el);
  });

  it('reads histogram up/down colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-histogram-up', '#26a69a');
    el.style.setProperty('--fc-histogram-down', '#ef5350');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.histogram?.upColor).toBe('#26a69a');
    expect(seriesDefaults.histogram?.downColor).toBe('#ef5350');
    document.body.removeChild(el);
  });

  it('reads step-line color', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-step-line-color', '#ff6600');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['step-line']?.color).toBe('#ff6600');
    document.body.removeChild(el);
  });

  it('reads colored-line up/down colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-colored-line-up', '#00ff99');
    el.style.setProperty('--fc-colored-line-down', '#ff0099');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['colored-line']?.upColor).toBe('#00ff99');
    expect(seriesDefaults['colored-line']?.downColor).toBe('#ff0099');
    document.body.removeChild(el);
  });

  it('reads colored-mountain up/down/fill colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-colored-mountain-up', '#00aaff');
    el.style.setProperty('--fc-colored-mountain-down', '#ff5500');
    el.style.setProperty('--fc-colored-mountain-fill-up', '#aaeeff');
    el.style.setProperty('--fc-colored-mountain-fill-down', '#ffddaa');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['colored-mountain']?.upColor).toBe('#00aaff');
    expect(seriesDefaults['colored-mountain']?.downColor).toBe('#ff5500');
    expect(seriesDefaults['colored-mountain']?.upFillColor).toBe('#aaeeff');
    expect(seriesDefaults['colored-mountain']?.downFillColor).toBe('#ffddaa');
    document.body.removeChild(el);
  });

  it('reads hlc-area high/low/fill colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-hlc-area-high', '#00cc88');
    el.style.setProperty('--fc-hlc-area-low', '#cc0088');
    el.style.setProperty('--fc-hlc-area-fill', '#cccccc');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['hlc-area']?.highLineColor).toBe('#00cc88');
    expect(seriesDefaults['hlc-area']?.lowLineColor).toBe('#cc0088');
    expect(seriesDefaults['hlc-area']?.fillColor).toBe('#cccccc');
    document.body.removeChild(el);
  });

  it('reads high-low up/down colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-high-low-up', '#33ee33');
    el.style.setProperty('--fc-high-low-down', '#ee3333');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['high-low']?.upColor).toBe('#33ee33');
    expect(seriesDefaults['high-low']?.downColor).toBe('#ee3333');
    document.body.removeChild(el);
  });

  it('reads column up/down colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-column-up', '#44dd44');
    el.style.setProperty('--fc-column-down', '#dd4444');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.column?.upColor).toBe('#44dd44');
    expect(seriesDefaults.column?.downColor).toBe('#dd4444');
    document.body.removeChild(el);
  });

  it('reads volume-candle up/down/wick colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-volume-candle-up', '#55cc55');
    el.style.setProperty('--fc-volume-candle-down', '#cc5555');
    el.style.setProperty('--fc-volume-candle-wick-up', '#aaccaa');
    el.style.setProperty('--fc-volume-candle-wick-down', '#ccaaaa');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['volume-candle']?.upColor).toBe('#55cc55');
    expect(seriesDefaults['volume-candle']?.downColor).toBe('#cc5555');
    expect(seriesDefaults['volume-candle']?.wickUpColor).toBe('#aaccaa');
    expect(seriesDefaults['volume-candle']?.wickDownColor).toBe('#ccaaaa');
    document.body.removeChild(el);
  });

  it('reads baseline-delta-mountain top/bottom line and fill colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-bdm-top-line', '#00bb00');
    el.style.setProperty('--fc-bdm-top-fill', '#aabbaa');
    el.style.setProperty('--fc-bdm-bottom-line', '#bb0000');
    el.style.setProperty('--fc-bdm-bottom-fill', '#bbaaaa');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['baseline-delta-mountain']?.topLineColor).toBe('#00bb00');
    expect(seriesDefaults['baseline-delta-mountain']?.topFillColor).toBe('#aabbaa');
    expect(seriesDefaults['baseline-delta-mountain']?.bottomLineColor).toBe('#bb0000');
    expect(seriesDefaults['baseline-delta-mountain']?.bottomFillColor).toBe('#bbaaaa');
    document.body.removeChild(el);
  });

  it('reads renko up/down colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-renko-up', '#11aa11');
    el.style.setProperty('--fc-renko-down', '#aa1111');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.renko?.upColor).toBe('#11aa11');
    expect(seriesDefaults.renko?.downColor).toBe('#aa1111');
    document.body.removeChild(el);
  });

  it('reads kagi yang/yin colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-kagi-yang', '#22bb22');
    el.style.setProperty('--fc-kagi-yin', '#bb2222');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.kagi?.yangColor).toBe('#22bb22');
    expect(seriesDefaults.kagi?.yinColor).toBe('#bb2222');
    document.body.removeChild(el);
  });

  it('reads line-break up/down colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-line-break-up', '#33cc33');
    el.style.setProperty('--fc-line-break-down', '#cc3333');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['line-break']?.upColor).toBe('#33cc33');
    expect(seriesDefaults['line-break']?.downColor).toBe('#cc3333');
    document.body.removeChild(el);
  });

  it('reads point-figure up/down colors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-point-figure-up', '#44dd44');
    el.style.setProperty('--fc-point-figure-down', '#dd4444');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults['point-figure']?.upColor).toBe('#44dd44');
    expect(seriesDefaults['point-figure']?.downColor).toBe('#dd4444');
    document.body.removeChild(el);
  });

  it('reads band-fill color', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-band-fill', '#eeeeee');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.bandFill?.color).toBe('#eeeeee');
    document.body.removeChild(el);
  });

  it('reads volume up/down colors into chartOptions', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-volume-up', '#00ee00');
    el.style.setProperty('--fc-volume-down', '#ee0000');

    const { chartOptions } = readCSSTheme(el);
    expect(chartOptions.volume?.upColor).toBe('#00ee00');
    expect(chartOptions.volume?.downColor).toBe('#ee0000');
    document.body.removeChild(el);
  });

  it('reads watermark color into chartOptions', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-watermark-color', '#cccccc');

    const { chartOptions } = readCSSTheme(el);
    expect(chartOptions.watermark?.color).toBe('#cccccc');
    document.body.removeChild(el);
  });

  it('reads grid colors into chartOptions', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-grid-horz-color', '#dddddd');
    el.style.setProperty('--fc-grid-vert-color', '#eeeeee');

    const { chartOptions } = readCSSTheme(el);
    expect(chartOptions.grid?.horzLinesColor).toBe('#dddddd');
    expect(chartOptions.grid?.vertLinesColor).toBe('#eeeeee');
    document.body.removeChild(el);
  });

  it('reads crosshair colors into chartOptions', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-crosshair-vert-color', '#111111');
    el.style.setProperty('--fc-crosshair-horz-color', '#222222');

    const { chartOptions } = readCSSTheme(el);
    expect(chartOptions.crosshair?.vertLineColor).toBe('#111111');
    expect(chartOptions.crosshair?.horzLineColor).toBe('#222222');
    document.body.removeChild(el);
  });

  it('reads font size as a number into chartOptions.layout.fontSize', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-font-size', '14px');

    const { chartOptions } = readCSSTheme(el);
    expect(chartOptions.layout?.fontSize).toBe(14);
    document.body.removeChild(el);
  });

  it('returns both chartOptions and seriesDefaults keys', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const result = readCSSTheme(el);
    expect(result).toHaveProperty('chartOptions');
    expect(result).toHaveProperty('seriesDefaults');
    document.body.removeChild(el);
  });
});
