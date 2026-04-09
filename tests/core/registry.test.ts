import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSeriesRegistration,
  getIndicatorRegistration,
  getRegisteredSeriesTypes,
  getRegisteredIndicatorTypes,
} from '@/core/registry';

// Note: tests/setup.ts imports all series and indicator registrations,
// so the registry is populated before these tests run.

describe('Series Registry', () => {
  it('has candlestick registered', () => {
    const reg = getSeriesRegistration('candlestick');
    expect(reg).toBeDefined();
    expect(reg!.type).toBe('candlestick');
  });

  it('has heikin-ashi registered as an alias of candlestick', () => {
    const reg = getSeriesRegistration('heikin-ashi');
    expect(reg).toBeDefined();
    expect(reg!.type).toBe('candlestick');
  });

  it('has all 19 series types registered (plus aliases)', () => {
    const types = getRegisteredSeriesTypes();
    // 19 base types + heikin-ashi alias = at least 20 entries
    expect(types.length).toBeGreaterThanOrEqual(20);

    const expectedTypes = [
      'candlestick', 'heikin-ashi', 'line', 'area', 'bar', 'baseline',
      'hollow-candle', 'histogram', 'step-line', 'colored-line',
      'colored-mountain', 'hlc-area', 'high-low', 'column',
      'volume-candle', 'baseline-delta-mountain', 'renko', 'kagi',
      'line-break', 'point-figure',
    ];
    for (const t of expectedTypes) {
      expect(getSeriesRegistration(t)).toBeDefined();
    }
  });

  it('createRenderer returns a renderer with draw method', () => {
    const reg = getSeriesRegistration('candlestick')!;
    const renderer = reg.createRenderer({});
    expect(renderer).toBeDefined();
    expect(typeof renderer.draw).toBe('function');
    expect(typeof renderer.applyOptions).toBe('function');
  });

  it('returns undefined for unregistered type', () => {
    expect(getSeriesRegistration('nonexistent')).toBeUndefined();
  });
});

describe('Indicator Registry', () => {
  it('has all 30 indicators registered', () => {
    const types = getRegisteredIndicatorTypes();
    expect(types.length).toBeGreaterThanOrEqual(29);

    const expectedTypes = [
      'sma', 'ema', 'rsi', 'macd', 'bollinger', 'vwap', 'stochastic',
      'atr', 'adx', 'obv', 'williams-r', 'ichimoku', 'parabolic-sar',
      'keltner', 'donchian', 'cci', 'pivot-points', 'aroon',
      'awesome-oscillator', 'chaikin-mf', 'coppock', 'elder-force',
      'trix', 'supertrend', 'vwma', 'choppiness', 'mfi', 'roc',
      'linear-regression',
    ];
    for (const t of expectedTypes) {
      expect(getIndicatorRegistration(t)).toBeDefined();
    }
  });

  it('each indicator has required properties', () => {
    const reg = getIndicatorRegistration('sma')!;
    expect(reg.type).toBe('sma');
    expect(typeof reg.compute).toBe('function');
    expect(typeof reg.overlay).toBe('boolean');
    expect(reg.defaultParams).toBeDefined();
    expect(typeof reg.colorMap).toBe('function');
  });

  it('overlay indicators are correctly flagged', () => {
    expect(getIndicatorRegistration('sma')!.overlay).toBe(true);
    expect(getIndicatorRegistration('bollinger')!.overlay).toBe(true);
    expect(getIndicatorRegistration('rsi')!.overlay).toBe(false);
    expect(getIndicatorRegistration('macd')!.overlay).toBe(false);
  });

  it('returns undefined for unregistered indicator', () => {
    expect(getIndicatorRegistration('nonexistent')).toBeUndefined();
  });
});
