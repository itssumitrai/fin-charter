# fin-charter Design Specification

**Date:** 2026-04-03
**Status:** Draft
**Package:** `fin-charter` (single npm package, tree-shakeable ES modules)
**License:** MIT

## 1. Overview

fin-charter is a TypeScript financial charting library optimized for extremely small bundle sizes and fast runtime performance. It targets fintech/trading app developers as the primary audience, with general time-series visualization as a secondary use case.

### Goals

- **Ultra-minimal core:** <15KB gzipped for core + one basic chart type
- **Tree-shakeable:** Every feature (chart type, indicator, interaction) is an opt-in ES module import
- **Fast rendering:** Canvas-based with layered canvases, dirty-region invalidation, zero per-frame allocations
- **Real-time ready:** Efficient incremental updates for streaming financial data
- **TradingView-compatible plugin model:** `ISeriesPrimitive` / `IPanePrimitive` pattern for extensions
- **Future SVG support:** Thin `IRenderer` interface abstracts rendering target

### Non-Goals (v1)

- Drawing tools (trend lines, fibonacci) — deferred to v2
- Built-in WebSocket/SSE data adapters — users manage their own connections
- Heikin-Ashi chart type — deferred
- OffscreenCanvas worker rendering — architecture supports it, shipped as fast follow

## 2. Technology Stack

| Tool | Purpose |
|------|---------|
| TypeScript | Source language, strict mode |
| Svelte | Internal DOM management (tooltips, axis labels, legends) — compiles to vanilla JS |
| Vite | Dev server, build tooling, library mode output |
| Vitest | Unit testing |
| ESLint + Prettier | Code quality |
| `sideEffects: false` | Enable bundler tree-shaking |

## 3. Module Structure

```
fin-charter/
├── src/
│   ├── core/              # ~8-12KB gzipped — the only mandatory code
│   │   ├── chart.ts              # ChartModel — orchestrator, owns panes/series/scales
│   │   ├── pane.ts               # Pane — container for series + price scales
│   │   ├── time-scale.ts         # TimeScale — horizontal axis, viewport, bar spacing
│   │   ├── price-scale.ts        # PriceScale — vertical axis, auto-scale, multiple per pane
│   │   ├── series.ts             # Base series abstraction
│   │   ├── data-layer.ts         # Data ingestion, ColumnStore, indexing
│   │   ├── crosshair.ts          # Crosshair state management
│   │   ├── invalidation.ts       # InvalidateMask (None/Cursor/Light/Full)
│   │   └── types.ts              # Shared types & interfaces
│   │
│   ├── renderers/         # Tree-shakeable — pulled in only by series that use them
│   │   ├── renderer.ts           # IRenderer interface + IRenderTarget
│   │   ├── canvas-renderer.ts    # CanvasRenderer implementation
│   │   ├── text-cache.ts         # Pre-measured glyph cache (pretext.js technique)
│   │   ├── candlestick.ts
│   │   ├── line.ts
│   │   ├── area.ts
│   │   ├── bar-ohlc.ts
│   │   ├── baseline.ts
│   │   ├── hollow-candle.ts
│   │   └── histogram.ts          # For volume
│   │
│   ├── series/            # Chart type modules — each registers a renderer
│   │   ├── candlestick.ts
│   │   ├── line.ts
│   │   ├── area.ts
│   │   ├── bar.ts
│   │   ├── baseline.ts
│   │   ├── hollow-candle.ts
│   │   └── volume.ts
│   │
│   ├── indicators/        # Each is independent, tree-shakeable (~0.5-1.5KB each)
│   │   ├── sma.ts
│   │   ├── ema.ts
│   │   ├── rsi.ts
│   │   ├── macd.ts
│   │   ├── bollinger.ts
│   │   └── volume.ts
│   │
│   ├── interactions/      # Opt-in interaction handlers
│   │   ├── pan-zoom.ts           # Pan + wheel zoom + pinch zoom (included by default)
│   │   ├── crosshair.ts          # Crosshair tracking (included by default)
│   │   ├── keyboard-nav.ts       # Arrow keys, +/-, Home/End (opt-in)
│   │   └── axis-drag.ts          # Price/time axis drag-scaling (opt-in)
│   │
│   ├── gui/               # Svelte-compiled DOM overlays
│   │   ├── ChartWidget.svelte     # Main container, ResizeObserver
│   │   ├── PaneWidget.svelte      # Per-pane canvas management
│   │   ├── PriceAxisWidget.svelte # Price axis labels
│   │   ├── TimeAxisWidget.svelte  # Time axis labels
│   │   ├── CrosshairLabel.svelte  # Floating price/time tooltip
│   │   ├── PaneSeparator.svelte   # Draggable pane divider
│   │   └── Legend.svelte           # Series name, OHLCV values
│   │
│   └── api/               # Public API surface
│       ├── chart-api.ts          # createChart() + IChartApi
│       ├── series-api.ts         # ISeriesApi
│       ├── pane-api.ts           # IPaneApi
│       └── options.ts            # Option types & defaults
│
├── dev/                   # Vite dev app (Svelte)
│   ├── App.svelte
│   ├── main.ts
│   └── index.html
│
├── tests/                 # Vitest unit tests
└── docs/                  # User documentation
```

### Tree-Shaking Strategy

- Package.json: `"sideEffects": false`, `"type": "module"`, `"exports"` map for deep imports
- Each indicator, chart type, and interaction is a leaf module with no cross-dependencies
- Core is the only always-included code
- Pan, zoom, and crosshair are included by default (essential); keyboard nav and axis drag are opt-in

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./indicators": "./dist/indicators/index.js",
    "./indicators/*": "./dist/indicators/*.js",
    "./interactions/*": "./dist/interactions/*.js"
  }
}
```

## 4. Data Model

### Public API — Two Input Formats

```typescript
// Standard bar objects (ergonomic)
interface Bar {
  time: number;    // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Columnar typed arrays (zero-copy, maximum performance)
interface ColumnData {
  time:    Float64Array;
  open:    Float64Array;
  high:    Float64Array;
  low:     Float64Array;
  close:   Float64Array;
  volume?: Float64Array;
}
```

### Internal Storage — ColumnStore

All data is stored internally as columnar typed arrays for cache-friendly sequential access during rendering.

```typescript
interface ColumnStore {
  time:     Float64Array;
  open:     Float64Array;
  high:     Float64Array;
  low:      Float64Array;
  close:    Float64Array;
  volume:   Float64Array;
  length:   number;     // Actual data count
  capacity: number;     // Allocated slots
}
```

**Design decisions:**

- `Float64Array` everywhere — financial prices need full double precision
- Contiguous memory — CPU cache lines prefetch sequential reads, 3-10x faster than object arrays
- No GC pressure — typed arrays are a single allocation, not thousands of objects
- SIMD-friendly — V8 can auto-vectorize loops over typed arrays

### Pre-allocation & Growth

- Initial capacity: `Math.max(dataLength * 1.5, 2048)`
- Growth: when `length === capacity`, allocate `capacity * 2`, copy via `TypedArray.set()` (memcpy-speed)
- First ~2048 real-time ticks never trigger reallocation

### Indexing

- **Sorted time assumption** — data must arrive in time order (enforced on ingestion)
- Binary search (`O(log n)`) for any time lookup — faster than HashMap due to cache locality
- No `Map<timestamp, index>` — avoids memory overhead and GC pressure
- `visibleRange: { fromIdx: number, toIdx: number }` — two integers bound all rendering loops

### Real-Time Update Path

```
update(bar) →
  1. Compare bar.time vs store.time[length-1]     (single float comparison)
  2. Same time → overwrite 5 floats in-place       (zero allocation)
  3. New time → write at store[length], length++    (zero allocation if capacity allows)
  4. Check if price exceeds visible range → Cursor or Light invalidation
  5. Enqueue invalidation → next RAF paints once
```

### Data Conflation

Multiple `update()` calls within a single frame (~16ms) are batched — only the last value per timestamp is rendered. Prevents thrashing during high-frequency feeds.

## 5. Rendering Pipeline

### Layered Canvas Architecture

Each Pane has 3 stacked canvases:

| Layer | Z-Index | Contents | Redraw Frequency |
|-------|---------|----------|-----------------|
| Background | 1 | Background fill, grid lines, watermarks | Rarely (resize, theme change) |
| Main | 2 | Series data, indicators | On new data, pan, zoom |
| Overlay | 3 | Crosshair, selection highlights, hover | Every mousemove |

**Why 3 canvases:** Crosshair moves every mousemove — only overlay redraws (~0.1ms). Series data redraws only on new bars. Background is painted once. Avoids redrawing the entire chart at 60fps for a moving crosshair.

### IRenderer Interface

```typescript
interface IRenderer {
  setSize(width: number, height: number): void;
  clear(): void;
  save(): void;
  restore(): void;
  clip(x: number, y: number, w: number, h: number): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  drawLine(x1: number, y1: number, x2: number, y2: number): void;
  drawRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawPath(commands: PathCommand[]): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): number;
  setStyle(style: RenderStyle): void;
  createGradient(x0: number, y0: number, x1: number, y1: number, stops: GradientStop[]): Gradient;
}
```

`CanvasRenderer` wraps Canvas2D with 1:1 method mapping — zero abstraction overhead. A future `SVGRenderer` would build SVG DOM elements instead.

### InvalidateMask

```
None   (0) → Nothing to redraw
Cursor (1) → Overlay canvas only (crosshair moved)
Light  (2) → Main + overlay (new bar, scroll, zoom)
Full   (3) → All 3 canvases (resize, theme change, full data reload)
```

Each pane tracks its own invalidation level. On RAF tick:
1. Read mask for each pane
2. Only repaint canvases at or above that level
3. Reset mask to None

### Render Cycle (Single RAF)

```
1. Collect invalidation mask across all panes
2. If all None → skip frame entirely (zero CPU when idle)
3. For each pane with invalidation:
   a. Compute visible range (fromIdx, toIdx) from TimeScale
   b. Convert data indices → pixel coordinates via PriceScale/TimeScale
   c. Call series renderer with typed array refs + pixel coords
   d. Call indicator renderers (primitives)
   e. If overlay dirty → redraw crosshair/hover
4. Paint axis labels (Svelte components update only if values changed)
5. Reset all masks to None
```

### Coordinate Conversion

Computed once per frame, not per bar:
- TimeScale: `index → pixel x` via `x = baseX + index * barSpacing`
- PriceScale: `price → pixel y` using visible min/max linear mapping

### Text Measurement Cache (pretext.js technique)

Instead of calling `ctx.measureText()` per label per frame, we pre-measure glyph widths:

- On font change: measure widths for financial character set (~70 chars: `0-9`, `.`, `-`, `,`, `$`, `%`, `:`, `/`, space, a-z, A-Z)
- On layout: sum cached widths via arithmetic — no canvas access needed
- Result: ~0.004ms for 20 labels vs ~1ms with raw `measureText()` (250x speedup)

### OffscreenCanvas (Progressive Enhancement, Post-v1)

Architecture supports optional worker-based rendering:
- Overlay stays on main thread (crosshair needs <1ms latency)
- Main + Background offloaded to worker via `transferControlToOffscreen()`
- Toggled by `useWorker: true` option
- Falls back to main-thread rendering if unsupported

### Performance Guarantees

| Scenario | Target |
|----------|--------|
| Idle chart | 0 CPU (no animation loop) |
| Mouse move | <0.5ms (overlay canvas only) |
| New tick | <3ms (main + overlay, 1000 visible bars) |
| Full resize | <10ms (all canvases) |
| Text measurement | ~0.004ms for 20 labels |

## 6. Interactions & Event Handling

### EventRouter

Single `PointerEvent` listener on chart container — normalizes mouse/touch/pen into unified events, determines target pane, dispatches to handlers.

### Interaction Handlers

**Pan (included by default):**
- PointerDown records `startX`, `startTimeOffset`
- PointerMove shifts `TimeScale.offset` → Light invalidation
- Kinetic scrolling on PointerUp: animate with 0.95 damping factor, stop when velocity < 0.5px/frame
- Zero allocations — reuses single state object

**Zoom (included by default):**
- Wheel: adjusts `barSpacing` centered on cursor. Debounced — accumulates delta, applies once per RAF
- Pinch: two-pointer distance delta → barSpacing change
- Clamped to `[minBarSpacing, maxBarSpacing]`

**Crosshair (included by default):**
- PointerMove → binary search for nearest bar index
- Reads values from ColumnStore at snapped index
- Cursor invalidation only (overlay canvas)
- Labels updated via Svelte compiled reactivity (direct property sets, no diffing)

**Axis Drag-Scaling (opt-in):**
- PointerDown on price axis → scale-drag mode
- Delta maps to price range expansion/contraction
- Overrides auto-scale until double-click reset
- Time axis drag adjusts visible range similarly

**Keyboard Navigation (opt-in):**
- Left/Right: shift visible range by 1 bar (10 with Shift)
- Up/Down: zoom in/out
- Home/End: jump to start/end
- `+`/`-`: zoom in/out
- Only fires when chart container is focused

### Event Batching

Multiple events within one RAF frame are accumulated:
```
mousemove → mousemove → mousemove → wheel
→ Accumulate: last cursor position + total wheel delta
→ Single RAF: apply accumulated state, redraw once
```

## 7. Plugin Architecture (TradingView-Compatible)

### Core Primitives

```typescript
// Attaches to a series (overlays, markers, custom renderers)
interface ISeriesPrimitive<TData = unknown> {
  onDataUpdate?(scope: DataUpdateScope): void;
  paneViews(): IPaneView[];
  priceAxisViews?(): IPriceAxisView[];
  timeAxisViews?(): ITimeAxisView[];
  attached?(params: AttachedParams): void;
  detached?(): void;
  hitTest?(x: number, y: number): PrimitiveHitTestResult | null;
}

// Attaches to a pane directly (watermarks, backgrounds)
interface IPanePrimitive {
  paneViews(): IPaneView[];
  priceAxisViews?(): IPriceAxisView[];
  timeAxisViews?(): ITimeAxisView[];
  attached?(params: AttachedParams): void;
  detached?(): void;
}
```

### View-Renderer Pattern

```typescript
// View — decides WHAT to render based on current state
interface IPaneView {
  update(): void;
  renderer(): IPaneRenderer | null;
  zOrder?(): PrimitiveZOrder;  // 'bottom' | 'main' | 'top'
}

// Renderer — stateless draw commands
interface IPaneRenderer {
  draw(target: IRenderTarget): void;
  drawBackground?(target: IRenderTarget): void;
}

// What renderers receive — direct canvas access for max performance
interface IRenderTarget {
  context: CanvasRenderingContext2D;
  pixelRatio: number;
  width: number;
  height: number;
  renderer(): IRenderer;  // Helper wrapper for those who prefer the abstraction
}
```

### Why View-Renderer Separation

- View holds state/logic, Renderer is stateless draw commands
- Same View can produce different Renderers (Canvas now, SVG later)
- Plugin developers from TradingView find the same concepts
- Z-order slots (`bottom`, `main`, `top`) control layering without hacking

### Indicators as Primitives

Indicators are `ISeriesPrimitive` implementations internally:

```typescript
function sma(options: SMAOptions): ISeriesPrimitive {
  return {
    onDataUpdate(scope) { /* recompute SMA values */ },
    paneViews() { return [smaLineView]; },
    priceAxisViews() { return [smaAxisLabel]; },
  };
}
```

### Indicator Computation

Pure functions returning typed arrays:

```typescript
// Overlay indicators
sma.compute(store, { period: 20 })       → Float64Array
ema.compute(store, { period: 20 })       → Float64Array
bollinger.compute(store, { period: 20, stdDev: 2 })
  → { middle: Float64Array, upper: Float64Array, lower: Float64Array }

// Separate-pane indicators
rsi.compute(store, { period: 14 })       → Float64Array
macd.compute(store, { period: 12, signal: 26, smooth: 9 })
  → { macd: Float64Array, signal: Float64Array, histogram: Float64Array }
volume.compute(store, {})                → Float64Array
```

### Incremental Computation (Real-Time)

```typescript
interface IncrementalCompute<TParams, TOutput, TState> {
  computeFull(store: ColumnStore, params: TParams): { output: TOutput; state: TState };
  computeIncremental(bar: BarView, params: TParams, state: TState): { output: number; state: TState };
}
```

Example — SMA(20) new bar: `newSMA = prevSMA + (newClose - droppedClose) / period` — one subtraction, one addition, one division instead of a 20-element loop.

### Third-Party Plugin Usage

```typescript
// TradingView-compatible attachment
series.attachPrimitive(myCustomPrimitive);
series.detachPrimitive(myCustomPrimitive);

// Convenience shorthand for indicators
series.addIndicator(sma({ period: 20, color: '#2196F3' }));
chart.addIndicator(rsi({ period: 14 }), { source: series });
```

## 8. GUI Layer (Svelte Components)

### Layout

```
┌─────────────────────────────────────────────────┐
│ ChartWidget                                      │
│ ┌─────────────────────────────────┬────────────┐│
│ │ PaneWidget (main)               │ PriceAxis  ││
│ │  [Background Canvas]            │  [Labels]  ││
│ │  [Main Canvas]                  │            ││
│ │  [Overlay Canvas]               │            ││
│ │  [CrosshairLabel]               │            ││
│ ├─────────────────────────────────┤            ││
│ │ PaneSeparator (draggable)       │            ││
│ ├─────────────────────────────────┼────────────┤│
│ │ PaneWidget (indicator pane)     │ PriceAxis  ││
│ │  [Canvas layers]                │  [Labels]  ││
│ ├─────────────────────────────────┴────────────┤│
│ │ TimeAxis                                      ││
│ └───────────────────────────────────────────────┘│
│ Legend (optional)                                 │
└─────────────────────────────────────────────────┘
```

### Svelte Component Responsibilities

| Component | Role | Why DOM not Canvas |
|-----------|------|-------------------|
| `ChartWidget` | Container, ResizeObserver, pane layout | Flexbox layout |
| `PaneWidget` | Creates/manages 3 canvas layers | DOM around canvases |
| `PriceAxisWidget` | Price labels, current price marker | Crisp text, accessibility |
| `TimeAxisWidget` | Time/date labels | Crisp text, accessibility |
| `CrosshairLabel` | Floating tooltip | Overflows canvas bounds |
| `PaneSeparator` | Draggable pane divider | CSS cursor feedback |
| `Legend` | OHLCV values display | Frequent text updates |

### Why Svelte

- Compiles to direct DOM mutations (~50 bytes per binding) — no virtual DOM, no runtime
- Users never know Svelte is involved — public API is `createChart(container, options)`
- Axis ticks/grid are drawn on canvas — only text labels are DOM for crispness and accessibility

## 9. Public API

### Chart Creation

```typescript
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), {
  width: 800,
  height: 600,
  layout: {
    background: '#1a1a2e',
    textColor: '#e0e0e0',
    fontSize: 12,
  },
  timeScale: {
    rightOffset: 5,
    barSpacing: 8,
    timeVisible: true,
  },
  crosshair: {
    mode: 'normal',  // 'normal' | 'magnet'
  },
});
```

### IChartApi

```typescript
interface IChartApi {
  // Series — data can be passed in options
  addCandlestickSeries(options?: CandlestickSeriesOptions & { data?: Bar[] | ColumnData }): ISeriesApi<'Candlestick'>;
  addLineSeries(options?: LineSeriesOptions & { data?: Bar[] | ColumnData }): ISeriesApi<'Line'>;
  addAreaSeries(options?: AreaSeriesOptions & { data?: Bar[] | ColumnData }): ISeriesApi<'Area'>;
  addBarSeries(options?: BarSeriesOptions & { data?: Bar[] | ColumnData }): ISeriesApi<'Bar'>;
  addBaselineSeries(options?: BaselineSeriesOptions & { data?: Bar[] | ColumnData }): ISeriesApi<'Baseline'>;
  addHollowCandleSeries(options?: HollowCandleSeriesOptions & { data?: Bar[] | ColumnData }): ISeriesApi<'HollowCandle'>;
  removeSeries(series: ISeriesApi<any>): void;

  // Panes
  addPane(options?: PaneOptions): IPaneApi;
  removePane(pane: IPaneApi): void;

  // Indicators (convenience)
  addIndicator(indicator: IndicatorDefinition, options?: { source: ISeriesApi<any> }): IIndicatorApi;
  removeIndicator(indicator: IIndicatorApi): void;

  // Scales
  timeScale(): ITimeScaleApi;
  priceScale(id?: string): IPriceScaleApi;

  // Options
  applyOptions(options: DeepPartial<ChartOptions>): void;
  options(): Readonly<ChartOptions>;

  // Lifecycle
  resize(width: number, height: number): void;
  remove(): void;

  // Events
  subscribeCrosshairMove(callback: (params: CrosshairMoveParams) => void): void;
  unsubscribeCrosshairMove(callback: (params: CrosshairMoveParams) => void): void;
  subscribeClick(callback: (params: ClickParams) => void): void;
  unsubscribeClick(callback: (params: ClickParams) => void): void;
  subscribeVisibleRangeChange(callback: (range: TimeRange) => void): void;
  unsubscribeVisibleRangeChange(callback: (range: TimeRange) => void): void;
}
```

### ISeriesApi

```typescript
interface ISeriesApi<T extends SeriesType> {
  setData(data: Bar[] | ColumnData): void;
  update(bar: Bar): void;
  attachPrimitive(primitive: ISeriesPrimitive): void;
  detachPrimitive(primitive: ISeriesPrimitive): void;
  addIndicator(indicator: IndicatorDefinition): IIndicatorApi;
  applyOptions(options: DeepPartial<SeriesOptionsMap[T]>): void;
  options(): Readonly<SeriesOptionsMap[T]>;
  priceScale(): IPriceScaleApi;
  dataByIndex(index: number): Bar | null;
  coordinateToPrice(y: number): number;
  priceToCoordinate(price: number): number;
}
```

### ITimeScaleApi

```typescript
interface ITimeScaleApi {
  scrollToPosition(position: number, animated?: boolean): void;
  scrollToRealTime(): void;
  getVisibleRange(): TimeRange | null;
  setVisibleRange(range: TimeRange): void;
  fitContent(): void;
  applyOptions(options: DeepPartial<TimeScaleOptions>): void;
  coordinateToTime(x: number): number | null;
  timeToCoordinate(time: number): number | null;
}
```

### Usage Examples

```typescript
// Minimal — line chart (~10-12KB gzipped)
import { createChart } from 'fin-charter';
const chart = createChart(el);
chart.addLineSeries({ data: prices });

// Full trading chart
import { createChart } from 'fin-charter';
import { sma, ema, bollinger } from 'fin-charter/indicators';
import { rsi, macd } from 'fin-charter/indicators';

const chart = createChart(el, { layout: { background: '#1a1a2e' } });
const series = chart.addCandlestickSeries({ data: ohlcv });

// Overlay indicators
series.addIndicator(sma({ period: 20, color: '#2196F3' }));
series.addIndicator(ema({ period: 50, color: '#FF9800' }));
series.addIndicator(bollinger({ period: 20, stdDev: 2 }));

// Separate-pane indicators
chart.addIndicator(rsi({ period: 14 }), { source: series });
chart.addIndicator(macd({ fast: 12, slow: 26, signal: 9 }), { source: series });

// Real-time updates
ws.onmessage = (e) => series.update(JSON.parse(e.data));

// Opt-in interactions
import { enableKeyboardNav } from 'fin-charter/interactions';
enableKeyboardNav(chart);
```

## 10. Chart Types (v1)

| Type | Renderer | Description |
|------|----------|-------------|
| Candlestick | `CandlestickRenderer` | Standard OHLC candles, up/down colors |
| Line | `LineRenderer` | Close-price line, configurable width/color |
| Area | `AreaRenderer` | Line + gradient fill to bottom |
| Bar (OHLC) | `BarOHLCRenderer` | Traditional OHLC bars |
| Baseline | `BaselineRenderer` | Line with above/below coloring relative to base price |
| Hollow Candle | `HollowCandleRenderer` | Filled when close < open, hollow when close > open |
| Volume (histogram) | `HistogramRenderer` | Volume bars, colored by price direction |

## 11. Indicators (v1)

| Indicator | Type | Pane | Outputs |
|-----------|------|------|---------|
| SMA | Overlay | Main | Single line |
| EMA | Overlay | Main | Single line |
| Bollinger Bands | Overlay | Main | Upper, middle, lower lines + optional fill |
| RSI | Oscillator | Separate | Single line (0-100), overbought/oversold zones |
| MACD | Oscillator | Separate | MACD line, signal line, histogram |
| Volume | Histogram | Separate | Volume bars colored by price direction |

## 12. Bundle Size Budget

| Import | Target (gzipped) |
|--------|-------------------|
| Core + Line chart | <12KB |
| Core + Candlestick | <15KB |
| Each additional chart type | +1-2KB |
| Each indicator | +0.5-1.5KB |
| Keyboard nav | +0.5KB |
| Axis drag-scaling | +0.5KB |
| Full chart (all types + all indicators + all interactions) | <35KB |

## 13. Dev Environment

- **Dev server:** Vite + Svelte dev app at `dev/` with hot reload
- **Testing:** Vitest with unit tests for data layer, indicators, coordinate conversion
- **Linting:** ESLint with TypeScript rules + Prettier
- **Build:** Vite library mode outputting ES modules + TypeScript declarations
