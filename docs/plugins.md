# Plugins

fin-charter's plugin system uses two interfaces: `ISeriesPrimitive` for overlays that live in the main series pane and `IPanePrimitive` for overlays that live in a secondary pane. Both follow the same lifecycle and rendering conventions.

## Interfaces

### `ISeriesPrimitive`

```ts
interface ISeriesPrimitive {
  /** Called once when the primitive is attached via series.attachPrimitive(). */
  attached?(params: AttachedParams): void;

  /** Called once when the primitive is detached via series.detachPrimitive(). */
  detached?(): void;

  /** Called by the chart whenever the series data changes (full reload or single update). */
  updateAllViews?(): void;

  /** Return the pane views this primitive contributes to the main pane. */
  paneViews?(): readonly IPaneView[];

  /** Return price-axis label views. */
  priceAxisViews?(): readonly IPriceAxisView[];

  /** Return time-axis label views. */
  timeAxisViews?(): readonly ITimeAxisView[];

  /** Hit-test at the given canvas coordinate (CSS pixels). Return null for no hit. */
  hitTest?(x: number, y: number): PrimitiveHitTestResult | null;
}
```

### `IPanePrimitive`

```ts
interface IPanePrimitive {
  attached?(params: AttachedParams): void;
  detached?(): void;
  updateAllViews?(): void;

  /** Return the pane views for the additional pane this primitive lives in. */
  paneViews?(): readonly IPaneView[];

  hitTest?(x: number, y: number): PrimitiveHitTestResult | null;
}
```

### `AttachedParams`

```ts
interface AttachedParams {
  /** Call to trigger a repaint. The chart batches repaints within a single RAF frame. */
  requestUpdate(): void;
}
```

---

## `IPaneView` and `IPaneRenderer`

Each `IPaneView` produces an `IPaneRenderer` on demand. The renderer performs the actual canvas drawing.

```ts
interface IPaneView {
  /** Return a renderer or null to skip drawing. */
  renderer(): IPaneRenderer | null;

  /** Controls draw order within a pane. Defaults to PrimitiveZOrder.Normal (1). */
  zOrder?(): PrimitiveZOrderValue;
}

interface IPaneRenderer {
  /** Draw to the main content layer. */
  draw(target: IRenderTarget): void;

  /** Draw to the background layer (called before draw()). */
  drawBackground?(target: IRenderTarget): void;
}
```

### Z-Order Slots

```ts
const PrimitiveZOrder = {
  Bottom: 0,  // drawn before the series (background overlays)
  Normal: 1,  // drawn after the series (default)
  Top:    2,  // drawn last (tooltips, annotations)
} as const;
```

---

## `IRenderTarget` — Direct Canvas Access

```ts
interface IRenderTarget {
  readonly canvas:     HTMLCanvasElement;
  readonly context:    CanvasRenderingContext2D;
  readonly width:      number;   // logical CSS pixels
  readonly height:     number;   // logical CSS pixels
  readonly pixelRatio: number;   // window.devicePixelRatio
}
```

All canvas coordinates must be multiplied by `pixelRatio` and rounded to integers for crisp HiDPI rendering. See the example below.

---

## Lifecycle

1. **Attach** — call `series.attachPrimitive(primitive)` or `pane.attachPrimitive(primitive)`. The primitive's `attached(params)` is called synchronously with `AttachedParams`.
2. **Data updates** — when `series.setData()` or `series.update()` is called, `updateAllViews()` is called on every attached primitive. Use this to recompute derived data.
3. **Rendering** — on each repaint, `paneViews()` is called. For each view, `renderer()` is called, then `draw()` (and optionally `drawBackground()`) on the renderer.
4. **Detach** — call `series.detachPrimitive(primitive)` or `pane.detachPrimitive(primitive)`. The primitive's `detached()` is called synchronously.

---

## Hit Testing

```ts
interface PrimitiveHitTestResult {
  cursorStyle?: string;    // CSS cursor value, e.g. 'pointer'
  externalId?:  string;    // arbitrary identifier for your own dispatch
}
```

The chart calls `hitTest(x, y)` on each attached primitive when the mouse moves. Return `null` for no hit. Return a result object to change the cursor style or receive the event in your own handler.

---

## Example: Simple Custom Overlay

The following adds a horizontal price level line at a fixed price.

```ts
import type {
  ISeriesPrimitive,
  IPaneView,
  IPaneRenderer,
  IRenderTarget,
  AttachedParams,
} from 'fin-charter';

class PriceLevelRenderer implements IPaneRenderer {
  constructor(
    private readonly priceY: number,
    private readonly color: string,
  ) {}

  draw(target: IRenderTarget): void {
    const { context: ctx, width, pixelRatio: pr } = target;
    const y = Math.round(this.priceY * pr);

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.round(pr);
    ctx.setLineDash([6 * pr, 3 * pr]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(Math.round(width * pr), y);
    ctx.stroke();
    ctx.restore();
  }
}

class PriceLevelView implements IPaneView {
  constructor(
    private readonly priceToY: (p: number) => number,
    private readonly price: number,
    private readonly color: string,
  ) {}

  renderer(): IPaneRenderer {
    return new PriceLevelRenderer(this.priceToY(this.price), this.color);
  }
}

class PriceLevelPrimitive implements ISeriesPrimitive {
  private _price: number;
  private _color: string;
  private _priceToY: ((p: number) => number) | null = null;
  private _requestUpdate: (() => void) | null = null;

  constructor(price: number, color = '#ff9800') {
    this._price = price;
    this._color = color;
  }

  attached(params: AttachedParams): void {
    this._requestUpdate = params.requestUpdate;
    params.requestUpdate();
  }

  setPrice(price: number): void {
    this._price = price;
    this._requestUpdate?.();
  }

  // Called by the chart to get the view for each repaint.
  // In a real plugin you would obtain priceToY from the series priceScale.
  paneViews(): readonly IPaneView[] {
    if (!this._priceToY) return [];
    return [new PriceLevelView(this._priceToY, this._price, this._color)];
  }
}

// Usage
const chart  = createChart(container);
const series = chart.addCandlestickSeries();
series.setData(bars);

const level = new PriceLevelPrimitive(150);
series.attachPrimitive(level);

// Move the line later
level.setPrice(160);
```

---

## Example: Separate-Pane Indicator

Use `chart.addPane()` and `IPanePrimitive` to draw into a secondary pane:

```ts
import type { IPanePrimitive, IPaneView, IPaneRenderer, IRenderTarget } from 'fin-charter';

class RSIRenderer implements IPaneRenderer {
  constructor(private readonly values: Float64Array) {}

  draw(target: IRenderTarget): void {
    const { context: ctx, width, height, pixelRatio: pr } = target;

    ctx.save();
    ctx.strokeStyle = '#9c27b0';
    ctx.lineWidth = Math.round(pr);
    ctx.beginPath();

    let started = false;
    for (let i = 0; i < this.values.length; i++) {
      const v = this.values[i];
      if (isNaN(v)) continue;

      const x = Math.round((i / this.values.length) * width * pr);
      const y = Math.round((1 - v / 100) * height * pr);

      if (!started) { ctx.moveTo(x, y); started = true; }
      else            ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.restore();
  }
}

class RSIPrimitive implements IPanePrimitive {
  private _values: Float64Array;

  constructor(values: Float64Array) {
    this._values = values;
  }

  paneViews(): readonly IPaneView[] {
    const values = this._values;
    return [{
      renderer: () => new RSIRenderer(values),
    }];
  }
}

// Usage
const rsiPane = chart.addPane({ height: 120 });
const rsi14   = computeRSI(store.close, store.length, 14);
rsiPane.attachPrimitive(new RSIPrimitive(rsi14));
```
