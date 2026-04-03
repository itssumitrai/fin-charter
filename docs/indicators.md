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

## Notes

- All indicator functions return **new** `Float64Array` allocations; they do not mutate their inputs.
- Indices for which the indicator is mathematically undefined are filled with `NaN`. Filter or guard against `NaN` before rendering.
- Indicators are pure functions — they can be called from a Web Worker, a test, or a Node.js script without any browser dependency.
