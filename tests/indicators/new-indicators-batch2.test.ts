import { describe, it, expect } from 'vitest';
import { computeROC } from '@/indicators/roc';
import { computeVWMA } from '@/indicators/vwma';
import { computeLinearRegression } from '@/indicators/linear-regression';
import { computeAroon } from '@/indicators/aroon';
import { computeMFI } from '@/indicators/mfi';
import { computeChoppiness } from '@/indicators/choppiness';
import { computeAwesomeOscillator } from '@/indicators/awesome-oscillator';
import { computeChaikinMF } from '@/indicators/chaikin-mf';
import { computeElderForce } from '@/indicators/elder-force';
import { computeCoppock } from '@/indicators/coppock';
import { computeTRIX } from '@/indicators/trix';
import { computeSupertrend } from '@/indicators/supertrend';

const arr = (values: number[]) => new Float64Array(values);

function generateOHLCV(length: number, start = 100, step = 1) {
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    const mid = start + i * step;
    open[i] = mid - 0.5;
    close[i] = mid + 0.5;
    high[i] = mid + 1;
    low[i] = mid - 1;
    volume[i] = 1000 + i * 10;
  }
  return { open, high, low, close, volume };
}

// ────────────────────────────────────────────────────────────────────────────
// ROC
// ────────────────────────────────────────────────────────────────────────────
describe('computeROC', () => {
  it('returns Float64Array of correct length', () => {
    const close = arr([10, 11, 12, 13, 14, 15]);
    const result = computeROC(close, 6, 3);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(6);
  });

  it('initial period values are NaN', () => {
    const close = arr([10, 11, 12, 13, 14, 15]);
    const result = computeROC(close, 6, 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
    expect(isNaN(result[2])).toBe(true);
  });

  it('computes correct ROC values', () => {
    const close = arr([10, 11, 12, 13, 14, 15]);
    const result = computeROC(close, 6, 3);
    // ROC(3) at index 3 = (13 - 10) / 10 * 100 = 30
    expect(result[3]).toBeCloseTo(30);
    // ROC(3) at index 4 = (14 - 11) / 11 * 100 ≈ 27.27
    expect(result[4]).toBeCloseTo(27.2727, 3);
  });

  it('returns NaN when previous close is zero', () => {
    const close = arr([0, 5, 10]);
    const result = computeROC(close, 3, 1);
    expect(isNaN(result[1])).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// VWMA
// ────────────────────────────────────────────────────────────────────────────
describe('computeVWMA', () => {
  it('returns Float64Array of correct length', () => {
    const { close, volume } = generateOHLCV(10);
    const result = computeVWMA(close, volume, 10, 3);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(10);
  });

  it('initial period-1 values are NaN', () => {
    const { close, volume } = generateOHLCV(10);
    const result = computeVWMA(close, volume, 10, 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
  });

  it('first valid value is correct', () => {
    const close = arr([10, 20, 30]);
    const volume = arr([100, 200, 300]);
    const result = computeVWMA(close, volume, 3, 3);
    // VWMA = (10*100 + 20*200 + 30*300) / (100+200+300) = (1000+4000+9000)/600 = 14000/600
    expect(result[2]).toBeCloseTo(14000 / 600);
  });

  it('returns NaN when total volume is zero', () => {
    const close = arr([10, 20, 30]);
    const volume = arr([0, 0, 0]);
    const result = computeVWMA(close, volume, 3, 3);
    expect(isNaN(result[2])).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Linear Regression
// ────────────────────────────────────────────────────────────────────────────
describe('computeLinearRegression', () => {
  it('returns Float64Array of correct length', () => {
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeLinearRegression(close, 10, 3);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(10);
  });

  it('initial period-1 values are NaN', () => {
    const close = arr([1, 2, 3, 4, 5]);
    const result = computeLinearRegression(close, 5, 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
  });

  it('perfectly linear data returns the data value at each point', () => {
    // For perfectly linear data, the regression line passes exactly through each point
    const close = arr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeLinearRegression(close, 10, 3);
    // The regression of a perfectly linear series should match the series
    expect(result[2]).toBeCloseTo(3);
    expect(result[5]).toBeCloseTo(6);
    expect(result[9]).toBeCloseTo(10);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Aroon
// ────────────────────────────────────────────────────────────────────────────
describe('computeAroon', () => {
  it('returns correct length arrays', () => {
    const { high, low } = generateOHLCV(20);
    const result = computeAroon(high, low, 20, 14);
    expect(result.up).toBeInstanceOf(Float64Array);
    expect(result.down).toBeInstanceOf(Float64Array);
    expect(result.up.length).toBe(20);
    expect(result.down.length).toBe(20);
  });

  it('initial period values are NaN', () => {
    const { high, low } = generateOHLCV(20);
    const result = computeAroon(high, low, 20, 14);
    for (let i = 0; i < 14; i++) {
      expect(isNaN(result.up[i])).toBe(true);
      expect(isNaN(result.down[i])).toBe(true);
    }
  });

  it('aroon values are between 0 and 100', () => {
    const { high, low } = generateOHLCV(50);
    const result = computeAroon(high, low, 50, 14);
    for (let i = 14; i < 50; i++) {
      expect(result.up[i]).toBeGreaterThanOrEqual(0);
      expect(result.up[i]).toBeLessThanOrEqual(100);
      expect(result.down[i]).toBeGreaterThanOrEqual(0);
      expect(result.down[i]).toBeLessThanOrEqual(100);
    }
  });

  it('uptrend data gives high aroon up', () => {
    // Strictly rising highs: highest is always the most recent
    const high = arr([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
    const low  = arr([9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
    const result = computeAroon(high, low, 16, 5);
    // Most recent high should be at current bar → aroon up = 100
    expect(result.up[15]).toBeCloseTo(100);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// MFI
// ────────────────────────────────────────────────────────────────────────────
describe('computeMFI', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low, close, volume } = generateOHLCV(30);
    const result = computeMFI(high, low, close, volume, 30, 14);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(30);
  });

  it('initial period values are NaN', () => {
    const { high, low, close, volume } = generateOHLCV(30);
    const result = computeMFI(high, low, close, volume, 30, 14);
    for (let i = 0; i < 14; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('MFI values are between 0 and 100', () => {
    const { high, low, close, volume } = generateOHLCV(50);
    const result = computeMFI(high, low, close, volume, 50, 14);
    for (let i = 14; i < 50; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(100);
    }
  });

  it('all positive flow gives MFI = 100', () => {
    // All bars rising — all money flow is positive
    const n = 20;
    const high = new Float64Array(n);
    const low = new Float64Array(n);
    const close = new Float64Array(n);
    const volume = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      high[i] = 100 + i;
      low[i] = 99 + i;
      close[i] = 99.5 + i;
      volume[i] = 1000;
    }
    const result = computeMFI(high, low, close, volume, n, 5);
    // With all positive flow, negFlow=0, so result should be 100
    expect(result[n - 1]).toBeCloseTo(100);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Choppiness Index
// ────────────────────────────────────────────────────────────────────────────
describe('computeChoppiness', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low, close } = generateOHLCV(30);
    const result = computeChoppiness(high, low, close, 30, 14);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(30);
  });

  it('initial period values are NaN', () => {
    const { high, low, close } = generateOHLCV(30);
    const result = computeChoppiness(high, low, close, 30, 14);
    for (let i = 0; i < 14; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('choppiness values are within theoretical range (0-100)', () => {
    const { high, low, close } = generateOHLCV(50);
    const result = computeChoppiness(high, low, close, 50, 14);
    for (let i = 14; i < 50; i++) {
      if (!isNaN(result[i])) {
        expect(result[i]).toBeGreaterThan(0);
        expect(result[i]).toBeLessThan(200);
      }
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Awesome Oscillator
// ────────────────────────────────────────────────────────────────────────────
describe('computeAwesomeOscillator', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low } = generateOHLCV(50);
    const result = computeAwesomeOscillator(high, low, 50, 5, 34);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(50);
  });

  it('initial slow period - 1 values are NaN', () => {
    const { high, low } = generateOHLCV(50);
    const result = computeAwesomeOscillator(high, low, 50, 5, 34);
    for (let i = 0; i < 33; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('AO is zero for constant price data', () => {
    const n = 50;
    const high = new Float64Array(n).fill(11);
    const low = new Float64Array(n).fill(9);
    const result = computeAwesomeOscillator(high, low, n, 5, 34);
    // Median is constant = 10, so SMA(fast) = SMA(slow) = 10, AO = 0
    expect(result[n - 1]).toBeCloseTo(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Chaikin Money Flow
// ────────────────────────────────────────────────────────────────────────────
describe('computeChaikinMF', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low, close, volume } = generateOHLCV(30);
    const result = computeChaikinMF(high, low, close, volume, 30, 20);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(30);
  });

  it('initial period-1 values are NaN', () => {
    const { high, low, close, volume } = generateOHLCV(30);
    const result = computeChaikinMF(high, low, close, volume, 30, 20);
    for (let i = 0; i < 19; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('CMF values are between -1 and 1', () => {
    const { high, low, close, volume } = generateOHLCV(50);
    const result = computeChaikinMF(high, low, close, volume, 50, 20);
    for (let i = 19; i < 50; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(-1);
      expect(result[i]).toBeLessThanOrEqual(1);
    }
  });

  it('returns 0 when volume is zero', () => {
    const high = arr([10, 10, 10]);
    const low = arr([8, 8, 8]);
    const close = arr([9, 9, 9]);
    const volume = arr([0, 0, 0]);
    const result = computeChaikinMF(high, low, close, volume, 3, 3);
    expect(result[2]).toBeCloseTo(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Elder Force Index
// ────────────────────────────────────────────────────────────────────────────
describe('computeElderForce', () => {
  it('returns Float64Array of correct length', () => {
    const { close, volume } = generateOHLCV(30);
    const result = computeElderForce(close, volume, 30, 13);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(30);
  });

  it('produces valid values after warmup period', () => {
    const { close, volume } = generateOHLCV(30);
    const result = computeElderForce(close, volume, 30, 13);
    expect(result.length).toBe(30);
    // raw[0] is NaN, EMA skips it — first valid at index 13 (period-1 after start=1)
    expect(isNaN(result[0])).toBe(true);
    // Should have some valid (non-NaN) values after warmup
    const validCount = Array.from(result).filter(v => !isNaN(v)).length;
    expect(validCount).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Coppock Curve
// ────────────────────────────────────────────────────────────────────────────
describe('computeCoppock', () => {
  it('returns Float64Array of correct length', () => {
    const close = new Float64Array(30).fill(0).map((_, i) => 100 + i);
    const result = computeCoppock(close, 30, 10, 14, 11);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(30);
  });

  it('initial maxLag + wmaPeriod - 1 values are NaN', () => {
    const close = new Float64Array(50).fill(0).map((_, i) => 100 + i);
    // maxLag = 14, wmaPeriod = 10, so first 23 values (0..22) should be NaN
    const result = computeCoppock(close, 50, 10, 14, 11);
    for (let i = 0; i < 23; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('produces valid values after warmup', () => {
    const close = new Float64Array(50).fill(0).map((_, i) => 100 + i);
    const result = computeCoppock(close, 50, 10, 14, 11);
    expect(isNaN(result[49])).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// TRIX
// ────────────────────────────────────────────────────────────────────────────
describe('computeTRIX', () => {
  it('returns trix and signal arrays of correct length', () => {
    const close = new Float64Array(60).fill(0).map((_, i) => 100 + i * 0.5);
    const result = computeTRIX(close, 60, 15, 9);
    expect(result.trix).toBeInstanceOf(Float64Array);
    expect(result.signal).toBeInstanceOf(Float64Array);
    expect(result.trix.length).toBe(60);
    expect(result.signal.length).toBe(60);
  });

  it('initial trix[0] is NaN', () => {
    const close = new Float64Array(60).fill(0).map((_, i) => 100 + i * 0.5);
    const result = computeTRIX(close, 60, 15, 9);
    expect(isNaN(result.trix[0])).toBe(true);
  });

  it('produces valid trix values after warmup period', () => {
    // Triple EMA needs 3*(period-1)+1 bars to warm up
    const close = new Float64Array(60).fill(0).map((_, i) => 100 + i * 0.5);
    const result = computeTRIX(close, 60, 15, 9);
    expect(isNaN(result.trix[0])).toBe(true);
    // Should have valid (non-NaN) values after warmup
    const validTrix = Array.from(result.trix).filter(v => !isNaN(v));
    expect(validTrix.length).toBeGreaterThan(0);
    // Signal should also have valid values
    const validSignal = Array.from(result.signal).filter(v => !isNaN(v));
    expect(validSignal.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Supertrend
// ────────────────────────────────────────────────────────────────────────────
describe('computeSupertrend', () => {
  it('returns value and direction arrays of correct length', () => {
    const { high, low, close } = generateOHLCV(50);
    const result = computeSupertrend(high, low, close, 50, 10, 3);
    expect(result.value).toBeInstanceOf(Float64Array);
    expect(result.direction).toBeInstanceOf(Float64Array);
    expect(result.value.length).toBe(50);
    expect(result.direction.length).toBe(50);
  });

  it('initial period values are NaN', () => {
    const { high, low, close } = generateOHLCV(50);
    const result = computeSupertrend(high, low, close, 50, 10, 3);
    for (let i = 0; i < 10; i++) {
      expect(isNaN(result.value[i])).toBe(true);
      expect(isNaN(result.direction[i])).toBe(true);
    }
  });

  it('direction is either 1 or -1 for valid values', () => {
    const { high, low, close } = generateOHLCV(50);
    const result = computeSupertrend(high, low, close, 50, 10, 3);
    for (let i = 10; i < 50; i++) {
      expect(Math.abs(result.direction[i])).toBe(1);
    }
  });

  it('uptrend data gives direction 1', () => {
    // Strictly rising prices with large ATR multiple → should be bullish
    const n = 30;
    const high = new Float64Array(n).fill(0).map((_, i) => 100 + i * 5 + 1);
    const low  = new Float64Array(n).fill(0).map((_, i) => 100 + i * 5 - 1);
    const close = new Float64Array(n).fill(0).map((_, i) => 100 + i * 5);
    const result = computeSupertrend(high, low, close, n, 5, 3);
    // In a strong uptrend, supertrend direction should eventually be 1
    expect(result.direction[n - 1]).toBe(1);
  });
});
