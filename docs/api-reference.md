# API Reference

## `createChart(container, options?)`

```ts
function createChart(
  container: HTMLElement,
  options?: DeepPartial<ChartOptions>,
): IChartApi
```

Creates a new chart instance and mounts it inside `container`. Two `<canvas>` elements are appended to a `<div>` wrapper that fills the container.

**Parameters**

| Parameter | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | The DOM element to mount the chart in |
| `options` | `DeepPartial<ChartOptions>` | Optional chart options (deep-merged with defaults) |

**Returns** `IChartApi`

---

## `IChartApi`

### Series management

#### `addSeries(options)`

```ts
addSeries<T extends SeriesType>(options: { type: T } & DeepPartial<SeriesOptionsMap[T]>): ISeriesApi<T>
```

Unified series factory. Pass `type` alongside any series-specific options. This is the preferred API — the individual `addCandlestickSeries()`, `addLineSeries()` etc. methods still work but are deprecated.

```ts
// Preferred
const candles = chart.addSeries({ type: 'candlestick' });
const line    = chart.addSeries({ type: 'line', color: '#2196F3' });
const area    = chart.addSeries({ type: 'area' });
const ha      = chart.addSeries({ type: 'heikin-ashi' });
```

#### `addCandlestickSeries(options?)` _(deprecated)_

```ts
addCandlestickSeries(options?: DeepPartial<CandlestickSeriesOptions>): ISeriesApi<'candlestick'>
```

Adds a candlestick series and returns its API handle.

#### `addLineSeries(options?)` _(deprecated)_

```ts
addLineSeries(options?: DeepPartial<LineSeriesOptions>): ISeriesApi<'line'>
```

Adds a line series. Prefer `addSeries({ type: 'line', ...options })`.

#### `addAreaSeries(options?)` _(deprecated)_

```ts
addAreaSeries(options?: DeepPartial<AreaSeriesOptions>): ISeriesApi<'area'>
```

Adds an area series. Prefer `addSeries({ type: 'area', ...options })`.

#### `addBarSeries(options?)` _(deprecated)_

```ts
addBarSeries(options?: DeepPartial<BarSeriesOptions>): ISeriesApi<'bar'>
```

Adds a traditional OHLC bar series. Prefer `addSeries({ type: 'bar', ...options })`.

#### `addBaselineSeries(options?)` _(deprecated)_

```ts
addBaselineSeries(options?: DeepPartial<BaselineSeriesOptions>): ISeriesApi<'baseline'>
```

Adds a baseline series. Prefer `addSeries({ type: 'baseline', ...options })`.

#### `addHollowCandleSeries(options?)` _(deprecated)_

```ts
addHollowCandleSeries(options?: DeepPartial<HollowCandleSeriesOptions>): ISeriesApi<'hollow-candle'>
```

Adds a hollow-candle series. Prefer `addSeries({ type: 'hollow-candle', ...options })`.

#### `addHistogramSeries(options?)` _(deprecated)_

```ts
addHistogramSeries(options?: DeepPartial<HistogramSeriesOptions>): ISeriesApi<'histogram'>
```

Adds a histogram series. Prefer `addSeries({ type: 'histogram', ...options })`.

#### `addHeikinAshiSeries(options?)` _(deprecated)_

```ts
addHeikinAshiSeries(options?: DeepPartial<CandlestickSeriesOptions>): ISeriesApi<'heikin-ashi'>
```

Adds a Heikin-Ashi series. Bar data is automatically transformed to Heikin-Ashi values before rendering. Prefer `addSeries({ type: 'heikin-ashi', ...options })`.

#### `removeSeries(series)`

```ts
removeSeries(series: ISeriesApi<SeriesType>): void
```

Removes a series and schedules a repaint.

### Pane management

#### `addPane(options?)`

```ts
addPane(options?: PaneOptions): IPaneApi
```

Creates an additional pane (for a secondary indicator). The pane is tracked by the `InvalidateMask` so primitives attached to it can trigger partial repaints.

#### `removePane(pane)`

```ts
removePane(pane: IPaneApi): void
```

Removes an additional pane and schedules a repaint.

### Scale access

#### `timeScale()`

```ts
timeScale(): TimeScale
```

Returns the `TimeScale` instance. Useful for calling `fitContent()`, `scrollToEnd()`, `scrollToPosition()`, or `zoomAt()`.

#### `priceScale(id?)`

```ts
priceScale(id?: string): PriceScale
```

Returns the `PriceScale` instance. The `id` parameter is accepted but currently only the primary price scale is tracked.

### Options

#### `applyOptions(options)`

```ts
applyOptions(options: DeepPartial<ChartOptions>): void
```

Deep-merges the given options into the current options and schedules a repaint. If `width` or `height` changes, `resize()` is called automatically.

#### `options()`

```ts
options(): ChartOptions
```

Returns a shallow copy of the current chart options.

### Lifecycle

#### `resize(width, height)`

```ts
resize(width: number, height: number): void
```

Resizes both canvases, updates internal state, and schedules a full repaint.

#### `remove()`

```ts
remove(): void
```

Cancels any pending animation frame, disconnects the `ResizeObserver`, detaches interaction handlers, and removes the wrapper `<div>` from the DOM. Safe to call multiple times.

### Events

#### `subscribeCrosshairMove(callback)`

```ts
subscribeCrosshairMove(callback: CrosshairMoveCallback): void
```

Registers a callback that fires on every repaint frame when the crosshair is visible. The callback receives `CrosshairState | null`.

```ts
type CrosshairMoveCallback = (state: CrosshairState | null) => void;

interface CrosshairState {
  x: number;        // canvas x in CSS pixels
  y: number;        // canvas y in CSS pixels
  barIndex: number; // snapped bar index
  price: number;    // price at y
  time: number;     // Unix timestamp of the snapped bar
  snappedX: number; // x snapped to bar center
}
```

#### `unsubscribeCrosshairMove(callback)`

```ts
unsubscribeCrosshairMove(callback: CrosshairMoveCallback): void
```

Removes a previously registered crosshair callback.

#### `subscribeClick(callback)`

```ts
subscribeClick(callback: ClickCallback): void
```

Registers a callback for click events on the chart canvas.

```ts
type ClickCallback = (state: { x: number; y: number; time: number; price: number }) => void;
```

#### `unsubscribeClick(callback)`

```ts
unsubscribeClick(callback: ClickCallback): void
```

Removes a previously registered click callback.

#### `subscribeVisibleRangeChange(callback)` / `unsubscribeVisibleRangeChange(callback)`

```ts
subscribeVisibleRangeChange(callback: (range: { from: number; to: number } | null) => void): void
unsubscribeVisibleRangeChange(callback: (range: { from: number; to: number } | null) => void): void
```

Fires whenever the visible bar-index range changes. Used to implement infinite-history pagination. See [Data Integration](data-integration.md) for a full example.

### Navigation

#### `fitContent()`

```ts
fitContent(): void
```

Adjusts bar spacing so that all loaded bars fit within the current chart width.

#### `scrollToRealTime()`

```ts
scrollToRealTime(): void
```

Snaps the view so the latest bar is at the right edge.

#### `setVisibleRange(from, to)`

```ts
setVisibleRange(from: number, to: number): void
```

Sets the visible time range by Unix timestamps (seconds). Adjusts bar spacing and right offset automatically.

#### `setVisibleLogicalRange(from, to)`

```ts
setVisibleLogicalRange(from: number, to: number): void
```

Sets the visible range by bar indices directly.

#### `takeScreenshot()`

```ts
takeScreenshot(): HTMLCanvasElement
```

Composites all panes into a single canvas and returns it. The caller can convert to a PNG via `canvas.toDataURL('image/png')` or display it in the DOM.

```ts
const canvas = chart.takeScreenshot();
const link = document.createElement('a');
link.href = canvas.toDataURL('image/png');
link.download = 'chart.png';
link.click();
```

### Drawing Tools

See [Drawing Tools](drawings.md) for full documentation.

#### `addDrawing(type, points, options?)`

```ts
addDrawing(
  type:    string,
  points:  AnchorPoint[],
  options?: DrawingOptions,
): IDrawingApi
```

Creates a drawing of the given type and returns its API handle. For built-in types see the [Drawing Types table](drawings.md#built-in-drawing-types).

#### `removeDrawing(drawing)`

```ts
removeDrawing(drawing: IDrawingApi): void
```

Removes a drawing and detaches it from the series.

#### `getDrawings()`

```ts
getDrawings(): IDrawingApi[]
```

Returns all current drawings.

#### `setActiveDrawingTool(type)`

```ts
setActiveDrawingTool(type: string | null): void
```

Activates an interactive drawing tool. Pass `null` to return to pan/zoom mode.

#### `registerDrawingType(type, factory)`

```ts
registerDrawingType(
  type:    string,
  factory: (id: string, points: AnchorPoint[], options: DrawingOptions) => ISeriesPrimitive & DrawingPrimitive,
): void
```

Registers a custom drawing type. See [Custom Drawing Types](drawings.md#custom-drawing-types).

#### `serializeDrawings()`

```ts
serializeDrawings(): SerializedDrawing[]
```

Returns all drawings as plain objects suitable for JSON serialization.

#### `deserializeDrawings(data)`

```ts
deserializeDrawings(data: SerializedDrawing[]): void
```

Recreates drawings from a previously serialized array.

### Comparison Mode

#### `setComparisonMode(enabled)`

```ts
setComparisonMode(enabled: boolean): void
```

Enables or disables comparison mode. When enabled, the Y-axis shows percentage change from each series' first visible bar's close.

#### `isComparisonMode()`

```ts
isComparisonMode(): boolean
```

Returns `true` when comparison mode is active.

### Periodicity

#### `setPeriodicity(periodicity)`

```ts
setPeriodicity(periodicity: Periodicity): void
```

Sets the current bar interval and fires `subscribePeriodicityChange` callbacks.

#### `getPeriodicity()`

```ts
getPeriodicity(): Periodicity
```

Returns the current periodicity.

#### `subscribePeriodicityChange(handler)` / `unsubscribePeriodicityChange(handler)`

```ts
subscribePeriodicityChange(handler: (p: Periodicity) => void): void
unsubscribePeriodicityChange(handler: (p: Periodicity) => void): void
```

Subscribe to periodicity changes. Use this to reload bar data at the new interval.

### Market Sessions

#### `setMarketSessions(sessions)`

```ts
setMarketSessions(sessions: MarketSession[]): void
```

Configures the market session definitions (pre-market, regular, post-market, etc.). Each session specifies a time range in minutes from midnight in the exchange timezone, and an optional background colour.

```ts
import { US_EQUITY_SESSIONS } from 'fin-charter';

chart.setMarketSessions(US_EQUITY_SESSIONS);
```

#### `setSessionFilter(filter)`

```ts
setSessionFilter(filter: 'regular' | 'extended' | 'all'): void
```

Filters which bars are visible based on their session.

| Value | Effect |
|---|---|
| `'all'` | All bars visible (default) |
| `'regular'` | Only bars within regular-session hours |
| `'extended'` | Regular + pre/post-market bars |

### Chart State Save/Restore

#### `exportState()`

```ts
exportState(): ChartState
```

Exports the current chart configuration (options, pane layout, series list, indicators, drawings, periodicity, visible range) as a plain serializable object. Bar data is **not** included.

```ts
const state = chart.exportState();
localStorage.setItem('chartState', JSON.stringify(state));
```

#### `importState(state, dataLoader)`

```ts
importState(
  state:      ChartState,
  dataLoader: (seriesId: string) => Promise<Bar[]>,
): Promise<void>
```

Restores a previously exported state. The `dataLoader` callback is called for each series in the state; it receives the series id and must return the bar data to load. Returns a `Promise` that resolves when all data has been loaded and applied.

```ts
const raw = localStorage.getItem('chartState');
if (raw) {
  await chart.importState(JSON.parse(raw), async (seriesId) => {
    return fetchBarsForSeries(seriesId);
  });
}
```

### `ChartState` Type

```ts
interface ChartState {
  version:        number;
  options:        DeepPartial<ChartOptions>;
  periodicity?:   Periodicity;
  comparisonMode?: boolean;
  timeScale:      { barSpacing: number; rightOffset: number };
  series:         Array<{ id: string; type: SeriesType; options: Record<string, unknown> }>;
  indicators:     Array<{ type: IndicatorType; sourceSeriesId: string; params: Record<string, number>; color?: string }>;
  panes:          Array<{ id: string; height: number }>;
  drawings:       SerializedDrawing[];
  marketSessions?: MarketSession[];
  sessionFilter?:  string;
  visibleRange?:  { from: number; to: number };
}
```

---

## `IDrawingApi`

Returned by `chart.addDrawing()`.

```ts
interface IDrawingApi {
  readonly id:  string;
  drawingType(): string;
  points():     AnchorPoint[];
  applyOptions(options: Partial<DrawingOptions>): void;
  options():    DrawingOptions;
  remove():     void;
}
```

---

## `ISeriesApi<T>`

### `setData(data)`

```ts
setData(data: Bar[] | ColumnData): void
```

Replaces all data on the series. Accepts either an array of `Bar` objects or a `ColumnData` struct of `Float64Array` columns (zero-copy fast path).

### `update(bar)`

```ts
update(bar: Bar): void
```

Appends or updates a single bar in real time. If the bar's `time` equals the last bar's timestamp the bar is updated in-place (O(1)). Otherwise it is appended, growing the underlying `Float64Array` store when needed.

### `attachPrimitive(primitive)`

```ts
attachPrimitive(primitive: ISeriesPrimitive): void
```

Attaches a plugin primitive. The primitive's `attached(params)` lifecycle method is called immediately with an `AttachedParams` object providing `requestUpdate()`.

### `detachPrimitive(primitive)`

```ts
detachPrimitive(primitive: ISeriesPrimitive): void
```

Detaches a primitive and calls its `detached()` lifecycle method.

### `applyOptions(options)`

```ts
applyOptions(options: Partial<SeriesOptionsMap[T]>): void
```

Updates series options (e.g. colours) and schedules a repaint.

### `options()`

```ts
options(): SeriesOptionsMap[T]
```

Returns a shallow copy of the current series options.

### `priceScale()`

```ts
priceScale(): PriceScale
```

Returns the `PriceScale` this series is associated with.

### `dataByIndex(index)`

```ts
dataByIndex(index: number): Bar | null
```

Returns the `Bar` at the given data index, or `null` if out of bounds.

### `seriesType()`

```ts
seriesType(): T
```

Returns the series type string, e.g. `'candlestick'`.

### `prependData(data)`

```ts
prependData(data: Bar[] | ColumnData): void
```

Inserts bars at the beginning of the series for infinite-history pagination. Bars must be in ascending time order and earlier than the current first bar. See [Data Integration — Pagination](data-integration.md#pagination--loading-historical-bars-on-demand).

### `barsInLogicalRange(range)`

```ts
barsInLogicalRange(range: { from: number; to: number }): {
  barsBefore: number;
  barsAfter:  number;
  from:       number;
  to:         number;
}
```

Returns how many loaded bars fall before and after the given logical index range. Used together with `subscribeVisibleRangeChange` to trigger pagination. See [Data Integration — Pagination](data-integration.md#pagination--loading-historical-bars-on-demand).

### `setEvents(events)` / `getEvents()`

```ts
setEvents(events: ChartEvent[]): void
getEvents(): readonly ChartEvent[]
```

Attaches chart event markers to the series (e.g. earnings releases, dividends). Events are rendered as distinct shapes above or below the relevant bar.

```ts
interface ChartEvent {
  time:        number;      // Unix timestamp (seconds)
  eventType:   EventType;   // 'earnings' | 'dividend' | 'split' | 'ipo' | 'other'
  title:       string;      // short label
  description?: string;     // tooltip text
  value?:      string;      // e.g. EPS amount
  color?:      string;
}
```

### `subscribeDataChanged(callback)` / `unsubscribeDataChanged(callback)`

```ts
subscribeDataChanged(callback: () => void): void
unsubscribeDataChanged(callback: () => void): void
```

Subscribe to any data mutation on the series (`setData`, `update`, `prependData`). Useful for recomputing derived indicators in response to new data.

---

## `IPaneApi`

```ts
interface IPaneApi {
  readonly id: string;
  setHeight(height: number): void;
  attachPrimitive(primitive: IPanePrimitive): void;
  detachPrimitive(primitive: IPanePrimitive): void;
}
```

---

## Option Types

### `ChartOptions`

```ts
interface ChartOptions {
  width:     number;   // default: 800
  height:    number;   // default: 400
  autoSize:  boolean;  // default: false
  layout:    LayoutOptions;
  timeScale: TimeScaleApiOptions;
  crosshair: CrosshairOptions;
  grid:      GridOptions;
}
```

### `LayoutOptions`

```ts
interface LayoutOptions {
  backgroundColor: string;  // default: '#ffffff'
  textColor:       string;  // default: '#333333'
  fontSize:        number;  // default: 11
  fontFamily:      string;  // default: system font stack
}
```

### `TimeScaleApiOptions`

```ts
interface TimeScaleApiOptions {
  barSpacing:    number;  // default: 6 (pixels per bar)
  rightOffset:   number;  // default: 0 (empty bars on the right)
  minBarSpacing: number;  // default: 1
  maxBarSpacing: number;  // default: 50
}
```

### `CrosshairOptions`

```ts
interface CrosshairOptions {
  vertLineColor: string;    // default: '#9598A1'
  vertLineWidth: number;    // default: 1
  vertLineDash:  number[];  // default: [4, 4]
  horzLineColor: string;    // default: '#9598A1'
  horzLineWidth: number;    // default: 1
  horzLineDash:  number[];  // default: [4, 4]
}
```

### `GridOptions`

```ts
interface GridOptions {
  vertLinesVisible: boolean;  // default: true
  vertLinesColor:   string;   // default: 'rgba(0,0,0,0.06)'
  horzLinesVisible: boolean;  // default: true
  horzLinesColor:   string;   // default: 'rgba(0,0,0,0.06)'
}
```

### `BaseSeriesOptions`

```ts
interface BaseSeriesOptions {
  data?:        Bar[] | ColumnData;  // initial data
  priceScaleId?: string;
  visible?:     boolean;             // default: true
}
```

All series-specific option types (`CandlestickSeriesOptions`, `LineSeriesOptions`, etc.) extend `BaseSeriesOptions` and add the renderer-specific fields shown in the Getting Started guide.

### `PaneOptions`

```ts
interface PaneOptions {
  height?: number;  // default: 100 (CSS pixels)
}
```

---

## Data Types

### `Bar`

```ts
interface Bar {
  time:    number;   // Unix timestamp (seconds)
  open:    number;
  high:    number;
  low:     number;
  close:   number;
  volume?: number;   // optional; defaults to 0
}
```

### `ColumnData`

```ts
interface ColumnData {
  time:   Float64Array;
  open:   Float64Array;
  high:   Float64Array;
  low:    Float64Array;
  close:  Float64Array;
  volume: Float64Array;
}
```

`ColumnData` is the zero-copy fast path for `setData`. All arrays must have the same length.

---

## `TimeScale` Methods

`chart.timeScale()` returns a `TimeScale` instance with these public methods:

| Method | Description |
|---|---|
| `setOptions(opts)` | Update time-scale options |
| `setWidth(width)` | Update the canvas width (called automatically on resize) |
| `setDataLength(n)` | Update bar count (called automatically before each paint) |
| `visibleRange()` | Returns `{ fromIdx, toIdx }` of the visible bar indices |
| `indexToX(i)` | Converts a bar index to a canvas x-pixel |
| `xToIndex(x)` | Converts a canvas x-pixel to the nearest bar index |
| `scrollByPixels(delta)` | Scroll by a pixel delta |
| `scrollToEnd()` | Snap the last bar to the right edge |
| `scrollToPosition(pos)` | Set scroll offset in bars |
| `zoomAt(x, factor)` | Zoom bar spacing around an x-pixel anchor |
| `fitContent()` | Fit all bars in the current width |
| `barSpacing` | Current pixels-per-bar (read-only getter) |

---

## `PriceScale` Methods

`chart.priceScale()` returns a `PriceScale` instance with these public methods:

| Method | Description |
|---|---|
| `setHeight(h)` | Update the canvas height (called automatically on resize) |
| `autoScale(min, max)` | Auto-scale to the given price range with a 5% margin |
| `setRange(min, max)` | Manually fix the price range; disables auto-scaling |
| `resetAutoScale()` | Re-enable auto-scaling |
| `priceToY(price)` | Converts a price to a canvas y-pixel |
| `yToPrice(y)` | Inverse of `priceToY` |
| `priceRange` | Current `{ min, max }` price range (read-only getter) |

---

## `InvalidationLevel`

```ts
const InvalidationLevel = {
  None:   0,  // no repaint needed
  Cursor: 1,  // crosshair overlay only
  Light:  2,  // series data layer (main canvas)
  Full:   3,  // everything
} as const;
```

Exported from the main entry point. Useful when writing plugins that call `requestUpdate()`.

---

## `SeriesType`

```ts
type SeriesType =
  | 'candlestick'
  | 'bar'
  | 'line'
  | 'area'
  | 'histogram'
  | 'baseline'
  | 'hollow-candle'
  | 'heikin-ashi';
```

---

## Drawing Types

### `AnchorPoint`

```ts
interface AnchorPoint {
  time:  number;  // Unix timestamp (seconds)
  price: number;  // Price coordinate
}
```

### `DrawingOptions`

```ts
interface DrawingOptions {
  color?:     string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fillColor?: string;
  text?:      string;
  fontSize?:  number;
}
```

### `SerializedDrawing`

```ts
interface SerializedDrawing {
  type:    string;
  id:      string;
  points:  AnchorPoint[];
  options: DrawingOptions;
}
```

---

## `Periodicity`

```ts
interface Periodicity {
  interval: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
}
```

Helper functions exported from the main entry point:

```ts
periodicityToSeconds(p: Periodicity): number
periodicityToLabel(p: Periodicity): string  // e.g. '5m', '1D', '4h'
```

---

## `MarketSession`

```ts
interface MarketSession {
  id:          string;   // e.g. 'premarket'
  label:       string;   // e.g. 'PRE'
  startMinute: number;   // minutes from midnight in exchange timezone
  endMinute:   number;
  bgColor:     string;   // CSS color for the session background
}
```

A pre-built set of US equity sessions is exported for convenience:

```ts
import { US_EQUITY_SESSIONS } from 'fin-charter';
// [{ id: 'premarket', … }, { id: 'regular', … }, { id: 'postmarket', … }]
```
