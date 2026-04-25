import { describe, it, expect } from 'vitest';
import { computeStochRSI } from '@/indicators/stoch-rsi';
import { computeCMO } from '@/indicators/cmo';
import { computeChaikinOsc } from '@/indicators/chaikin-osc';
import { computeAD } from '@/indicators/ad';
import { computeALMA } from '@/indicators/alma';
import { computeZLEMA } from '@/indicators/zlema';
import { computeBOP } from '@/indicators/bop';
import { computePVT } from '@/indicators/pvt';
import { computeEMV } from '@/indicators/emv';
import { computeStdDev } from '@/indicators/std-dev';

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
// StochRSI
// ────────────────────────────────────────────────────────────────────────────
describe('computeStochRSI', () => {
  it('returns Float64Arrays of correct length', () => {
    const close = new Float64Array(50).fill(0).map((_, i) => 100 + i);
    const r = computeStochRSI(close, 50, 14, 14, 3, 3);
    expect(r.k).toBeInstanceOf(Float64Array);
    expect(r.d).toBeInstanceOf(Float64Array);
    expect(r.k.length).toBe(50);
    expect(r.d.length).toBe(50);
  });

  it('initial values are NaN', () => {
    const close = new Float64Array(50).fill(0).map((_, i) => 100 + i);
    const r = computeStochRSI(close, 50, 14, 14, 3, 3);
    // rsiPeriod=14, stochPeriod=14 -> stochastic starts at 14+14-1=27, then kPeriod=3 -> 29, dPeriod=3 -> 31
    expect(isNaN(r.k[0])).toBe(true);
    expect(isNaN(r.d[0])).toBe(true);
  });

  it('produces valid values after warm-up period', () => {
    const close = new Float64Array(60).fill(0).map((_, i) => 100 + Math.sin(i * 0.3) * 10);
    const r = computeStochRSI(close, 60, 5, 5, 3, 3);
    // At minimum some values near end should be defined
    const lastK = r.k[59];
    const lastD = r.d[59];
    expect(isNaN(lastK)).toBe(false);
    expect(isNaN(lastD)).toBe(false);
  });

  it('handles short series gracefully', () => {
    const close = arr([100, 101, 102]);
    const r = computeStochRSI(close, 3, 14, 14, 3, 3);
    expect(r.k.length).toBe(3);
    expect(r.d.length).toBe(3);
    for (let i = 0; i < 3; i++) {
      expect(isNaN(r.k[i])).toBe(true);
      expect(isNaN(r.d[i])).toBe(true);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// CMO
// ────────────────────────────────────────────────────────────────────────────
describe('computeCMO', () => {
  it('returns Float64Array of correct length', () => {
    const close = arr([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    const result = computeCMO(close, 11, 5);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(11);
  });

  it('initial period values are NaN', () => {
    const close = arr([10, 11, 12, 13, 14, 15]);
    const result = computeCMO(close, 6, 4);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
    expect(isNaN(result[2])).toBe(true);
    expect(isNaN(result[3])).toBe(true);
  });

  it('pure uptrend gives +100', () => {
    // All positive changes -> sumDown=0 -> CMO=100
    const close = arr([10, 11, 12, 13, 14]);
    const result = computeCMO(close, 5, 4);
    expect(result[4]).toBeCloseTo(100);
  });

  it('pure downtrend gives -100', () => {
    const close = arr([14, 13, 12, 11, 10]);
    const result = computeCMO(close, 5, 4);
    expect(result[4]).toBeCloseTo(-100);
  });

  it('flat series gives 0', () => {
    const close = arr([10, 10, 10, 10, 10]);
    const result = computeCMO(close, 5, 4);
    expect(result[4]).toBeCloseTo(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// ChaikinOsc
// ────────────────────────────────────────────────────────────────────────────
describe('computeChaikinOsc', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low, close, volume } = generateOHLCV(20);
    const result = computeChaikinOsc(high, low, close, volume, 20, 3, 10);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(20);
  });

  it('initial values are NaN until slowPeriod', () => {
    const { high, low, close, volume } = generateOHLCV(20);
    const result = computeChaikinOsc(high, low, close, volume, 20, 3, 10);
    // slowPeriod=10 -> first valid at index 9
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[8])).toBe(true);
  });

  it('produces finite values after warm-up', () => {
    const { high, low, close, volume } = generateOHLCV(30);
    const result = computeChaikinOsc(high, low, close, volume, 30, 3, 10);
    expect(isNaN(result[29])).toBe(false);
    expect(isFinite(result[29])).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// AD
// ────────────────────────────────────────────────────────────────────────────
describe('computeAD', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low, close, volume } = generateOHLCV(10);
    const result = computeAD(high, low, close, volume, 10);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(10);
  });

  it('no NaN values (AD has no warm-up period)', () => {
    const { high, low, close, volume } = generateOHLCV(10);
    const result = computeAD(high, low, close, volume, 10);
    for (let i = 0; i < 10; i++) {
      expect(isNaN(result[i])).toBe(false);
    }
  });

  it('is cumulative', () => {
    const high = arr([10]);
    const low = arr([6]);
    const close = arr([9]);
    const volume = arr([1000]);
    const result = computeAD(high, low, close, volume, 1);
    // mfm = ((9-6)-(10-9))/(10-6) = (3-1)/4 = 0.5
    // AD = 0.5 * 1000 = 500
    expect(result[0]).toBeCloseTo(500);
  });

  it('handles high==low (no division by zero)', () => {
    const high = arr([10, 10]);
    const low = arr([10, 10]);
    const close = arr([10, 10]);
    const volume = arr([500, 500]);
    const result = computeAD(high, low, close, volume, 2);
    expect(isNaN(result[0])).toBe(false);
    expect(result[0]).toBeCloseTo(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// ALMA
// ────────────────────────────────────────────────────────────────────────────
describe('computeALMA', () => {
  it('returns Float64Array of correct length', () => {
    const { close } = generateOHLCV(30);
    const result = computeALMA(close, 30, 10, 0.85, 6);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(30);
  });

  it('initial period-1 values are NaN', () => {
    const { close } = generateOHLCV(30);
    const result = computeALMA(close, 30, 10, 0.85, 6);
    for (let i = 0; i < 9; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('valid value at period-1', () => {
    const { close } = generateOHLCV(30);
    const result = computeALMA(close, 30, 10, 0.85, 6);
    expect(isNaN(result[9])).toBe(false);
    expect(isFinite(result[9])).toBe(true);
  });

  it('for flat series returns that value', () => {
    const close = new Float64Array(20).fill(100);
    const result = computeALMA(close, 20, 5, 0.85, 6);
    for (let i = 4; i < 20; i++) {
      expect(result[i]).toBeCloseTo(100);
    }
  });

  it('handles short series (length < period)', () => {
    const close = arr([10, 20, 30]);
    const result = computeALMA(close, 3, 10, 0.85, 6);
    for (let i = 0; i < 3; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// ZLEMA
// ────────────────────────────────────────────────────────────────────────────
describe('computeZLEMA', () => {
  it('returns Float64Array of correct length', () => {
    const { close } = generateOHLCV(30);
    const result = computeZLEMA(close, 30, 10);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(30);
  });

  it('initial period-1 values are NaN', () => {
    const { close } = generateOHLCV(30);
    const result = computeZLEMA(close, 30, 5);
    for (let i = 0; i < 4; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('valid value after warm-up', () => {
    const { close } = generateOHLCV(30);
    const result = computeZLEMA(close, 30, 5);
    expect(isNaN(result[4])).toBe(false);
    expect(isFinite(result[result.length - 1])).toBe(true);
  });

  it('flat series returns that flat value', () => {
    const close = new Float64Array(20).fill(50);
    const result = computeZLEMA(close, 20, 5);
    for (let i = 4; i < 20; i++) {
      expect(result[i]).toBeCloseTo(50);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// BOP
// ────────────────────────────────────────────────────────────────────────────
describe('computeBOP', () => {
  it('returns Float64Array of correct length', () => {
    const { open, high, low, close } = generateOHLCV(20);
    const result = computeBOP(open, high, low, close, 20, 5);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(20);
  });

  it('initial period-1 values are NaN', () => {
    const { open, high, low, close } = generateOHLCV(20);
    const result = computeBOP(open, high, low, close, 20, 5);
    for (let i = 0; i < 4; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('bullish bar gives positive raw BOP', () => {
    // close > open, so BOP raw > 0; with SMA(1) just returns raw
    const open = arr([10, 10, 10, 10, 10]);
    const high = arr([15, 15, 15, 15, 15]);
    const low = arr([5, 5, 5, 5, 5]);
    const close = arr([12, 12, 12, 12, 12]);
    const result = computeBOP(open, high, low, close, 5, 1);
    // raw = (12-10)/(15-5) = 0.2
    expect(result[0]).toBeCloseTo(0.2);
  });

  it('handles high==low (no division by zero)', () => {
    const open = arr([10, 10, 10]);
    const high = arr([10, 10, 10]);
    const low = arr([10, 10, 10]);
    const close = arr([10, 10, 10]);
    const result = computeBOP(open, high, low, close, 3, 1);
    expect(isNaN(result[0])).toBe(false);
    expect(result[0]).toBeCloseTo(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// PVT
// ────────────────────────────────────────────────────────────────────────────
describe('computePVT', () => {
  it('returns Float64Array of correct length', () => {
    const { close, volume } = generateOHLCV(10);
    const result = computePVT(close, volume, 10);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(10);
  });

  it('no NaN values', () => {
    const { close, volume } = generateOHLCV(10);
    const result = computePVT(close, volume, 10);
    for (let i = 0; i < 10; i++) {
      expect(isNaN(result[i])).toBe(false);
    }
  });

  it('starts at 0', () => {
    const close = arr([100, 110, 105]);
    const volume = arr([1000, 2000, 1500]);
    const result = computePVT(close, volume, 3);
    expect(result[0]).toBeCloseTo(0);
  });

  it('computes correct incremental value', () => {
    const close = arr([100, 110]);
    const volume = arr([1000, 2000]);
    const result = computePVT(close, volume, 2);
    // pvt[1] = 0 + (110-100)/100 * 2000 = 0.1 * 2000 = 200
    expect(result[1]).toBeCloseTo(200);
  });

  it('handles zero previous close gracefully', () => {
    const close = arr([0, 10]);
    const volume = arr([1000, 1000]);
    const result = computePVT(close, volume, 2);
    expect(isNaN(result[1])).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// EMV
// ────────────────────────────────────────────────────────────────────────────
describe('computeEMV', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low, volume } = generateOHLCV(20);
    const result = computeEMV(high, low, volume, 20, 5);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(20);
  });

  it('index 0 and initial values are NaN', () => {
    const { high, low, volume } = generateOHLCV(20);
    const result = computeEMV(high, low, volume, 20, 5);
    expect(isNaN(result[0])).toBe(true);
    // SMA of period 5 starting from index 1: first valid at index 1+5-1=5
    expect(isNaN(result[4])).toBe(true);
  });

  it('produces finite values after warm-up', () => {
    const { high, low, volume } = generateOHLCV(30);
    const result = computeEMV(high, low, volume, 30, 5);
    // First valid is at index 5 (SMA of indices 1..5), so index 29 is valid
    expect(isNaN(result[5])).toBe(false);
    expect(isFinite(result[29])).toBe(true);
  });

  it('handles high==low (no division by zero)', () => {
    const high = new Float64Array(10).fill(10);
    const low = new Float64Array(10).fill(10);
    const volume = new Float64Array(10).fill(1000);
    const result = computeEMV(high, low, volume, 10, 3);
    // First valid at index 1+3-1=3
    expect(isNaN(result[3])).toBe(false);
    for (let i = 3; i < 10; i++) {
      expect(isNaN(result[i])).toBe(false);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// StdDev
// ────────────────────────────────────────────────────────────────────────────
describe('computeStdDev', () => {
  it('returns Float64Array of correct length', () => {
    const { close } = generateOHLCV(20);
    const result = computeStdDev(close, 20, 5, 1);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(20);
  });

  it('initial period-1 values are NaN', () => {
    const { close } = generateOHLCV(20);
    const result = computeStdDev(close, 20, 5, 1);
    for (let i = 0; i < 4; i++) {
      expect(isNaN(result[i])).toBe(true);
    }
  });

  it('flat series returns 0', () => {
    const close = new Float64Array(10).fill(100);
    const result = computeStdDev(close, 10, 5, 1);
    for (let i = 4; i < 10; i++) {
      expect(result[i]).toBeCloseTo(0);
    }
  });

  it('multiplier scales the result', () => {
    const { close } = generateOHLCV(20);
    const r1 = computeStdDev(close, 20, 5, 1);
    const r2 = computeStdDev(close, 20, 5, 2);
    for (let i = 4; i < 20; i++) {
      expect(r2[i]).toBeCloseTo(r1[i] * 2);
    }
  });

  it('computes correct std dev for known values', () => {
    const close = arr([2, 4, 4, 4, 5, 5, 7, 9]);
    const result = computeStdDev(close, 8, 8, 1);
    // population std dev of [2,4,4,4,5,5,7,9]: mean=5, variance=4, std=2
    expect(result[7]).toBeCloseTo(2);
  });
});
