# Performance

This document explains the architectural decisions that keep fin-charter fast and small.

## ColumnStore — Typed Array Data Model

All series data is stored in a `ColumnStore` — a struct of six `Float64Array` columns (time, open, high, low, close, volume) plus a `length` counter.

```ts
interface ColumnStore {
  time:     Float64Array;
  open:     Float64Array;
  high:     Float64Array;
  low:      Float64Array;
  close:    Float64Array;
  volume:   Float64Array;
  length:   number;
  capacity: number;
}
```

**Why `Float64Array`?**

- **CPU cache locality** — iterating `store.close[i]` for `i` in the visible range scans a contiguous block of memory. Each 64-byte cache line holds 8 doubles. A traditional array of `{ open, high, low, close }` objects scatters those fields across the heap.
- **No GC pressure** — typed arrays are allocated once and reused. There are no short-lived objects during each render frame.
- **SIMD-friendly layout** — V8 and SpiderMonkey recognise typed-array loops and can apply loop optimisations that are not available for object-property access.

**Zero-copy fast path**

`series.setData(columnData)` copies `Float64Array` columns using `TypedArray.prototype.set()`, which maps to a single `memcpy`. The row-oriented `Bar[]` path converts with a simple indexed loop.

---

## Pre-Allocation Strategy

`DataLayer` initialises the `ColumnStore` with a capacity of **2 048 bars**:

```ts
constructor() {
  this.store = createColumnStore(2048);
}
```

When data loaded via `setData(bars[])` exceeds 2 048 bars, `barsToColumnStore` allocates at `Math.ceil(bars.length * 1.5)` — a 50% over-allocation to leave room for subsequent `update()` calls.

When the store fills during live `update()` calls the store **doubles in capacity** (classic geometric growth). This amortises allocation cost to O(1) per append.

---

## Layered Canvas Architecture

The chart uses **two stacked canvases** inside a positioned `<div>`:

| Canvas | `z-index` | Redrawn when |
|---|---|---|
| Main (series + grid) | 2 | `InvalidationLevel.Light` or higher |
| Overlay (crosshair) | 3 | `InvalidationLevel.Cursor` or higher |

This means moving the crosshair — the most frequent interaction — **only clears and redraws the 2-colour overlay canvas** rather than re-rendering every series. The main canvas is left untouched.

All canvas coordinates are multiplied by `window.devicePixelRatio` and rounded to integers before drawing. Canvas CSS size stays at the logical pixel size. This produces crisp lines on Retina and high-DPI displays without any blur.

---

## `InvalidateMask` — 4-Level Invalidation

```ts
const InvalidationLevel = {
  None:   0,  // nothing to do
  Cursor: 1,  // overlay (crosshair) only
  Light:  2,  // main canvas (data changed but layout unchanged)
  Full:   3,  // everything, including resize
} as const;
```

`InvalidateMask` tracks the highest level requested for each pane since the last paint. When the RAF fires, only the necessary work is done:

```
level >= Cursor → repaint overlay
level >= Light  → repaint main canvas
```

Multiple calls to `requestRepaint()` within a single event-loop tick merge into one RAF callback — the mask keeps whichever level is highest, so no redundant work is scheduled.

---

## Data Conflation — Batching Updates Within RAF

`requestRepaint()` guards against duplicate RAF registrations:

```ts
requestRepaint(level: number): void {
  this._mask.invalidateAll(level);
  if (this._rafId === null && !this._removed) {
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this._paint();
    });
  }
}
```

If `series.update()` is called 60 times in a tight loop (e.g. replaying historical data at speed) only **one** RAF is scheduled and one repaint occurs. The mask accumulates the highest level.

---

## Text Measurement Caching — `TextMetricsCache`

`ctx.measureText()` is expensive. `TextMetricsCache` pre-measures every character that appears in financial labels (`0–9`, `.`, `,`, `-`, `$`, `%`, `:`, `/`, all letters, space) once when the font changes, then answers subsequent calls with a fast integer summation:

```ts
measureWidth(text: string): number {
  let total = 0;
  for (const ch of text) {
    total += this._widths.get(ch) ?? /* fallback */ 0;
  }
  return total;
}
```

The cache is invalidated only when the font string changes. Characters outside the pre-measured set fall back to a live `ctx.measureText` call and are cached for next time.

---

## Bundle Size Budget

| Entry point | Target (gzip) | Strategy |
|---|---|---|
| `fin-charter` (core) | < 15 KB | No runtime deps; typed arrays; no polyfills |
| `fin-charter/indicators` | < 4 KB | Pure math; no imports outside the indicators dir |
| Full bundle (all chart types + indicators) | < 20 KB | All renderers + indicators |

The package sets `"sideEffects": false` in `package.json`. Every renderer, indicator, and interaction handler is imported only where used. Bundlers (Vite, Rollup, webpack) will tree-shake any module that is never referenced.

---

## Tree-Shaking

The ES module structure ensures that unused chart types are excluded automatically:

```ts
// Only LineRenderer is bundled; CandlestickRenderer, AreaRenderer, etc. are not.
import { createChart } from 'fin-charter';
const chart  = createChart(container);
const series = chart.addLineSeries();
```

Each renderer class is a separate module imported only inside `chart-api.ts`'s `_createRenderer()` switch statement. A bundler with dead-code elimination will drop the branches for series types that are never instantiated.

Similarly, importing only specific indicators keeps the indicators bundle minimal:

```ts
// Only sma.ts and ema.ts are included; rsi.ts, macd.ts, bollinger.ts are not.
import { computeSMA, computeEMA } from 'fin-charter/indicators';
```

---

## Tips for Users

### Use `ColumnData` for large datasets

```ts
// Fast — single memcpy per column
series.setData({
  time:   new Float64Array(timestamps),
  open:   new Float64Array(opens),
  high:   new Float64Array(highs),
  low:    new Float64Array(lows),
  close:  new Float64Array(closes),
  volume: new Float64Array(volumes),
});
```

The `Bar[]` path is convenient for small datasets but involves a per-bar loop and object allocation. For datasets over ~10 000 bars use `ColumnData` directly.

### Limit the visible range

The chart only renders bars within `timeScale().visibleRange()`. Zoom in (increase `barSpacing`) to render fewer bars per frame. At the default `barSpacing: 6` a 800 px wide chart renders ~133 bars per frame.

### Avoid calling `setData` on every tick

Use `series.update(bar)` for real-time streaming. `setData` rebuilds the entire `ColumnStore` on every call. `update` is O(1) for both overwrites and appends.

### Use `autoSize: true` instead of polling

```ts
const chart = createChart(container, { autoSize: true });
```

The chart attaches a native `ResizeObserver`. This fires exactly when the container size changes — no polling, no `setInterval`.
