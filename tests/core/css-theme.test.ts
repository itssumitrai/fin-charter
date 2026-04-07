import { describe, it, expect } from 'vitest';
import { CSS_VARS, generateCSSTheme, applyCSSTheme, readCSSTheme } from '@/core/css-theme';
import { DARK_THEME, LIGHT_THEME } from '@/api/options';

describe('CSS_VARS', () => {
  it('all variable names are prefixed with --fc-', () => {
    for (const value of Object.values(CSS_VARS)) {
      expect(value).toMatch(/^--fc-/);
    }
  });
});

describe('generateCSSTheme', () => {
  it('generates CSS string from dark theme', () => {
    const css = generateCSSTheme(DARK_THEME);
    expect(css).toContain('--fc-bg: #1a1a2e');
    expect(css).toContain('--fc-text: #d1d4dc');
    expect(css).toContain('--fc-crosshair-vert-color: #758696');
  });

  it('generates CSS string from light theme', () => {
    const css = generateCSSTheme(LIGHT_THEME);
    expect(css).toContain('--fc-bg: #ffffff');
    expect(css).toContain('--fc-text: #333333');
  });

  it('returns empty string for empty options', () => {
    const css = generateCSSTheme({});
    expect(css).toBe('');
  });

  it('includes only provided properties', () => {
    const css = generateCSSTheme({ layout: { backgroundColor: '#000' } });
    expect(css).toContain('--fc-bg: #000');
    expect(css).not.toContain('--fc-text');
  });
});

describe('applyCSSTheme', () => {
  it('sets CSS custom properties on element', () => {
    const el = document.createElement('div');
    applyCSSTheme(el, DARK_THEME);
    expect(el.style.getPropertyValue('--fc-bg')).toBe('#1a1a2e');
    expect(el.style.getPropertyValue('--fc-text')).toBe('#d1d4dc');
  });

  it('sets grid properties', () => {
    const el = document.createElement('div');
    applyCSSTheme(el, {
      grid: { horzLinesColor: 'red', vertLinesColor: 'blue' },
    });
    expect(el.style.getPropertyValue('--fc-grid-horz-color')).toBe('red');
    expect(el.style.getPropertyValue('--fc-grid-vert-color')).toBe('blue');
  });

  it('does not set properties for undefined values', () => {
    const el = document.createElement('div');
    applyCSSTheme(el, {});
    expect(el.style.getPropertyValue('--fc-bg')).toBe('');
  });
});

describe('readCSSTheme', () => {
  it('reads back properties set via applyCSSTheme', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    applyCSSTheme(el, DARK_THEME);

    const { chartOptions } = readCSSTheme(el);
    expect(chartOptions.layout?.backgroundColor).toBe('#1a1a2e');
    expect(chartOptions.layout?.textColor).toBe('#d1d4dc');

    document.body.removeChild(el);
  });

  it('returns empty options when no properties set', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const { chartOptions } = readCSSTheme(el);
    expect(chartOptions.layout).toBeUndefined();
    expect(chartOptions.grid).toBeUndefined();

    document.body.removeChild(el);
  });

  it('returns empty seriesDefaults when no series vars set', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.candlestick).toBeUndefined();
    expect(seriesDefaults.bar).toBeUndefined();

    document.body.removeChild(el);
  });

  it('reads candlestick body/wick/border vars', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-candle-body-up', '#26a69a');
    el.style.setProperty('--fc-candle-body-down', '#ef5350');
    el.style.setProperty('--fc-candle-wick-up', '#aaaaaa');
    el.style.setProperty('--fc-candle-wick-down', '#bbbbbb');
    el.style.setProperty('--fc-candle-border-up', '#00ff00');
    el.style.setProperty('--fc-candle-border-down', '#ff0000');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.candlestick?.upColor).toBe('#26a69a');
    expect(seriesDefaults.candlestick?.downColor).toBe('#ef5350');
    expect(seriesDefaults.candlestick?.wickUpColor).toBe('#aaaaaa');
    expect(seriesDefaults.candlestick?.wickDownColor).toBe('#bbbbbb');
    expect(seriesDefaults.candlestick?.borderUpColor).toBe('#00ff00');
    expect(seriesDefaults.candlestick?.borderDownColor).toBe('#ff0000');

    document.body.removeChild(el);
  });

  it('falls back to legacy --fc-candle-up/down when specific body vars not set', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-candle-up', '#111111');
    el.style.setProperty('--fc-candle-down', '#222222');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.candlestick?.upColor).toBe('#111111');
    expect(seriesDefaults.candlestick?.downColor).toBe('#222222');

    document.body.removeChild(el);
  });

  it('specific candle body var takes priority over legacy alias', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-candle-body-up', '#specific');
    el.style.setProperty('--fc-candle-up', '#legacy');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.candlestick?.upColor).toBe('#specific');

    document.body.removeChild(el);
  });

  it('reads bar up/down vars', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-bar-up', '#33cc33');
    el.style.setProperty('--fc-bar-down', '#cc3333');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.bar?.upColor).toBe('#33cc33');
    expect(seriesDefaults.bar?.downColor).toBe('#cc3333');

    document.body.removeChild(el);
  });

  it('reads last price up/down vars', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-last-price-up', '#00cc00');
    el.style.setProperty('--fc-last-price-down', '#cc0000');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.lastPriceLine?.upColor).toBe('#00cc00');
    expect(seriesDefaults.lastPriceLine?.downColor).toBe('#cc0000');

    document.body.removeChild(el);
  });
});
