import { describe, it, expect } from 'vitest';
import { computeSMA } from '@/indicators/sma';

describe('computeSMA', () => {
  // Helper to make a Float64Array from an array
  const arr = (values: number[]) => new Float64Array(values);

  it('returns NaN for indices before period-1', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeSMA(close, 10, 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
  });

  it('SMA(3) on [1..10] produces correct values', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeSMA(close, 10, 3);

    // indices 0,1 are NaN
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);

    // result[2] = avg(1,2,3) = 2
    expect(result[2]).toBeCloseTo(2);
    // result[3] = avg(2,3,4) = 3
    expect(result[3]).toBeCloseTo(3);
    // result[4] = avg(3,4,5) = 4
    expect(result[4]).toBeCloseTo(4);
    // result[9] = avg(8,9,10) = 9
    expect(result[9]).toBeCloseTo(9);
  });

  it('period equals length returns single value', () => {
    const close = arr([1, 2, 3, 4, 5]);
    const result = computeSMA(close, 5, 5);

    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
    expect(isNaN(result[2])).toBe(true);
    expect(isNaN(result[3])).toBe(true);
    // Only last index is valid
    expect(result[4]).toBeCloseTo(3); // avg(1,2,3,4,5) = 3
  });

  it('period greater than length returns all NaN', () => {
    const close = arr([1, 2, 3]);
    const result = computeSMA(close, 3, 5);

    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
    expect(isNaN(result[2])).toBe(true);
  });

  it('returns Float64Array of correct length', () => {
    const close = arr([1, 2, 3, 4, 5]);
    const result = computeSMA(close, 5, 3);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(5);
  });

  it('SMA(1) equals input', () => {
    const close = arr([5, 10, 15, 20]);
    const result = computeSMA(close, 4, 1);
    expect(result[0]).toBeCloseTo(5);
    expect(result[1]).toBeCloseTo(10);
    expect(result[2]).toBeCloseTo(15);
    expect(result[3]).toBeCloseTo(20);
  });
});
