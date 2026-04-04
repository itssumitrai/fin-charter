# Drawing Tools

fin-charter ships a complete drawing system that supports programmatic creation, interactive placement, extensibility via custom types, and round-trip serialization.

## Overview

Drawings are series primitives that map `(time, price)` anchor points to canvas coordinates on every paint. Each built-in type extends `BaseDrawing`, which implements `ISeriesPrimitive` so it participates in the normal plugin lifecycle — hit-testing, z-ordering, and repaint scheduling all work automatically.

## Built-In Drawing Types

| Type | Key | Required Points | Description |
|---|---|---|---|
| Horizontal line | `'horizontal-line'` | 1 | Infinite horizontal line at a fixed price |
| Vertical line | `'vertical-line'` | 1 | Infinite vertical line at a fixed time |
| Trendline | `'trendline'` | 2 | Straight line between two time/price points |
| Fibonacci retracement | `'fibonacci'` | 2 | Trendline with 0 %, 23.6 %, 38.2 %, 50 %, 61.8 %, 100 % retracement levels |
| Rectangle | `'rectangle'` | 2 | Axis-aligned rectangle between two corners |
| Text annotation | `'text-annotation'` | 1 | Label anchored to a time/price coordinate |

## Adding Drawings Programmatically

Use `chart.addDrawing(type, points, options?)` to add a drawing without user interaction.

```ts
import { createChart } from 'fin-charter';

const chart = createChart(container);
const series = chart.addCandlestickSeries();
series.setData(bars);

// Horizontal support line at price 150
const support = chart.addDrawing(
  'horizontal-line',
  [{ time: 0, price: 150 }],  // time is ignored for horizontal lines
  { color: '#26a69a', lineWidth: 2, lineStyle: 'dashed' },
);

// Trendline between two bars
const trend = chart.addDrawing(
  'trendline',
  [
    { time: 1700000000, price: 100 },
    { time: 1700259200, price: 115 },
  ],
  { color: '#2196F3', lineWidth: 1 },
);

// Fibonacci retracement
const fib = chart.addDrawing(
  'fibonacci',
  [
    { time: 1700000000, price: 90 },
    { time: 1700259200, price: 130 },
  ],
  { color: '#9c27b0' },
);

// Text label
const label = chart.addDrawing(
  'text-annotation',
  [{ time: 1700172800, price: 108 }],
  { text: 'Key level', color: '#ff9800', fontSize: 12 },
);
```

`addDrawing` returns an `IDrawingApi` handle:

```ts
interface IDrawingApi {
  readonly id: string;
  drawingType(): string;
  points(): AnchorPoint[];
  applyOptions(options: Partial<DrawingOptions>): void;
  options(): DrawingOptions;
  remove(): void;
}
```

### Removing a Drawing

```ts
const drawing = chart.addDrawing('horizontal-line', [{ time: 0, price: 150 }]);
// ... later
drawing.remove();
// or equivalently
chart.removeDrawing(drawing);
```

### Listing All Drawings

```ts
const all = chart.getDrawings(); // IDrawingApi[]
```

## Interactive Drawing Tools

Call `chart.setActiveDrawingTool(type)` to let the user place anchor points by clicking on the chart canvas. The chart collects the required number of points for the chosen type and then creates the drawing automatically.

```ts
// Activate the trendline tool — user clicks two points to complete it
chart.setActiveDrawingTool('trendline');

// Clear the active tool (return to pan/zoom mode)
chart.setActiveDrawingTool(null);
```

While a drawing tool is active, left-clicks place anchor points instead of triggering pan. The tool is automatically cleared after the required points are collected.

## Drawing Options

```ts
interface DrawingOptions {
  color?:     string;                        // stroke/text color (default: '#2196F3')
  lineWidth?: number;                        // stroke width in CSS pixels (default: 1)
  lineStyle?: 'solid' | 'dashed' | 'dotted'; // dash pattern (default: 'solid')
  fillColor?: string;                        // fill for rectangles (default: none)
  text?:      string;                        // label text for text-annotation
  fontSize?:  number;                        // label font size in CSS pixels (default: 12)
}
```

## Anchor Points

```ts
interface AnchorPoint {
  time:  number;  // Unix timestamp (seconds) — aligns the drawing to a bar
  price: number;  // Price coordinate
}
```

For drawing types where the time axis is irrelevant (e.g. `horizontal-line`), set `time` to any valid timestamp; it is ignored during rendering.

## Custom Drawing Types

Register a factory function for any drawing type name using `chart.registerDrawingType()`. The factory receives an `id`, an array of `AnchorPoint`s, and `DrawingOptions`, and must return an object that implements both `ISeriesPrimitive` and `DrawingPrimitive`.

```ts
import type { AnchorPoint, DrawingOptions, DrawingPrimitive, DrawingContext } from 'fin-charter';
import type { ISeriesPrimitive, IPaneView, IRenderTarget } from 'fin-charter';
import { BaseDrawing } from 'fin-charter';

class CircleAnnotation extends BaseDrawing {
  readonly drawingType = 'circle';
  readonly requiredPoints = 1;

  _hitTestDrawing(x: number, y: number) {
    if (!this._ctx) return null;
    const { timeScale, priceScale } = this._ctx;
    const cx = timeScale.indexToX(timeScale.xToIndex(this.points[0].time));
    const cy = priceScale.priceToY(this.points[0].price);
    const dist = Math.hypot(x - cx, y - cy);
    if (dist > 20) return null;
    return { drawingId: this.id, part: 'body' as const, cursorStyle: 'pointer' };
  }

  protected _createPaneView(): IPaneView {
    const ctx = this._ctx!;
    return {
      renderer: () => ({
        draw: (target: IRenderTarget) => {
          const { context: c, pixelRatio: pr } = target;
          const cx = ctx.timeScale.indexToX(ctx.timeScale.xToIndex(this.points[0].time)) * pr;
          const cy = ctx.priceScale.priceToY(this.points[0].price) * pr;
          c.save();
          c.strokeStyle = this.options.color ?? '#ff9800';
          c.lineWidth = (this.options.lineWidth ?? 2) * pr;
          c.beginPath();
          c.arc(cx, cy, 10 * pr, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        },
      }),
    };
  }
}

// Register once
chart.registerDrawingType('circle', (id, points, options) =>
  new CircleAnnotation(id, points, options),
);

// Use like any built-in
chart.addDrawing('circle', [{ time: 1700172800, price: 108 }], { color: '#ff9800' });
chart.setActiveDrawingTool('circle');
```

## Serialization

Use `serializeDrawings()` / `deserializeDrawings()` to persist drawings (e.g. to `localStorage` or a database) and restore them in a future session.

```ts
// Save
const serialized = chart.serializeDrawings();
localStorage.setItem('drawings', JSON.stringify(serialized));

// Restore
const raw = localStorage.getItem('drawings');
if (raw) {
  chart.deserializeDrawings(JSON.parse(raw));
}
```

### Serialized Shape

```ts
interface SerializedDrawing {
  type:    string;         // drawing type key
  id:      string;         // unique id assigned at creation
  points:  AnchorPoint[];  // anchor points in time/price space
  options: DrawingOptions;
}
```

Custom drawing types registered via `registerDrawingType` are serialized and deserialized in the same way as built-in types, as long as the same factory is registered before calling `deserializeDrawings`.

## Notes

- Drawings are always rendered on top of all series (z-order: Top).
- `addDrawing` attaches the primitive to the first candlestick or bar series found. If no OHLC series exists, the drawing is attached to the first series in the chart.
- Hit-testing uses a 6 px threshold in CSS pixels so drawings are easy to click on small screens.
