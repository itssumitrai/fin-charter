import { describe, it, expect } from 'vitest';
import { allIndicators } from '@/indicators/registrations';

// Create a small mock ColumnStore with realistic OHLCV data
function makeStore(length: number) {
  const store = {
    time: new Float64Array(length),
    open: new Float64Array(length),
    high: new Float64Array(length),
    low: new Float64Array(length),
    close: new Float64Array(length),
    volume: new Float64Array(length),
    length,
    capacity: length,
  };
  for (let i = 0; i < length; i++) {
    store.time[i] = 1700000000 + i * 86400;
    store.open[i] = 100 + Math.sin(i * 0.1) * 10;
    store.high[i] = store.open[i] + 5;
    store.low[i] = store.open[i] - 5;
    store.close[i] = 100 + Math.sin(i * 0.1 + 0.05) * 10;
    store.volume[i] = 1000000;
  }
  return store;
}

describe('Indicator Registrations compute()', () => {
  const store = makeStore(100);

  for (const reg of allIndicators) {
    it(`${reg.type} computes without throwing`, () => {
      const result = reg.compute(store, reg.defaultParams);
      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThan(0);
      for (const key of Object.keys(result)) {
        expect(result[key]).toBeInstanceOf(Float64Array);
      }
    });
  }

  it('all 29 indicators are registered', () => {
    expect(allIndicators.length).toBe(29);
  });

  it('each indicator has a type string', () => {
    for (const reg of allIndicators) {
      expect(typeof reg.type).toBe('string');
      expect(reg.type.length).toBeGreaterThan(0);
    }
  });

  it('each indicator has defaultParams as object', () => {
    for (const reg of allIndicators) {
      expect(typeof reg.defaultParams).toBe('object');
    }
  });

  it('each indicator has overlay as boolean', () => {
    for (const reg of allIndicators) {
      expect(typeof reg.overlay).toBe('boolean');
    }
  });

  it('each indicator colorMap returns object with string values', () => {
    for (const reg of allIndicators) {
      const colors = reg.colorMap('#2962ff');
      expect(typeof colors).toBe('object');
      for (const val of Object.values(colors)) {
        expect(typeof val).toBe('string');
      }
    }
  });

  it('colorMap output keys match compute output keys', () => {
    for (const reg of allIndicators) {
      const result = reg.compute(store, reg.defaultParams);
      const colors = reg.colorMap('#2962ff');
      const resultKeys = Object.keys(result).sort();
      const colorKeys = Object.keys(colors).sort();
      expect(resultKeys).toEqual(colorKeys);
    }
  });

  it('compute results have same length as store', () => {
    for (const reg of allIndicators) {
      const result = reg.compute(store, reg.defaultParams);
      for (const arr of Object.values(result)) {
        expect(arr.length).toBe(store.length);
      }
    }
  });
});

describe('Individual indicator types', () => {
  const store = makeStore(100);

  it('sma returns a single "value" key', () => {
    const sma = allIndicators.find(r => r.type === 'sma')!;
    const result = sma.compute(store, { period: 20 });
    expect(Object.keys(result)).toEqual(['value']);
  });

  it('ema returns a single "value" key', () => {
    const ema = allIndicators.find(r => r.type === 'ema')!;
    const result = ema.compute(store, { period: 20 });
    expect(Object.keys(result)).toEqual(['value']);
  });

  it('rsi returns a single "value" key', () => {
    const rsi = allIndicators.find(r => r.type === 'rsi')!;
    const result = rsi.compute(store, { period: 14 });
    expect(Object.keys(result)).toEqual(['value']);
  });

  it('macd returns macd, signal, histogram keys', () => {
    const macd = allIndicators.find(r => r.type === 'macd')!;
    const result = macd.compute(store, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
    expect(Object.keys(result).sort()).toEqual(['histogram', 'macd', 'signal']);
  });

  it('bollinger returns upper, middle, lower keys', () => {
    const bollinger = allIndicators.find(r => r.type === 'bollinger')!;
    const result = bollinger.compute(store, { period: 20, stdDev: 2 });
    expect(Object.keys(result).sort()).toEqual(['lower', 'middle', 'upper']);
  });

  it('vwap returns a single "value" key', () => {
    const vwap = allIndicators.find(r => r.type === 'vwap')!;
    const result = vwap.compute(store, {});
    expect(Object.keys(result)).toEqual(['value']);
  });

  it('stochastic returns k and d keys', () => {
    const stochastic = allIndicators.find(r => r.type === 'stochastic')!;
    const result = stochastic.compute(store, { kPeriod: 14, dPeriod: 3 });
    expect(Object.keys(result).sort()).toEqual(['d', 'k']);
  });

  it('adx returns adx, plusDI, minusDI keys', () => {
    const adx = allIndicators.find(r => r.type === 'adx')!;
    const result = adx.compute(store, { period: 14 });
    expect(Object.keys(result).sort()).toEqual(['adx', 'minusDI', 'plusDI']);
  });

  it('ichimoku returns tenkan, kijun, senkouA, senkouB, chikou keys', () => {
    const ichimoku = allIndicators.find(r => r.type === 'ichimoku')!;
    const result = ichimoku.compute(store, { tenkanPeriod: 9, kijunPeriod: 26, senkouPeriod: 52 });
    expect(Object.keys(result).sort()).toEqual(['chikou', 'kijun', 'senkouA', 'senkouB', 'tenkan']);
  });

  it('pivot-points returns pp, r1, r2, r3, s1, s2, s3 keys', () => {
    const pp = allIndicators.find(r => r.type === 'pivot-points')!;
    const result = pp.compute(store, {});
    expect(Object.keys(result).sort()).toEqual(['pp', 'r1', 'r2', 'r3', 's1', 's2', 's3']);
  });

  it('supertrend returns "value" key', () => {
    const supertrend = allIndicators.find(r => r.type === 'supertrend')!;
    const result = supertrend.compute(store, { period: 10, multiplier: 3 });
    expect(Object.keys(result)).toEqual(['value']);
  });

  it('trix returns trix and signal keys', () => {
    const trix = allIndicators.find(r => r.type === 'trix')!;
    const result = trix.compute(store, { period: 15, signalPeriod: 9 });
    expect(Object.keys(result).sort()).toEqual(['signal', 'trix']);
  });
});
