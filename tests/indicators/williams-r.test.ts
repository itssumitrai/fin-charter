import { describe, it, expect } from 'vitest';
import { computeWilliamsR } from '@/indicators/williams-r';

describe('computeWilliamsR', () => {
  const arr = (...nums: number[]) => new Float64Array(nums);

  it('returns a Float64Array of correct length', () => {
    const high  = arr(12, 13, 14, 15, 16);
    const low   = arr(10, 11, 12, 13, 14);
    const close = arr(11, 12, 13, 14, 15);
    const result = computeWilliamsR(high, low, close, 5, 3);

    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(5);
  });

  it('NaN for [0, period-2] and valid at period-1', () => {
    const high  = arr(12, 13, 14, 15, 16);
    const low   = arr(10, 11, 12, 13, 14);
    const close = arr(11, 12, 13, 14, 15);
    const period = 3;
    const result = computeWilliamsR(high, low, close, 5, period);

    for (let i = 0; i < period - 1; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
    expect(isNaN(result[period - 1])).toBe(false);
  });

  it('values are bounded between -100 and 0', () => {
    const len = 20;
    const high = new Float64Array(len);
    const low = new Float64Array(len);
    const close = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      high[i] = 50 + Math.sin(i) * 10;
      low[i] = 40 + Math.sin(i) * 10;
      close[i] = 45 + Math.sin(i) * 10;
    }
    const period = 5;
    const result = computeWilliamsR(high, low, close, len, period);

    for (let i = period - 1; i < len; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(-100);
      expect(result[i]).toBeLessThanOrEqual(0);
    }
  });

  it('computes correct value with known data', () => {
    // period=3, bars: H=[10,15,12], L=[5,8,7], C=[_,_,11]
    // At i=2: HH=15, LL=5, WR = (15-11)/(15-5)*(-100) = -40
    const high  = arr(10, 15, 12);
    const low   = arr(5,  8,  7);
    const close = arr(8,  13, 11);
    const result = computeWilliamsR(high, low, close, 3, 3);

    expect(result[2]).toBeCloseTo(-40);
  });

  it('returns 0 when close equals highest high', () => {
    // close at the top of the range => WR = 0
    const high  = arr(10, 12, 15);
    const low   = arr(8,  9,  11);
    const close = arr(9,  11, 15);
    const result = computeWilliamsR(high, low, close, 3, 3);

    expect(result[2]).toBeCloseTo(0);
  });

  it('returns -100 when close equals lowest low', () => {
    // close at the bottom of the range => WR = -100
    const high  = arr(10, 12, 15);
    const low   = arr(8,  9,  11);
    const close = arr(9,  11, 8);
    const result = computeWilliamsR(high, low, close, 3, 3);

    expect(result[2]).toBeCloseTo(-100);
  });

  it('returns 0 when range is zero (high == low)', () => {
    const high  = arr(50, 50, 50);
    const low   = arr(50, 50, 50);
    const close = arr(50, 50, 50);
    const result = computeWilliamsR(high, low, close, 3, 3);

    expect(result[2]).toBeCloseTo(0);
  });
});
