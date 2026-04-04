import { describe, it, expect } from 'vitest';
import { computeOBV } from '@/indicators/obv';

describe('computeOBV', () => {
  const arr = (...nums: number[]) => new Float64Array(nums);

  it('returns a Float64Array of correct length', () => {
    const close  = arr(10, 11, 12);
    const volume = arr(100, 200, 300);
    const result = computeOBV(close, volume, 3);

    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(3);
  });

  it('first value is 0', () => {
    const close  = arr(10, 11, 12);
    const volume = arr(100, 200, 300);
    const result = computeOBV(close, volume, 3);

    expect(result[0]).toBe(0);
  });

  it('adds volume on up close', () => {
    const close  = arr(10, 12, 15);
    const volume = arr(100, 200, 300);
    const result = computeOBV(close, volume, 3);

    // Bar 1: close up => 0 + 200 = 200
    expect(result[1]).toBeCloseTo(200);
    // Bar 2: close up => 200 + 300 = 500
    expect(result[2]).toBeCloseTo(500);
  });

  it('subtracts volume on down close', () => {
    const close  = arr(15, 12, 10);
    const volume = arr(100, 200, 300);
    const result = computeOBV(close, volume, 3);

    // Bar 1: close down => 0 - 200 = -200
    expect(result[1]).toBeCloseTo(-200);
    // Bar 2: close down => -200 - 300 = -500
    expect(result[2]).toBeCloseTo(-500);
  });

  it('OBV unchanged on flat close', () => {
    const close  = arr(10, 10, 10, 10);
    const volume = arr(100, 200, 300, 400);
    const result = computeOBV(close, volume, 4);

    for (let i = 0; i < 4; i++) {
      expect(result[i]).toBeCloseTo(0);
    }
  });

  it('handles mixed up/down/flat correctly', () => {
    const close  = arr(10, 12, 12, 9, 11);
    const volume = arr(100, 200, 300, 400, 500);
    const result = computeOBV(close, volume, 5);

    // Bar 0: 0
    // Bar 1: up => 0 + 200 = 200
    // Bar 2: flat => 200
    // Bar 3: down => 200 - 400 = -200
    // Bar 4: up => -200 + 500 = 300
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(200);
    expect(result[2]).toBeCloseTo(200);
    expect(result[3]).toBeCloseTo(-200);
    expect(result[4]).toBeCloseTo(300);
  });
});
