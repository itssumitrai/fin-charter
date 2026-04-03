import { describe, it, expect } from 'vitest';
import { computeEMA } from '@/indicators/ema';

describe('computeEMA', () => {
  const arr = (values: number[]) => new Float64Array(values);

  it('returns NaN for indices before period-1', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7]);
    const result = computeEMA(close, 7, 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
  });

  it('first EMA value equals SMA of first period values', () => {
    // period=3, k=0.5
    const close = arr([1, 2, 3, 4, 5, 6, 7]);
    const result = computeEMA(close, 7, 3);
    // First EMA at index 2 = avg(1,2,3) = 2
    expect(result[2]).toBeCloseTo(2);
  });

  it('subsequent values apply EMA formula with k=0.5 (period=3)', () => {
    // k = 2/(3+1) = 0.5
    const close = arr([1, 2, 3, 4, 5, 6, 7]);
    const result = computeEMA(close, 7, 3);
    const k = 0.5;

    // result[2] = 2 (SMA)
    // result[3] = 4 * 0.5 + 2 * 0.5 = 3
    expect(result[3]).toBeCloseTo(4 * k + result[2] * (1 - k));
    // result[4] = 5 * 0.5 + result[3] * 0.5
    expect(result[4]).toBeCloseTo(5 * k + result[3] * (1 - k));
    // result[5] = 6 * 0.5 + result[4] * 0.5
    expect(result[5]).toBeCloseTo(6 * k + result[4] * (1 - k));
    // result[6] = 7 * 0.5 + result[5] * 0.5
    expect(result[6]).toBeCloseTo(7 * k + result[5] * (1 - k));
  });

  it('period greater than length returns all NaN', () => {
    const close = arr([1, 2]);
    const result = computeEMA(close, 2, 5);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
  });

  it('returns Float64Array of correct length', () => {
    const close = arr([1, 2, 3, 4, 5]);
    const result = computeEMA(close, 5, 3);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(5);
  });

  it('EMA(1) equals input', () => {
    // k = 2/2 = 1, each value equals close[i]
    const close = arr([5, 10, 15, 20]);
    const result = computeEMA(close, 4, 1);
    expect(result[0]).toBeCloseTo(5);
    expect(result[1]).toBeCloseTo(10);
    expect(result[2]).toBeCloseTo(15);
    expect(result[3]).toBeCloseTo(20);
  });

  it('NaN only before period-1, not at period-1', () => {
    const close = arr([2, 4, 6, 8, 10]);
    const result = computeEMA(close, 5, 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
    expect(isNaN(result[2])).toBe(false);
    expect(result[2]).toBeCloseTo(4); // avg(2,4,6) = 4
  });
});
