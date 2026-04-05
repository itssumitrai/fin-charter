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

    const theme = readCSSTheme(el);
    expect(theme.layout?.backgroundColor).toBe('#1a1a2e');
    expect(theme.layout?.textColor).toBe('#d1d4dc');

    document.body.removeChild(el);
  });

  it('returns empty options when no properties set', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const theme = readCSSTheme(el);
    expect(theme.layout).toBeUndefined();
    expect(theme.grid).toBeUndefined();

    document.body.removeChild(el);
  });
});
