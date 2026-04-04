import type { EventHandler } from './event-router';
import type { ISeriesPrimitive } from '../core/types';
import type {
  AnchorPoint,
  DrawingOptions,
  DrawingPrimitive,
  DrawingHitTestResult,
  DrawingContext,
} from '../drawings/base';
import { BaseDrawing, HIT_THRESHOLD } from '../drawings/base';
import { DRAWING_REGISTRY } from '../drawings/index';

// ─── State machine ───────────────────────────────────────────────────────────

export type DrawingHandlerState = 'IDLE' | 'SELECTING' | 'PLACING' | 'EDITING';

export interface DrawingHandlerCallbacks {
  getDrawings(): (ISeriesPrimitive & DrawingPrimitive)[];
  getDrawingContext(): DrawingContext | null;
  onDrawingCreated(drawing: ISeriesPrimitive & DrawingPrimitive): void;
  onDrawingUpdated(drawing?: ISeriesPrimitive & DrawingPrimitive): void;
  xToTime(x: number): number;
  yToPrice(y: number): number;
}

/**
 * Interaction handler for drawing tools.
 * Manages placement of new drawings and selection/editing of existing drawings.
 */
export class DrawingHandler implements EventHandler {
  private _state: DrawingHandlerState = 'IDLE';
  private _activeToolType: string | null = null;
  private _callbacks: DrawingHandlerCallbacks;

  // Placement state
  private _placingDrawing: (BaseDrawing & DrawingPrimitive) | null = null;
  private _placedPointCount: number = 0;
  private _nextId: number = 0;

  // Editing state
  private _selectedDrawing: (ISeriesPrimitive & DrawingPrimitive) | null = null;
  private _editHit: DrawingHitTestResult | null = null;
  private _dragStartX: number = 0;
  private _dragStartY: number = 0;
  private _dragStartPoints: AnchorPoint[] = [];

  constructor(callbacks: DrawingHandlerCallbacks) {
    this._callbacks = callbacks;
  }

  get state(): DrawingHandlerState {
    return this._state;
  }

  setActiveToolType(type: string | null): void {
    this._activeToolType = type;
    if (type) {
      this._state = 'PLACING';
      this._placingDrawing = null;
      this._placedPointCount = 0;
    } else {
      if (this._state === 'PLACING') {
        this._state = 'IDLE';
        this._placingDrawing = null;
      }
    }
  }

  // ── EventHandler ──────────────────────────────────────────────────────────

  onPointerDown(x: number, y: number, _pointerId: number): boolean {
    // PLACING mode: set anchor points
    if (this._state === 'PLACING' && this._activeToolType) {
      return this._handlePlacementClick(x, y);
    }

    // IDLE/SELECTING: try to select an existing drawing
    const hit = this._hitTestDrawings(x, y);
    if (hit) {
      this._state = 'EDITING';
      const drawings = this._callbacks.getDrawings();
      const drawing = drawings.find(d =>
        'drawingType' in d && 'points' in d && 'selected' in d && 'drawingHitTest' in d
        && 'id' in d && (d as unknown as { id: string }).id === hit.drawingId
      );
      if (drawing) {
        // Deselect previous
        if (this._selectedDrawing) this._selectedDrawing.selected = false;
        drawing.selected = true;
        this._selectedDrawing = drawing;
        this._editHit = hit;
        this._dragStartX = x;
        this._dragStartY = y;
        this._dragStartPoints = drawing.points.map(p => ({ ...p }));
        this._callbacks.onDrawingUpdated();
        return true; // consume event
      }
    }

    // Clicked on nothing: deselect
    if (this._selectedDrawing) {
      this._selectedDrawing.selected = false;
      this._selectedDrawing = null;
      this._state = 'IDLE';
      this._callbacks.onDrawingUpdated();
    }

    return false; // let other handlers process
  }

  onPointerMove(x: number, y: number, _pointerId: number): boolean {
    // While placing: update the next (preview) point at _placedPointCount index
    if (this._state === 'PLACING' && this._placingDrawing && this._placedPointCount >= 1) {
      const time = this._callbacks.xToTime(x);
      const price = this._callbacks.yToPrice(y);
      const pts = this._placingDrawing.points;
      const previewIdx = this._placedPointCount;
      if (pts.length > previewIdx) {
        pts[previewIdx] = { time, price };
      } else {
        pts.push({ time, price });
      }
      this._callbacks.onDrawingUpdated();
      return true;
    }

    // Editing: drag the drawing
    if (this._state === 'EDITING' && this._selectedDrawing && this._editHit) {
      const dx = x - this._dragStartX;
      const dy = y - this._dragStartY;
      this._applyDrag(dx, dy);
      this._callbacks.onDrawingUpdated(this._selectedDrawing);
      return true;
    }

    return false;
  }

  onPointerUp(_pointerId: number): boolean {
    if (this._state === 'EDITING') {
      this._editHit = null;
      this._state = this._selectedDrawing ? 'SELECTING' : 'IDLE';
      return true;
    }
    return false;
  }

  onKeyDown(key: string, _shiftKey: boolean): boolean {
    if (key === 'Escape') {
      if (this._state === 'PLACING') {
        this._activeToolType = null;
        this._placingDrawing = null;
        this._state = 'IDLE';
        this._callbacks.onDrawingUpdated();
        return true;
      }
      if (this._selectedDrawing) {
        this._selectedDrawing.selected = false;
        this._selectedDrawing = null;
        this._state = 'IDLE';
        this._callbacks.onDrawingUpdated();
        return true;
      }
    }
    if (key === 'Delete' || key === 'Backspace') {
      if (this._selectedDrawing) {
        // The chart-api will handle actual removal via the IDrawingApi
        this._selectedDrawing.selected = false;
        this._selectedDrawing = null;
        this._state = 'IDLE';
        this._callbacks.onDrawingUpdated();
        return true;
      }
    }
    return false;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _handlePlacementClick(x: number, y: number): boolean {
    const type = this._activeToolType!;
    const time = this._callbacks.xToTime(x);
    const price = this._callbacks.yToPrice(y);

    if (!this._placingDrawing) {
      // Create the drawing with the first point
      const factory = DRAWING_REGISTRY.get(type);
      if (!factory) return false;
      const id = `interactive-drawing-${Date.now()}-${this._nextId++}`;
      const drawing = factory(id, [{ time, price }], {}) as BaseDrawing & DrawingPrimitive;
      const drawingCtx = this._callbacks.getDrawingContext();
      if (drawingCtx) drawing.setContext(drawingCtx);
      this._placingDrawing = drawing;
      this._placedPointCount = 1;

      // If only 1 point required, finalize immediately
      if (drawing.requiredPoints === 1) {
        this._callbacks.onDrawingCreated(drawing);
        this._placingDrawing = null;
        this._placedPointCount = 0;
        // Stay in PLACING for the next drawing of the same type
        return true;
      }

      // For multi-point drawings, add a preview second point at the same location
      drawing.points.push({ time, price });
      this._callbacks.onDrawingCreated(drawing);
      return true;
    }

    // Second click for 2-point drawings: finalize
    this._placingDrawing.points[this._placedPointCount] = { time, price };
    this._placedPointCount++;
    if (this._placedPointCount >= this._placingDrawing.requiredPoints) {
      this._placingDrawing = null;
      this._placedPointCount = 0;
      this._callbacks.onDrawingUpdated();
      // Stay in PLACING for the next drawing
    }
    return true;
  }

  private _hitTestDrawings(x: number, y: number): DrawingHitTestResult | null {
    const drawings = this._callbacks.getDrawings();
    // Iterate in reverse (top-most first)
    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i];
      const hit = d.drawingHitTest(x, y);
      if (hit) return hit;
    }
    return null;
  }

  private _applyDrag(dx: number, dy: number): void {
    if (!this._selectedDrawing || !this._editHit) return;
    const ctx = this._callbacks.getDrawingContext();
    if (!ctx) return;

    const part = this._editHit.part;
    const pts = this._selectedDrawing.points;

    if (part === 'handle1' && this._dragStartPoints.length >= 1) {
      const orig = this._dragStartPoints[0];
      const origX = ctx.timeScale.indexToX(orig.time);
      const origY = ctx.priceScale.priceToY(orig.price);
      pts[0] = {
        time: this._callbacks.xToTime(origX + dx),
        price: this._callbacks.yToPrice(origY + dy),
      };
    } else if (part === 'handle2' && this._dragStartPoints.length >= 2) {
      const orig = this._dragStartPoints[1];
      const origX = ctx.timeScale.indexToX(orig.time);
      const origY = ctx.priceScale.priceToY(orig.price);
      pts[1] = {
        time: this._callbacks.xToTime(origX + dx),
        price: this._callbacks.yToPrice(origY + dy),
      };
    } else {
      // Move all points
      for (let i = 0; i < pts.length && i < this._dragStartPoints.length; i++) {
        const orig = this._dragStartPoints[i];
        const origX = ctx.timeScale.indexToX(orig.time);
        const origY = ctx.priceScale.priceToY(orig.price);
        pts[i] = {
          time: this._callbacks.xToTime(origX + dx),
          price: this._callbacks.yToPrice(origY + dy),
        };
      }
    }
  }
}
