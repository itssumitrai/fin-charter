# Production Feature Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make fin-charter production-grade by adding data infrastructure, drawing tools, Heikin-Ashi, market sessions, comparison mode, event markers, chart state save/restore, and 6 new indicators — all with unit tests.

**Architecture:** Bottom-up: pure indicator/transform functions first (no dependencies), then core infrastructure (periodicity, market sessions, data layer), then chart-api integration (drawings, comparison, state), then stories and documentation.

**Tech Stack:** TypeScript, Canvas 2D, Vitest, Vite, Storybook (HTML-Vite)

---

## Task 1: Shared Indicator Utilities (slidingMax/slidingMin)

**Files:**
- Create: `src/indicators/utils.ts`
- Test: `tests/indicators/utils.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/indicators/utils.test.ts
import { describe, it, expect } from 'vitest';
import { slidingMax, slidingMin } from '../src/indicators/utils';

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
    expect(result[2]).toBe(3);  // max(1,3,2)
    expect(result[3]).toBe(5);  // max(3,2,5)
    expect(result[4]).toBe(5);  // max(2,5,4)
    expect(result[5]).toBe(5);  // max(5,4,1)
    expect(result[6]).toBe(6);  // max(4,1,6)
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
    expect(result[2]).toBe(3);  // min(5,3,4)
    expect(result[3]).toBe(1);  // min(3,4,1)
    expect(result[4]).toBe(1);  // min(4,1,2)
    expect(result[5]).toBe(1);  // min(1,2,6)
    expect(result[6]).toBe(0);  // min(2,6,0)
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/indicators/utils.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```ts
// src/indicators/utils.ts

/**
 * O(n) sliding window maximum using monotone deque.
 * Returns Float64Array where result[i] = max of data[i-period+1..i].
 * Indices [0, period-2] are NaN.
 */
export function slidingMax(data: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const deque: number[] = []; // indices of potential maximums

  for (let i = 0; i < length; i++) {
    // Remove elements outside the window
    while (deque.length > 0 && deque[0] <= i - period) deque.shift();
    // Remove elements smaller than current (they'll never be the max)
    while (deque.length > 0 && data[deque[deque.length - 1]] <= data[i]) deque.pop();
    deque.push(i);
    result[i] = i >= period - 1 ? data[deque[0]] : NaN;
  }

  return result;
}

/**
 * O(n) sliding window minimum using monotone deque.
 */
export function slidingMin(data: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const deque: number[] = [];

  for (let i = 0; i < length; i++) {
    while (deque.length > 0 && deque[0] <= i - period) deque.shift();
    while (deque.length > 0 && data[deque[deque.length - 1]] >= data[i]) deque.pop();
    deque.push(i);
    result[i] = i >= period - 1 ? data[deque[0]] : NaN;
  }

  return result;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/indicators/utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/indicators/utils.ts tests/indicators/utils.test.ts
git commit -m "feat: add O(n) slidingMax/slidingMin utilities with monotone deque"
```

---

## Task 2: New Indicators (6 files)

**Files:**
- Create: `src/indicators/ichimoku.ts`
- Create: `src/indicators/parabolic-sar.ts`
- Create: `src/indicators/keltner.ts`
- Create: `src/indicators/donchian.ts`
- Create: `src/indicators/cci.ts`
- Create: `src/indicators/pivot-points.ts`
- Modify: `src/indicators/index.ts`
- Test: `tests/indicators/new-indicators.test.ts`

- [ ] **Step 1: Create test file for all 6 indicators**

```ts
// tests/indicators/new-indicators.test.ts
import { describe, it, expect } from 'vitest';
import { computeIchimoku } from '../src/indicators/ichimoku';
import { computeParabolicSAR } from '../src/indicators/parabolic-sar';
import { computeKeltner } from '../src/indicators/keltner';
import { computeDonchian } from '../src/indicators/donchian';
import { computeCCI } from '../src/indicators/cci';
import { computePivotPoints } from '../src/indicators/pivot-points';

// Helper: generate simple trending data
function makeData(n: number) {
  const high = new Float64Array(n);
  const low = new Float64Array(n);
  const close = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    close[i] = 100 + i * 0.5 + Math.sin(i) * 2;
    high[i] = close[i] + 1 + Math.random();
    low[i] = close[i] - 1 - Math.random();
  }
  return { high, low, close, length: n };
}

describe('computeIchimoku', () => {
  it('returns correct structure with default periods', () => {
    const { high, low, close, length } = makeData(100);
    const result = computeIchimoku(high, low, close, length);
    expect(result.tenkan).toBeInstanceOf(Float64Array);
    expect(result.kijun).toBeInstanceOf(Float64Array);
    expect(result.senkouA).toBeInstanceOf(Float64Array);
    expect(result.senkouB).toBeInstanceOf(Float64Array);
    expect(result.chikou).toBeInstanceOf(Float64Array);
    expect(result.tenkan.length).toBe(length);
  });

  it('has NaN for early tenkan values', () => {
    const { high, low, close, length } = makeData(100);
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    for (let i = 0; i < 8; i++) expect(result.tenkan[i]).toBeNaN();
    expect(result.tenkan[8]).not.toBeNaN();
  });

  it('senkouA shifted ahead by kijun period', () => {
    const { high, low, close, length } = makeData(100);
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    // First 25 senkouA values should be NaN (shifted by 26)
    for (let i = 0; i < 25; i++) expect(result.senkouA[i]).toBeNaN();
  });

  it('chikou shifted behind', () => {
    const { high, low, close, length } = makeData(100);
    const result = computeIchimoku(high, low, close, length, 9, 26, 52);
    // Last 26 chikou values should be NaN
    for (let i = length - 26; i < length; i++) expect(result.chikou[i]).toBeNaN();
    // chikou[0] should equal close[26]
    expect(result.chikou[0]).toBe(close[26]);
  });
});

describe('computeParabolicSAR', () => {
  it('returns Float64Array of correct length', () => {
    const { high, low, length } = makeData(50);
    const result = computeParabolicSAR(high, low, length);
    expect(result).toBeInstanceOf(Float64Array);
    expect(result.length).toBe(length);
  });

  it('SAR values are either above highs or below lows', () => {
    const { high, low, length } = makeData(100);
    const result = computeParabolicSAR(high, low, length);
    // After initial bar, SAR should be on one side of price
    for (let i = 2; i < length; i++) {
      if (!isNaN(result[i])) {
        const aboveHigh = result[i] > high[i];
        const belowLow = result[i] < low[i];
        expect(aboveHigh || belowLow).toBe(true);
      }
    }
  });
});

describe('computeKeltner', () => {
  it('returns upper, middle, lower bands', () => {
    const { high, low, close, length } = makeData(50);
    const result = computeKeltner(close, high, low, length);
    expect(result.upper).toBeInstanceOf(Float64Array);
    expect(result.middle).toBeInstanceOf(Float64Array);
    expect(result.lower).toBeInstanceOf(Float64Array);
  });

  it('upper > middle > lower when valid', () => {
    const { high, low, close, length } = makeData(50);
    const result = computeKeltner(close, high, low, length, 20, 10, 2.0);
    for (let i = 20; i < length; i++) {
      if (!isNaN(result.upper[i]) && !isNaN(result.middle[i]) && !isNaN(result.lower[i])) {
        expect(result.upper[i]).toBeGreaterThan(result.middle[i]);
        expect(result.middle[i]).toBeGreaterThan(result.lower[i]);
      }
    }
  });
});

describe('computeDonchian', () => {
  it('upper is highest high in window', () => {
    const high = new Float64Array([5, 3, 7, 2, 8, 4, 6]);
    const low = new Float64Array([2, 1, 4, 0, 5, 1, 3]);
    const result = computeDonchian(high, low, 7, 3);
    expect(result.upper[2]).toBe(7);  // max(5,3,7)
    expect(result.upper[4]).toBe(8);  // max(7,2,8)
  });

  it('lower is lowest low in window', () => {
    const high = new Float64Array([5, 3, 7, 2, 8, 4, 6]);
    const low = new Float64Array([2, 1, 4, 0, 5, 1, 3]);
    const result = computeDonchian(high, low, 7, 3);
    expect(result.lower[2]).toBe(1);  // min(2,1,4)
    expect(result.lower[3]).toBe(0);  // min(1,4,0)
  });

  it('middle is average of upper and lower', () => {
    const high = new Float64Array([10, 20, 30]);
    const low = new Float64Array([0, 5, 10]);
    const result = computeDonchian(high, low, 3, 2);
    expect(result.middle[1]).toBe((20 + 0) / 2);
  });
});

describe('computeCCI', () => {
  it('returns Float64Array with NaN prefix', () => {
    const { high, low, close, length } = makeData(30);
    const result = computeCCI(high, low, close, length, 20);
    for (let i = 0; i < 19; i++) expect(result[i]).toBeNaN();
    expect(result[19]).not.toBeNaN();
  });

  it('values centered around zero', () => {
    const { high, low, close, length } = makeData(100);
    const result = computeCCI(high, low, close, length, 20);
    let positives = 0, negatives = 0;
    for (let i = 19; i < length; i++) {
      if (result[i] > 0) positives++;
      else negatives++;
    }
    // Should have both positive and negative values
    expect(positives).toBeGreaterThan(0);
    expect(negatives).toBeGreaterThan(0);
  });
});

describe('computePivotPoints', () => {
  it('standard: PP is average of H, L, C', () => {
    const high = new Float64Array([110, 115, 120]);
    const low = new Float64Array([90, 95, 100]);
    const close = new Float64Array([100, 105, 110]);
    const result = computePivotPoints(high, low, close, 3, 'standard');
    // PP for bar 1 uses bar 0's HLC: (110+90+100)/3 = 100
    expect(result.pp[1]).toBe(100);
  });

  it('R1 > PP > S1', () => {
    const high = new Float64Array([110, 115]);
    const low = new Float64Array([90, 95]);
    const close = new Float64Array([100, 105]);
    const result = computePivotPoints(high, low, close, 2, 'standard');
    expect(result.r1[1]).toBeGreaterThan(result.pp[1]);
    expect(result.pp[1]).toBeGreaterThan(result.s1[1]);
  });

  it('first bar is NaN (no previous data)', () => {
    const high = new Float64Array([110, 115]);
    const low = new Float64Array([90, 95]);
    const close = new Float64Array([100, 105]);
    const result = computePivotPoints(high, low, close, 2, 'standard');
    expect(result.pp[0]).toBeNaN();
  });

  it('fibonacci variant uses fib ratios', () => {
    const high = new Float64Array([110, 120]);
    const low = new Float64Array([90, 100]);
    const close = new Float64Array([100, 110]);
    const result = computePivotPoints(high, low, close, 2, 'fibonacci');
    const pp = (110 + 90 + 100) / 3;
    const range = 110 - 90;
    expect(result.pp[1]).toBe(pp);
    expect(result.r1[1]).toBeCloseTo(pp + 0.382 * range, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/indicators/new-indicators.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement all 6 indicators**

Create each file following the established pattern (Float64Array in/out, NaN prefill). The implementations should match the algorithms from the spec exactly. Each indicator is a pure function.

Key implementations:
- **Ichimoku:** Uses `slidingMax`/`slidingMin` from utils.ts. Senkou spans shifted by `kijunPeriod` positions. Chikou is close shifted backward.
- **Parabolic SAR:** Single-pass Wilder's algorithm with AF tracking and reversal detection.
- **Keltner:** Composes `computeEMA` + `computeATR`.
- **Donchian:** Uses `slidingMax`/`slidingMin` from utils.ts.
- **CCI:** Typical price → SMA → mean deviation. O(n*k).
- **Pivot Points:** Previous bar's HLC → PP/R/S levels. Supports 'standard', 'fibonacci', 'woodie' variants.

- [ ] **Step 4: Update `src/indicators/index.ts`**

Add all 6 new exports plus utils:

```ts
export { slidingMax, slidingMin } from './utils';
export { computeIchimoku, type IchimokuResult } from './ichimoku';
export { computeParabolicSAR } from './parabolic-sar';
export { computeKeltner, type KeltnerResult } from './keltner';
export { computeDonchian, type DonchianResult } from './donchian';
export { computeCCI } from './cci';
export { computePivotPoints, type PivotPointsResult } from './pivot-points';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/indicators/`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/indicators/ tests/indicators/
git commit -m "feat: add 6 production indicators (Ichimoku, SAR, Keltner, Donchian, CCI, Pivot Points)"
```

---

## Task 3: Transforms (Heikin-Ashi + OHLC Aggregation)

**Files:**
- Create: `src/transforms/heikin-ashi.ts`
- Create: `src/transforms/aggregate.ts`
- Create: `src/transforms/index.ts`
- Test: `tests/transforms/transforms.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/transforms/transforms.test.ts
import { describe, it, expect } from 'vitest';
import { computeHeikinAshi } from '../src/transforms/heikin-ashi';
import { aggregateOHLC } from '../src/transforms/aggregate';
import { createColumnStore } from '../src/core/types';

function makeStore(bars: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>) {
  const store = createColumnStore(bars.length * 2);
  store.length = bars.length;
  for (let i = 0; i < bars.length; i++) {
    store.time[i] = bars[i].time;
    store.open[i] = bars[i].open;
    store.high[i] = bars[i].high;
    store.low[i] = bars[i].low;
    store.close[i] = bars[i].close;
    store.volume[i] = bars[i].volume;
  }
  return store;
}

describe('computeHeikinAshi', () => {
  it('first bar: HA_Close = (O+H+L+C)/4, HA_Open = (O+C)/2', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 15, low: 8, close: 12, volume: 100 },
      { time: 1001, open: 12, high: 16, low: 10, close: 14, volume: 200 },
    ]);
    const ha = computeHeikinAshi(store);
    expect(ha.close[0]).toBe((10 + 15 + 8 + 12) / 4); // 11.25
    expect(ha.open[0]).toBe((10 + 12) / 2);            // 11
  });

  it('subsequent bars use previous HA values', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 15, low: 8, close: 12, volume: 100 },
      { time: 1001, open: 12, high: 16, low: 10, close: 14, volume: 200 },
    ]);
    const ha = computeHeikinAshi(store);
    const prevHAOpen = ha.open[0];
    const prevHAClose = ha.close[0];
    expect(ha.open[1]).toBe((prevHAOpen + prevHAClose) / 2);
    expect(ha.close[1]).toBe((12 + 16 + 10 + 14) / 4); // 13
  });

  it('preserves time and volume', () => {
    const store = makeStore([
      { time: 5000, open: 10, high: 15, low: 8, close: 12, volume: 999 },
    ]);
    const ha = computeHeikinAshi(store);
    expect(ha.time[0]).toBe(5000);
    expect(ha.volume[0]).toBe(999);
  });

  it('HA_High = max(H, HA_Open, HA_Close)', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 15, low: 8, close: 12, volume: 100 },
    ]);
    const ha = computeHeikinAshi(store);
    const haOpen = (10 + 12) / 2;
    const haClose = (10 + 15 + 8 + 12) / 4;
    expect(ha.high[0]).toBe(Math.max(15, haOpen, haClose));
  });
});

describe('aggregateOHLC', () => {
  it('aggregates 1-minute bars into 5-minute bars', () => {
    const bars = [];
    for (let i = 0; i < 10; i++) {
      bars.push({ time: 1000 + i * 60, open: 100 + i, high: 105 + i, low: 95 + i, close: 102 + i, volume: 1000 });
    }
    const store = makeStore(bars);
    const agg = aggregateOHLC(store, 300); // 5 min = 300s
    expect(agg.length).toBe(2); // 10 bars / 5 = 2 aggregated bars
  });

  it('open is first, close is last, high is max, low is min, volume is sum', () => {
    const store = makeStore([
      { time: 0, open: 10, high: 15, low: 8, close: 12, volume: 100 },
      { time: 60, open: 12, high: 18, low: 7, close: 14, volume: 200 },
      { time: 120, open: 14, high: 16, low: 9, close: 11, volume: 150 },
    ]);
    const agg = aggregateOHLC(store, 300); // All 3 bars in one bucket
    expect(agg.length).toBe(1);
    expect(agg.open[0]).toBe(10);   // first open
    expect(agg.high[0]).toBe(18);   // max high
    expect(agg.low[0]).toBe(7);     // min low
    expect(agg.close[0]).toBe(11);  // last close
    expect(agg.volume[0]).toBe(450); // sum volume
  });

  it('bucket time aligns to interval boundary', () => {
    const store = makeStore([
      { time: 130, open: 10, high: 15, low: 8, close: 12, volume: 100 },
    ]);
    const agg = aggregateOHLC(store, 300);
    expect(agg.time[0]).toBe(0); // floor(130/300)*300 = 0
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement heikin-ashi.ts**

```ts
// src/transforms/heikin-ashi.ts
import type { ColumnStore } from '../core/types';
import { createColumnStore } from '../core/types';

export function computeHeikinAshi(store: ColumnStore): ColumnStore {
  const len = store.length;
  const ha = createColumnStore(Math.max(len * 2, store.capacity));
  ha.length = len;

  if (len === 0) return ha;

  // Copy time and volume unchanged
  ha.time.set(store.time.subarray(0, len));
  ha.volume.set(store.volume.subarray(0, len));

  // First bar
  ha.close[0] = (store.open[0] + store.high[0] + store.low[0] + store.close[0]) / 4;
  ha.open[0] = (store.open[0] + store.close[0]) / 2;
  ha.high[0] = Math.max(store.high[0], ha.open[0], ha.close[0]);
  ha.low[0] = Math.min(store.low[0], ha.open[0], ha.close[0]);

  for (let i = 1; i < len; i++) {
    ha.close[i] = (store.open[i] + store.high[i] + store.low[i] + store.close[i]) / 4;
    ha.open[i] = (ha.open[i - 1] + ha.close[i - 1]) / 2;
    ha.high[i] = Math.max(store.high[i], ha.open[i], ha.close[i]);
    ha.low[i] = Math.min(store.low[i], ha.open[i], ha.close[i]);
  }

  return ha;
}
```

- [ ] **Step 4: Implement aggregate.ts**

```ts
// src/transforms/aggregate.ts
import type { ColumnStore } from '../core/types';
import { createColumnStore } from '../core/types';

export function aggregateOHLC(source: ColumnStore, targetIntervalSec: number): ColumnStore {
  if (source.length === 0) return createColumnStore(0);

  // Count buckets first
  let bucketCount = 0;
  let lastBucket = -1;
  for (let i = 0; i < source.length; i++) {
    const bucket = Math.floor(source.time[i] / targetIntervalSec) * targetIntervalSec;
    if (bucket !== lastBucket) {
      bucketCount++;
      lastBucket = bucket;
    }
  }

  const result = createColumnStore(Math.max(bucketCount * 2, 64));
  result.length = bucketCount;

  let outIdx = -1;
  lastBucket = -1;

  for (let i = 0; i < source.length; i++) {
    const bucket = Math.floor(source.time[i] / targetIntervalSec) * targetIntervalSec;

    if (bucket !== lastBucket) {
      outIdx++;
      lastBucket = bucket;
      result.time[outIdx] = bucket;
      result.open[outIdx] = source.open[i];
      result.high[outIdx] = source.high[i];
      result.low[outIdx] = source.low[i];
      result.close[outIdx] = source.close[i];
      result.volume[outIdx] = source.volume[i];
    } else {
      if (source.high[i] > result.high[outIdx]) result.high[outIdx] = source.high[i];
      if (source.low[i] < result.low[outIdx]) result.low[outIdx] = source.low[i];
      result.close[outIdx] = source.close[i];
      result.volume[outIdx] += source.volume[i];
    }
  }

  return result;
}
```

- [ ] **Step 5: Create index.ts**

```ts
// src/transforms/index.ts
export { computeHeikinAshi } from './heikin-ashi';
export { aggregateOHLC } from './aggregate';
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/transforms/`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/transforms/ tests/transforms/
git commit -m "feat: add Heikin-Ashi transform and OHLC aggregation utility"
```

---

## Task 4: Periodicity Model

**Files:**
- Create: `src/core/periodicity.ts`
- Test: `tests/core/periodicity.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/core/periodicity.test.ts
import { describe, it, expect } from 'vitest';
import { Periodicity, periodicityToSeconds, periodicityToLabel } from '../src/core/periodicity';

describe('Periodicity', () => {
  it('converts minute periodicity to seconds', () => {
    expect(periodicityToSeconds({ interval: 5, unit: 'minute' })).toBe(300);
  });

  it('converts hour periodicity to seconds', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'hour' })).toBe(3600);
  });

  it('converts day periodicity to seconds', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'day' })).toBe(86400);
  });

  it('generates human-readable label', () => {
    expect(periodicityToLabel({ interval: 1, unit: 'minute' })).toBe('1m');
    expect(periodicityToLabel({ interval: 5, unit: 'minute' })).toBe('5m');
    expect(periodicityToLabel({ interval: 1, unit: 'hour' })).toBe('1h');
    expect(periodicityToLabel({ interval: 1, unit: 'day' })).toBe('1D');
    expect(periodicityToLabel({ interval: 1, unit: 'week' })).toBe('1W');
    expect(periodicityToLabel({ interval: 1, unit: 'month' })).toBe('1M');
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/core/periodicity.ts
export interface Periodicity {
  interval: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export function periodicityToSeconds(p: Periodicity): number {
  switch (p.unit) {
    case 'second': return p.interval;
    case 'minute': return p.interval * 60;
    case 'hour': return p.interval * 3600;
    case 'day': return p.interval * 86400;
    case 'week': return p.interval * 604800;
    case 'month': return p.interval * 2592000; // 30 days approximation
  }
}

const UNIT_LABELS: Record<string, string> = {
  second: 's', minute: 'm', hour: 'h', day: 'D', week: 'W', month: 'M',
};

export function periodicityToLabel(p: Periodicity): string {
  return `${p.interval}${UNIT_LABELS[p.unit]}`;
}
```

- [ ] **Step 3: Run tests, commit**

```bash
npx vitest run tests/core/periodicity.test.ts
git add src/core/periodicity.ts tests/core/periodicity.test.ts
git commit -m "feat: add Periodicity model with conversion utilities"
```

---

## Task 5: Market Sessions

**Files:**
- Create: `src/core/market-session.ts`
- Test: `tests/core/market-session.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/core/market-session.test.ts
import { describe, it, expect } from 'vitest';
import { MarketSession, US_EQUITY_SESSIONS, isInSession, getSessionForTime } from '../src/core/market-session';

describe('MarketSession', () => {
  it('US_EQUITY_SESSIONS has premarket, regular, postmarket', () => {
    expect(US_EQUITY_SESSIONS).toHaveLength(3);
    expect(US_EQUITY_SESSIONS.map(s => s.id)).toEqual(['premarket', 'regular', 'postmarket']);
  });

  it('isInSession returns true for time within session', () => {
    const regular = US_EQUITY_SESSIONS.find(s => s.id === 'regular')!;
    // 10:00 AM = 600 minutes from midnight
    expect(isInSession(600, regular)).toBe(true);
  });

  it('isInSession returns false for time outside session', () => {
    const regular = US_EQUITY_SESSIONS.find(s => s.id === 'regular')!;
    // 3:00 AM = 180 minutes from midnight
    expect(isInSession(180, regular)).toBe(false);
  });

  it('getSessionForTime returns correct session', () => {
    // 10:00 AM = 600 minutes
    const session = getSessionForTime(600, US_EQUITY_SESSIONS);
    expect(session?.id).toBe('regular');
  });

  it('getSessionForTime returns null for out-of-session', () => {
    // 3:00 AM = 180 minutes
    const session = getSessionForTime(180, US_EQUITY_SESSIONS);
    expect(session).toBeNull();
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/core/market-session.ts
export interface MarketSession {
  id: string;
  label: string;
  startMinute: number;  // minutes from midnight in exchange timezone
  endMinute: number;
  bgColor: string;
}

export const US_EQUITY_SESSIONS: MarketSession[] = [
  { id: 'premarket', label: 'PRE', startMinute: 240, endMinute: 570, bgColor: 'rgba(255,235,59,0.05)' },
  { id: 'regular', label: '', startMinute: 570, endMinute: 960, bgColor: 'transparent' },
  { id: 'postmarket', label: 'POST', startMinute: 960, endMinute: 1200, bgColor: 'rgba(255,235,59,0.05)' },
];

export function isInSession(minuteOfDay: number, session: MarketSession): boolean {
  return minuteOfDay >= session.startMinute && minuteOfDay < session.endMinute;
}

export function getSessionForTime(minuteOfDay: number, sessions: MarketSession[]): MarketSession | null {
  for (const s of sessions) {
    if (isInSession(minuteOfDay, s)) return s;
  }
  return null;
}

export function timestampToMinuteOfDay(timestamp: number, utcOffsetMinutes: number = -300): number {
  const totalMinutes = Math.floor(timestamp / 60) + utcOffsetMinutes;
  return ((totalMinutes % 1440) + 1440) % 1440;
}
```

- [ ] **Step 3: Run tests, commit**

```bash
npx vitest run tests/core/market-session.test.ts
git add src/core/market-session.ts tests/core/market-session.test.ts
git commit -m "feat: add MarketSession model with US equity defaults"
```

---

## Task 6: DataLayer prependData + barsInLogicalRange

**Files:**
- Modify: `src/core/data-layer.ts`
- Modify: `src/api/series-api.ts`
- Test: `tests/core/data-layer-prepend.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/core/data-layer-prepend.test.ts
import { describe, it, expect } from 'vitest';
import { DataLayer } from '../src/core/data-layer';

describe('DataLayer.prepend', () => {
  it('prepends bars before existing data', () => {
    const dl = new DataLayer();
    dl.setData([
      { time: 100, open: 1, high: 2, low: 0, close: 1.5 },
      { time: 200, open: 2, high: 3, low: 1, close: 2.5 },
    ]);
    expect(dl.store.length).toBe(2);

    dl.prepend([
      { time: 50, open: 0.5, high: 1.5, low: 0, close: 1 },
    ]);
    expect(dl.store.length).toBe(3);
    expect(dl.store.time[0]).toBe(50);
    expect(dl.store.time[1]).toBe(100);
    expect(dl.store.time[2]).toBe(200);
  });

  it('preserves existing data after prepend', () => {
    const dl = new DataLayer();
    dl.setData([
      { time: 100, open: 10, high: 20, low: 5, close: 15 },
    ]);
    dl.prepend([
      { time: 50, open: 5, high: 10, low: 2, close: 8 },
    ]);
    expect(dl.store.open[1]).toBe(10);
    expect(dl.store.close[1]).toBe(15);
  });

  it('handles prepend to empty store', () => {
    const dl = new DataLayer();
    dl.prepend([
      { time: 100, open: 10, high: 20, low: 5, close: 15 },
    ]);
    expect(dl.store.length).toBe(1);
    expect(dl.store.time[0]).toBe(100);
  });
});
```

- [ ] **Step 2: Implement DataLayer.prepend()**

Read `src/core/data-layer.ts` first to understand the existing pattern, then add:

```ts
prepend(data: Bar[] | ColumnData): void {
  // Convert to bars if ColumnData
  const bars = Array.isArray(data) ? data : columnDataToBars(data);
  if (bars.length === 0) return;

  const oldLen = this.store.length;
  const newLen = oldLen + bars.length;
  const newCapacity = Math.max(Math.ceil(newLen * 1.5), 2048);
  const newStore = createColumnStore(newCapacity);
  newStore.length = newLen;

  // Copy new data at front
  for (let i = 0; i < bars.length; i++) {
    newStore.time[i] = bars[i].time;
    newStore.open[i] = bars[i].open;
    newStore.high[i] = bars[i].high;
    newStore.low[i] = bars[i].low;
    newStore.close[i] = bars[i].close;
    newStore.volume[i] = bars[i].volume ?? 0;
  }

  // Copy existing data after
  for (const field of ['time', 'open', 'high', 'low', 'close', 'volume'] as const) {
    newStore[field].set(this.store[field].subarray(0, oldLen), bars.length);
  }

  this.store = newStore;
}
```

- [ ] **Step 3: Add `prependData()` and `barsInLogicalRange()` to SeriesApi**

In `src/api/series-api.ts`, add to ISeriesApi interface and implement:

```ts
// ISeriesApi additions
prependData(data: Bar[] | ColumnData): void;
barsInLogicalRange(range: { from: number; to: number }): { barsBefore: number; barsAfter: number; from: number; to: number };
```

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run tests/core/data-layer-prepend.test.ts
git add src/core/data-layer.ts src/api/series-api.ts tests/core/
git commit -m "feat: add prependData and barsInLogicalRange for pagination support"
```

---

## Task 7: Comparison Mode on PriceScale

**Files:**
- Modify: `src/core/price-scale.ts`
- Modify: `src/api/chart-api.ts` (comparison API methods)
- Test: `tests/core/comparison.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/core/comparison.test.ts
import { describe, it, expect } from 'vitest';
import { PriceScale } from '../src/core/price-scale';

describe('PriceScale comparison mode', () => {
  it('percentToY maps 0% to the basis position', () => {
    const scale = new PriceScale('right');
    scale.setHeight(400);
    scale.setComparisonMode(true);
    scale.autoScale(-10, 10); // -10% to +10%
    const yAt0 = scale.percentToY(0);
    // 0% should be roughly in the middle area
    expect(yAt0).toBeGreaterThan(50);
    expect(yAt0).toBeLessThan(350);
  });

  it('positive percent maps above 0%, negative below', () => {
    const scale = new PriceScale('right');
    scale.setHeight(400);
    scale.setComparisonMode(true);
    scale.autoScale(-10, 10);
    const yPositive = scale.percentToY(5);
    const yZero = scale.percentToY(0);
    const yNegative = scale.percentToY(-5);
    // In canvas, higher Y = lower on screen, so positive% should have lower Y value
    expect(yPositive).toBeLessThan(yZero);
    expect(yNegative).toBeGreaterThan(yZero);
  });

  it('yToPercent is inverse of percentToY', () => {
    const scale = new PriceScale('right');
    scale.setHeight(400);
    scale.setComparisonMode(true);
    scale.autoScale(-20, 20);
    const y = scale.percentToY(7.5);
    const pct = scale.yToPercent(y);
    expect(pct).toBeCloseTo(7.5, 1);
  });

  it('comparisonMode flag toggles', () => {
    const scale = new PriceScale('right');
    expect(scale.isComparisonMode()).toBe(false);
    scale.setComparisonMode(true);
    expect(scale.isComparisonMode()).toBe(true);
  });
});
```

- [ ] **Step 2: Implement comparison mode on PriceScale**

Add to `src/core/price-scale.ts`:

```ts
private _comparisonMode = false;

setComparisonMode(enabled: boolean): void { this._comparisonMode = enabled; }
isComparisonMode(): boolean { return this._comparisonMode; }

percentToY(percent: number): number {
  // Same math as priceToY but operating in percent space
  return this.priceToY(percent);
}

yToPercent(y: number): number {
  return this.yToPrice(y);
}
```

When comparison mode is on, the autoScale receives percent min/max instead of raw price min/max. The renderers convert prices to percent before calling priceToY.

- [ ] **Step 3: Add comparison API to chart-api.ts**

Add `setComparisonMode(enabled)` and `isComparisonMode()` to IChartApi. In `_paintPane()`, when comparison mode is on, compute basis prices and transform coordinates.

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run tests/core/comparison.test.ts
git add src/core/price-scale.ts src/api/chart-api.ts tests/core/comparison.test.ts
git commit -m "feat: add comparison mode with percentage change Y-axis"
```

---

## Task 8: Drawing Tools Infrastructure

**Files:**
- Create: `src/drawings/base.ts`
- Create: `src/drawings/horizontal-line.ts`
- Create: `src/drawings/vertical-line.ts`
- Create: `src/drawings/trendline.ts`
- Create: `src/drawings/fibonacci.ts`
- Create: `src/drawings/rectangle.ts`
- Create: `src/drawings/text-annotation.ts`
- Create: `src/drawings/index.ts`
- Create: `src/interactions/drawing-handler.ts`
- Modify: `src/interactions/event-router.ts` (handler return boolean)
- Modify: `src/api/chart-api.ts` (drawing API methods)
- Test: `tests/drawings/drawings.test.ts`
- Test: `tests/drawings/hit-test.test.ts`

This is the largest task. It implements the full drawing system: base class, 6 drawing types, hit testing, interaction handler, and chart API integration.

- [ ] **Step 1: Create drawing hit-test test file**

```ts
// tests/drawings/hit-test.test.ts
import { describe, it, expect } from 'vitest';
import { distToSegment, pointInRect } from '../src/drawings/base';

describe('distToSegment', () => {
  it('returns 0 for point on segment', () => {
    expect(distToSegment(5, 5, 0, 0, 10, 10)).toBeCloseTo(0, 1);
  });

  it('returns perpendicular distance for point near middle', () => {
    // Point (5, 0) to horizontal segment (0,0)→(10,0) = distance 0
    expect(distToSegment(5, 0, 0, 0, 10, 0)).toBeCloseTo(0, 1);
    // Point (5, 3) to horizontal segment (0,0)→(10,0) = distance 3
    expect(distToSegment(5, 3, 0, 0, 10, 0)).toBeCloseTo(3, 1);
  });

  it('returns distance to endpoint for point beyond segment', () => {
    // Point (15, 0) to segment (0,0)→(10,0) = distance 5
    expect(distToSegment(15, 0, 0, 0, 10, 0)).toBeCloseTo(5, 1);
  });
});

describe('pointInRect', () => {
  it('returns true for point inside rectangle', () => {
    expect(pointInRect(5, 5, 0, 0, 10, 10)).toBe(true);
  });

  it('returns false for point outside rectangle', () => {
    expect(pointInRect(15, 5, 0, 0, 10, 10)).toBe(false);
  });

  it('handles inverted coordinates (x1 > x2)', () => {
    expect(pointInRect(5, 5, 10, 10, 0, 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Create drawing serialization test file**

```ts
// tests/drawings/drawings.test.ts
import { describe, it, expect } from 'vitest';
import { createBuiltinDrawing, DRAWING_REGISTRY } from '../src/drawings/index';

describe('Drawing Registry', () => {
  it('has all 6 built-in types', () => {
    expect(DRAWING_REGISTRY.has('horizontalLine')).toBe(true);
    expect(DRAWING_REGISTRY.has('verticalLine')).toBe(true);
    expect(DRAWING_REGISTRY.has('trendline')).toBe(true);
    expect(DRAWING_REGISTRY.has('fibonacci')).toBe(true);
    expect(DRAWING_REGISTRY.has('rectangle')).toBe(true);
    expect(DRAWING_REGISTRY.has('text')).toBe(true);
  });

  it('creates a drawing with correct type', () => {
    const drawing = createBuiltinDrawing('trendline', 'test-1', [
      { time: 1000, price: 100 },
      { time: 2000, price: 110 },
    ], {});
    expect(drawing.drawingType).toBe('trendline');
    expect(drawing.requiredPoints).toBe(2);
    expect(drawing.points).toHaveLength(2);
  });

  it('serializes and can be deserialized', () => {
    const drawing = createBuiltinDrawing('horizontalLine', 'test-2', [
      { time: 0, price: 150 },
    ], { color: '#ff0000' });
    const serialized = drawing.serialize();
    expect(serialized.type).toBe('horizontalLine');
    expect(serialized.id).toBe('test-2');
    expect(serialized.points[0].price).toBe(150);
    expect(serialized.options.color).toBe('#ff0000');
  });

  it('fibonacci has requiredPoints = 2', () => {
    const drawing = createBuiltinDrawing('fibonacci', 'fib-1', [
      { time: 1000, price: 100 },
      { time: 2000, price: 150 },
    ], {});
    expect(drawing.requiredPoints).toBe(2);
  });
});
```

- [ ] **Step 3: Implement drawing base and all 6 types**

Create `src/drawings/base.ts` with:
- `AnchorPoint`, `DrawingOptions`, `SerializedDrawing`, `DrawingHitTestResult` types
- `distToSegment()` and `pointInRect()` hit-test utilities
- Internal base implementation with common paneView/renderer logic

Create each of the 6 drawing files implementing `ISeriesPrimitive & DrawingPrimitive`.

Create `src/drawings/index.ts` with the `DRAWING_REGISTRY` map and `createBuiltinDrawing()` factory.

- [ ] **Step 4: Implement DrawingInteractionHandler**

Create `src/interactions/drawing-handler.ts` with the state machine (IDLE → SELECTING → PLACING → EDITING). Modify `src/interactions/event-router.ts` so handler `onPointerDown` returns boolean for event consumption.

- [ ] **Step 5: Integrate drawings into chart-api.ts**

Add to IChartApi: `addDrawing()`, `removeDrawing()`, `getDrawings()`, `setActiveDrawingTool()`, `registerDrawingType()`, `serializeDrawings()`, `deserializeDrawings()`.

- [ ] **Step 6: Run all drawing tests**

```bash
npx vitest run tests/drawings/
```

- [ ] **Step 7: Commit**

```bash
git add src/drawings/ src/interactions/drawing-handler.ts src/interactions/event-router.ts src/api/chart-api.ts tests/drawings/
git commit -m "feat: extensible drawing tools with 6 built-in types and interaction handler"
```

---

## Task 9: Enhanced Event Markers

**Files:**
- Modify: `src/core/series-markers.ts`
- Modify: `src/api/series-api.ts`
- Modify: `src/api/chart-api.ts` (event tooltip rendering)
- Test: `tests/core/events.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/core/events.test.ts
import { describe, it, expect } from 'vitest';
import type { ChartEvent } from '../src/core/series-markers';

describe('ChartEvent type', () => {
  it('extends SeriesMarker with event fields', () => {
    const event: ChartEvent = {
      time: 1000,
      position: 'belowBar',
      shape: 'circle',
      color: '#4caf50',
      eventType: 'dividend',
      title: 'Dividend',
      description: 'Quarterly dividend',
      value: '$0.52/share',
    };
    expect(event.eventType).toBe('dividend');
    expect(event.title).toBe('Dividend');
  });
});
```

- [ ] **Step 2: Implement ChartEvent type and setEvents/getEvents**

Extend `SeriesMarker` in `src/core/series-markers.ts`:

```ts
export interface ChartEvent extends SeriesMarker {
  eventType: 'earnings' | 'dividend' | 'split' | 'ipo' | 'other';
  title: string;
  description?: string;
  value?: string;
}
```

Add `setEvents()` / `getEvents()` to ISeriesApi and SeriesApi. Events are stored separately from markers and rendered with tooltip support.

Add event tooltip rendering in chart-api.ts: single DOM tooltip positioned on hover, hidden otherwise.

- [ ] **Step 3: Run tests, commit**

```bash
npx vitest run tests/core/events.test.ts
git add src/core/series-markers.ts src/api/series-api.ts src/api/chart-api.ts tests/core/events.test.ts
git commit -m "feat: enhanced event markers with tooltips for dividends, splits, earnings"
```

---

## Task 10: Chart State Save/Restore

**Files:**
- Create: `src/core/chart-state.ts`
- Modify: `src/api/chart-api.ts`
- Test: `tests/core/chart-state.test.ts`

- [ ] **Step 1: Create test file**

```ts
// tests/core/chart-state.test.ts
import { describe, it, expect } from 'vitest';
import type { ChartState } from '../src/core/chart-state';
import { validateChartState, CHART_STATE_VERSION } from '../src/core/chart-state';

describe('ChartState', () => {
  it('validates a well-formed state', () => {
    const state: ChartState = {
      version: CHART_STATE_VERSION,
      options: { layout: { backgroundColor: '#000' } },
      timeScale: { barSpacing: 6, rightOffset: 0 },
      series: [{ id: 's1', type: 'candlestick', options: {} }],
      indicators: [],
      panes: [],
      drawings: [],
    };
    expect(validateChartState(state)).toBe(true);
  });

  it('rejects state with wrong version', () => {
    const state = { version: -1 } as ChartState;
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects state without series array', () => {
    const state = { version: CHART_STATE_VERSION } as ChartState;
    expect(validateChartState(state)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement ChartState type and validation**

```ts
// src/core/chart-state.ts
import type { DeepPartial } from './types';
import type { ChartOptions, IndicatorType } from '../api/options';
import type { SeriesType } from './types';
import type { Periodicity } from './periodicity';
import type { MarketSession } from './market-session';
import type { SerializedDrawing } from '../drawings/base';

export const CHART_STATE_VERSION = 1;

export interface ChartState {
  version: number;
  options: DeepPartial<ChartOptions>;
  periodicity?: Periodicity;
  comparisonMode?: boolean;
  timeScale: { barSpacing: number; rightOffset: number };
  series: Array<{ id: string; type: SeriesType; options: Record<string, unknown> }>;
  indicators: Array<{ type: IndicatorType; sourceSeriesId: string; params: Record<string, number>; color?: string }>;
  panes: Array<{ id: string; height: number }>;
  drawings: SerializedDrawing[];
  marketSessions?: MarketSession[];
  sessionFilter?: string;
  visibleRange?: { from: number; to: number };
}

export function validateChartState(state: unknown): state is ChartState {
  if (!state || typeof state !== 'object') return false;
  const s = state as Record<string, unknown>;
  if (s.version !== CHART_STATE_VERSION) return false;
  if (!Array.isArray(s.series)) return false;
  return true;
}
```

- [ ] **Step 3: Add exportState/importState to chart-api.ts**

```ts
// IChartApi additions
exportState(): ChartState;
importState(state: ChartState, dataLoader: (seriesId: string) => Promise<Bar[]>): Promise<void>;
```

Export collects current options, series configs, indicator configs, pane heights, drawing serializations, and visible range.

Import follows the restore flow: options → panes → series (no data) → data loads (parallel) → indicators → drawings → viewport.

- [ ] **Step 4: Run tests, commit**

```bash
npx vitest run tests/core/chart-state.test.ts
git add src/core/chart-state.ts src/api/chart-api.ts tests/core/chart-state.test.ts
git commit -m "feat: chart state save/restore with JSON serialization"
```

---

## Task 11: Integration — Wire Periodicity, Sessions, Heikin-Ashi into Chart API

**Files:**
- Modify: `src/api/chart-api.ts`
- Modify: `src/api/options.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add periodicity API to chart-api.ts**

```ts
// IChartApi additions
setPeriodicity(periodicity: Periodicity): void;
getPeriodicity(): Periodicity;
subscribePeriodicityChange(handler: (p: Periodicity) => void): void;
```

Store `_periodicity: Periodicity` on ChartApi. `setPeriodicity()` updates it, fires callbacks, and updates time-axis label formatting.

- [ ] **Step 2: Add market session API**

```ts
// IChartApi additions
setMarketSessions(sessions: MarketSession[]): void;
setSessionFilter(filter: 'regular' | 'extended' | 'all'): void;
```

Store sessions and filter. In `_paintPane()`, render session background shading. In time axis, render session labels at boundaries.

- [ ] **Step 3: Add heikin-ashi support**

When series type is `'heikin-ashi'`, `setData()` stores raw data AND a transformed ColumnStore. The rendered data is the HA transform; indicators use raw data.

- [ ] **Step 4: Register new indicators in the dispatcher**

Add Ichimoku, SAR, Keltner, Donchian, CCI, Pivot Points to `_computeIndicator()` and `DEFAULT_INDICATOR_PARAMS`.

- [ ] **Step 5: Update exports in `src/index.ts`**

Export all new types: `DrawingType`, `DrawingOptions`, `AnchorPoint`, `SerializedDrawing`, `IDrawingApi`, `ChartState`, `Periodicity`, `ChartEvent`, `MarketSession`, new indicator types.

- [ ] **Step 6: Verify build**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/api/ src/index.ts
git commit -m "feat: integrate periodicity, market sessions, heikin-ashi, and new indicators into chart API"
```

---

## Task 12: Storybook Stories

**Files:**
- Create: `stories/Features/DrawingTools.stories.ts`
- Create: `stories/Features/ComparisonMode.stories.ts`
- Create: `stories/Features/HeikinAshi.stories.ts`
- Create: `stories/Features/ExtendedHours.stories.ts`
- Create: `stories/Features/EventMarkers.stories.ts`
- Create: `stories/Features/ChartState.stories.ts`
- Create: `stories/Features/Pagination.stories.ts`
- Create: `stories/Features/Periodicity.stories.ts`
- Create: `stories/Indicators-Production.stories.ts`

Each story follows the existing pattern. Demo buttons for interactive features (save/load state, activate drawing tools, toggle comparison). Use `AAPL_DAILY` from sample-data.

- [ ] **Step 1: Create all 9 story files**

- [ ] **Step 2: Verify in storybook**

```bash
npm run storybook
```

- [ ] **Step 3: Commit**

```bash
git add stories/
git commit -m "feat: storybook stories for drawings, comparison, heikin-ashi, sessions, events, state, pagination, periodicity, and production indicators"
```

---

## Task 13: Documentation Update

**Files:**
- Modify: `docs/api-reference.md`
- Modify: `docs/indicators.md`
- Create: `docs/drawings.md`
- Create: `docs/data-integration.md`
- Modify: `README.md`

- [ ] **Step 1: Update API reference with all new methods**

Document: `addDrawing`, `removeDrawing`, `setActiveDrawingTool`, `registerDrawingType`, `serializeDrawings`, `deserializeDrawings`, `setComparisonMode`, `setPeriodicity`, `setMarketSessions`, `setSessionFilter`, `exportState`, `importState`, `fitContent`, `takeScreenshot`, `prependData`, `barsInLogicalRange`, `setEvents`.

- [ ] **Step 2: Update indicators.md with 6 new indicators**

- [ ] **Step 3: Create drawings.md**

Document the drawing system: built-in types, custom drawing tutorial, serialization format.

- [ ] **Step 4: Create data-integration.md**

Document: pagination pattern, real-time streaming pattern, periodicity switching, comparison mode.

- [ ] **Step 5: Update README**

Update feature list with new capabilities.

- [ ] **Step 6: Commit**

```bash
git add docs/ README.md
git commit -m "docs: update documentation for production features"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Production build**

```bash
npm run build
```

- [ ] **Step 4: Storybook check**

```bash
npm run storybook
```

Verify all new stories render correctly.

- [ ] **Step 5: Fix any issues found**

- [ ] **Step 6: Final commit if needed**
