# Extended Indicators & Functional Features

**Date:** 2026-04-03
**Scope:** Single PR with two logical commits — indicators, then functional features
**Goal:** Fill remaining gaps in the library's indicator toolkit and public API surface

---

## A. New Indicators (6)

All indicators follow the established pattern in `src/indicators/`:
- Pure functions taking `Float64Array` inputs
- Return `Float64Array` (single-value) or typed result object (multi-value)
- NaN-filled for indices with insufficient data
- O(n) computation
- Exported from `fin-charter/indicators` path

### A1. VWAP (Volume Weighted Average Price)

**File:** `src/indicators/vwap.ts`

```ts
export function computeVWAP(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  length: number,
): Float64Array
```

- Cumulative: `sum(typicalPrice * volume) / sum(volume)` where typicalPrice = `(H+L+C)/3`
- No `period` parameter — VWAP is cumulative from start
- Valid from index 0 onwards (NaN only if cumulative volume is 0)

### A2. Stochastic Oscillator

**File:** `src/indicators/stochastic.ts`

```ts
export interface StochasticResult {
  k: Float64Array;
  d: Float64Array;
}

export function computeStochastic(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  kPeriod: number,
  dPeriod: number,
): StochasticResult
```

- %K = `(close - lowestLow(kPeriod)) / (highestHigh(kPeriod) - lowestLow(kPeriod)) * 100`
- %D = SMA of %K over `dPeriod`
- NaN fill: K `[0, kPeriod-2]`, D `[0, kPeriod+dPeriod-3]`

### A3. ATR (Average True Range)

**File:** `src/indicators/atr.ts`

```ts
export function computeATR(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): Float64Array
```

- True Range = `max(H-L, |H-prevC|, |L-prevC|)`
- ATR = Wilder smoothing of True Range over `period`
- NaN fill: `[0, period-1]`

### A4. ADX (Average Directional Index)

**File:** `src/indicators/adx.ts`

```ts
export interface ADXResult {
  adx: Float64Array;
  plusDI: Float64Array;
  minusDI: Float64Array;
}

export function computeADX(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): ADXResult
```

- Builds on directional movement (+DM/-DM), smoothed with Wilder's method
- +DI and -DI = smoothed directional movement / ATR * 100
- ADX = Wilder smoothing of `|+DI - -DI| / (+DI + -DI) * 100`
- NaN fill: `[0, 2*period-1]` (two smoothing passes)

### A5. OBV (On-Balance Volume)

**File:** `src/indicators/obv.ts`

```ts
export function computeOBV(
  close: Float64Array,
  volume: Float64Array,
  length: number,
): Float64Array
```

- Cumulative: if `close > prevClose`, add volume; if `close < prevClose`, subtract volume; else unchanged
- No period parameter
- Index 0 = 0 (seed), index 1+ always valid. No NaN fill needed.

### A6. Williams %R

**File:** `src/indicators/williams-r.ts`

```ts
export function computeWilliamsR(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): Float64Array
```

- `%R = (highestHigh - close) / (highestHigh - lowestLow) * -100`
- Range: -100 to 0
- NaN fill: `[0, period-2]`

### Indicator Exports

Add all 6 to `src/indicators/index.ts`:

```ts
export { computeVWAP } from './vwap';
export { computeStochastic, type StochasticResult } from './stochastic';
export { computeATR } from './atr';
export { computeADX, type ADXResult } from './adx';
export { computeOBV } from './obv';
export { computeWilliamsR } from './williams-r';
```

No changes to `src/index.ts` — indicators stay on the `fin-charter/indicators` import path.

---

## B. Functional Features (4)

### B1. takeScreenshot()

**Location:** `IChartApi` interface + `ChartApi` class in `src/api/chart-api.ts`

```ts
// IChartApi addition
takeScreenshot(): HTMLCanvasElement;
```

Implementation composites all canvas layers onto one offscreen canvas:

1. Create offscreen canvas sized to wrapper dimensions * pixelRatio
2. Draw layers in visual stacking order:
   - Left price axis canvas at (0, 0)
   - Chart canvas at (leftScaleW, 0)
   - Overlay canvas at (leftScaleW, 0)
   - Right price axis canvas at (leftScaleW + chartW, 0)
   - Time axis canvas at (0, chartH)
3. Return the canvas element

Caller uses `.toDataURL()` or `.toBlob()` as needed. No new options.

### B2. fitContent()

**Location:** `IChartApi` interface + `ChartApi` class in `src/api/chart-api.ts`

```ts
// IChartApi addition
fitContent(): void;
```

Delegates to existing `TimeScale.fitContent()` + triggers `InvalidationLevel.Full` repaint. One-liner.

### B3. Custom Time Formatter

**Location:** `TimeScaleApiOptions` in `src/api/options.ts`, time axis paint in `chart-api.ts`

```ts
// TimeScaleApiOptions addition
tickMarkFormatter?: (time: number, tickType: 'year' | 'month' | 'day' | 'time') => string;
```

- `time`: Unix timestamp (seconds)
- `tickType`: granularity hint for this specific tick mark
- Returns: formatted string

The existing `_paintTimeAxis()` method checks for a custom formatter first, falls back to built-in `Date` formatting logic.

### B4. subscribeDataChanged / unsubscribeDataChanged

**Location:** `ISeriesApi` interface + `SeriesApi` class in `src/api/series-api.ts`

```ts
export type DataChangedCallback = () => void;

// ISeriesApi additions
subscribeDataChanged(callback: DataChangedCallback): void;
unsubscribeDataChanged(callback: DataChangedCallback): void;
```

- Callbacks stored in a `Set<DataChangedCallback>` on SeriesApi
- Fired at the end of `setData()` and `update()` methods
- No arguments — just a notification signal
- Export `DataChangedCallback` type from `src/index.ts`

---

## C. Storybook Stories

### C1. Extended Indicators Story

**File:** `stories/Indicators-Extended.stories.ts`

Demonstrates all 6 new indicators on a candlestick chart:
- VWAP as overlay line on main pane
- Stochastic K/D in a separate pane
- ATR in a separate pane
- ADX (+DI/-DI/ADX) in a separate pane
- OBV in a separate pane
- Williams %R in a separate pane

### C2. Feature Stories

- `stories/Features/Screenshot.stories.ts` — button triggers `takeScreenshot()`, displays result as `<img>`
- `stories/Features/FitContent.stories.ts` — zooms in first, then button calls `fitContent()`
- `stories/Features/TimeFormatter.stories.ts` — custom formatter showing e.g. relative dates
- `stories/Features/DataChanged.stories.ts` — real-time updates with counter showing data change event count

---

## Files Changed Summary

**New files (indicators):**
- `src/indicators/vwap.ts`
- `src/indicators/stochastic.ts`
- `src/indicators/atr.ts`
- `src/indicators/adx.ts`
- `src/indicators/obv.ts`
- `src/indicators/williams-r.ts`

**New files (stories):**
- `stories/Indicators-Extended.stories.ts`
- `stories/Features/Screenshot.stories.ts`
- `stories/Features/FitContent.stories.ts`
- `stories/Features/TimeFormatter.stories.ts`
- `stories/Features/DataChanged.stories.ts`

**Modified files:**
- `src/indicators/index.ts` — add 6 new exports
- `src/api/chart-api.ts` — add `takeScreenshot()`, `fitContent()`, time formatter support in `_paintTimeAxis()`
- `src/api/series-api.ts` — add `subscribeDataChanged()` / `unsubscribeDataChanged()`, fire from `setData()` / `update()`
- `src/api/options.ts` — add `tickMarkFormatter` to `TimeScaleApiOptions`
- `src/index.ts` — export `DataChangedCallback` type
