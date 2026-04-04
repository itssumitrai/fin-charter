# Production Feature Gaps — Design Spec

**Date:** 2026-04-03
**Scope:** Single PR covering all P0+P1 production gaps
**Goal:** Make fin-charter production-grade by adding data infrastructure, drawing tools, chart types, market sessions, event markers, comparison mode, state save/restore, and 6 additional indicators

---

## A. Data Feed Infrastructure

### A1. `prependData()` for Pagination

**Location:** `ISeriesApi` + `SeriesApi` + `DataLayer`

```ts
series.prependData(data: Bar[] | ColumnData): void;
```

Internally allocates a new ColumnStore with `capacity = existing + new + headroom`, copies new data at front, existing data after. O(n) single copy, avoids full `setData()` rebuild on every scroll-back.

`DataLayer` gains a `prepend(data)` method that handles the ColumnStore reallocation.

### A2. `barsInLogicalRange()` for Pagination Detection

**Location:** `ISeriesApi` + `SeriesApi`

```ts
series.barsInLogicalRange(range: LogicalRange): { barsBefore: number; barsAfter: number; from: number; to: number };
```

Returns how many bars exist before/after the visible range, plus the timestamps at the edges. Consumers use this to decide when to fetch more history.

### A3. Periodicity Model

**Location:** `src/core/periodicity.ts` (new), `IChartApi`, `TimeScaleApiOptions`

```ts
interface Periodicity {
  interval: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
}

// IChartApi additions
setPeriodicity(periodicity: Periodicity): void;
getPeriodicity(): Periodicity;
subscribePeriodicityChange(handler: (p: Periodicity) => void): void;
```

The chart stores periodicity as metadata. Switching fires an event. The consumer decides whether to fetch new data or aggregate client-side.

**Client-side aggregation utility** at `src/transforms/aggregate.ts`:

```ts
function aggregateOHLC(source: ColumnStore, targetIntervalSec: number): ColumnStore
```

Single-pass O(n) on Float64Arrays. Buckets align to clock boundaries (floor division). `open=first, high=max, low=min, close=last, volume=sum`.

Periodicity also informs time-axis label formatting (HH:MM for intraday, MMM DD for daily, YYYY for monthly).

### A4. Comparison Mode

**Location:** `PriceScale` (extended), `IChartApi`, renderers

```ts
// IChartApi additions
setComparisonMode(enabled: boolean): void;
isComparisonMode(): boolean;
```

When enabled:
- Each series gets a `basisPrice` = first visible bar's close, recomputed on scroll
- `percentChange = ((price - basisPrice) / basisPrice) * 100`
- PriceScale operates in percent space: `percentToY()` / `yToPercent()`
- Y-axis labels format as `"+12.5%"`, `"-3.2%"`, `"0.0%"`
- Auto-scaling scans percentage min/max across all series
- OHLC series auto-switch to line rendering (industry standard for comparisons)
- Raw data stays untouched — transformation is at render time only

Basis price recomputation is O(series_count) on scroll, not O(data_length).

---

## B. Drawing Tools

### B1. Architecture — Managed API Following Indicator Pattern

**Layer 1 (exists):** `ISeriesPrimitive` — users attach custom drawings manually via `series.attachPrimitive()`

**Layer 2 (new):** Managed Drawing API — chart owns lifecycle

```ts
// IChartApi additions
addDrawing(type: DrawingType, points: AnchorPoint[], options?: DrawingOptions): IDrawingApi;
removeDrawing(drawing: IDrawingApi): void;
getDrawings(): IDrawingApi[];
setActiveDrawingTool(type: DrawingType | null): void;
registerDrawingType(type: string, factory: DrawingFactory): void;
serializeDrawings(): SerializedDrawing[];
deserializeDrawings(data: SerializedDrawing[]): void;
```

**Types:**

```ts
interface AnchorPoint { time: number; price: number; }

interface DrawingOptions {
  color?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fillColor?: string;
  text?: string;
  fontSize?: number;
}

type DrawingType = 'horizontalLine' | 'verticalLine' | 'trendline' | 'fibonacci' | 'rectangle' | 'text';

type DrawingFactory = (id: string, points: AnchorPoint[], options: DrawingOptions) => ISeriesPrimitive & DrawingPrimitive;

interface DrawingPrimitive {
  readonly drawingType: string;
  readonly requiredPoints: number;
  points: AnchorPoint[];
  options: DrawingOptions;
  selected: boolean;
  serialize(): SerializedDrawing;
  hitTest(x: number, y: number): DrawingHitTestResult | null;
}

interface IDrawingApi {
  readonly id: string;
  drawingType(): DrawingType;
  points(): AnchorPoint[];
  applyOptions(options: Partial<DrawingOptions>): void;
  options(): DrawingOptions;
  remove(): void;
}
```

Built-in drawings are implemented as `ISeriesPrimitive & DrawingPrimitive` and pre-registered via `registerDrawingType()` — same code path users use for custom drawings. We dogfood our own extensibility.

### B2. Built-in Drawing Types (6)

Each implements `ISeriesPrimitive & DrawingPrimitive` with Model/PaneView/PaneRenderer separation:

| Tool | requiredPoints | Rendering |
|------|---------------|-----------|
| Horizontal Line | 1 | Full-width line at price + Y-axis label |
| Vertical Line | 1 | Full-height line at time + X-axis label |
| Trendline | 2 | Line segment between anchors |
| Fibonacci | 2 | 7 horizontal levels (0, 23.6, 38.2, 50, 61.8, 78.6, 100%) with shaded zones + labels |
| Rectangle | 2 | Filled rectangle between two corners |
| Text | 1 | Positioned text with optional background |

**New files:**
- `src/drawings/base.ts` — Internal base implementation with common paneView/renderer logic
- `src/drawings/horizontal-line.ts`
- `src/drawings/vertical-line.ts`
- `src/drawings/trendline.ts`
- `src/drawings/fibonacci.ts`
- `src/drawings/rectangle.ts`
- `src/drawings/text-annotation.ts`
- `src/drawings/index.ts` — Registry setup, exports built-in factories

### B3. Rendering

Drawings render on the **existing overlay canvas** (zIndex 2). Drawing changes trigger `InvalidationLevel.Cursor` (overlay-only repaint — series canvas untouched).

Render order on overlay:
1. Drawing fills (rectangles, fibonacci zones) — zOrder Bottom
2. Drawing lines (trendlines, horizontals) — zOrder Normal
3. Crosshair lines
4. Drawing handles (selection handles when editing) — zOrder Top

### B4. Hit Testing

Mathematical distance per shape type. 5-8px threshold (scaled by pixelRatio).

- **Horizontal/Vertical line:** `|mouseCoord - lineCoord| < threshold`
- **Trendline:** Point-to-line-segment distance < threshold
- **Rectangle:** Point inside rect OR distance-to-edge < threshold
- **Fibonacci:** Same as horizontal for each level line
- **Text:** Point inside text bounding box

Returns `{ drawing, part: 'body' | 'handle1' | 'handle2', cursorStyle }`.

### B5. Interaction — State Machine

**New file:** `src/interactions/drawing-handler.ts`

Implements `EventHandler`, registered as first handler in EventRouter (highest priority).

**EventRouter change:** Handlers return `boolean` from `onPointerDown` — if `true`, stops propagation to subsequent handlers (PanZoomHandler).

**States:**
- `IDLE` — pass all events through
- `SELECTING` — tool active, waiting for first click (cursor: crosshair)
- `PLACING` — first point placed, tracking mouse for preview (live preview drawing updates)
- `EDITING` — drawing selected, handles visible and draggable

**Snapping:** X snaps to bar centers, Y snaps to nearest OHLC within 8px.

**Keys:** Delete removes selected drawing, Escape cancels tool/deselects.

### B6. Serialization

```ts
interface SerializedDrawing {
  type: string;
  id: string;
  points: { time: number; price: number }[];  // Unix timestamps
  options: DrawingOptions;
}
```

Uses timestamps (not bar indices) so drawings survive data reloads. On deserialization, timestamps are converted to bar indices via binary search.

---

## C. Heikin-Ashi Chart Type

**Location:** `src/transforms/heikin-ashi.ts` (new), `SeriesType` union, `_addSeries()` in chart-api.ts

```ts
function computeHeikinAshi(store: ColumnStore): ColumnStore
```

Single-pass O(n) data transform. Formula:
- `HA_Close = (O+H+L+C)/4`
- `HA_Open = (prev_HA_Open + prev_HA_Close)/2`  (first bar: `(O+C)/2`)
- `HA_High = max(H, HA_Open, HA_Close)`
- `HA_Low = min(L, HA_Open, HA_Close)`

Add `'heikin-ashi'` to `SeriesType`. When type is heikin-ashi:
- `setData()` / `update()` transform the store and pass to standard `CandlestickRenderer`
- Raw data preserved separately for indicator computation (indicators always run on real OHLC)
- Can be toggled: `series.applyOptions({ chartType: 'heikin-ashi' })` vs `'candlestick'`

---

## D. Extended Hours / Market Sessions

**Location:** `src/core/market-session.ts` (new), `IChartApi`

```ts
interface MarketSession {
  id: string;           // 'premarket' | 'regular' | 'postmarket'
  label: string;
  startTime: string;    // 'HH:MM' in exchange timezone
  endTime: string;
  bgColor?: string;
}

// IChartApi additions
setMarketSessions(sessions: MarketSession[]): void;
setSessionFilter(filter: 'regular' | 'extended' | 'all'): void;
```

- Sessions are chart-level metadata (not per-series)
- **Session filter** controls which bars are visible. Bars always exist in the store — the filter adjusts the visible index mapping via a `_sessionMask: boolean[]` on DataLayer
- **Visual dividers:** Semi-transparent `fillRect` at session boundaries during `_paintPane()`
- **Time axis:** Session labels ("PRE", "POST") at boundaries
- Time gaps (weekends/holidays) already handled by logical indexing

---

## E. Enhanced Event Markers

**Location:** Extend `SeriesMarker` in `src/core/series-markers.ts`, update rendering in chart-api.ts

```ts
interface ChartEvent extends SeriesMarker {
  eventType: 'earnings' | 'dividend' | 'split' | 'ipo' | 'other';
  title: string;
  description?: string;
  value?: string;
}

// ISeriesApi additions
setEvents(events: ChartEvent[]): void;
getEvents(): readonly ChartEvent[];
```

**Performance at scale:**
1. Binary-search culling to visible range
2. Batch rendering by `(color, shape)` to minimize canvas state changes
3. Single shared DOM tooltip — positioned on hover, hidden otherwise
4. Hit-test only visible markers — O(visible_count) per mousemove

**Event tooltip:** On hover over a marker, display a floating DOM tooltip with title, description, value. Same pattern as existing chart tooltip (single element, repositioned).

---

## F. Chart State Save/Restore

**Location:** `src/core/chart-state.ts` (new), `IChartApi`

```ts
interface ChartState {
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

// IChartApi additions
exportState(): ChartState;
importState(state: ChartState, dataLoader: (seriesId: string) => Promise<Bar[]>): Promise<void>;
```

**Restore flow:**
1. Apply chart options (sync)
2. Create panes with saved heights (sync)
3. Create series with saved types/options (sync, no data yet)
4. Load data async via `dataLoader` for each series (parallel)
5. Restore indicators (sync, auto-compute fires)
6. Restore drawings (sync, deserialize from timestamps)
7. Restore periodicity and comparison mode
8. Restore visible range (LAST — after data arrives)

JSON format. Small payload (< 10KB typically). Storable in localStorage, IndexedDB, or server.

---

## G. Additional Indicators (6)

All follow established pattern. New shared utility for O(n) sliding window:

**`src/indicators/utils.ts`:**
```ts
function slidingMax(data: Float64Array, length: number, period: number): Float64Array
function slidingMin(data: Float64Array, length: number, period: number): Float64Array
```
Monotone deque algorithm — O(n) for any window size.

### G1. Ichimoku Cloud

```ts
interface IchimokuResult { tenkan, kijun, senkouA, senkouB, chikou: Float64Array }
computeIchimoku(high, low, close, length, tenkanPeriod=9, kijunPeriod=26, senkouPeriod=52): IchimokuResult
```

- Uses `slidingMax`/`slidingMin` for O(n) computation
- SenkouA/B shifted +26 periods ahead (indices 0..25 are NaN)
- Chikou shifted -26 periods behind (last 26 are NaN)
- **Cloud fill rendering:** Filled polygon between Senkou A and B. Green when A > B, red when B > A. Requires a custom indicator renderer (not just line series) — extends the `addIndicator` system with a cloud fill pass.

### G2. Parabolic SAR

```ts
computeParabolicSAR(high, low, length, afStep=0.02, afMax=0.20): Float64Array
```

- Single-pass stateful loop (Wilder's algorithm)
- AF increments on new extremes, resets on reversal
- Rendered as dots (small circles) above/below bars

### G3. Keltner Channel

```ts
computeKeltner(close, high, low, length, emaPeriod=20, atrPeriod=10, multiplier=2.0): { upper, middle, lower }
```

Composes existing `computeEMA` + `computeATR`. Zero new math.

### G4. Donchian Channel

```ts
computeDonchian(high, low, length, period=20): { upper, middle, lower }
```

Uses `slidingMax`/`slidingMin` from shared utils.

### G5. CCI (Commodity Channel Index)

```ts
computeCCI(high, low, close, length, period=20): Float64Array
```

TP = (H+L+C)/3, CCI = (TP - SMA(TP)) / (0.015 * MeanDeviation). O(n*k) with k=20 (standard, mean deviation cannot be incrementalized).

### G6. Pivot Points

```ts
computePivotPoints(high, low, close, length, variant='standard'): { pp, r1, r2, r3, s1, s2, s3 }
```

Variants: `'standard'` (default), `'fibonacci'`, `'woodie'`. Computed from previous session's H/L/C. Rendered as horizontal price lines spanning the session.

**Register all 6 in `DEFAULT_INDICATOR_PARAMS`, `OVERLAY_INDICATORS` (Ichimoku, Keltner, Donchian = overlay; SAR = overlay dots; CCI, Pivot = pane), and the `_computeIndicator()` dispatcher.**

---

## H. Exports & Stories

### New public exports from `src/index.ts`:
- `DrawingType`, `DrawingOptions`, `AnchorPoint`, `SerializedDrawing`, `IDrawingApi`
- `ChartState`, `Periodicity`
- `ChartEvent`
- `MarketSession`
- New indicator types added to `IndicatorType` union

### New indicator exports from `src/indicators/index.ts`:
- `computeIchimoku`, `IchimokuResult`
- `computeParabolicSAR`
- `computeKeltner`, `KeltnerResult`
- `computeDonchian`, `DonchianResult`
- `computeCCI`
- `computePivotPoints`, `PivotPointsResult`
- `slidingMax`, `slidingMin` (from utils)

### New transform exports from `src/transforms/index.ts`:
- `computeHeikinAshi`
- `aggregateOHLC`

### Storybook Stories:
- `stories/Features/DrawingTools.stories.ts` — interactive drawing demo
- `stories/Features/ComparisonMode.stories.ts` — multi-symbol comparison
- `stories/Features/HeikinAshi.stories.ts` — HA chart type
- `stories/Features/ExtendedHours.stories.ts` — pre/post market sessions
- `stories/Features/EventMarkers.stories.ts` — dividends, splits, earnings
- `stories/Features/ChartState.stories.ts` — save/restore demo
- `stories/Features/Pagination.stories.ts` — infinite scroll-back
- `stories/Features/Periodicity.stories.ts` — interval switching
- `stories/Indicators-Production.stories.ts` — Ichimoku, SAR, Keltner, Donchian, CCI, Pivot Points

---

## I. Files Changed Summary

**New files (drawings):**
- `src/drawings/base.ts`
- `src/drawings/horizontal-line.ts`
- `src/drawings/vertical-line.ts`
- `src/drawings/trendline.ts`
- `src/drawings/fibonacci.ts`
- `src/drawings/rectangle.ts`
- `src/drawings/text-annotation.ts`
- `src/drawings/index.ts`
- `src/interactions/drawing-handler.ts`

**New files (data infrastructure):**
- `src/core/periodicity.ts`
- `src/core/market-session.ts`
- `src/core/chart-state.ts`

**New files (transforms):**
- `src/transforms/heikin-ashi.ts`
- `src/transforms/aggregate.ts`
- `src/transforms/index.ts`

**New files (indicators):**
- `src/indicators/utils.ts`
- `src/indicators/ichimoku.ts`
- `src/indicators/parabolic-sar.ts`
- `src/indicators/keltner.ts`
- `src/indicators/donchian.ts`
- `src/indicators/cci.ts`
- `src/indicators/pivot-points.ts`

**New files (stories):**
- 9 new story files (listed above)

**Modified files:**
- `src/api/chart-api.ts` — addDrawing/removeDrawing, comparison mode, periodicity, session filter, state export/import, event markers, new indicator dispatcher entries
- `src/api/series-api.ts` — prependData, barsInLogicalRange, setEvents/getEvents
- `src/api/options.ts` — DrawingType, Periodicity, MarketSession, ChartState types, new indicator defaults
- `src/core/data-layer.ts` — prepend() method
- `src/core/price-scale.ts` — comparison mode (percentToY, yToPercent, basisPrice)
- `src/core/series-markers.ts` — ChartEvent type extension
- `src/core/types.ts` — DrawingPrimitive interface, 'heikin-ashi' in SeriesType
- `src/interactions/event-router.ts` — handler return boolean for event consumption
- `src/indicators/index.ts` — 6 new exports + utils
- `src/index.ts` — all new public exports
