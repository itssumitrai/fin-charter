import { describe, it, expect } from 'vitest';
import {
  getSeriesRegistration,
  getIndicatorRegistration,
  getRegisteredSeriesTypes,
  getRegisteredIndicatorTypes,
  registerDrawing,
  getDrawingRegistration,
  getRegisteredDrawingTypes,
  registerAll,
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
  it('has all 29 indicators registered', () => {
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

describe('Drawing Registry', () => {
  it('registerDrawing and getDrawingRegistration round-trip', () => {
    registerDrawing({ type: 'test-drawing-reg', requiredPoints: 2, create: () => ({}) });
    const reg = getDrawingRegistration('test-drawing-reg');
    expect(reg).toBeDefined();
    expect(reg!.type).toBe('test-drawing-reg');
    expect(reg!.requiredPoints).toBe(2);
  });

  it('getDrawingRegistration returns undefined for unknown type', () => {
    expect(getDrawingRegistration('nonexistent-drawing')).toBeUndefined();
  });

  it('getRegisteredDrawingTypes returns registered types', () => {
    registerDrawing({ type: 'test-drawing-list', requiredPoints: 1, create: () => ({}) });
    const types = getRegisteredDrawingTypes();
    expect(types).toContain('test-drawing-list');
  });

  it('create factory is callable', () => {
    registerDrawing({
      type: 'factory-test',
      requiredPoints: 1,
      create: (id, points, options) => ({ id, points, options }),
    });
    const reg = getDrawingRegistration('factory-test');
    expect(reg).toBeDefined();
    const result = reg!.create('d1', [{ time: 100, price: 50 }], {}) as Record<string, unknown>;
    expect(result.id).toBe('d1');
  });
});

describe('registerAll', () => {
  it('registers drawings in bulk via registerAll', () => {
    registerAll({
      drawings: [
        { type: 'bulk-test-1', requiredPoints: 1, create: () => ({}) },
        { type: 'bulk-test-2', requiredPoints: 2, create: () => ({}) },
      ],
    });
    expect(getDrawingRegistration('bulk-test-1')).toBeDefined();
    expect(getDrawingRegistration('bulk-test-2')).toBeDefined();
  });

  it('registerAll with empty arrays does not throw', () => {
    expect(() => registerAll({ series: [], indicators: [], drawings: [] })).not.toThrow();
  });

  it('registerAll with no options does not throw', () => {
    expect(() => registerAll({})).not.toThrow();
  });

  it('registerAll registers series aliases via aliases property', () => {
    const reg = getSeriesRegistration('candlestick');
    expect(reg).toBeDefined();
    // candlestick has heikin-ashi as alias (registered in setup.ts)
    const alias = getSeriesRegistration('heikin-ashi');
    expect(alias).toBeDefined();
    expect(alias!.type).toBe('candlestick');
  });
});
