import { describe, it, expect } from 'vitest';
import { computeBollinger } from '@/indicators/bollinger';
import { computeSMA } from '@/indicators/sma';

describe('computeBollinger', () => {
  const arr = (values: number[]) => new Float64Array(values);

  it('returns three Float64Arrays of correct length', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeBollinger(close, 10, 3, 2);
    expect(result.upper).toBeInstanceOf(Float64Array);
    expect(result.middle).toBeInstanceOf(Float64Array);
    expect(result.lower).toBeInstanceOf(Float64Array);
    expect(result.upper.length).toBe(10);
    expect(result.middle.length).toBe(10);
    expect(result.lower.length).toBe(10);
  });

  it('NaN for indices before period-1', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeBollinger(close, 10, 3, 2);
    expect(isNaN(result.upper[0])).toBe(true);
    expect(isNaN(result.upper[1])).toBe(true);
    expect(isNaN(result.middle[0])).toBe(true);
    expect(isNaN(result.middle[1])).toBe(true);
    expect(isNaN(result.lower[0])).toBe(true);
    expect(isNaN(result.lower[1])).toBe(true);
  });

  it('middle band equals SMA', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeBollinger(close, 10, 3, 2);
    const sma = computeSMA(close, 10, 3);
    for (let i = 0; i < 10; i++) {
      if (isNaN(sma[i])) {
        expect(isNaN(result.middle[i])).toBe(true);
      } else {
        expect(result.middle[i]).toBeCloseTo(sma[i]);
      }
    }
  });

  it('upper > middle > lower at all valid indices', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeBollinger(close, 10, 3, 2);
    for (let i = 2; i < 10; i++) {
      expect(result.upper[i]).toBeGreaterThan(result.middle[i]);
      expect(result.middle[i]).toBeGreaterThan(result.lower[i]);
    }
  });

  it('symmetric bands: upper - middle = middle - lower', () => {
    const close = arr([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    const result = computeBollinger(close, 10, 4, 2);
    for (let i = 3; i < 10; i++) {
      const upperDist = result.upper[i] - result.middle[i];
      const lowerDist = result.middle[i] - result.lower[i];
      expect(upperDist).toBeCloseTo(lowerDist, 10);
    }
  });

  it('std dev multiplier scales band width', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result1 = computeBollinger(close, 10, 3, 1);
    const result2 = computeBollinger(close, 10, 3, 2);
    // Width at stdDev=2 should be twice the width at stdDev=1
    for (let i = 2; i < 10; i++) {
      const width1 = result1.upper[i] - result1.lower[i];
      const width2 = result2.upper[i] - result2.lower[i];
      expect(width2).toBeCloseTo(2 * width1, 10);
    }
  });

  it('period > length returns all NaN', () => {
    const close = arr([1, 2, 3]);
    const result = computeBollinger(close, 3, 5, 2);
    for (let i = 0; i < 3; i++) {
      expect(isNaN(result.upper[i])).toBe(true);
      expect(isNaN(result.lower[i])).toBe(true);
    }
  });

  it('constant prices produce zero std dev, upper = middle = lower', () => {
    const close = arr([5, 5, 5, 5, 5, 5]);
    const result = computeBollinger(close, 6, 3, 2);
    for (let i = 2; i < 6; i++) {
      expect(result.upper[i]).toBeCloseTo(result.middle[i]);
      expect(result.lower[i]).toBeCloseTo(result.middle[i]);
    }
  });
});
