# Extended Indicators, Pane System, HUD & Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new indicators, multi-pane canvas architecture, chart-managed indicator API, series/indicator HUD, and 4 functional features (takeScreenshot, fitContent, tickMarkFormatter, subscribeDataChanged).

**Architecture:** The implementation builds bottom-up: new indicator functions first (no dependencies), then subscribeDataChanged on series (needed by indicator API), then multi-pane canvas refactor (biggest change), then chart-managed indicator API (depends on panes + indicators), then HUD (depends on indicators + panes), and finally the small functional features + stories + logo.

**Tech Stack:** TypeScript, Canvas 2D API, Vite, Storybook (HTML-Vite)

---

## Task 1: New Indicator Functions (6 files)

**Files:**
- Create: `src/indicators/vwap.ts`
- Create: `src/indicators/stochastic.ts`
- Create: `src/indicators/atr.ts`
- Create: `src/indicators/adx.ts`
- Create: `src/indicators/obv.ts`
- Create: `src/indicators/williams-r.ts`
- Modify: `src/indicators/index.ts`

All indicators follow the existing pattern: pure functions, Float64Array inputs/outputs, NaN prefill for insufficient data.

- [ ] **Step 1: Create `src/indicators/vwap.ts`**

```ts
export function computeVWAP(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  length: number,
): Float64Array {
  const result = new Float64Array(length);
  let cumTPV = 0; // cumulative typicalPrice * volume
  let cumVol = 0; // cumulative volume

  for (let i = 0; i < length; i++) {
    const tp = (high[i] + low[i] + close[i]) / 3;
    cumTPV += tp * volume[i];
    cumVol += volume[i];
    result[i] = cumVol === 0 ? NaN : cumTPV / cumVol;
  }

  return result;
}
```

- [ ] **Step 2: Create `src/indicators/stochastic.ts`**

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
): StochasticResult {
  const k = new Float64Array(length);
  const d = new Float64Array(length);

  // Fill NaN before valid K values
  for (let i = 0; i < kPeriod - 1; i++) {
    k[i] = NaN;
    d[i] = NaN;
  }

  // Compute %K
  for (let i = kPeriod - 1; i < length; i++) {
    let lowestLow = Infinity;
    let highestHigh = -Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (low[j] < lowestLow) lowestLow = low[j];
      if (high[j] > highestHigh) highestHigh = high[j];
    }
    const range = highestHigh - lowestLow;
    k[i] = range === 0 ? 50 : ((close[i] - lowestLow) / range) * 100;
  }

  // Compute %D = SMA of %K over dPeriod
  const firstDIdx = kPeriod - 1 + dPeriod - 1;
  for (let i = kPeriod - 1; i < firstDIdx && i < length; i++) {
    d[i] = NaN;
  }

  if (firstDIdx < length) {
    let sum = 0;
    for (let i = kPeriod - 1; i <= firstDIdx; i++) {
      sum += k[i];
    }
    d[firstDIdx] = sum / dPeriod;

    for (let i = firstDIdx + 1; i < length; i++) {
      sum += k[i] - k[i - dPeriod];
      d[i] = sum / dPeriod;
    }
  }

  return { k, d };
}
```

- [ ] **Step 3: Create `src/indicators/atr.ts`**

```ts
export function computeATR(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const result = new Float64Array(length);

  if (length === 0) return result;

  // Fill NaN before period
  for (let i = 0; i < period; i++) {
    result[i] = NaN;
  }

  if (length <= period) return result;

  // Compute True Range values and initial ATR as SMA of first `period` TRs
  // TR[0] = high[0] - low[0] (no previous close)
  let sumTR = high[0] - low[0];
  for (let i = 1; i < period; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1]),
    );
    sumTR += tr;
  }

  // First ATR at index period (using period TRs from indices 0..period-1)
  // But we need period+1 bars for period TRs (TR uses prev close), so first valid at index period
  // Actually: TR[i] for i>=1 uses close[i-1]. TR[0] = H[0]-L[0].
  // First ATR = average of TR[0..period-1], placed at index period-1? No - RSI convention:
  // NaN for [0, period-1], first value at index period.
  // Recompute: use TRs from index 1 to period (period values)
  let atrSum = 0;
  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1]),
    );
    atrSum += tr;
  }
  result[period] = atrSum / period;

  // Wilder smoothing for subsequent values
  for (let i = period + 1; i < length; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1]),
    );
    result[i] = (result[i - 1] * (period - 1) + tr) / period;
  }

  return result;
}
```

- [ ] **Step 4: Create `src/indicators/adx.ts`**

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
): ADXResult {
  const adx = new Float64Array(length);
  const plusDI = new Float64Array(length);
  const minusDI = new Float64Array(length);

  const needed = 2 * period;
  // Fill NaN
  for (let i = 0; i < Math.min(needed, length); i++) {
    adx[i] = NaN;
    plusDI[i] = NaN;
    minusDI[i] = NaN;
  }

  if (length <= needed) return { adx, plusDI, minusDI };

  // Step 1: Compute +DM, -DM, TR for each bar starting at index 1
  const plusDM = new Float64Array(length);
  const minusDM = new Float64Array(length);
  const tr = new Float64Array(length);

  for (let i = 1; i < length; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
    tr[i] = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1]),
    );
  }

  // Step 2: Wilder-smooth +DM, -DM, TR over period (first sum, then smooth)
  let smoothPlusDM = 0;
  let smoothMinusDM = 0;
  let smoothTR = 0;
  for (let i = 1; i <= period; i++) {
    smoothPlusDM += plusDM[i];
    smoothMinusDM += minusDM[i];
    smoothTR += tr[i];
  }

  // First +DI/-DI at index period
  plusDI[period] = smoothTR === 0 ? 0 : (smoothPlusDM / smoothTR) * 100;
  minusDI[period] = smoothTR === 0 ? 0 : (smoothMinusDM / smoothTR) * 100;

  for (let i = period + 1; i < length; i++) {
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];
    smoothTR = smoothTR - smoothTR / period + tr[i];
    plusDI[i] = smoothTR === 0 ? 0 : (smoothPlusDM / smoothTR) * 100;
    minusDI[i] = smoothTR === 0 ? 0 : (smoothMinusDM / smoothTR) * 100;
  }

  // Step 3: DX from period onwards, then Wilder-smooth into ADX
  // First ADX = average of DX values from period to 2*period-1
  let dxSum = 0;
  for (let i = period; i < needed; i++) {
    const diSum = plusDI[i] + minusDI[i];
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100;
    dxSum += dx;
  }
  adx[needed] = dxSum / period;

  for (let i = needed + 1; i < length; i++) {
    const diSum = plusDI[i] + minusDI[i];
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100;
    adx[i] = (adx[i - 1] * (period - 1) + dx) / period;
  }

  return { adx, plusDI, minusDI };
}
```

- [ ] **Step 5: Create `src/indicators/obv.ts`**

```ts
export function computeOBV(
  close: Float64Array,
  volume: Float64Array,
  length: number,
): Float64Array {
  const result = new Float64Array(length);

  if (length === 0) return result;

  result[0] = 0; // seed

  for (let i = 1; i < length; i++) {
    if (close[i] > close[i - 1]) {
      result[i] = result[i - 1] + volume[i];
    } else if (close[i] < close[i - 1]) {
      result[i] = result[i - 1] - volume[i];
    } else {
      result[i] = result[i - 1];
    }
  }

  return result;
}
```

- [ ] **Step 6: Create `src/indicators/williams-r.ts`**

```ts
export function computeWilliamsR(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const result = new Float64Array(length);

  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  for (let i = period - 1; i < length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (high[j] > highestHigh) highestHigh = high[j];
      if (low[j] < lowestLow) lowestLow = low[j];
    }
    const range = highestHigh - lowestLow;
    result[i] = range === 0 ? -50 : ((highestHigh - close[i]) / range) * -100;
  }

  return result;
}
```

- [ ] **Step 7: Update `src/indicators/index.ts` to export all new indicators**

Add after the existing exports (line 6):

```ts
export { computeVWAP } from './vwap';
export { computeStochastic, type StochasticResult } from './stochastic';
export { computeATR } from './atr';
export { computeADX, type ADXResult } from './adx';
export { computeOBV } from './obv';
export { computeWilliamsR } from './williams-r';
```

- [ ] **Step 8: Verify build**

Run: `cd "/Users/raisumit/Documents/My Programs/fin-charter" && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 9: Commit**

```bash
git add src/indicators/vwap.ts src/indicators/stochastic.ts src/indicators/atr.ts src/indicators/adx.ts src/indicators/obv.ts src/indicators/williams-r.ts src/indicators/index.ts
git commit -m "feat: add 6 new indicators (VWAP, Stochastic, ATR, ADX, OBV, Williams %R)"
```

---

## Task 2: subscribeDataChanged on SeriesApi

**Files:**
- Modify: `src/api/series-api.ts`
- Modify: `src/index.ts`

This is needed by the indicator API (Task 5) to auto-recompute when source data changes.

- [ ] **Step 1: Add DataChangedCallback type and callback set to SeriesApi**

In `src/api/series-api.ts`, add the type export before the interface and add the field + methods:

After line 6 (`import type { SeriesOptionsMap } from './options';`), add:

```ts
export type DataChangedCallback = () => void;
```

In the `ISeriesApi` interface (after `getPriceLines()` at line 38), add:

```ts
  /** Subscribe to data change events. */
  subscribeDataChanged(callback: DataChangedCallback): void;
  /** Unsubscribe from data change events. */
  unsubscribeDataChanged(callback: DataChangedCallback): void;
```

In the `SeriesApi` class, add a private field after `_visible` (line 52):

```ts
  private _dataChangedCallbacks: Set<DataChangedCallback> = new Set();
```

Add the methods after `getPriceLines()` (line 155):

```ts
  subscribeDataChanged(callback: DataChangedCallback): void {
    this._dataChangedCallbacks.add(callback);
  }

  unsubscribeDataChanged(callback: DataChangedCallback): void {
    this._dataChangedCallbacks.delete(callback);
  }
```

Add a private method after `_notifyPrimitives` (line 178):

```ts
  private _emitDataChanged(): void {
    for (const cb of this._dataChangedCallbacks) cb();
  }
```

Modify `setData()` (line 74-78) to fire the callback at the end:

```ts
  setData(data: Bar[] | ColumnData): void {
    this._dataLayer.setData(data);
    this._notifyPrimitives('full');
    this._requestRepaint();
    this._emitDataChanged();
  }
```

Modify `update()` (line 80-84) similarly:

```ts
  update(bar: Bar): void {
    this._dataLayer.update(bar);
    this._notifyPrimitives('update');
    this._requestRepaint();
    this._emitDataChanged();
  }
```

- [ ] **Step 2: Export DataChangedCallback from `src/index.ts`**

Add after the existing series-api type export (line 5):

```ts
export type { DataChangedCallback } from './api/series-api';
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/api/series-api.ts src/index.ts
git commit -m "feat: add subscribeDataChanged/unsubscribeDataChanged to ISeriesApi"
```

---

## Task 3: Multi-Pane Canvas Architecture

This is the biggest refactor. We transform the single-canvas chart into a multi-pane system where each pane has its own canvas stack and price scale.

**Files:**
- Create: `src/core/pane.ts` — Internal Pane class holding canvases, price scale, series refs
- Create: `src/core/pane-divider.ts` — Divider drag interaction
- Modify: `src/api/pane-api.ts` — Extend to reference internal Pane
- Modify: `src/api/options.ts` — Add `paneId` to `BaseSeriesOptions`, add `label` to series options
- Modify: `src/api/chart-api.ts` — Major refactor to per-pane rendering

### Step-by-step:

- [ ] **Step 1: Add `paneId` and `label` to BaseSeriesOptions in `src/api/options.ts`**

Change `BaseSeriesOptions` (line 209-213) to:

```ts
export interface BaseSeriesOptions {
  data?: Bar[] | ColumnData;
  priceScaleId?: string;
  visible?: boolean;
  paneId?: string;
  label?: string;
}
```

- [ ] **Step 2: Create `src/core/pane.ts`**

This is the internal pane class that holds a canvas stack and price scale for a single pane.

```ts
import { PriceScale } from './price-scale';

const PRICE_AXIS_WIDTH = 60;

export interface PaneCanvases {
  chart: HTMLCanvasElement;
  overlay: HTMLCanvasElement;
  rightPriceAxis: HTMLCanvasElement;
  leftPriceAxis: HTMLCanvasElement;
  chartCtx: CanvasRenderingContext2D;
  overlayCtx: CanvasRenderingContext2D;
  rightPriceAxisCtx: CanvasRenderingContext2D;
  leftPriceAxisCtx: CanvasRenderingContext2D;
}

export class Pane {
  public readonly id: string;
  public readonly priceScale: PriceScale;
  public readonly leftPriceScale: PriceScale;
  public readonly canvases: PaneCanvases;
  public readonly row: HTMLDivElement;

  private _height: number;

  constructor(id: string, height: number) {
    this.id = id;
    this._height = height;
    this.priceScale = new PriceScale('right');
    this.leftPriceScale = new PriceScale('left');

    // Create DOM row
    this.row = document.createElement('div');
    this.row.style.cssText = 'position:relative;display:flex;flex-shrink:0;';

    // Create canvases
    const chart = document.createElement('canvas');
    chart.style.cssText = 'position:absolute;z-index:1;';

    const overlay = document.createElement('canvas');
    overlay.style.cssText = 'position:absolute;z-index:2;';

    const rightPriceAxis = document.createElement('canvas');
    rightPriceAxis.style.cssText = 'position:absolute;z-index:1;';

    const leftPriceAxis = document.createElement('canvas');
    leftPriceAxis.style.cssText = 'position:absolute;z-index:1;left:0;';

    this.row.appendChild(chart);
    this.row.appendChild(overlay);
    this.row.appendChild(rightPriceAxis);
    this.row.appendChild(leftPriceAxis);

    this.canvases = {
      chart,
      overlay,
      rightPriceAxis,
      leftPriceAxis,
      chartCtx: chart.getContext('2d')!,
      overlayCtx: overlay.getContext('2d')!,
      rightPriceAxisCtx: rightPriceAxis.getContext('2d')!,
      leftPriceAxisCtx: leftPriceAxis.getContext('2d')!,
    };
  }

  get height(): number {
    return this._height;
  }

  setHeight(h: number): void {
    this._height = Math.max(50, h);
  }

  /** Resize canvases to fit current height and provided chart width. */
  layout(chartW: number, leftScaleW: number, rightScaleVisible: boolean, leftScaleVisible: boolean, pixelRatio: number): void {
    const h = this._height;
    this.row.style.height = `${h}px`;

    // Chart + overlay canvases
    for (const canvas of [this.canvases.chart, this.canvases.overlay]) {
      canvas.width = Math.round(chartW * pixelRatio);
      canvas.height = Math.round(h * pixelRatio);
      canvas.style.width = `${chartW}px`;
      canvas.style.height = `${h}px`;
      canvas.style.left = `${leftScaleW}px`;
    }

    // Right price axis
    this.canvases.rightPriceAxis.width = Math.round(PRICE_AXIS_WIDTH * pixelRatio);
    this.canvases.rightPriceAxis.height = Math.round(h * pixelRatio);
    this.canvases.rightPriceAxis.style.width = `${PRICE_AXIS_WIDTH}px`;
    this.canvases.rightPriceAxis.style.height = `${h}px`;
    this.canvases.rightPriceAxis.style.left = `${leftScaleW + chartW}px`;
    this.canvases.rightPriceAxis.style.display = rightScaleVisible ? '' : 'none';

    // Left price axis
    this.canvases.leftPriceAxis.width = Math.round(PRICE_AXIS_WIDTH * pixelRatio);
    this.canvases.leftPriceAxis.height = Math.round(h * pixelRatio);
    this.canvases.leftPriceAxis.style.width = `${PRICE_AXIS_WIDTH}px`;
    this.canvases.leftPriceAxis.style.height = `${h}px`;
    this.canvases.leftPriceAxis.style.display = leftScaleVisible ? '' : 'none';

    // Update price scale heights
    this.priceScale.setHeight(h);
    this.leftPriceScale.setHeight(h);
  }
}
```

- [ ] **Step 3: Create `src/core/pane-divider.ts`**

```ts
const DIVIDER_HEIGHT = 4;
const MIN_PANE_HEIGHT = 50;

export class PaneDivider {
  public readonly el: HTMLDivElement;
  private _topPaneGetHeight: () => number;
  private _bottomPaneGetHeight: () => number;
  private _topPaneSetHeight: (h: number) => void;
  private _bottomPaneSetHeight: (h: number) => void;
  private _onResize: () => void;
  private _dragging = false;
  private _startY = 0;
  private _startTopH = 0;
  private _startBottomH = 0;

  constructor(
    topPaneGetHeight: () => number,
    bottomPaneGetHeight: () => number,
    topPaneSetHeight: (h: number) => void,
    bottomPaneSetHeight: (h: number) => void,
    onResize: () => void,
    bgColor: string,
  ) {
    this._topPaneGetHeight = topPaneGetHeight;
    this._bottomPaneGetHeight = bottomPaneGetHeight;
    this._topPaneSetHeight = topPaneSetHeight;
    this._bottomPaneSetHeight = bottomPaneSetHeight;
    this._onResize = onResize;

    this.el = document.createElement('div');
    this.el.style.cssText = `height:${DIVIDER_HEIGHT}px;cursor:row-resize;flex-shrink:0;background:${bgColor};`;

    this.el.addEventListener('pointerdown', this._onPointerDown);
  }

  destroy(): void {
    this.el.removeEventListener('pointerdown', this._onPointerDown);
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  }

  private _onPointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    this._dragging = true;
    this._startY = e.clientY;
    this._startTopH = this._topPaneGetHeight();
    this._startBottomH = this._bottomPaneGetHeight();
    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragging) return;
    const delta = e.clientY - this._startY;
    let newTopH = this._startTopH + delta;
    let newBottomH = this._startBottomH - delta;

    // Enforce minimum
    if (newTopH < MIN_PANE_HEIGHT) {
      newTopH = MIN_PANE_HEIGHT;
      newBottomH = this._startTopH + this._startBottomH - MIN_PANE_HEIGHT;
    }
    if (newBottomH < MIN_PANE_HEIGHT) {
      newBottomH = MIN_PANE_HEIGHT;
      newTopH = this._startTopH + this._startBottomH - MIN_PANE_HEIGHT;
    }

    this._topPaneSetHeight(newTopH);
    this._bottomPaneSetHeight(newBottomH);
    this._onResize();
  };

  private _onPointerUp = (): void => {
    this._dragging = false;
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  };
}

export { DIVIDER_HEIGHT };
```

- [ ] **Step 4: Refactor `src/api/chart-api.ts` — Replace single-canvas with multi-pane system**

This is the core refactor. Key changes:

1. Replace the 5 individual canvas fields with a `Map<string, Pane>` (`_paneMap`)
2. The main pane is always in `_paneMap.get('main')`
3. `_series` entries gain a `paneId` field
4. `_paintMain()` becomes `_paintPane(pane: Pane, seriesForPane: SeriesEntry[])`
5. `_paintOverlay()` becomes `_paintPaneOverlay(pane: Pane)`
6. `_paintPriceAxis()` and `_paintLeftPriceAxis()` become per-pane
7. The wrapper DOM becomes a flex column container with pane rows and dividers
8. `resize()` distributes heights proportionally
9. Time axis canvas remains shared at the bottom

**The full refactored chart-api.ts is too large to inline here. The key structural changes are:**

**a) Replace canvas fields (lines 133-142) with:**
```ts
private _paneMap: Map<string, Pane> = new Map();
private _dividers: PaneDivider[] = [];
private _paneContainer: HTMLDivElement;
private _timeAxisCanvas: HTMLCanvasElement;
private _timeAxisCtx: CanvasRenderingContext2D;
```

**b) SeriesEntry gains paneId:**
```ts
interface SeriesEntry {
  api: SeriesApi<SeriesType>;
  renderer: /* ... same union ... */;
  type: SeriesType;
  paneId: string;
}
```

**c) Constructor creates pane container + main pane:**
- Create `_paneContainer` div with `display:flex;flex-direction:column`
- Create main `Pane` instance and add to `_paneMap`
- Append `_paneContainer` + time axis to wrapper
- Move legend/tooltip/HUD creation to after pane setup
- EventRouter attaches to main pane's overlay canvas

**d) `addPane()` creates a real `Pane` with divider:**
```ts
addPane(options?: PaneOptions): IPaneApi {
  const id = `pane-${this._nextPaneId++}`;
  const height = options?.height ?? 150;
  const pane = new Pane(id, height);
  this._paneMap.set(id, pane);

  // Create divider between last pane and this one
  const paneIds = this._orderedPaneIds();
  const prevPaneId = paneIds[paneIds.length - 2]; // pane just before the new one
  const prevPane = this._paneMap.get(prevPaneId)!;
  const divider = new PaneDivider(
    () => prevPane.height,
    () => pane.height,
    (h) => prevPane.setHeight(h),
    (h) => pane.setHeight(h),
    () => this._layoutPanes(),
    this._options.grid.horzLinesColor,
  );
  this._dividers.push(divider);

  // Insert divider + pane row into DOM
  this._paneContainer.appendChild(divider.el);
  this._paneContainer.appendChild(pane.row);

  this._mask.addPane(id);
  this._layoutPanes();
  return new PaneApi(id, height, () => this.requestRepaint(InvalidationLevel.Full));
}
```

**e) `_paint()` iterates all panes:**
```ts
private _paint(): void {
  if (this._removed) return;

  for (const [paneId, pane] of this._paneMap) {
    const level = this._mask.level(paneId);
    const seriesForPane = this._series.filter(s => s.paneId === paneId);

    if (level >= InvalidationLevel.Light) {
      this._paintPane(pane, seriesForPane);
      this._paintPanePriceAxis(pane, seriesForPane);
    }
    if (level >= InvalidationLevel.Cursor) {
      this._paintPaneOverlay(pane);
      this._paintPanePriceAxis(pane, seriesForPane);
    }
  }

  // Shared time axis
  const mainLevel = this._mask.level(this._mainPaneId);
  if (mainLevel >= InvalidationLevel.Cursor) {
    this._paintTimeAxis();
  }

  // Emit callbacks, update HUD/tooltip
  this._emitCrosshairCallbacks();
  this._updateHud();
  this._updateTooltip();
  this._emitVisibleRangeChange();
  this._mask.reset();
}
```

**f) `_paintPane(pane, series)` replaces `_paintMain()`:**
Same logic as current `_paintMain()` but uses `pane.canvases.chartCtx`, `pane.priceScale`, `pane.height` instead of the single-canvas equivalents.

**g) `_addSeries()` reads `paneId` from options:**
```ts
const paneId = resolvedOptions.paneId ?? 'main';
this._series.push({ api, renderer, type, paneId });
```

**h) `_layoutPanes()` distributes heights:**
Main pane gets remaining height after indicator panes, dividers, and time axis.

**i) `resize()` calls `_layoutPanes()` after updating width/height.**

**j) Event routing needs to route pointer events to the correct pane** based on Y coordinate. The overlay canvases of each pane need their own event listener, or the wrapper needs a single listener that determines which pane the cursor is in.

- [ ] **Step 5: Update `src/api/pane-api.ts` to reference internal Pane**

The PaneApi stores a reference to the internal `Pane` for height management:

```ts
import type { IPanePrimitive, AttachedParams } from '../core/types';
import type { Pane } from '../core/pane';

export interface IPaneApi {
  readonly id: string;
  setHeight(height: number): void;
  attachPrimitive(primitive: IPanePrimitive): void;
  detachPrimitive(primitive: IPanePrimitive): void;
}

export class PaneApi implements IPaneApi {
  public readonly id: string;
  private _pane: Pane | null;
  private _primitives: IPanePrimitive[] = [];
  private _requestRepaint: () => void;

  constructor(id: string, pane: Pane | null, requestRepaint: () => void) {
    this.id = id;
    this._pane = pane;
    this._requestRepaint = requestRepaint;
  }

  setHeight(height: number): void {
    if (this._pane) {
      this._pane.setHeight(height);
    }
    this._requestRepaint();
  }

  getHeight(): number {
    return this._pane?.height ?? 0;
  }

  attachPrimitive(primitive: IPanePrimitive): void {
    this._primitives.push(primitive);
    const params: AttachedParams = {
      requestUpdate: () => this._requestRepaint(),
    };
    primitive.attached?.(params);
  }

  detachPrimitive(primitive: IPanePrimitive): void {
    const idx = this._primitives.indexOf(primitive);
    if (idx !== -1) {
      this._primitives.splice(idx, 1);
      primitive.detached?.();
    }
  }

  getPrimitives(): readonly IPanePrimitive[] {
    return this._primitives;
  }
}
```

- [ ] **Step 6: Verify build and test in Storybook**

Run: `npx tsc --noEmit`
Run: `npm run storybook` — verify existing stories still render correctly.

- [ ] **Step 7: Commit**

```bash
git add src/core/pane.ts src/core/pane-divider.ts src/api/pane-api.ts src/api/options.ts src/api/chart-api.ts
git commit -m "feat: multi-pane canvas architecture with per-pane price scales and dividers"
```

---

## Task 4: Functional Features (fitContent, takeScreenshot, tickMarkFormatter)

**Files:**
- Modify: `src/api/chart-api.ts`
- Modify: `src/api/options.ts`

- [ ] **Step 1: Add `tickMarkFormatter` to `TimeScaleApiOptions` in `src/api/options.ts`**

Add after `maxBarSpacing` (line 25):

```ts
  tickMarkFormatter?: (time: number, tickType: 'year' | 'month' | 'day' | 'time') => string;
```

- [ ] **Step 2: Add `fitContent()` and `takeScreenshot()` to IChartApi and implement**

In the `IChartApi` interface, add:

```ts
  fitContent(): void;
  takeScreenshot(): HTMLCanvasElement;
```

Implement `fitContent()`:

```ts
fitContent(): void {
  this._timeScale.fitContent();
  this.requestRepaint(InvalidationLevel.Full);
}
```

Implement `takeScreenshot()`:

```ts
takeScreenshot(): HTMLCanvasElement {
  // Force a synchronous paint to ensure canvases are up-to-date
  this._paint();

  const pixelRatio = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(this._width * pixelRatio);
  canvas.height = Math.round(this._height * pixelRatio);
  const ctx = canvas.getContext('2d')!;

  const leftScaleW = this._options.leftPriceScale.visible ? PRICE_AXIS_WIDTH : 0;
  let yOffset = 0;

  // Draw each pane's canvases
  for (const paneId of this._orderedPaneIds()) {
    const pane = this._paneMap.get(paneId)!;
    const paneH = Math.round(pane.height * pixelRatio);

    // Left price axis
    if (this._options.leftPriceScale.visible) {
      ctx.drawImage(pane.canvases.leftPriceAxis, 0, yOffset);
    }
    // Chart canvas
    ctx.drawImage(pane.canvases.chart, Math.round(leftScaleW * pixelRatio), yOffset);
    // Overlay canvas
    ctx.drawImage(pane.canvases.overlay, Math.round(leftScaleW * pixelRatio), yOffset);
    // Right price axis
    if (this._options.rightPriceScale.visible) {
      const chartW = this._width - leftScaleW - (this._options.rightPriceScale.visible ? PRICE_AXIS_WIDTH : 0);
      ctx.drawImage(pane.canvases.rightPriceAxis, Math.round((leftScaleW + chartW) * pixelRatio), yOffset);
    }

    yOffset += paneH + Math.round(DIVIDER_HEIGHT * pixelRatio);
  }

  // Draw time axis at bottom
  const timeAxisY = Math.round((this._height - TIME_AXIS_HEIGHT) * pixelRatio);
  ctx.drawImage(this._timeAxisCanvas, Math.round(leftScaleW * pixelRatio), timeAxisY);

  return canvas;
}
```

- [ ] **Step 3: Update `_paintTimeAxis()` to use custom formatter**

In the time label generation section (around line 1097-1104 of original), add a check:

```ts
let label: string;
const formatter = this._options.timeScale.tickMarkFormatter;
if (formatter) {
  const tickType = this._getTickType(primaryStore);
  label = formatter(timestamp, tickType);
} else if (primaryStore.length >= 2 && (primaryStore.time[1] - primaryStore.time[0]) < 86400) {
  // existing intraday logic
} else {
  // existing daily logic
}
```

Add helper method:
```ts
private _getTickType(store: ColumnStore): 'year' | 'month' | 'day' | 'time' {
  if (store.length < 2) return 'day';
  const interval = store.time[1] - store.time[0];
  if (interval < 86400) return 'time';
  if (interval < 86400 * 28) return 'day';
  if (interval < 86400 * 365) return 'month';
  return 'year';
}
```

Also update the crosshair time label section (around line 1125-1132) similarly.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/api/chart-api.ts src/api/options.ts
git commit -m "feat: add fitContent, takeScreenshot, and tickMarkFormatter"
```

---

## Task 5: Chart-Managed Indicator API

**Files:**
- Create: `src/api/indicator-api.ts`
- Modify: `src/api/chart-api.ts`
- Modify: `src/api/options.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add types to `src/api/options.ts`**

Add at the end of the file (before the `mergeOptions` function):

```ts
// ─── Indicator types ───────────────────────────────────────────────────────

export type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger'
  | 'vwap' | 'stochastic' | 'atr' | 'adx' | 'obv' | 'williams-r';

export interface IndicatorOptions {
  source: import('./series-api').ISeriesApi<import('../core/types').SeriesType>;
  params?: Record<string, number>;
  paneId?: string;
  color?: string;
  lineWidth?: number;
  visible?: boolean;
  label?: string;
}

/** Which indicators are overlays (render on main pane by default). */
export const OVERLAY_INDICATORS: Set<IndicatorType> = new Set(['sma', 'ema', 'bollinger', 'vwap']);

/** Default params per indicator type. */
export const DEFAULT_INDICATOR_PARAMS: Record<IndicatorType, Record<string, number>> = {
  sma: { period: 20 },
  ema: { period: 20 },
  rsi: { period: 14 },
  macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  bollinger: { period: 20, stdDev: 2 },
  stochastic: { kPeriod: 14, dPeriod: 3 },
  atr: { period: 14 },
  adx: { period: 14 },
  obv: {},
  vwap: {},
  'williams-r': { period: 14 },
};
```

- [ ] **Step 2: Create `src/api/indicator-api.ts`**

```ts
import type { SeriesType } from '../core/types';
import type { ISeriesApi } from './series-api';
import type { SeriesApi } from './series-api';
import type { IndicatorType, IndicatorOptions } from './options';

export interface IIndicatorApi {
  readonly id: string;
  indicatorType(): IndicatorType;
  applyOptions(options: Partial<IndicatorOptions>): void;
  options(): IndicatorOptions;
  paneId(): string;
  isVisible(): boolean;
  remove(): void;
}

export class IndicatorApi implements IIndicatorApi {
  public readonly id: string;
  private _type: IndicatorType;
  private _options: IndicatorOptions;
  private _paneId: string;
  private _visible: boolean;
  /** Internal series created for this indicator (1 for SMA, 2-3 for MACD, etc.) */
  public internalSeries: ISeriesApi<SeriesType>[] = [];
  /** Auto-created pane id, if any — so we know to remove it when indicator is removed. */
  public autoCreatedPaneId: string | null = null;
  private _removeCallback: () => void;

  constructor(
    id: string,
    type: IndicatorType,
    options: IndicatorOptions,
    paneId: string,
    removeCallback: () => void,
  ) {
    this.id = id;
    this._type = type;
    this._options = { ...options };
    this._paneId = paneId;
    this._visible = options.visible !== false;
    this._removeCallback = removeCallback;
  }

  indicatorType(): IndicatorType {
    return this._type;
  }

  applyOptions(options: Partial<IndicatorOptions>): void {
    this._options = { ...this._options, ...options };
    if (options.visible !== undefined) {
      this._visible = options.visible !== false;
    }
  }

  options(): IndicatorOptions {
    return { ...this._options };
  }

  paneId(): string {
    return this._paneId;
  }

  isVisible(): boolean {
    return this._visible;
  }

  remove(): void {
    this._removeCallback();
  }

  /** Generate display label from type + params. */
  label(): string {
    if (this._options.label) return this._options.label;
    const params = this._options.params ?? {};
    const type = this._type.toUpperCase();
    const vals = Object.values(params);
    if (vals.length === 0) return type;
    return `${type} ${vals.join(',')}`;
  }
}
```

- [ ] **Step 3: Add `addIndicator()` / `removeIndicator()` to `IChartApi` and implement in `ChartApi`**

Add to `IChartApi` interface:
```ts
  addIndicator(type: IndicatorType, options: IndicatorOptions): IIndicatorApi;
  removeIndicator(indicator: IIndicatorApi): void;
```

Add to `ChartApi`:
- A `_indicators: IndicatorApi[] = []` field
- A `_nextIndicatorId = 0` counter
- `addIndicator()` implementation that:
  1. Resolves params from defaults + user overrides
  2. Determines pane (overlay vs auto-create)
  3. Reads source data from the `source` series
  4. Computes indicator values using the appropriate function
  5. Creates internal line/histogram series on the target pane
  6. Subscribes to source `dataChanged` to auto-recompute
  7. Returns `IIndicatorApi`

- [ ] **Step 4: Implement the indicator computation dispatcher**

Add a private method `_computeIndicator()` that dispatches to the right compute function based on type:

```ts
private _computeIndicator(type: IndicatorType, store: ColumnStore, params: Record<string, number>): Record<string, Float64Array> {
  const len = store.length;
  switch (type) {
    case 'sma': return { value: computeSMA(store.close, len, params.period) };
    case 'ema': return { value: computeEMA(store.close, len, params.period) };
    case 'rsi': return { value: computeRSI(store.close, len, params.period) };
    case 'macd': {
      const r = computeMACD(store.close, len, params.fastPeriod, params.slowPeriod, params.signalPeriod);
      return { macd: r.macd, signal: r.signal, histogram: r.histogram };
    }
    case 'bollinger': {
      const r = computeBollinger(store.close, len, params.period, params.stdDev);
      return { upper: r.upper, middle: r.middle, lower: r.lower };
    }
    case 'vwap': return { value: computeVWAP(store.high, store.low, store.close, store.volume, len) };
    case 'stochastic': {
      const r = computeStochastic(store.high, store.low, store.close, len, params.kPeriod, params.dPeriod);
      return { k: r.k, d: r.d };
    }
    case 'atr': return { value: computeATR(store.high, store.low, store.close, len, params.period) };
    case 'adx': {
      const r = computeADX(store.high, store.low, store.close, len, params.period);
      return { adx: r.adx, plusDI: r.plusDI, minusDI: r.minusDI };
    }
    case 'obv': return { value: computeOBV(store.close, store.volume, len) };
    case 'williams-r': return { value: computeWilliamsR(store.high, store.low, store.close, len, params.period) };
  }
}
```

- [ ] **Step 5: Implement `_indicatorResultToSeries()` helper**

Converts indicator compute results into line/histogram series with proper data:

```ts
private _indicatorResultToSeries(
  indicator: IndicatorApi,
  result: Record<string, Float64Array>,
  store: ColumnStore,
  paneId: string,
  color: string,
  lineWidth: number,
): void {
  const keys = Object.keys(result);
  const colors = this._deriveColors(color, keys.length);

  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    const values = result[key];
    const isHistogram = key === 'histogram';

    const series = isHistogram
      ? this.addHistogramSeries({ paneId, visible: indicator.isVisible() })
      : this.addLineSeries({ paneId, color: colors[k], lineWidth, visible: indicator.isVisible() });

    // Convert Float64Array to Bar[] (using source time array)
    const bars: Bar[] = [];
    for (let i = 0; i < values.length; i++) {
      if (!isNaN(values[i])) {
        const v = values[i];
        bars.push({ time: store.time[i], open: v, high: v, low: v, close: v });
      }
    }
    series.setData(bars);
    indicator.internalSeries.push(series);
  }
}
```

- [ ] **Step 6: Export new types from `src/index.ts`**

```ts
export type { IIndicatorApi } from './api/indicator-api';
export type { IndicatorType, IndicatorOptions } from './api/options';
```

- [ ] **Step 7: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 8: Commit**

```bash
git add src/api/indicator-api.ts src/api/chart-api.ts src/api/options.ts src/index.ts
git commit -m "feat: chart-managed indicator API with auto-compute and pane creation"
```

---

## Task 6: Series/Indicator Management HUD

**Files:**
- Create: `src/ui/hud.ts`
- Create: `src/ui/settings-popup.ts`
- Modify: `src/api/chart-api.ts` — Replace old legend with HUD

- [ ] **Step 1: Create `src/ui/settings-popup.ts`**

```ts
export interface SettingsField {
  key: string;
  label: string;
  type: 'number' | 'color';
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
}

export type OnApply = (values: Record<string, number | string>) => void;

export function createSettingsPopup(
  fields: SettingsField[],
  onApply: OnApply,
  onCancel: () => void,
  theme: { bg: string; text: string; border: string },
): HTMLDivElement {
  const popup = document.createElement('div');
  popup.style.cssText =
    `position:absolute;z-index:30;padding:8px 12px;border-radius:6px;` +
    `background:${theme.bg};color:${theme.text};border:1px solid ${theme.border};` +
    `font-size:11px;font-family:inherit;display:flex;flex-direction:column;gap:6px;`;

  const inputs: Map<string, HTMLInputElement> = new Map();

  for (const field of fields) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;';

    const label = document.createElement('label');
    label.textContent = field.label;
    label.style.cssText = 'min-width:60px;';
    row.appendChild(label);

    const input = document.createElement('input');
    input.type = field.type === 'color' ? 'color' : 'number';
    input.value = String(field.value);
    if (field.type === 'number') {
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      if (field.step !== undefined) input.step = String(field.step);
      input.style.cssText = 'width:60px;background:transparent;color:inherit;border:1px solid ' + theme.border + ';border-radius:3px;padding:2px 4px;';
    } else {
      input.style.cssText = 'width:28px;height:22px;padding:0;border:none;cursor:pointer;';
    }
    row.appendChild(input);
    inputs.set(field.key, input);
    popup.appendChild(row);
  }

  // Buttons row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;margin-top:4px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `padding:3px 10px;border:1px solid ${theme.border};border-radius:3px;background:transparent;color:${theme.text};cursor:pointer;font-size:11px;`;
  cancelBtn.addEventListener('click', onCancel);

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.style.cssText = `padding:3px 10px;border:none;border-radius:3px;background:#2962ff;color:#fff;cursor:pointer;font-size:11px;`;
  applyBtn.addEventListener('click', () => {
    const values: Record<string, number | string> = {};
    for (const [key, input] of inputs) {
      values[key] = input.type === 'number' ? parseFloat(input.value) : input.value;
    }
    onApply(values);
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(applyBtn);
  popup.appendChild(btnRow);

  return popup;
}
```

- [ ] **Step 2: Create `src/ui/hud.ts`**

```ts
import { createSettingsPopup, type SettingsField, type OnApply } from './settings-popup';

export interface HudRowConfig {
  id: string;
  label: string;
  color: string;
  getValues: (barIndex: number) => string;
  onToggleVisible: () => boolean; // returns new visibility state
  onRemove: () => void;
  getSettingsFields: () => SettingsField[];
  onSettingsApply: OnApply;
}

export class HudManager {
  private _container: HTMLDivElement;
  private _rows: Map<string, { el: HTMLDivElement; valEl: HTMLSpanElement; eyeBtn: HTMLButtonElement; config: HudRowConfig }> = new Map();
  private _activePopup: HTMLDivElement | null = null;
  private _theme: { bg: string; text: string; border: string };

  constructor(paneRow: HTMLElement, theme: { bg: string; text: string; border: string; fontFamily: string }) {
    this._theme = theme;
    this._container = document.createElement('div');
    this._container.style.cssText =
      `position:absolute;top:4px;left:8px;z-index:10;font-size:11px;` +
      `font-family:${theme.fontFamily};pointer-events:none;display:flex;flex-direction:column;gap:2px;`;
    paneRow.appendChild(this._container);
  }

  addRow(config: HudRowConfig): void {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;pointer-events:auto;height:18px;';

    // Color swatch
    const swatch = document.createElement('div');
    swatch.style.cssText = `width:10px;height:10px;border-radius:2px;background:${config.color};flex-shrink:0;`;
    row.appendChild(swatch);

    // Label
    const label = document.createElement('span');
    label.textContent = config.label;
    label.style.cssText = `color:${this._theme.text};margin-right:4px;`;
    row.appendChild(label);

    // Values
    const valEl = document.createElement('span');
    valEl.style.cssText = `color:${this._theme.text};margin-right:4px;`;
    row.appendChild(valEl);

    // Eye button
    const eyeBtn = document.createElement('button');
    eyeBtn.innerHTML = '&#128065;'; // 👁
    eyeBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:0 2px;font-size:12px;opacity:0.7;';
    eyeBtn.title = 'Toggle visibility';
    eyeBtn.addEventListener('click', () => {
      const isVisible = config.onToggleVisible();
      eyeBtn.style.opacity = isVisible ? '0.7' : '0.3';
    });
    row.appendChild(eyeBtn);

    // Gear button
    const gearBtn = document.createElement('button');
    gearBtn.innerHTML = '&#9881;'; // ⚙
    gearBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:0 2px;font-size:12px;opacity:0.7;';
    gearBtn.title = 'Settings';
    gearBtn.addEventListener('click', () => {
      this._openSettings(config, gearBtn);
    });
    row.appendChild(gearBtn);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '&#10005;'; // ✕
    removeBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:0 2px;font-size:12px;opacity:0.7;color:' + this._theme.text + ';';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', () => {
      config.onRemove();
      this.removeRow(config.id);
    });
    row.appendChild(removeBtn);

    this._container.appendChild(row);
    this._rows.set(config.id, { el: row, valEl, eyeBtn, config });
  }

  removeRow(id: string): void {
    const entry = this._rows.get(id);
    if (entry) {
      entry.el.remove();
      this._rows.delete(id);
    }
  }

  updateValues(barIndex: number): void {
    for (const { valEl, config } of this._rows.values()) {
      valEl.textContent = config.getValues(barIndex);
    }
  }

  destroy(): void {
    this._closePopup();
    this._container.remove();
    this._rows.clear();
  }

  private _openSettings(config: HudRowConfig, anchor: HTMLElement): void {
    this._closePopup();
    const fields = config.getSettingsFields();
    if (fields.length === 0) return;

    const popup = createSettingsPopup(
      fields,
      (values) => {
        config.onSettingsApply(values);
        this._closePopup();
      },
      () => this._closePopup(),
      this._theme,
    );

    // Position below anchor
    const rect = anchor.getBoundingClientRect();
    const containerRect = this._container.getBoundingClientRect();
    popup.style.left = `${rect.left - containerRect.left}px`;
    popup.style.top = `${rect.bottom - containerRect.top + 4}px`;

    this._container.style.pointerEvents = 'auto';
    this._activePopup = popup;
    this._container.appendChild(popup);

    // Close on outside click
    const handler = (e: MouseEvent) => {
      if (!popup.contains(e.target as Node)) {
        this._closePopup();
        document.removeEventListener('mousedown', handler);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
  }

  private _closePopup(): void {
    if (this._activePopup) {
      this._activePopup.remove();
      this._activePopup = null;
      this._container.style.pointerEvents = 'none';
    }
  }
}
```

- [ ] **Step 3: Integrate HUD into chart-api.ts**

Replace the old legend DOM creation and `_updateLegend()` method:

1. Remove all `_legendEl`, `_legendOLabelEl`, etc. fields
2. Add `_huds: Map<string, HudManager> = new Map()` field
3. After pane creation, create a HudManager for each pane
4. When a series is added, register a HUD row for it
5. When an indicator is added, register a HUD row (with settings support)
6. `_updateHud()` replaces `_updateLegend()` — calls `hud.updateValues(barIndex)` on each HUD

- [ ] **Step 4: Verify build and test in Storybook**

Run: `npx tsc --noEmit`
Run: `npm run storybook` — verify HUD renders for existing stories.

- [ ] **Step 5: Commit**

```bash
git add src/ui/hud.ts src/ui/settings-popup.ts src/api/chart-api.ts
git commit -m "feat: series/indicator management HUD with visibility toggle, settings, and remove"
```

---

## Task 7: Logo and Branding

**Files:**
- Create: `public/logo.svg` — SVG logo
- Modify: `.storybook/preview.ts` — Add branding
- Modify: `.storybook/manager.ts` (create if needed) — Storybook theme with logo
- Modify: `README.md` — Add logo

- [ ] **Step 1: Create SVG logo at `public/logo.svg`**

Design a professional, minimalist financial charting logo. Concept: a stylized candlestick chart forming the letter "F" (for fin-charter), with a modern gradient.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2962ff"/>
      <stop offset="100%" stop-color="#00bcd4"/>
    </linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#26a69a"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </linearGradient>
    <linearGradient id="g3" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#ef5350"/>
      <stop offset="100%" stop-color="#b71c1c"/>
    </linearGradient>
  </defs>
  <!-- Background rounded square -->
  <rect x="16" y="16" width="480" height="480" rx="64" fill="#0d1117"/>
  <!-- Grid lines (subtle) -->
  <line x1="80" y1="100" x2="432" y2="100" stroke="#1a2332" stroke-width="1"/>
  <line x1="80" y1="180" x2="432" y2="180" stroke="#1a2332" stroke-width="1"/>
  <line x1="80" y1="260" x2="432" y2="260" stroke="#1a2332" stroke-width="1"/>
  <line x1="80" y1="340" x2="432" y2="340" stroke="#1a2332" stroke-width="1"/>
  <line x1="80" y1="420" x2="432" y2="420" stroke="#1a2332" stroke-width="1"/>
  <!-- Candlestick 1 (green/up) -->
  <line x1="140" y1="140" x2="140" y2="380" stroke="url(#g2)" stroke-width="4" stroke-linecap="round"/>
  <rect x="120" y="200" width="40" height="120" rx="4" fill="url(#g2)"/>
  <!-- Candlestick 2 (red/down) -->
  <line x1="220" y1="100" x2="220" y2="360" stroke="url(#g3)" stroke-width="4" stroke-linecap="round"/>
  <rect x="200" y="140" width="40" height="140" rx="4" fill="url(#g3)"/>
  <!-- Candlestick 3 (green/up, tall) -->
  <line x1="300" y1="80" x2="300" y2="340" stroke="url(#g2)" stroke-width="4" stroke-linecap="round"/>
  <rect x="280" y="120" width="40" height="160" rx="4" fill="url(#g2)"/>
  <!-- Candlestick 4 (green/up) -->
  <line x1="380" y1="100" x2="380" y2="300" stroke="url(#g2)" stroke-width="4" stroke-linecap="round"/>
  <rect x="360" y="140" width="40" height="100" rx="4" fill="url(#g2)"/>
  <!-- Trend line overlay -->
  <line x1="120" y1="320" x2="400" y2="130" stroke="url(#g1)" stroke-width="3" stroke-linecap="round" stroke-dasharray="8 4" opacity="0.8"/>
  <!-- Glow effect on trend line -->
  <line x1="120" y1="320" x2="400" y2="130" stroke="#2962ff" stroke-width="8" stroke-linecap="round" opacity="0.15" filter="blur(4px)"/>
</svg>
```

- [ ] **Step 2: Create `.storybook/manager.ts` with custom theme**

```ts
import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'dark',
  brandTitle: 'fin-charter',
  brandUrl: '/',
  brandImage: '/logo.svg',
  brandTarget: '_self',

  colorPrimary: '#2962ff',
  colorSecondary: '#00bcd4',

  appBg: '#0d1117',
  appContentBg: '#0d0d1a',
  appBorderColor: '#1a2332',
  appBorderRadius: 8,

  textColor: '#d1d4dc',
  textMutedColor: '#758696',
  textInverseColor: '#0d1117',

  barTextColor: '#d1d4dc',
  barSelectedColor: '#2962ff',
  barBg: '#0d1117',
});

addons.setConfig({ theme });
```

- [ ] **Step 3: Update `README.md` to include the logo**

At the top of `README.md`, add:

```md
<p align="center">
  <img src="public/logo.svg" alt="fin-charter" width="128" height="128" />
</p>

<h1 align="center">fin-charter</h1>
```

- [ ] **Step 4: Install Storybook theming dependency if needed**

Run: `npm ls @storybook/theming || npm install -D @storybook/theming @storybook/manager-api`

- [ ] **Step 5: Verify Storybook renders with logo**

Run: `npm run storybook`
Expected: Logo appears in Storybook sidebar header.

- [ ] **Step 6: Commit**

```bash
git add public/logo.svg .storybook/manager.ts README.md
git commit -m "feat: add fin-charter logo and Storybook branding"
```

---

## Task 8: Storybook Stories

**Files:**
- Create: `stories/Indicators-Extended.stories.ts`
- Create: `stories/Features/Screenshot.stories.ts`
- Create: `stories/Features/FitContent.stories.ts`
- Create: `stories/Features/TimeFormatter.stories.ts`
- Create: `stories/Features/DataChanged.stories.ts`
- Create: `stories/Features/IndicatorPanes.stories.ts`
- Create: `stories/Features/HUD.stories.ts`

- [ ] **Step 1: Create `stories/Features/IndicatorPanes.stories.ts`**

Demonstrates `addIndicator()` with RSI and MACD in separate panes.

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { AAPL_DAILY } from '../sample-data';
import { createChartContainer } from '../helpers';

const meta: Meta = { title: 'Features/Indicator Panes' };
export default meta;
type Story = StoryObj;

export const RSIAndMACD: Story = {
  name: 'RSI + MACD Panes',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('sma', { source: series, params: { period: 20 }, color: '#f0b90b' });
    chart.addIndicator('rsi', { source: series, color: '#7e57c2' });
    chart.addIndicator('macd', { source: series });

    return container;
  },
};

export const AllIndicators: Story = {
  name: 'All Indicators',
  render: () => {
    const container = createChartContainer();
    container.style.height = '800px';
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('vwap', { source: series, color: '#ff9800' });
    chart.addIndicator('bollinger', { source: series, color: '#42a5f5' });
    chart.addIndicator('rsi', { source: series });
    chart.addIndicator('stochastic', { source: series });
    chart.addIndicator('atr', { source: series });
    chart.addIndicator('adx', { source: series });

    return container;
  },
};
```

- [ ] **Step 2: Create `stories/Features/HUD.stories.ts`**

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { AAPL_DAILY } from '../sample-data';
import { createChartContainer } from '../helpers';

const meta: Meta = { title: 'Features/HUD' };
export default meta;
type Story = StoryObj;

export const FullHUD: Story = {
  name: 'Series & Indicator Management',
  render: () => {
    const container = createChartContainer();
    container.style.height = '700px';
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries({ label: 'AAPL' });
    series.setData(AAPL_DAILY);

    chart.addIndicator('sma', { source: series, params: { period: 20 }, color: '#f0b90b' });
    chart.addIndicator('ema', { source: series, params: { period: 50 }, color: '#e040fb' });
    chart.addIndicator('rsi', { source: series });
    chart.addIndicator('macd', { source: series });

    return container;
  },
};
```

- [ ] **Step 3: Create `stories/Features/Screenshot.stories.ts`**

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { AAPL_DAILY } from '../sample-data';
import { createChartContainer } from '../helpers';

const meta: Meta = { title: 'Features/Screenshot' };
export default meta;
type Story = StoryObj;

export const TakeScreenshot: Story = {
  name: 'Take Screenshot',
  render: () => {
    const wrapper = document.createElement('div');

    const btn = document.createElement('button');
    btn.textContent = 'Take Screenshot';
    btn.style.cssText = 'margin:8px;padding:6px 16px;cursor:pointer;';
    wrapper.appendChild(btn);

    const container = createChartContainer();
    wrapper.appendChild(container);

    const imgEl = document.createElement('img');
    imgEl.style.cssText = 'margin:8px;max-width:100%;border:1px solid #333;display:none;';
    wrapper.appendChild(imgEl);

    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    btn.addEventListener('click', () => {
      const canvas = chart.takeScreenshot();
      imgEl.src = canvas.toDataURL();
      imgEl.style.display = 'block';
    });

    return wrapper;
  },
};
```

- [ ] **Step 4: Create `stories/Features/FitContent.stories.ts`**

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { AAPL_DAILY } from '../sample-data';
import { createChartContainer } from '../helpers';

const meta: Meta = { title: 'Features/Fit Content' };
export default meta;
type Story = StoryObj;

export const FitContentDemo: Story = {
  name: 'Fit Content',
  render: () => {
    const wrapper = document.createElement('div');

    const btn = document.createElement('button');
    btn.textContent = 'Fit Content';
    btn.style.cssText = 'margin:8px;padding:6px 16px;cursor:pointer;';
    wrapper.appendChild(btn);

    const container = createChartContainer();
    wrapper.appendChild(container);

    const chart = createChart(container, {
      autoSize: true,
      timeScale: { barSpacing: 2 }, // zoomed out initially
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    btn.addEventListener('click', () => {
      chart.fitContent();
    });

    return wrapper;
  },
};
```

- [ ] **Step 5: Create `stories/Features/TimeFormatter.stories.ts`**

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { AAPL_DAILY } from '../sample-data';
import { createChartContainer } from '../helpers';

const meta: Meta = { title: 'Features/Time Formatter' };
export default meta;
type Story = StoryObj;

export const CustomTimeFormatter: Story = {
  name: 'Custom Time Formatter',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      timeScale: {
        tickMarkFormatter: (time: number, tickType: string) => {
          const d = new Date(time * 1000);
          if (tickType === 'year') return d.getUTCFullYear().toString();
          if (tickType === 'month') return d.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
          return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
        },
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    return container;
  },
};
```

- [ ] **Step 6: Create `stories/Features/DataChanged.stories.ts`**

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from '../helpers';

const meta: Meta = { title: 'Features/Data Changed' };
export default meta;
type Story = StoryObj;

export const DataChangedCounter: Story = {
  name: 'Data Change Events',
  render: () => {
    const wrapper = document.createElement('div');

    const counter = document.createElement('div');
    counter.style.cssText = 'margin:8px;color:#d1d4dc;font-family:monospace;';
    counter.textContent = 'Data changes: 0';
    wrapper.appendChild(counter);

    const container = createChartContainer();
    wrapper.appendChild(container);

    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    const bars = generateOHLCV(200);
    series.setData(bars);

    let count = 0;
    series.subscribeDataChanged(() => {
      count++;
      counter.textContent = `Data changes: ${count}`;
    });

    // Simulate real-time updates
    let price = bars[bars.length - 1].close;
    let time = bars[bars.length - 1].time;
    setInterval(() => {
      time += 86400;
      const change = (Math.random() - 0.48) * 3;
      const open = price;
      const close = price + change;
      series.update({
        time,
        open: +open.toFixed(2),
        high: +Math.max(open, close + Math.random() * 2).toFixed(2),
        low: +Math.min(open, close - Math.random() * 2).toFixed(2),
        close: +close.toFixed(2),
        volume: Math.round(50000 + Math.random() * 100000),
      });
      price = close;
    }, 1000);

    return wrapper;
  },
};
```

- [ ] **Step 7: Create `stories/Indicators-Extended.stories.ts`**

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { computeVWAP, computeStochastic, computeATR, computeADX, computeOBV, computeWilliamsR } from 'fin-charter/indicators';
import { AAPL_DAILY } from './sample-data';
import { createChartContainer } from './helpers';
import type { Bar } from 'fin-charter';

const meta: Meta = { title: 'Indicators Extended' };
export default meta;
type Story = StoryObj;

function indicatorToLineBars(times: Float64Array, values: Float64Array, length: number): Bar[] {
  const bars: Bar[] = [];
  for (let i = 0; i < length; i++) {
    if (isNaN(values[i])) continue;
    const v = values[i];
    bars.push({ time: times[i], open: v, high: v, low: v, close: v });
  }
  return bars;
}

export const VWAPOverlay: Story = {
  name: 'VWAP',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, volume: { visible: true } });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    const store = (series as any).getDataLayer().store;
    const vwap = computeVWAP(store.high, store.low, store.close, store.volume, store.length);
    const vwapSeries = chart.addLineSeries({ color: '#ff9800', lineWidth: 2 });
    vwapSeries.setData(indicatorToLineBars(store.time, vwap, store.length));

    return container;
  },
};

export const StochasticOscillator: Story = {
  name: 'Stochastic',
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('stochastic', { source: series, params: { kPeriod: 14, dPeriod: 3 } });

    return container;
  },
};

export const ATRIndicator: Story = {
  name: 'ATR',
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('atr', { source: series });

    return container;
  },
};

export const ADXIndicator: Story = {
  name: 'ADX',
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('adx', { source: series });

    return container;
  },
};

export const OBVIndicator: Story = {
  name: 'OBV',
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('obv', { source: series });

    return container;
  },
};

export const WilliamsRIndicator: Story = {
  name: 'Williams %R',
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('williams-r', { source: series });

    return container;
  },
};
```

- [ ] **Step 8: Verify all stories render in Storybook**

Run: `npm run storybook`
Expected: All new stories render without errors.

- [ ] **Step 9: Commit**

```bash
git add stories/
git commit -m "feat: add storybook stories for new indicators, panes, HUD, and features"
```

---

## Task 9: Final Verification & Cleanup

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Clean build, no warnings

- [ ] **Step 3: Run Storybook and verify all stories**

Run: `npm run storybook`
Manually verify:
- All chart types still work
- New indicators render correctly
- Multi-pane with dividers works
- HUD shows series/indicators with eye/gear/X buttons
- Settings popup opens and applies changes
- Screenshot captures all panes
- fitContent works
- Custom time formatter works
- DataChanged counter increments

- [ ] **Step 4: Commit any fixes**

If issues found, fix and commit.
