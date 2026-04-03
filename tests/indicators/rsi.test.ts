import { describe, it, expect } from 'vitest';
import { computeRSI } from '@/indicators/rsi';

describe('computeRSI', () => {
  const arr = (values: number[]) => new Float64Array(values);

  it('returns NaN for indices 0 through period-1, valid at period', () => {
    const close = arr([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    const result = computeRSI(close, 11, 5);
    // indices 0 through period-1 are NaN
    for (let i = 0; i < 5; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
    // index period (5) should be the first valid RSI
    expect(isNaN(result[5])).toBe(false);
  });

  it('all RSI values are between 0 and 100', () => {
    const close = arr([44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.15, 43.61, 44.33, 44.83, 45.10, 45.15, 43.61, 44.33]);
    const result = computeRSI(close, 15, 5);
    // Valid values start at index period (5)
    for (let i = 5; i < 15; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(100);
    }
  });

  it('RSI = 100 for monotonically increasing prices', () => {
    // All gains, no losses → RSI = 100
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    const result = computeRSI(close, 15, 5);
    // After initial period, all RSI should be 100
    for (let i = 5; i < 15; i++) {
      expect(result[i]).toBeCloseTo(100);
    }
  });

  it('RSI = 0 for monotonically decreasing prices', () => {
    // All losses, no gains → RSI = 0
    const close = arr([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    const result = computeRSI(close, 15, 5);
    // After initial period, all RSI should be 0
    for (let i = 5; i < 15; i++) {
      expect(result[i]).toBeCloseTo(0);
    }
  });

  it('returns Float64Array of correct length', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeRSI(close, 10, 5);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(10);
  });

  it('length <= period returns all NaN', () => {
    const close = arr([1, 2, 3]);
    const result = computeRSI(close, 3, 5);
    for (let i = 0; i < 3; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('Wilder smoothing produces values in valid range for mixed data', () => {
    const close = arr([44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.15,
                       43.61, 44.33, 44.83, 45.10, 45.15, 46.0, 44.5]);
    const result = computeRSI(close, 15, 14);
    // Only result[14] should be valid
    expect(isNaN(result[14])).toBe(false);
    expect(result[14]).toBeGreaterThanOrEqual(0);
    expect(result[14]).toBeLessThanOrEqual(100);
  });
});
