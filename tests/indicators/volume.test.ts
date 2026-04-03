import { describe, it, expect } from 'vitest';
import { computeVolume } from '@/indicators/volume';

describe('computeVolume', () => {
  const arr = (values: number[]) => new Float64Array(values);

  it('passes through all values', () => {
    const volume = arr([100, 200, 300, 400, 500]);
    const result = computeVolume(volume, 5);
    expect(result[0]).toBe(100);
    expect(result[1]).toBe(200);
    expect(result[2]).toBe(300);
    expect(result[3]).toBe(400);
    expect(result[4]).toBe(500);
  });

  it('returns a new Float64Array (not the same reference)', () => {
    const volume = arr([1, 2, 3]);
    const result = computeVolume(volume, 3);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result).not.toBe(volume);
  });

  it('returns array of correct length', () => {
    const volume = arr([10, 20, 30, 40, 50]);
    const result = computeVolume(volume, 5);
    expect(result.length).toBe(5);
  });

  it('handles empty array', () => {
    const volume = new Float64Array(0);
    const result = computeVolume(volume, 0);
    expect(result.length).toBe(0);
  });

  it('handles single element', () => {
    const volume = arr([42]);
    const result = computeVolume(volume, 1);
    expect(result[0]).toBe(42);
  });

  it('works with zero volume values', () => {
    const volume = arr([0, 0, 0, 100, 0]);
    const result = computeVolume(volume, 5);
    expect(result[0]).toBe(0);
    expect(result[3]).toBe(100);
    expect(result[4]).toBe(0);
  });

  it('preserves large values accurately', () => {
    const volume = arr([1_000_000, 9_999_999, 12_345_678]);
    const result = computeVolume(volume, 3);
    expect(result[0]).toBe(1_000_000);
    expect(result[1]).toBe(9_999_999);
    expect(result[2]).toBe(12_345_678);
  });
});
