import { describe, it, expect } from 'vitest';
import { computeVWAP } from '@/indicators/vwap';

describe('computeVWAP', () => {
  const arr = (...nums: number[]) => new Float64Array(nums);

  it('returns a Float64Array of correct length', () => {
    const high   = arr(12, 13, 14);
    const low    = arr(10, 11, 12);
    const close  = arr(11, 12, 13);
    const volume = arr(100, 200, 300);
    const result = computeVWAP(high, low, close, volume, 3);

    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(3);
  });

  it('computes cumulative volume-weighted average of typical price', () => {
    const high   = arr(12, 15, 18);
    const low    = arr(10, 11, 14);
    const close  = arr(11, 13, 16);
    const volume = arr(100, 200, 300);

    // Typical prices: (12+10+11)/3=11, (15+11+13)/3=13, (18+14+16)/3=16
    // Bar 0: cumTPV=11*100=1100, cumVol=100 => 11
    // Bar 1: cumTPV=1100+13*200=3700, cumVol=300 => 12.333...
    // Bar 2: cumTPV=3700+16*300=8500, cumVol=600 => 14.1666...
    const result = computeVWAP(high, low, close, volume, 3);

    expect(result[0]).toBeCloseTo(11);
    expect(result[1]).toBeCloseTo(3700 / 300);
    expect(result[2]).toBeCloseTo(8500 / 600);
  });

  it('returns NaN when cumulative volume is zero', () => {
    const high   = arr(12, 13, 14);
    const low    = arr(10, 11, 12);
    const close  = arr(11, 12, 13);
    const volume = arr(0, 0, 0);
    const result = computeVWAP(high, low, close, volume, 3);

    for (let i = 0; i < 3; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('VWAP equals typical price when all bars have the same price', () => {
    const high   = arr(50, 50, 50, 50);
    const low    = arr(50, 50, 50, 50);
    const close  = arr(50, 50, 50, 50);
    const volume = arr(100, 200, 150, 300);
    const result = computeVWAP(high, low, close, volume, 4);

    for (let i = 0; i < 4; i++) {
      expect(result[i]).toBeCloseTo(50);
    }
  });

  it('handles empty data', () => {
    const result = computeVWAP(
      new Float64Array(0),
      new Float64Array(0),
      new Float64Array(0),
      new Float64Array(0),
      0
    );
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(0);
  });

  it('first NaN then valid once volume appears', () => {
    const high   = arr(10, 12, 14);
    const low    = arr(8,  10, 12);
    const close  = arr(9,  11, 13);
    const volume = arr(0,  100, 200);
    const result = computeVWAP(high, low, close, volume, 3);

    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(false);
    expect(isNaN(result[2])).toBe(false);
  });
});
