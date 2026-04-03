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

#### `addCandlestickSeries(options?)`

```ts
addCandlestickSeries(options?: DeepPartial<CandlestickSeriesOptions>): ISeriesApi<'candlestick'>
```

Adds a candlestick series and returns its API handle.

#### `addLineSeries(options?)`

```ts
addLineSeries(options?: DeepPartial<LineSeriesOptions>): ISeriesApi<'line'>
```

Adds a line series (close-price polyline).

#### `addAreaSeries(options?)`

```ts
addAreaSeries(options?: DeepPartial<AreaSeriesOptions>): ISeriesApi<'area'>
```

Adds an area series (line + gradient fill).

#### `addBarSeries(options?)`

```ts
addBarSeries(options?: DeepPartial<BarSeriesOptions>): ISeriesApi<'bar'>
```

Adds a traditional OHLC bar series.

#### `addBaselineSeries(options?)`

```ts
addBaselineSeries(options?: DeepPartial<BaselineSeriesOptions>): ISeriesApi<'baseline'>
```

Adds a baseline series coloured above/below a reference price.

#### `addHollowCandleSeries(options?)`

```ts
addHollowCandleSeries(options?: DeepPartial<HollowCandleSeriesOptions>): ISeriesApi<'hollow-candle'>
```

Adds a hollow-candle series (up candles outline-only, down candles filled).

#### `addHistogramSeries(options?)`

```ts
addHistogramSeries(options?: DeepPartial<HistogramSeriesOptions>): ISeriesApi<'histogram'>
```

Adds a histogram series (vertical bars from the pane bottom).

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
  | 'hollow-candle';
```
