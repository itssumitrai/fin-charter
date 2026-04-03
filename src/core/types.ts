// ─── Bar & Column Store ──────────────────────────────────────────────────────

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** Same fields as Bar but stored as typed arrays (column-oriented). */
export interface ColumnData {
  time: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
}

export interface ColumnStore {
  time: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
  length: number;
  capacity: number;
}

export function createColumnStore(capacity: number): ColumnStore {
  return {
    time: new Float64Array(capacity),
    open: new Float64Array(capacity),
    high: new Float64Array(capacity),
    low: new Float64Array(capacity),
    close: new Float64Array(capacity),
    volume: new Float64Array(capacity),
    length: 0,
    capacity,
  };
}

export function barsToColumnStore(bars: Bar[]): ColumnStore {
  const capacity = Math.max(Math.ceil(bars.length * 1.5), 2048);
  const store = createColumnStore(capacity);
  store.length = bars.length;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    store.time[i] = b.time;
    store.open[i] = b.open;
    store.high[i] = b.high;
    store.low[i] = b.low;
    store.close[i] = b.close;
    store.volume[i] = b.volume ?? 0;
  }
  return store;
}

// ─── Invalidation ────────────────────────────────────────────────────────────

export const InvalidationLevel = {
  None: 0,
  Cursor: 1,
  Light: 2,
  Full: 3,
} as const;

export type InvalidationLevelValue = (typeof InvalidationLevel)[keyof typeof InvalidationLevel];

// ─── Range types ─────────────────────────────────────────────────────────────

export interface VisibleRange {
  fromIdx: number;
  toIdx: number;
}

export interface TimeRange {
  from: number;
  to: number;
}

// ─── Rendering primitives ─────────────────────────────────────────────────────

export type PathCommand =
  | { cmd: 'M'; x: number; y: number }
  | { cmd: 'L'; x: number; y: number }
  | { cmd: 'Z' }
  | { cmd: 'Q'; cpx: number; cpy: number; x: number; y: number }
  | { cmd: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number };

export interface GradientStop {
  offset: number;
  color: string;
}

export interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
}

export type RenderStyle = string | Gradient;

export const PrimitiveZOrder = {
  Bottom: 0,
  Normal: 1,
  Top: 2,
} as const;

export type PrimitiveZOrderValue = (typeof PrimitiveZOrder)[keyof typeof PrimitiveZOrder];

// ─── Plugin / Primitive interfaces ───────────────────────────────────────────

export type DataUpdateScope = 'full' | 'update';

export interface AttachedParams {
  requestUpdate(): void;
}

export interface IRenderTarget {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}

export interface IPaneRenderer {
  draw(target: IRenderTarget): void;
  drawBackground?(target: IRenderTarget): void;
}

export interface IPaneView {
  renderer(): IPaneRenderer | null;
  zOrder?(): PrimitiveZOrderValue;
}

export interface IPriceAxisView {
  text(): string;
  textColor(): string;
  backColor(): string;
  coordinate(): number;
}

export interface ITimeAxisView {
  text(): string;
  coordinate(): number;
}

export interface PrimitiveHitTestResult {
  cursorStyle?: string;
  externalId?: string;
}

export interface ISeriesPrimitive {
  /** Called when the primitive is attached to a series. */
  attached?(params: AttachedParams): void;
  /** Called when the primitive is detached. */
  detached?(): void;
  /** Notifies the primitive of a data scope update. */
  updateAllViews?(): void;
  /** Returns pane views for this primitive. */
  paneViews?(): readonly IPaneView[];
  /** Returns price axis views. */
  priceAxisViews?(): readonly IPriceAxisView[];
  /** Returns time axis views. */
  timeAxisViews?(): readonly ITimeAxisView[];
  /** Hit-test at the given canvas coordinate. */
  hitTest?(x: number, y: number): PrimitiveHitTestResult | null;
}

export interface IPanePrimitive {
  attached?(params: AttachedParams): void;
  detached?(): void;
  updateAllViews?(): void;
  paneViews?(): readonly IPaneView[];
  hitTest?(x: number, y: number): PrimitiveHitTestResult | null;
}

// ─── Series ──────────────────────────────────────────────────────────────────

export type SeriesType = 'candlestick' | 'bar' | 'line' | 'area' | 'histogram' | 'baseline';

// ─── Utility types ───────────────────────────────────────────────────────────

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
