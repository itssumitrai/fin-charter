# Extended Indicators, Functional Features, Indicator Panes & HUD

**Date:** 2026-04-03
**Scope:** Single PR — indicators, functional features, multi-pane rendering, chart-managed indicators, series/indicator management HUD
**Goal:** Fill remaining gaps in the library's indicator toolkit, public API surface, and interactive chart management

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

Implementation composites all canvas layers (across all panes) onto one offscreen canvas:

1. Create offscreen canvas sized to wrapper dimensions * pixelRatio
2. For each pane (top to bottom), draw its canvas layers at the correct vertical offset:
   - Left price axis canvas
   - Chart canvas
   - Overlay canvas
   - Right price axis canvas
3. Draw the shared time axis canvas at the bottom
4. Return the canvas element

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

## C. Indicator Pane System

### Per-Pane Canvas Architecture

Each pane (including main) gets its own isolated rendering stack:
- Chart canvas (series, grid)
- Overlay canvas (crosshair horizontal line)
- Left price axis canvas
- Right price axis canvas

All panes share a single time axis canvas at the bottom, and a single vertical crosshair line drawn across all pane overlay canvases simultaneously.

### Pane DOM Structure

```
_wrapper (div, position: relative)
├── _paneContainer (div, display: flex, flex-direction: column)
│   ├── PaneRow[main] (div)
│   │   ├── leftPriceAxisCanvas
│   │   ├── chartCanvas + overlayCanvas (stacked)
│   │   └── rightPriceAxisCanvas
│   ├── PaneDivider (div, cursor: row-resize, height: 4px)
│   ├── PaneRow[pane-0] (div)
│   │   ├── leftPriceAxisCanvas
│   │   ├── chartCanvas + overlayCanvas (stacked)
│   │   └── rightPriceAxisCanvas
│   ├── PaneDivider (div)
│   ├── PaneRow[pane-1] (div)
│   │   └── ...
│   └── ...
├── timeAxisCanvas (full width, below pane container)
├── HUD elements (per-pane, z-index 10)
└── _tooltipEl (z-index 20)
```

### Per-Pane PriceScale

Each pane gets its own `PriceScale` instance. Auto-scales based only on the series assigned to that pane. The main pane keeps the existing left/right dual price scale behavior. Indicator panes get a single right price scale by default (configurable).

### Series-to-Pane Assignment

- `BaseSeriesOptions` gains `paneId?: string` — defaults to `'main'`
- `SeriesEntry` gains `paneId: string` field
- `_updateDataRange()` iterates per-pane, updating each pane's price scale from its own series
- `_paintMain()` becomes `_paintPane(paneId)`, called for each pane

### Pane Divider Interaction

- Thin (4px) horizontal bar between panes, `cursor: row-resize`
- On pointer down + drag: redistributes height between the two adjacent panes
- Minimum pane height: 50px (prevents collapse)
- Emits repaint on drag (throttled to rAF)

### Height Distribution

- Main pane takes remaining height after subtracting indicator panes + dividers + time axis
- New panes default to 150px height
- `pane.setHeight(h)` still works programmatically
- On chart `resize()`, heights are proportionally rescaled

---

## D. Chart-Managed Indicators

### New API Surface

```ts
// IChartApi additions
addIndicator(type: IndicatorType, options: IndicatorOptions): IIndicatorApi;
removeIndicator(indicator: IIndicatorApi): void;
```

### IndicatorType

```ts
type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger'
  | 'vwap' | 'stochastic' | 'atr' | 'adx' | 'obv' | 'williams-r';
```

### IndicatorOptions

```ts
interface IndicatorOptions {
  source: ISeriesApi<SeriesType>;  // which series to compute from
  params?: Record<string, number>; // e.g. { period: 20 } or { kPeriod: 14, dPeriod: 3 }
  paneId?: string;                 // 'main' for overlays, or a pane id
  color?: string;                  // primary color (multi-output indicators get auto-derived colors)
  lineWidth?: number;
  visible?: boolean;
  label?: string;                  // override default label like "SMA 20"
}
```

If `paneId` is omitted, the system decides based on indicator type:
- **Overlay indicators** (SMA, EMA, Bollinger, VWAP) default to `'main'`
- **Oscillator indicators** (RSI, MACD, Stochastic, Williams %R) auto-create a new pane
- **Range indicators** (ATR, ADX, OBV) auto-create a new pane

### IIndicatorApi

```ts
interface IIndicatorApi {
  readonly id: string;
  indicatorType(): IndicatorType;
  applyOptions(options: Partial<IndicatorOptions>): void;
  options(): IndicatorOptions;
  paneId(): string;
  isVisible(): boolean;
  remove(): void;  // convenience, same as chart.removeIndicator(this)
}
```

### Internal Mechanics

1. **On `addIndicator()`**: Chart reads source series' data layer, runs the compute function, creates the appropriate internal series (line for SMA/EMA/ATR/OBV/Williams/VWAP, multiple lines for MACD/Bollinger/Stochastic/ADX), assigns them to the specified pane.

2. **On source data change**: Chart listens to the source series' `dataChanged` event (feature B4). When fired, it recomputes the indicator and updates the internal series via `setData()`.

3. **On params change** (via settings popup or `applyOptions()`): Recomputes with new params, updates internal series. Regenerates the label (e.g. "SMA 20" becomes "SMA 50").

4. **Multi-output indicators** create multiple internal series:
   - MACD: 2 lines (macd, signal) + 1 histogram (divergence)
   - Bollinger: 3 lines (upper, middle, lower)
   - Stochastic: 2 lines (K, D)
   - ADX: 3 lines (ADX, +DI, -DI)

5. **Default params** per indicator type:
   - SMA/EMA: `{ period: 20 }`
   - RSI: `{ period: 14 }`
   - MACD: `{ fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }`
   - Bollinger: `{ period: 20, stdDev: 2 }`
   - Stochastic: `{ kPeriod: 14, dPeriod: 3 }`
   - ATR: `{ period: 14 }`
   - ADX: `{ period: 14 }`
   - OBV: `{}` (no params)
   - VWAP: `{}` (no params)
   - Williams %R: `{ period: 14 }`

### Default Labels

Auto-generated from type + key params: `"SMA 20"`, `"RSI 14"`, `"MACD 12,26,9"`, `"BB 20,2"`, etc. Overridable via `label` option.

---

## E. Series/Indicator Management HUD

### Replacing the Current Legend

The current hardcoded OHLCV legend gets replaced with a structured HUD that shows all series and indicators. The OHLCV values for the primary series remain as the first row.

### HUD DOM Structure

```
_hudEl (div, position: absolute, top: 4px, left: 8px, z-index: 10)
├── HudRow[main series] (div, display: flex, align-items: center, gap: 6px)
│   ├── colorSwatch (div, 10x10, background: series color)
│   ├── label (span, "AAPL" or series label)
│   ├── values (span, "O 182.50  H 184.20  L 181.30  C 183.90  V 52.3M")
│   ├── eyeBtn (button, toggle visibility)
│   ├── gearBtn (button, open settings)
│   └── removeBtn (button, remove series)
├── HudRow[SMA 20] (div)
│   ├── colorSwatch (div, gold line swatch)
│   ├── label (span, "SMA 20")
│   ├── value (span, "183.45")  ← single value at crosshair
│   ├── eyeBtn
│   ├── gearBtn
│   └── removeBtn
├── HudRow[RSI 14] (div)
│   ├── colorSwatch
│   ├── label (span, "RSI 14")
│   ├── value (span, "62.30")
│   ├── eyeBtn
│   ├── gearBtn
│   └── removeBtn
└── ... more rows
```

### Key Behaviors

**Values update on crosshair move:**
- Primary series row: shows OHLCV (same as current legend, just within new structure)
- Line/overlay series: shows the single close value at crosshair bar
- Multi-output indicators (MACD): shows all output values, e.g. "M 1.23  S 0.98  H 0.25"

**Eye button:** Toggles `visible` on the series/indicator. Dimmed icon when hidden. For indicators, hides all internal series.

**Gear button:** Opens a floating settings popup anchored below the button. Contents depend on series/indicator type:
- For raw series: color picker, line width
- For indicators: color picker, line width, plus editable number fields for each param (period, stdDev, etc.)
- Popup has "Apply" and "Cancel" buttons
- On Apply: calls `series.applyOptions()` or `indicator.applyOptions()` which triggers recomputation

**Remove button (X):** Calls `chart.removeSeries()` or `chart.removeIndicator()`. Removes the HUD row. For indicators that auto-created a pane, also removes the pane if no other series remain in it.

### HUD Positioning Per Pane

Each pane gets its own HUD rows positioned at the top-left of that pane. The main pane HUD shows the primary series + overlays (SMA, EMA, Bollinger, VWAP). Each indicator pane shows its own indicator rows at the top-left of that pane.

### Settings Popup

Minimal floating `<div>` with:
- `position: absolute`, anchored below the gear icon
- `z-index: 30` (above tooltip)
- Background matches chart theme (dark/light)
- Form fields rendered dynamically from indicator param definitions
- Color input uses native `<input type="color">`
- Number inputs use `<input type="number">` with step/min/max from param definitions
- Closes on outside click or Cancel
- "Apply" triggers `applyOptions()` with new values

### pointer-events Consideration

HUD buttons need `pointer-events: auto`. The HUD container itself should have `pointer-events: none` so chart interactions (pan/zoom/crosshair) work through empty areas. Only the interactive elements (buttons, popup) capture clicks.

---

## F. Storybook Stories

### F1. Extended Indicators Story

**File:** `stories/Indicators-Extended.stories.ts`

Demonstrates all 6 new indicators on a candlestick chart:
- VWAP as overlay line on main pane
- Stochastic K/D in a separate pane
- ATR in a separate pane
- ADX (+DI/-DI/ADX) in a separate pane
- OBV in a separate pane
- Williams %R in a separate pane

### F2. Feature Stories

- `stories/Features/Screenshot.stories.ts` — button triggers `takeScreenshot()`, displays result as `<img>`
- `stories/Features/FitContent.stories.ts` — zooms in first, then button calls `fitContent()`
- `stories/Features/TimeFormatter.stories.ts` — custom formatter showing e.g. relative dates
- `stories/Features/DataChanged.stories.ts` — real-time updates with counter showing data change event count

### F3. Pane & Indicator Management Stories

- `stories/Features/IndicatorPanes.stories.ts` — candlestick + RSI pane + MACD pane via `addIndicator()` API
- `stories/Features/HUD.stories.ts` — full HUD demo: multiple series/indicators, visibility toggle, settings edit, remove

---

## G. Files Changed Summary

**New files (indicators):**
- `src/indicators/vwap.ts`
- `src/indicators/stochastic.ts`
- `src/indicators/atr.ts`
- `src/indicators/adx.ts`
- `src/indicators/obv.ts`
- `src/indicators/williams-r.ts`

**New files (pane system):**
- `src/core/pane.ts` — Internal Pane class (holds canvases, price scale, series refs, HUD DOM)
- `src/core/pane-divider.ts` — PaneDivider drag interaction
- `src/api/indicator-api.ts` — IIndicatorApi interface + IndicatorApi class

**New files (HUD):**
- `src/ui/hud.ts` — HUD manager (creates/updates/removes HUD rows per pane)
- `src/ui/settings-popup.ts` — Settings popup builder (dynamic form from param definitions)

**New files (stories):**
- `stories/Indicators-Extended.stories.ts`
- `stories/Features/Screenshot.stories.ts`
- `stories/Features/FitContent.stories.ts`
- `stories/Features/TimeFormatter.stories.ts`
- `stories/Features/DataChanged.stories.ts`
- `stories/Features/IndicatorPanes.stories.ts`
- `stories/Features/HUD.stories.ts`

**Modified files:**
- `src/indicators/index.ts` — add 6 new exports
- `src/api/chart-api.ts` — major refactor: multi-pane rendering, addIndicator/removeIndicator, takeScreenshot, fitContent, time formatter in _paintTimeAxis, replace legend with HUD
- `src/api/series-api.ts` — subscribeDataChanged/unsubscribeDataChanged, fire from setData/update
- `src/api/pane-api.ts` — extend to hold per-pane canvases and price scale reference
- `src/api/options.ts` — tickMarkFormatter on TimeScaleApiOptions, paneId on BaseSeriesOptions, IndicatorOptions/IndicatorType types
- `src/index.ts` — export DataChangedCallback, IIndicatorApi, IndicatorType, IndicatorOptions
- `src/core/types.ts` — IndicatorType union type if needed
