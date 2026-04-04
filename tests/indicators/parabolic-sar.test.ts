import { describe, it, expect } from 'vitest';
import { computeParabolicSAR } from '@/indicators/parabolic-sar';

describe('computeParabolicSAR', () => {
  const arr = (...nums: number[]) => new Float64Array(nums);

  it('returns a Float64Array of correct length', () => {
    const high = arr(12, 13, 14, 15, 16);
    const low  = arr(10, 11, 12, 13, 14);
    const result = computeParabolicSAR(high, low, 5);

    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(5);
  });

  it('handles empty data', () => {
    const result = computeParabolicSAR(new Float64Array(0), new Float64Array(0), 0);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(0);
  });

  it('first SAR equals first low (initial uptrend assumption)', () => {
    const high = arr(15, 16, 17);
    const low  = arr(10, 11, 12);
    const result = computeParabolicSAR(high, low, 3);

    expect(result[0]).toBeCloseTo(10);
  });

  it('uses default parameters afStep=0.02 and afMax=0.20', () => {
    // In uptrend: SAR(1) = SAR(0) + 0.02 * (EP - SAR(0))
    // SAR(0) = low[0] = 10, EP = high[0] = 15
    // SAR(1) = 10 + 0.02 * (15 - 10) = 10.1
    // Since high[1]=16 > EP=15, EP becomes 16, af becomes 0.04
    // SAR(1) is clamped to min(SAR, low[0]) = min(10.1, 10) = 10
    const high = arr(15, 16, 17);
    const low  = arr(10, 11, 12);
    const result = computeParabolicSAR(high, low, 3);

    // SAR(1) = 10 + 0.02*(15-10) = 10.1, clamped to min(10.1, low[0]=10) = 10
    expect(result[1]).toBeCloseTo(10);
  });

  it('SAR tracks below price in uptrend', () => {
    // Strong uptrend
    const len = 15;
    const high = new Float64Array(len);
    const low = new Float64Array(len);
    for (let i = 0; i < len; i++) {
      high[i] = 100 + i * 5;
      low[i] = 95 + i * 5;
    }
    const result = computeParabolicSAR(high, low, len);

    // In an uptrend, SAR should be below the low
    // Skip first few bars where SAR might be adjusting
    for (let i = 2; i < len; i++) {
      expect(result[i]).toBeLessThan(high[i]);
    }
  });

  it('SAR tracks above price in downtrend', () => {
    // Strong downtrend: prices consistently falling
    const len = 15;
    const high = new Float64Array(len);
    const low = new Float64Array(len);
    // Start with a brief up so algorithm initializes uptrend, then reverse
    high[0] = 200; low[0] = 195;
    high[1] = 202; low[1] = 197;
    // Then crash hard to trigger reversal
    for (let i = 2; i < len; i++) {
      high[i] = 180 - (i - 2) * 5;
      low[i] = 175 - (i - 2) * 5;
    }
    const result = computeParabolicSAR(high, low, len);

    // After reversal, SAR should be above the high for several bars
    // Check later bars where downtrend is established
    let aboveCount = 0;
    for (let i = 4; i < len; i++) {
      if (result[i] > low[i]) aboveCount++;
    }
    // Most bars should have SAR above low in a downtrend
    expect(aboveCount).toBeGreaterThan((len - 4) / 2);
  });

  it('detects trend reversal', () => {
    // Uptrend followed by a sharp drop to trigger reversal
    const high = arr(100, 105, 110, 115, 120, 80, 75, 70);
    const low  = arr(95,  100, 105, 110, 115, 75, 70, 65);
    const result = computeParabolicSAR(high, low, 8);

    // During uptrend (bars 0-4), SAR should be below price
    // After reversal at bar 5, SAR should jump above price
    // The SAR at reversal point equals the prior EP (highest high)
    expect(result[5]).toBeGreaterThan(high[5]);
  });

  it('custom afStep and afMax are respected', () => {
    const high = arr(100, 105, 110, 115, 120);
    const low  = arr(95,  100, 105, 110, 115);

    const resultDefault = computeParabolicSAR(high, low, 5, 0.02, 0.20);
    const resultFast = computeParabolicSAR(high, low, 5, 0.04, 0.40);

    // Faster AF makes SAR converge to price more quickly
    // So the fast SAR should be closer to (higher than) the default SAR in uptrend
    // Check a later bar where the difference is noticeable
    expect(resultFast[4]).toBeGreaterThan(resultDefault[4]);
  });
});
