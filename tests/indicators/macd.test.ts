import { describe, it, expect } from 'vitest';
import { computeMACD } from '@/indicators/macd';

describe('computeMACD', () => {
  const arr = (values: number[]) => new Float64Array(values);

  // Generate a longer data set for MACD testing (12,26,9)
  const generateClose = (n: number): Float64Array => {
    const data = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      data[i] = 100 + Math.sin(i * 0.3) * 10 + i * 0.1;
    }
    return data;
  };

  it('returns three Float64Arrays of correct length', () => {
    const close = generateClose(50);
    const result = computeMACD(close, 50, 12, 26, 9);
    expect(result.macd).toBeInstanceOf(Float64Array);
    expect(result.signal).toBeInstanceOf(Float64Array);
    expect(result.histogram).toBeInstanceOf(Float64Array);
    expect(result.macd.length).toBe(50);
    expect(result.signal.length).toBe(50);
    expect(result.histogram.length).toBe(50);
  });

  it('MACD is NaN before slow period-1', () => {
    const close = generateClose(50);
    const result = computeMACD(close, 50, 12, 26, 9);
    // Before slowPeriod-1 = 25, MACD is NaN
    for (let i = 0; i < 25; i++) {
      expect(isNaN(result.macd[i])).toBe(true);
    }
  });

  it('MACD is valid at and after slow period-1', () => {
    const close = generateClose(50);
    const result = computeMACD(close, 50, 12, 26, 9);
    expect(isNaN(result.macd[25])).toBe(false);
  });

  it('signal is NaN before first signal index', () => {
    const close = generateClose(50);
    // fastPeriod=12, slowPeriod=26, signalPeriod=9
    // firstSignalIdx = 26-1 + 9-1 = 33
    const result = computeMACD(close, 50, 12, 26, 9);
    for (let i = 0; i < 33; i++) {
      expect(isNaN(result.signal[i])).toBe(true);
    }
  });

  it('histogram = MACD - signal at all valid indices', () => {
    const close = generateClose(50);
    const result = computeMACD(close, 50, 12, 26, 9);
    for (let i = 33; i < 50; i++) {
      expect(result.histogram[i]).toBeCloseTo(result.macd[i] - result.signal[i], 10);
    }
  });

  it('returns NaN histogram where signal is NaN', () => {
    const close = generateClose(50);
    const result = computeMACD(close, 50, 12, 26, 9);
    for (let i = 0; i < 33; i++) {
      expect(isNaN(result.histogram[i])).toBe(true);
    }
  });

  it('handles data shorter than slow period', () => {
    const close = arr([1, 2, 3, 4, 5]);
    const result = computeMACD(close, 5, 3, 10, 3);
    // All MACD should be NaN since length < slowPeriod
    for (let i = 0; i < 5; i++) {
      expect(isNaN(result.macd[i])).toBe(true);
    }
  });
});
