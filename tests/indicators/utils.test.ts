import { describe, it, expect } from 'vitest';
import { slidingMax, slidingMin } from '../../src/indicators/utils';

describe('slidingMax', () => {
  it('returns NaN for indices before period-1', () => {
    const data = new Float64Array([1, 3, 2, 5, 4]);
    const result = slidingMax(data, 5, 3);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBe(3);
  });

  it('computes correct sliding maximum', () => {
    const data = new Float64Array([1, 3, 2, 5, 4, 1, 6]);
    const result = slidingMax(data, 7, 3);
    expect(result[2]).toBe(3);
    expect(result[3]).toBe(5);
    expect(result[4]).toBe(5);
    expect(result[5]).toBe(5);
    expect(result[6]).toBe(6);
  });

  it('handles single-element period', () => {
    const data = new Float64Array([3, 1, 4, 1, 5]);
    const result = slidingMax(data, 5, 1);
    expect(result[0]).toBe(3);
    expect(result[1]).toBe(1);
    expect(result[4]).toBe(5);
  });

  it('handles empty array', () => {
    const data = new Float64Array(0);
    const result = slidingMax(data, 0, 3);
    expect(result.length).toBe(0);
  });
});

describe('slidingMin', () => {
  it('computes correct sliding minimum', () => {
    const data = new Float64Array([5, 3, 4, 1, 2, 6, 0]);
    const result = slidingMin(data, 7, 3);
    expect(result[2]).toBe(3);
    expect(result[3]).toBe(1);
    expect(result[4]).toBe(1);
    expect(result[5]).toBe(1);
    expect(result[6]).toBe(0);
  });
});
