# Indicators

Indicators are pure compute functions that operate on `Float64Array` columns and return `Float64Array` results (or a plain object of `Float64Array`s for multi-output indicators). They have no side effects and no dependency on the chart instance.

## Import

```ts
import {
  computeSMA,
  computeEMA,
  computeBollinger,
  computeRSI,
  computeMACD,
  computeVolume,
  // New in this release
  computeIchimoku,
  computeParabolicSAR,
  computeKeltner,
  computeDonchian,
  computeCCI,
  computePivotPoints,
  slidingMax,
  slidingMin,
} from 'fin-charter/indicators';
```

The `fin-charter/indicators` entry point is separate from the core so that bundlers exclude indicators when they are not used.

---

## SMA — Simple Moving Average

**Overlay indicator, single line.**

```ts
function computeSMA(
  close:  Float64Array,
  length: number,
  period: number,
): Float64Array
```

**Parameters**

| Parameter | Description |
|---|---|
| `close` | Close-price column from a `ColumnStore` |
| `length` | Number of bars to process (`store.length`) |
| `period` | Look-back window in bars |

**Returns** `Float64Array` of length `length`. Values before index `period - 1` are `NaN`.

Uses a sliding-window O(1)-per-bar algorithm.

**Usage**

```ts
import { createChart } from 'fin-charter';
import { computeSMA } from 'fin-charter/indicators';

const chart = createChart(container);
const candles = chart.addCandlestickSeries();
candles.setData(bars);

// Compute SMA-20 from the internal store
const store = /* obtain store from plugin or external data */;
const sma20 = computeSMA(store.close, store.length, 20);

// Render as a line series
const smaSeries = chart.addLineSeries({ color: '#ff9800' });
smaSeries.setData(
  Array.from({ length: store.length }, (_, i) => ({
    time:  store.time[i],
    open:  sma20[i],
    high:  sma20[i],
    low:   sma20[i],
    close: sma20[i],
  })).filter(b => !isNaN(b.close))
);
```

---

## EMA — Exponential Moving Average

**Overlay indicator, single line.**

```ts
function computeEMA(
  close:  Float64Array,
  length: number,
  period: number,
): Float64Array
```

**Parameters** — same as `computeSMA`.

**Returns** `Float64Array` of length `length`. Values before index `period - 1` are `NaN`.

The first EMA value is seeded with the SMA of the first `period` bars. Subsequent values use the standard EMA multiplier `k = 2 / (period + 1)`.

**Usage**

```ts
const ema20 = computeEMA(store.close, store.length, 20);
```

---

## Bollinger Bands

**Overlay indicator, 3 lines: upper, middle (SMA), lower.**

```ts
function computeBollinger(
  close:  Float64Array,
  length: number,
  period: number,
  stdDev: number,
): BollingerResult

interface BollingerResult {
  upper:  Float64Array;
  middle: Float64Array;  // SMA of period
  lower:  Float64Array;
}
```

**Parameters**

| Parameter | Description |
|---|---|
| `close` | Close-price column |
| `length` | Number of bars |
| `period` | Look-back window (default convention: 20) |
| `stdDev` | Number of standard deviations for the bands (default convention: 2) |

**Returns** `BollingerResult` — three arrays of length `length`. Values before index `period - 1` are `NaN`.

Standard deviation is computed as the population standard deviation over each window.

**Usage**

```ts
import { computeBollinger } from 'fin-charter/indicators';

const bb = computeBollinger(store.close, store.length, 20, 2);

// bb.upper, bb.middle, bb.lower are Float64Arrays
const upperSeries = chart.addLineSeries({ color: '#2196F3' });
const midSeries   = chart.addLineSeries({ color: '#9c27b0' });
const lowerSeries = chart.addLineSeries({ color: '#2196F3' });
```

---

## RSI — Relative Strength Index

**Separate-pane indicator, oscillates 0–100.**

```ts
function computeRSI(
  close:  Float64Array,
  length: number,
  period: number,
): Float64Array
```

**Parameters** — same signature as `computeSMA`.

**Returns** `Float64Array` of length `length`. Values at indices `0` through `period` are `NaN`. First valid RSI is at index `period`.

Uses Wilder's smoothing (RMA) for subsequent values.

**Usage**

```ts
import { computeRSI } from 'fin-charter/indicators';

const rsi14 = computeRSI(store.close, store.length, 14);

// Add a separate pane for RSI
const rsiPane   = chart.addPane({ height: 120 });
const rsiSeries = chart.addHistogramSeries();
rsiSeries.setData(
  Array.from({ length: store.length }, (_, i) => ({
    time:  store.time[i],
    open:  rsi14[i],
    high:  rsi14[i],
    low:   rsi14[i],
    close: rsi14[i],
  })).filter(b => !isNaN(b.close))
);
```

---

## MACD — Moving Average Convergence Divergence

**Separate-pane indicator, 3 outputs: macd line, signal line, histogram.**

```ts
function computeMACD(
  close:        Float64Array,
  length:       number,
  fastPeriod:   number,
  slowPeriod:   number,
  signalPeriod: number,
): MACDResult

interface MACDResult {
  macd:      Float64Array;  // fastEMA - slowEMA
  signal:    Float64Array;  // EMA of macd
  histogram: Float64Array;  // macd - signal
}
```

**Parameters**

| Parameter | Default convention | Description |
|---|---|---|
| `close` | — | Close-price column |
| `length` | — | Number of bars |
| `fastPeriod` | 12 | Fast EMA period |
| `slowPeriod` | 26 | Slow EMA period |
| `signalPeriod` | 9 | Signal EMA period |

**Returns** `MACDResult`. `macd` is `NaN` before index `slowPeriod - 1`. `signal` and `histogram` are `NaN` before index `slowPeriod - 1 + signalPeriod - 1`.

**Usage**

```ts
import { computeMACD } from 'fin-charter/indicators';

const macd = computeMACD(store.close, store.length, 12, 26, 9);

// macd.macd, macd.signal — render as line series
// macd.histogram         — render as histogram series
```

---

## Volume

**Histogram indicator.**

```ts
function computeVolume(
  volume: Float64Array,
  length: number,
): Float64Array
```

Copies the volume column into a new `Float64Array`. This is a pass-through helper that normalises the input for use with the indicator pipeline or for rendering via a histogram series.

**Usage**

```ts
import { computeVolume } from 'fin-charter/indicators';

const vol = computeVolume(store.volume, store.length);

const volSeries = chart.addHistogramSeries({
  upColor:   'rgba(38, 166, 154, 0.5)',
  downColor: 'rgba(239, 83, 80, 0.5)',
});
```

---

---

## Ichimoku Cloud

**Overlay indicator, 5 outputs: tenkan, kijun, senkouA, senkouB, chikou.**

```ts
function computeIchimoku(
  high:          Float64Array,
  low:           Float64Array,
  close:         Float64Array,
  length:        number,
  tenkanPeriod?: number,  // default: 9
  kijunPeriod?:  number,  // default: 26
  senkouPeriod?: number,  // default: 52
): IchimokuResult

interface IchimokuResult {
  tenkan:  Float64Array;  // Conversion line — (highest high + lowest low) / 2 over tenkanPeriod
  kijun:   Float64Array;  // Base line — (highest high + lowest low) / 2 over kijunPeriod
  senkouA: Float64Array;  // (tenkan + kijun) / 2, shifted forward by kijunPeriod
  senkouB: Float64Array;  // (highest high + lowest low) / 2 over senkouPeriod, shifted forward by kijunPeriod
  chikou:  Float64Array;  // close shifted back by kijunPeriod bars (lagging span)
}
```

**Parameters**

| Parameter | Default | Description |
|---|---|---|
| `high` | — | High-price column |
| `low` | — | Low-price column |
| `close` | — | Close-price column |
| `length` | — | Number of bars |
| `tenkanPeriod` | 9 | Look-back for the conversion line |
| `kijunPeriod` | 26 | Look-back for the base line and cloud displacement |
| `senkouPeriod` | 52 | Look-back for Senkou Span B |

**Returns** `IchimokuResult`. Early indices contain `NaN` depending on each component's look-back.

**Usage**

```ts
import { computeIchimoku } from 'fin-charter/indicators';

const ichi = computeIchimoku(store.high, store.low, store.close, store.length);

const tenkanSeries = chart.addLineSeries({ color: '#e91e63', lineWidth: 1 });
const kijunSeries  = chart.addLineSeries({ color: '#2196F3', lineWidth: 1 });
// Render senkouA and senkouB as a filled cloud using a plugin
```

---

## Parabolic SAR

**Overlay indicator, single series of stop-and-reverse prices.**

```ts
function computeParabolicSAR(
  high:   Float64Array,
  low:    Float64Array,
  length: number,
  afStep?: number,  // default: 0.02
  afMax?:  number,  // default: 0.20
): Float64Array
```

**Parameters**

| Parameter | Default | Description |
|---|---|---|
| `high` | — | High-price column |
| `low` | — | Low-price column |
| `length` | — | Number of bars |
| `afStep` | 0.02 | Acceleration factor step |
| `afMax` | 0.20 | Maximum acceleration factor |

**Returns** `Float64Array` of length `length`. First value is initialised from `low[0]`. No leading `NaN` values.

The algorithm starts in an uptrend and reverses whenever price crosses the SAR. On reversal, the SAR resets to the prior extreme point and the acceleration factor resets to `afStep`.

**Usage**

```ts
import { computeParabolicSAR } from 'fin-charter/indicators';

const sar = computeParabolicSAR(store.high, store.low, store.length);

// Render as dots — typically shown as small circles above/below bars
const sarSeries = chart.addLineSeries({ color: '#ff9800', lineWidth: 1 });
```

---

## Keltner Channel

**Overlay indicator, 3 lines: upper, middle (EMA), lower.**

```ts
function computeKeltner(
  close:       Float64Array,
  high:        Float64Array,
  low:         Float64Array,
  length:      number,
  emaPeriod?:  number,  // default: 20
  atrPeriod?:  number,  // default: 10
  multiplier?: number,  // default: 2.0
): KeltnerResult

interface KeltnerResult {
  upper:  Float64Array;  // middle + multiplier × ATR
  middle: Float64Array;  // EMA of close
  lower:  Float64Array;  // middle - multiplier × ATR
}
```

**Parameters**

| Parameter | Default | Description |
|---|---|---|
| `close` | — | Close-price column |
| `high` | — | High-price column |
| `low` | — | Low-price column |
| `length` | — | Number of bars |
| `emaPeriod` | 20 | EMA period for the middle band |
| `atrPeriod` | 10 | ATR period for band width |
| `multiplier` | 2.0 | ATR multiplier |

**Returns** `KeltnerResult`. Values are `NaN` before both the EMA and ATR warm-up periods complete.

**Usage**

```ts
import { computeKeltner } from 'fin-charter/indicators';

const kc = computeKeltner(store.close, store.high, store.low, store.length);

const upper  = chart.addLineSeries({ color: 'rgba(33,150,243,0.8)', lineWidth: 1 });
const middle = chart.addLineSeries({ color: '#2196F3', lineWidth: 1 });
const lower  = chart.addLineSeries({ color: 'rgba(33,150,243,0.8)', lineWidth: 1 });
```

---

## Donchian Channel

**Overlay indicator, 3 lines: upper, middle, lower.**

```ts
function computeDonchian(
  high:    Float64Array,
  low:     Float64Array,
  length:  number,
  period?: number,  // default: 20
): DonchianResult

interface DonchianResult {
  upper:  Float64Array;  // sliding maximum of high
  middle: Float64Array;  // (upper + lower) / 2
  lower:  Float64Array;  // sliding minimum of low
}
```

**Parameters**

| Parameter | Default | Description |
|---|---|---|
| `high` | — | High-price column |
| `low` | — | Low-price column |
| `length` | — | Number of bars |
| `period` | 20 | Look-back window |

**Returns** `DonchianResult`. Values before index `period - 1` are `NaN`.

Uses `slidingMax` / `slidingMin` internally for O(n) computation regardless of period.

**Usage**

```ts
import { computeDonchian } from 'fin-charter/indicators';

const dc = computeDonchian(store.high, store.low, store.length, 20);
```

---

## CCI — Commodity Channel Index

**Separate-pane oscillator. Oscillates around 0; readings beyond ±100 signal potential extremes.**

```ts
function computeCCI(
  high:    Float64Array,
  low:     Float64Array,
  close:   Float64Array,
  length:  number,
  period?: number,  // default: 20
): Float64Array
```

**Parameters**

| Parameter | Default | Description |
|---|---|---|
| `high` | — | High-price column |
| `low` | — | Low-price column |
| `close` | — | Close-price column |
| `length` | — | Number of bars |
| `period` | 20 | Look-back window |

**Returns** `Float64Array` of length `length`. Values before index `period - 1` are `NaN`.

The formula is `(typical price − SMA of typical price) / (0.015 × mean deviation)`.

**Usage**

```ts
import { computeCCI } from 'fin-charter/indicators';

const cci = computeCCI(store.high, store.low, store.close, store.length, 20);

const cciPane   = chart.addPane({ height: 100 });
const cciSeries = chart.addHistogramSeries();
```

---

## Pivot Points

**Overlay indicator, 7 levels: pp, r1, r2, r3, s1, s2, s3.**

```ts
function computePivotPoints(
  high:     Float64Array,
  low:      Float64Array,
  close:    Float64Array,
  length:   number,
  variant?: 'standard' | 'fibonacci' | 'woodie',  // default: 'standard'
): PivotPointsResult

interface PivotPointsResult {
  pp: Float64Array;  // pivot point
  r1: Float64Array;  // resistance 1
  r2: Float64Array;  // resistance 2
  r3: Float64Array;  // resistance 3
  s1: Float64Array;  // support 1
  s2: Float64Array;  // support 2
  s3: Float64Array;  // support 3
}
```

**Parameters**

| Parameter | Default | Description |
|---|---|---|
| `high` | — | High-price column |
| `low` | — | Low-price column |
| `close` | — | Close-price column |
| `length` | — | Number of bars |
| `variant` | `'standard'` | Calculation method |

**Variants**

| Variant | PP formula | Level formula |
|---|---|---|
| `standard` | (H + L + C) / 3 | Standard pivot arithmetic |
| `fibonacci` | (H + L + C) / 3 | Fibonacci ratios (0.382, 0.618, 1.0) |
| `woodie` | (H + L + 2 × C) / 4 | Standard pivot arithmetic |

**Returns** `PivotPointsResult`. Each array has `NaN` at index 0 because each bar uses the previous bar's HLC.

**Usage**

```ts
import { computePivotPoints } from 'fin-charter/indicators';

const pivots = computePivotPoints(store.high, store.low, store.close, store.length, 'fibonacci');

const ppSeries = chart.addLineSeries({ color: '#ff9800', lineWidth: 1 });
const r1Series = chart.addLineSeries({ color: '#ef5350', lineWidth: 1 });
const s1Series = chart.addLineSeries({ color: '#26a69a', lineWidth: 1 });
```

---

## Shared Utilities — `slidingMax` / `slidingMin`

These O(n) sliding-window utilities are used internally by `computeDonchian` and `computeIchimoku`. They are also exported for use in custom indicators.

```ts
function slidingMax(data: Float64Array, length: number, period: number): Float64Array
function slidingMin(data: Float64Array, length: number, period: number): Float64Array
```

Each returns a new `Float64Array` of length `length` where `result[i]` is the maximum (or minimum) of `data[i - period + 1 .. i]`. Indices before `period - 1` are `NaN`.

The algorithm uses a monotone deque so each element is pushed and popped at most once — O(n) total regardless of period size.

**Usage**

```ts
import { slidingMax, slidingMin } from 'fin-charter/indicators';

// 20-period highest-high channel
const hhv = slidingMax(store.high, store.length, 20);
// 20-period lowest-low channel
const llv = slidingMin(store.low, store.length, 20);
```

---

## Notes

- All indicator functions return **new** `Float64Array` allocations; they do not mutate their inputs.
- Indices for which the indicator is mathematically undefined are filled with `NaN`. Filter or guard against `NaN` before rendering.
- Indicators are pure functions — they can be called from a Web Worker, a test, or a Node.js script without any browser dependency.
