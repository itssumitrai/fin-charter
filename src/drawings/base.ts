import type { ISeriesPrimitive, IPaneView, IPaneRenderer, IRenderTarget, PrimitiveHitTestResult } from '../core/types';
import type { TimeScale } from '../core/time-scale';
import type { PriceScale } from '../core/price-scale';

// ─── Hit-test threshold (CSS pixels) ────────────────────────────────────────

export const HIT_THRESHOLD = 6;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnchorPoint {
  time: number;
  price: number;
}

export interface DrawingOptions {
  color?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fillColor?: string;
  text?: string;
  fontSize?: number;
}

export interface SerializedDrawing {
  type: string;
  id: string;
  points: AnchorPoint[];
  options: DrawingOptions;
}

export interface DrawingHitTestResult {
  drawingId: string;
  part: 'body' | 'handle1' | 'handle2' | 'edge';
  cursorStyle: string;
}

export interface DrawingPrimitive {
  readonly drawingType: string;
  readonly requiredPoints: number;
  points: AnchorPoint[];
  options: DrawingOptions;
  selected: boolean;
  serialize(): SerializedDrawing;
  drawingHitTest(x: number, y: number): DrawingHitTestResult | null;
}

/** Coordinate converters passed to drawings so they can map time/price to pixels. */
export interface DrawingContext {
  timeScale: TimeScale;
  priceScale: PriceScale;
  chartWidth: number;
  chartHeight: number;
  requestUpdate(): void;
}

// ─── Hit-test utilities ─────────────────────────────────────────────────────

/** Distance from point (px,py) to the closest point on segment (x1,y1)-(x2,y2). */
export function distToSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Returns true if (px,py) is inside the axis-aligned rectangle defined by two corners. */
export function pointInRect(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): boolean {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}

// ─── Factory type ────────────────────────────────────────────────────────────

export type DrawingFactory = (
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
) => ISeriesPrimitive & DrawingPrimitive;

// ─── Line-style helper ──────────────────────────────────────────────────────

export function applyLineStyle(ctx: CanvasRenderingContext2D, style: DrawingOptions['lineStyle']): void {
  if (style === 'dashed') {
    ctx.setLineDash([6, 4]);
  } else if (style === 'dotted') {
    ctx.setLineDash([2, 3]);
  } else {
    ctx.setLineDash([]);
  }
}

// ─── Base drawing class ─────────────────────────────────────────────────────

/**
 * Abstract base that implements common ISeriesPrimitive + DrawingPrimitive plumbing.
 * Subclasses only override _createPaneView().
 */
export abstract class BaseDrawing implements ISeriesPrimitive, DrawingPrimitive {
  abstract readonly drawingType: string;
  abstract readonly requiredPoints: number;

  points: AnchorPoint[];
  options: DrawingOptions;
  selected: boolean = false;

  readonly id: string;
  protected _ctx: DrawingContext | null = null;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    this.id = id;
    this.points = points;
    this.options = { color: '#2196F3', lineWidth: 1, lineStyle: 'solid', ...options };
  }

  // ── ISeriesPrimitive ────────────────────────────────────────────────────

  attached(params: { requestUpdate(): void }): void {
    // DrawingContext is set externally via setContext()
    void params;
  }

  detached(): void {
    this._ctx = null;
  }

  updateAllViews(): void {
    // no-op; views re-read state each render
  }

  paneViews(): readonly IPaneView[] {
    if (!this._ctx) return [];
    return [this._createPaneView()];
  }

  hitTest(x: number, y: number): PrimitiveHitTestResult | null {
    const result = this._hitTestDrawing(x, y);
    if (!result) return null;
    return { cursorStyle: result.cursorStyle, externalId: result.drawingId };
  }

  // ── DrawingPrimitive ──────────────────────────────────────────────────

  drawingHitTest(x: number, y: number): DrawingHitTestResult | null {
    return this._hitTestDrawing(x, y);
  }

  serialize(): SerializedDrawing {
    return {
      type: this.drawingType,
      id: this.id,
      points: this.points.map(p => ({ ...p })),
      options: { ...this.options },
    };
  }

  /** Externally accessible hit-test returning DrawingHitTestResult. */
  abstract _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null;

  // ── Context setter ────────────────────────────────────────────────────

  setContext(ctx: DrawingContext): void {
    this._ctx = ctx;
  }

  // ── Abstract ──────────────────────────────────────────────────────────

  protected abstract _createPaneView(): IPaneView;
}
