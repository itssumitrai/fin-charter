import { describe, it, expect } from 'vitest';
import { computeStochastic } from '@/indicators/stochastic';

describe('computeStochastic', () => {
  const arr = (...nums: number[]) => new Float64Array(nums);

  it('returns an object with k and d as Float64Arrays of correct length', () => {
    const high  = arr(12, 13, 14, 15, 16, 17, 18, 19, 20, 21);
    const low   = arr(10, 11, 12, 13, 14, 15, 16, 17, 18, 19);
    const close = arr(11, 12, 13, 14, 15, 16, 17, 18, 19, 20);
    const result = computeStochastic(high, low, close, 10, 5, 3);

    expect(result.k).toBeInstanceOf(Float64Array);
    expect(result.d).toBeInstanceOf(Float64Array);
    expect(result.k.length).toBe(10);
    expect(result.d.length).toBe(10);
  });

  it('K is NaN for [0, kPeriod-2] and valid at kPeriod-1', () => {
    const high  = arr(12, 13, 14, 15, 16, 17, 18, 19, 20, 21);
    const low   = arr(10, 11, 12, 13, 14, 15, 16, 17, 18, 19);
    const close = arr(11, 12, 13, 14, 15, 16, 17, 18, 19, 20);
    const kPeriod = 5;
    const result = computeStochastic(high, low, close, 10, kPeriod, 3);

    for (let i = 0; i < kPeriod - 1; i++) {
      expect(isNaN(result.k[i])).toBe(true);
    }
    expect(isNaN(result.k[kPeriod - 1])).toBe(false);
  });

  it('D is NaN for [0, kPeriod+dPeriod-3] and valid at kPeriod+dPeriod-2', () => {
    const high  = arr(12, 13, 14, 15, 16, 17, 18, 19, 20, 21);
    const low   = arr(10, 11, 12, 13, 14, 15, 16, 17, 18, 19);
    const close = arr(11, 12, 13, 14, 15, 16, 17, 18, 19, 20);
    const kPeriod = 5;
    const dPeriod = 3;
    const dStart = kPeriod + dPeriod - 2; // 6
    const result = computeStochastic(high, low, close, 10, kPeriod, dPeriod);

    for (let i = 0; i < dStart; i++) {
      expect(isNaN(result.d[i])).toBe(true);
    }
    expect(isNaN(result.d[dStart])).toBe(false);
  });

  it('K and D values are bounded between 0 and 100', () => {
    const len = 20;
    const high = new Float64Array(len);
    const low = new Float64Array(len);
    const close = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      high[i] = 50 + Math.sin(i) * 10;
      low[i] = 40 + Math.sin(i) * 10;
      close[i] = 45 + Math.sin(i) * 10;
    }
    const kPeriod = 5;
    const dPeriod = 3;
    const result = computeStochastic(high, low, close, len, kPeriod, dPeriod);

    for (let i = kPeriod - 1; i < len; i++) {
      expect(result.k[i]).toBeGreaterThanOrEqual(0);
      expect(result.k[i]).toBeLessThanOrEqual(100);
    }
    const dStart = kPeriod + dPeriod - 2;
    for (let i = dStart; i < len; i++) {
      expect(result.d[i]).toBeGreaterThanOrEqual(0);
      expect(result.d[i]).toBeLessThanOrEqual(100);
    }
  });

  it('computes correct K with known values', () => {
    // kPeriod=3: K = (close - lowestLow) / (highestHigh - lowestLow) * 100
    // Bars: H=[10,12,11], L=[8,9,7], C=[9,11,10]
    // At i=2 (kPeriod-1): HH=12, LL=7, K = (10-7)/(12-7)*100 = 60
    const high  = arr(10, 12, 11);
    const low   = arr(8,  9,  7);
    const close = arr(9,  11, 10);
    const result = computeStochastic(high, low, close, 3, 3, 1);

    expect(result.k[2]).toBeCloseTo(60);
  });

  it('K is 0 when range is zero (high == low for all bars)', () => {
    const high  = arr(50, 50, 50, 50, 50);
    const low   = arr(50, 50, 50, 50, 50);
    const close = arr(50, 50, 50, 50, 50);
    const result = computeStochastic(high, low, close, 5, 3, 1);

    for (let i = 2; i < 5; i++) {
      expect(result.k[i]).toBeCloseTo(0);
    }
  });
});
