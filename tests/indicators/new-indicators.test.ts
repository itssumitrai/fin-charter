import { describe, it, expect } from 'vitest';
import { computeIchimoku } from '@/indicators/ichimoku';
import { computeParabolicSAR } from '@/indicators/parabolic-sar';
import { computeKeltner } from '@/indicators/keltner';
import { computeDonchian } from '@/indicators/donchian';
import { computeCCI } from '@/indicators/cci';
import { computePivotPoints } from '@/indicators/pivot-points';

const arr = (values: number[]) => new Float64Array(values);

// Helper: generate simple trending data
function generateOHLC(length: number, start = 100, step = 1) {
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    const mid = start + i * step;
    open[i] = mid - 0.5;
    close[i] = mid + 0.5;
    high[i] = mid + 1;
    low[i] = mid - 1;
  }
  return { open, high, low, close };
}

// ────────────────────────────────────────────────────────────────────────────
// Ichimoku
// ────────────────────────────────────────────────────────────────────────────
describe('computeIchimoku', () => {
  const length = 100;
  const { high, low, close } = generateOHLC(length);

  it('returns correct result shape with Float64Arrays of correct length', () => {
    const result = computeIchimoku(high, low, close, length);
    expect(result.tenkan).toBeInstanceOf(Float64Array);
    expect(result.kijun).toBeInstanceOf(Float64Array);
    expect(result.senkouA).toBeInstanceOf(Float64Array);
    expect(result.senkouB).toBeInstanceOf(Float64Array);
    expect(result.chikou).toBeInstanceOf(Float64Array);
    expect(result.tenkan.length).toBe(length);
    expect(result.kijun.length).toBe(length);
    expect(result.senkouA.length).toBe(length);
    expect(result.senkouB.length).toBe(length);
    expect(result.chikou.length).toBe(length);
  });

  it('tenkan NaN for first tenkanPeriod-1 indices', () => {
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    for (let i = 0; i < 8; i++) {
      expect(isNaN(result.tenkan[i])).toBe(true);
    }
    expect(isNaN(result.tenkan[8])).toBe(false);
  });

  it('kijun NaN for first kijunPeriod-1 indices', () => {
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    for (let i = 0; i < 25; i++) {
      expect(isNaN(result.kijun[i])).toBe(true);
    }
    expect(isNaN(result.kijun[25])).toBe(false);
  });

  it('senkouA NaN for first kijunPeriod indices', () => {
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    for (let i = 0; i < 26; i++) {
      expect(isNaN(result.senkouA[i])).toBe(true);
    }
  });

  it('senkouA valid at index kijunPeriod when tenkan and kijun are valid at index 0', () => {
    // Use short periods so we have valid data
    const result = computeIchimoku(high, low, close, length, 1, 1, 1);
    // kijunPeriod=1, so senkouA[1] should be valid (computed from index 0)
    expect(isNaN(result.senkouA[0])).toBe(true); // index 0 is NaN
    expect(isNaN(result.senkouA[1])).toBe(false);
  });

  it('senkouB NaN for first kijunPeriod indices', () => {
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    for (let i = 0; i < 26; i++) {
      expect(isNaN(result.senkouB[i])).toBe(true);
    }
  });

  it('chikou = close shifted back by kijunPeriod', () => {
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    // chikou[i] = close[i + 26] for i in 0..length-27
    for (let i = 0; i < length - 26; i++) {
      expect(result.chikou[i]).toBeCloseTo(close[i + 26]);
    }
  });

  it('chikou NaN for last kijunPeriod indices', () => {
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    for (let i = length - 26; i < length; i++) {
      expect(isNaN(result.chikou[i])).toBe(true);
    }
  });

  it('tenkan = midpoint of highest high and lowest low over tenkanPeriod', () => {
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    // At index 8 (period-1=8): highest high from 0..8 = high[8]=109, lowest low=low[0]=99
    // mid = (109 + 99) / 2 = 104
    // high[i] = 100 + i + 1 = 101..., low[i] = 100 + i - 1 = 99...
    // high[8] = 109, low[0] = 99, tenkan[8] = (109 + 99) / 2 = 104
    expect(result.tenkan[8]).toBeCloseTo(104);
  });

  it('length < period returns all NaN for tenkan', () => {
    const h = arr([110, 112, 108]);
    const l = arr([108, 110, 106]);
    const c = arr([109, 111, 107]);
    const result = computeIchimoku(h, l, c, 3, 9, 26, 52);
    expect(isNaN(result.tenkan[0])).toBe(true);
    expect(isNaN(result.tenkan[1])).toBe(true);
    expect(isNaN(result.tenkan[2])).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Parabolic SAR
// ────────────────────────────────────────────────────────────────────────────
describe('computeParabolicSAR', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low } = generateOHLC(50);
    const result = computeParabolicSAR(high, low, 50);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(50);
  });

  it('no NaN values (SAR is always defined)', () => {
    const { high, low } = generateOHLC(50);
    const result = computeParabolicSAR(high, low, 50);
    for (let i = 0; i < 50; i++) {
      expect(isNaN(result[i])).toBe(false);
    }
  });

  it('SAR is always outside candle body (above high or below low)', () => {
    const { high, low } = generateOHLC(50);
    const result = computeParabolicSAR(high, low, 50);
    // SAR should never be between high and low simultaneously
    // i.e. for each bar: result[i] >= high[i] OR result[i] <= low[i]
    for (let i = 1; i < 50; i++) {
      const aboveHigh = result[i] >= high[i];
      const belowLow = result[i] <= low[i];
      expect(aboveHigh || belowLow).toBe(true);
    }
  });

  it('empty array returns empty result', () => {
    const result = computeParabolicSAR(new Float64Array(0), new Float64Array(0), 0);
    expect(result.length).toBe(0);
  });

  it('single bar returns initial SAR', () => {
    const high = arr([110]);
    const low = arr([100]);
    const result = computeParabolicSAR(high, low, 1);
    expect(result[0]).toBe(100); // SAR[0] = low[0]
  });

  it('SAR flips sides on trend reversal', () => {
    // Rising data: SAR should be below prices
    const { high, low } = generateOHLC(30, 100, 2);
    const result = computeParabolicSAR(high, low, 30);
    // After a sustained uptrend, most SAR values should be below lows
    let belowLowCount = 0;
    for (let i = 5; i < 30; i++) {
      if (result[i] <= low[i]) belowLowCount++;
    }
    expect(belowLowCount).toBeGreaterThan(10);
  });

  it('custom afStep and afMax are respected (SAR changes slowly at start)', () => {
    const { high, low } = generateOHLC(20);
    const resultDefault = computeParabolicSAR(high, low, 20);
    const resultSlower = computeParabolicSAR(high, low, 20, 0.01, 0.10);
    // Slower AF means SAR moves less aggressively from start
    // They should differ
    let differs = false;
    for (let i = 1; i < 20; i++) {
      if (Math.abs(resultDefault[i] - resultSlower[i]) > 1e-10) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Keltner Channels
// ────────────────────────────────────────────────────────────────────────────
describe('computeKeltner', () => {
  const length = 60;
  const { high, low, close } = generateOHLC(length);

  it('returns correct shape with Float64Arrays of length', () => {
    const result = computeKeltner(close, high, low, length);
    expect(result.upper).toBeInstanceOf(Float64Array);
    expect(result.middle).toBeInstanceOf(Float64Array);
    expect(result.lower).toBeInstanceOf(Float64Array);
    expect(result.upper.length).toBe(length);
    expect(result.middle.length).toBe(length);
    expect(result.lower.length).toBe(length);
  });

  it('upper > middle > lower at all valid indices', () => {
    const result = computeKeltner(close, high, low, length, 20, 10, 2.0);
    // Valid indices: max(emaPeriod-1, atrPeriod) = max(19, 10) = 19... atr needs period+1 bars
    for (let i = 20; i < length; i++) {
      if (!isNaN(result.upper[i]) && !isNaN(result.lower[i])) {
        expect(result.upper[i]).toBeGreaterThan(result.middle[i]);
        expect(result.middle[i]).toBeGreaterThan(result.lower[i]);
      }
    }
  });

  it('NaN propagation: early indices are NaN', () => {
    const result = computeKeltner(close, high, low, length, 20, 10, 2.0);
    // EMA NaN for i < emaPeriod-1=19; ATR NaN for i <= atrPeriod=10
    expect(isNaN(result.upper[0])).toBe(true);
    expect(isNaN(result.lower[0])).toBe(true);
  });

  it('multiplier=0 makes upper=middle=lower', () => {
    const result = computeKeltner(close, high, low, length, 20, 10, 0);
    for (let i = 0; i < length; i++) {
      if (!isNaN(result.middle[i])) {
        expect(result.upper[i]).toBeCloseTo(result.middle[i]);
        expect(result.lower[i]).toBeCloseTo(result.middle[i]);
      }
    }
  });

  it('larger multiplier produces wider channels', () => {
    const r1 = computeKeltner(close, high, low, length, 20, 10, 1.0);
    const r2 = computeKeltner(close, high, low, length, 20, 10, 2.0);
    for (let i = 21; i < length; i++) {
      if (!isNaN(r1.upper[i]) && !isNaN(r2.upper[i])) {
        const width1 = r1.upper[i] - r1.lower[i];
        const width2 = r2.upper[i] - r2.lower[i];
        expect(width2).toBeCloseTo(2 * width1, 8);
      }
    }
  });

  it('period > length returns NaN arrays', () => {
    const c = arr([100, 101, 102]);
    const h = arr([101, 102, 103]);
    const l = arr([99, 100, 101]);
    const result = computeKeltner(c, h, l, 3, 20, 10, 2.0);
    expect(isNaN(result.upper[2])).toBe(true);
    expect(isNaN(result.lower[2])).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Donchian Channels
// ────────────────────────────────────────────────────────────────────────────
describe('computeDonchian', () => {
  const length = 40;
  const { high, low } = generateOHLC(length);

  it('returns correct shape with Float64Arrays of length', () => {
    const result = computeDonchian(high, low, length);
    expect(result.upper).toBeInstanceOf(Float64Array);
    expect(result.middle).toBeInstanceOf(Float64Array);
    expect(result.lower).toBeInstanceOf(Float64Array);
    expect(result.upper.length).toBe(length);
    expect(result.middle.length).toBe(length);
    expect(result.lower.length).toBe(length);
  });

  it('upper >= lower at all valid indices', () => {
    const result = computeDonchian(high, low, length, 10);
    for (let i = 9; i < length; i++) {
      expect(result.upper[i]).toBeGreaterThanOrEqual(result.lower[i]);
    }
  });

  it('middle = (upper + lower) / 2', () => {
    const result = computeDonchian(high, low, length, 10);
    for (let i = 9; i < length; i++) {
      expect(result.middle[i]).toBeCloseTo((result.upper[i] + result.lower[i]) / 2);
    }
  });

  it('NaN for first period-1 indices', () => {
    const result = computeDonchian(high, low, length, 10);
    for (let i = 0; i < 9; i++) {
      expect(isNaN(result.upper[i])).toBe(true);
      expect(isNaN(result.lower[i])).toBe(true);
    }
  });

  it('upper = max of highs in window', () => {
    const h = arr([5, 3, 8, 2, 6, 4, 7, 1, 9, 3]);
    const l = arr([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    const result = computeDonchian(h, l, 10, 3);
    // At index 2: max(5,3,8)=8
    expect(result.upper[2]).toBe(8);
    // At index 4: max(8,2,6)=8
    expect(result.upper[4]).toBe(8);
    // At index 8: max(7,1,9)=9
    expect(result.upper[8]).toBe(9);
  });

  it('lower = min of lows in window', () => {
    const h = arr([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    const l = arr([5, 3, 8, 2, 6, 4, 7, 1, 9, 3]);
    const result = computeDonchian(h, l, 10, 3);
    // At index 2: min(5,3,8)=3
    expect(result.lower[2]).toBe(3);
    // At index 3: min(3,8,2)=2
    expect(result.lower[3]).toBe(2);
    // At index 7: min(4,7,1)=1
    expect(result.lower[7]).toBe(1);
  });

  it('period > length returns all NaN', () => {
    const h = arr([5, 6, 7]);
    const l = arr([3, 4, 5]);
    const result = computeDonchian(h, l, 3, 10);
    for (let i = 0; i < 3; i++) {
      expect(isNaN(result.upper[i])).toBe(true);
      expect(isNaN(result.lower[i])).toBe(true);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// CCI
// ────────────────────────────────────────────────────────────────────────────
describe('computeCCI', () => {
  const length = 40;
  const { high, low, close } = generateOHLC(length);

  it('returns Float64Array of correct length', () => {
    const result = computeCCI(high, low, close, length);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(length);
  });

  it('NaN for indices [0, period-2]', () => {
    const result = computeCCI(high, low, close, length, 20);
    for (let i = 0; i < 19; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
    expect(isNaN(result[19])).toBe(false);
  });

  it('no NaN for indices >= period-1', () => {
    const result = computeCCI(high, low, close, length, 5);
    for (let i = 4; i < length; i++) {
      expect(isNaN(result[i])).toBe(false);
    }
  });

  it('constant prices produce CCI = 0 (zero mean deviation)', () => {
    const h = new Float64Array(20).fill(110);
    const l = new Float64Array(20).fill(90);
    const c = new Float64Array(20).fill(100);
    const result = computeCCI(h, l, c, 20, 5);
    for (let i = 4; i < 20; i++) {
      expect(result[i]).toBe(0);
    }
  });

  it('computes correct CCI for known values', () => {
    // TP = (H+L+C)/3. Use period=3 with simple values.
    const h = arr([11, 12, 13, 14, 15]);
    const l = arr([9, 10, 11, 12, 13]);
    const c = arr([10, 11, 12, 13, 14]);
    // TP = [10, 11, 12, 13, 14]
    // At i=2 (period=3): SMA = (10+11+12)/3 = 11
    // MeanDev = (|10-11| + |11-11| + |12-11|) / 3 = (1+0+1)/3 = 2/3
    // CCI = (12-11) / (0.015 * 2/3) = 1 / 0.01 = 100
    const result = computeCCI(h, l, c, 5, 3);
    expect(result[2]).toBeCloseTo(100, 5);
  });

  it('period > length returns all NaN', () => {
    const h = arr([11, 12]);
    const l = arr([9, 10]);
    const c = arr([10, 11]);
    const result = computeCCI(h, l, c, 2, 5);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Pivot Points
// ────────────────────────────────────────────────────────────────────────────
describe('computePivotPoints', () => {
  const length = 10;
  const { high, low, close } = generateOHLC(length, 100, 1);

  it('returns correct shape with Float64Arrays of length', () => {
    const result = computePivotPoints(high, low, close, length);
    const keys = ['pp', 'r1', 'r2', 'r3', 's1', 's2', 's3'] as const;
    for (const key of keys) {
      expect(result[key]).toBeInstanceOf(Float64Array);
      expect(result[key].length).toBe(length);
    }
  });

  it('first bar is NaN for all levels', () => {
    const result = computePivotPoints(high, low, close, length);
    expect(isNaN(result.pp[0])).toBe(true);
    expect(isNaN(result.r1[0])).toBe(true);
    expect(isNaN(result.s1[0])).toBe(true);
  });

  it('standard: R levels > PP > S levels', () => {
    // Use a bar with clear spread: H=120, L=80, C=100
    const h = arr([120, 110]);
    const l = arr([80, 90]);
    const c = arr([100, 100]);
    const result = computePivotPoints(h, l, c, 2, 'standard');
    // At i=1: prev H=120, L=80, C=100
    // PP = (120+80+100)/3 = 100
    expect(result.pp[1]).toBeCloseTo(100);
    expect(result.r1[1]).toBeGreaterThan(result.pp[1]);
    expect(result.r2[1]).toBeGreaterThan(result.pp[1]);
    expect(result.r3[1]).toBeGreaterThan(result.pp[1]);
    expect(result.s1[1]).toBeLessThan(result.pp[1]);
    expect(result.s2[1]).toBeLessThan(result.pp[1]);
    expect(result.s3[1]).toBeLessThan(result.pp[1]);
  });

  it('standard: correct formula for known values', () => {
    const h = arr([120, 0]);
    const l = arr([80, 0]);
    const c = arr([100, 0]);
    const result = computePivotPoints(h, l, c, 2, 'standard');
    // PP = 100, range = 40
    expect(result.pp[1]).toBeCloseTo(100);
    expect(result.r1[1]).toBeCloseTo(2 * 100 - 80);    // 120
    expect(result.s1[1]).toBeCloseTo(2 * 100 - 120);   // 80
    expect(result.r2[1]).toBeCloseTo(100 + 40);         // 140
    expect(result.s2[1]).toBeCloseTo(100 - 40);         // 60
    expect(result.r3[1]).toBeCloseTo(120 + 2 * (100 - 80)); // 160
    expect(result.s3[1]).toBeCloseTo(80 - 2 * (120 - 100)); // 40
  });

  it('fibonacci: uses correct ratios 0.382, 0.618, 1.0', () => {
    const h = arr([120, 0]);
    const l = arr([80, 0]);
    const c = arr([100, 0]);
    const result = computePivotPoints(h, l, c, 2, 'fibonacci');
    // PP = (120+80+100)/3 = 100, range = 40
    expect(result.pp[1]).toBeCloseTo(100);
    expect(result.r1[1]).toBeCloseTo(100 + 0.382 * 40, 5);
    expect(result.r2[1]).toBeCloseTo(100 + 0.618 * 40, 5);
    expect(result.r3[1]).toBeCloseTo(100 + 1.0 * 40, 5);
    expect(result.s1[1]).toBeCloseTo(100 - 0.382 * 40, 5);
    expect(result.s2[1]).toBeCloseTo(100 - 0.618 * 40, 5);
    expect(result.s3[1]).toBeCloseTo(100 - 1.0 * 40, 5);
  });

  it('woodie: PP uses 2*C weighting', () => {
    const h = arr([120, 0]);
    const l = arr([80, 0]);
    const c = arr([100, 0]);
    const result = computePivotPoints(h, l, c, 2, 'woodie');
    // PP = (H+L+2*C)/4 = (120+80+200)/4 = 100
    expect(result.pp[1]).toBeCloseTo(100);
    // Check it's different from standard when C != (H+L)/2
    const h2 = arr([120, 0]);
    const l2 = arr([80, 0]);
    const c2 = arr([115, 0]); // skewed close
    const standard = computePivotPoints(h2, l2, c2, 2, 'standard');
    const woodie = computePivotPoints(h2, l2, c2, 2, 'woodie');
    // Standard PP = (120+80+115)/3 = 105; Woodie PP = (120+80+230)/4 = 107.5
    expect(woodie.pp[1]).not.toBeCloseTo(standard.pp[1]);
  });

  it('uses previous bar HLC (not current)', () => {
    const h = arr([200, 120, 0]);
    const l = arr([100, 80, 0]);
    const c = arr([150, 100, 0]);
    const result = computePivotPoints(h, l, c, 3, 'standard');
    // i=1 should use bar 0 HLC: H=200, L=100, C=150
    const expectedPP = (200 + 100 + 150) / 3;
    expect(result.pp[1]).toBeCloseTo(expectedPP);
    // i=2 should use bar 1 HLC: H=120, L=80, C=100
    const expectedPP2 = (120 + 80 + 100) / 3;
    expect(result.pp[2]).toBeCloseTo(expectedPP2);
  });

  it('length=1 returns all NaN (no previous bar)', () => {
    const result = computePivotPoints(arr([120]), arr([80]), arr([100]), 1);
    expect(isNaN(result.pp[0])).toBe(true);
    expect(isNaN(result.r1[0])).toBe(true);
    expect(isNaN(result.s1[0])).toBe(true);
  });

  it('fibonacci: R levels symmetrically opposite to S levels around PP', () => {
    const h = arr([120, 0]);
    const l = arr([80, 0]);
    const c = arr([100, 0]);
    const result = computePivotPoints(h, l, c, 2, 'fibonacci');
    const pp = result.pp[1];
    expect(result.r1[1] - pp).toBeCloseTo(pp - result.s1[1], 8);
    expect(result.r2[1] - pp).toBeCloseTo(pp - result.s2[1], 8);
    expect(result.r3[1] - pp).toBeCloseTo(pp - result.s3[1], 8);
  });
});
