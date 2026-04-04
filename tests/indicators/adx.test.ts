import { describe, it, expect } from 'vitest';
import { computeADX } from '@/indicators/adx';

describe('computeADX', () => {
  const arr = (...nums: number[]) => new Float64Array(nums);

  it('returns an object with adx, plusDI, minusDI as Float64Arrays of correct length', () => {
    const high  = arr(12, 13, 14, 15, 16, 17, 18, 19, 20, 21);
    const low   = arr(10, 11, 12, 13, 14, 15, 16, 17, 18, 19);
    const close = arr(11, 12, 13, 14, 15, 16, 17, 18, 19, 20);
    const result = computeADX(high, low, close, 10, 3);

    expect(result.adx).toBeInstanceOf(Float64Array);
    expect(result.plusDI).toBeInstanceOf(Float64Array);
    expect(result.minusDI).toBeInstanceOf(Float64Array);
    expect(result.adx.length).toBe(10);
    expect(result.plusDI.length).toBe(10);
    expect(result.minusDI.length).toBe(10);
  });

  it('DI values are NaN for [0, period-1]', () => {
    const high  = arr(12, 13, 14, 15, 16, 17, 18, 19, 20, 21);
    const low   = arr(10, 11, 12, 13, 14, 15, 16, 17, 18, 19);
    const close = arr(11, 12, 13, 14, 15, 16, 17, 18, 19, 20);
    const period = 3;
    const result = computeADX(high, low, close, 10, period);

    for (let i = 0; i < period; i++) {
      expect(isNaN(result.plusDI[i])).toBe(true);
      expect(isNaN(result.minusDI[i])).toBe(true);
    }
    // First valid DI at index period
    expect(isNaN(result.plusDI[period])).toBe(false);
    expect(isNaN(result.minusDI[period])).toBe(false);
  });

  it('ADX values are NaN for [0, 2*period-2] and valid at 2*period-1', () => {
    const high  = arr(12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23);
    const low   = arr(10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21);
    const close = arr(11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22);
    const period = 3;
    const result = computeADX(high, low, close, 12, period);

    // ADX NaN for indices before 2*period-1
    for (let i = 0; i < 2 * period - 1; i++) {
      expect(isNaN(result.adx[i])).toBe(true);
    }
    // First valid ADX at index 2*period-1
    expect(isNaN(result.adx[2 * period - 1])).toBe(false);
  });

  it('ADX and DI values are bounded between 0 and 100', () => {
    // Generate longer trending data
    const len = 30;
    const high = new Float64Array(len);
    const low = new Float64Array(len);
    const close = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      high[i] = 100 + i * 2 + 1;
      low[i] = 100 + i * 2 - 1;
      close[i] = 100 + i * 2;
    }
    const period = 5;
    const result = computeADX(high, low, close, len, period);

    for (let i = period; i < len; i++) {
      expect(result.plusDI[i]).toBeGreaterThanOrEqual(0);
      expect(result.plusDI[i]).toBeLessThanOrEqual(100);
      expect(result.minusDI[i]).toBeGreaterThanOrEqual(0);
      expect(result.minusDI[i]).toBeLessThanOrEqual(100);
    }
    for (let i = 2 * period; i < len; i++) {
      expect(result.adx[i]).toBeGreaterThanOrEqual(0);
      expect(result.adx[i]).toBeLessThanOrEqual(100);
    }
  });

  it('trending data produces high ADX', () => {
    // Strong uptrend: highs and lows consistently increase
    const len = 30;
    const high = new Float64Array(len);
    const low = new Float64Array(len);
    const close = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      high[i] = 50 + i * 3;
      low[i] = 48 + i * 3;
      close[i] = 49 + i * 3;
    }
    const period = 5;
    const result = computeADX(high, low, close, len, period);

    // ADX should be well above 25 for a strong trend
    const lastADX = result.adx[len - 1];
    expect(lastADX).toBeGreaterThan(25);
  });

  it('period > length returns all NaN', () => {
    const high  = arr(12, 13, 14);
    const low   = arr(10, 11, 12);
    const close = arr(11, 12, 13);
    const result = computeADX(high, low, close, 3, 5);

    for (let i = 0; i < 3; i++) {
      expect(isNaN(result.adx[i])).toBe(true);
      expect(isNaN(result.plusDI[i])).toBe(true);
      expect(isNaN(result.minusDI[i])).toBe(true);
    }
  });
});
