import type { EventHandler } from './event-router';
import type { PriceScale } from '../core/price-scale';
import type { TimeScale } from '../core/time-scale';

export interface AxisRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragMode = 'price' | 'time' | null;

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  /** Snapshot of price range when drag started */
  startPriceMin: number;
  startPriceMax: number;
}

function pointInRect(x: number, y: number, rect: AxisRect): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export class AxisDragHandler implements EventHandler {
  private _priceScale: PriceScale;
  private _timeScale: TimeScale;
  private _requestInvalidation: () => void;
  private _priceAxisRect: () => AxisRect;
  private _timeAxisRect: () => AxisRect;

  private _drag: DragState | null = null;
  private _activePointerId: number | null = null;

  constructor(
    priceScale: PriceScale,
    timeScale: TimeScale,
    requestInvalidation: () => void,
    priceAxisRect: () => AxisRect,
    timeAxisRect: () => AxisRect,
  ) {
    this._priceScale = priceScale;
    this._timeScale = timeScale;
    this._requestInvalidation = requestInvalidation;
    this._priceAxisRect = priceAxisRect;
    this._timeAxisRect = timeAxisRect;
  }

  onPointerDown(x: number, y: number, pointerId: number): void {
    // Only track first pointer
    if (this._activePointerId !== null) return;

    const priceRect = this._priceAxisRect();
    const timeRect = this._timeAxisRect();

    let mode: DragMode = null;
    if (pointInRect(x, y, priceRect)) {
      mode = 'price';
    } else if (pointInRect(x, y, timeRect)) {
      mode = 'time';
    }

    if (!mode) return;

    this._activePointerId = pointerId;
    const { min, max } = this._priceScale.priceRange;
    this._drag = {
      mode,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      startPriceMin: min,
      startPriceMax: max,
    };
  }

  onPointerMove(x: number, y: number, pointerId: number): void {
    if (pointerId !== this._activePointerId || !this._drag) return;

    const drag = this._drag;

    if (drag.mode === 'price') {
      this._handlePriceDrag(y, drag);
    } else if (drag.mode === 'time') {
      this._handleTimeDrag(x, drag);
    }

    drag.lastX = x;
    drag.lastY = y;

    this._requestInvalidation();
  }

  onPointerUp(pointerId: number): void {
    if (pointerId !== this._activePointerId) return;
    this._drag = null;
    this._activePointerId = null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _handlePriceDrag(y: number, drag: DragState): void {
    const dy = y - drag.startY;
    // Dragging down expands range, dragging up contracts it.
    // Scale factor based on vertical drag distance.
    const scale = 1 + dy * 0.005;
    const clampedScale = Math.max(0.1, scale);

    const mid = (drag.startPriceMin + drag.startPriceMax) / 2;
    const halfSpan = ((drag.startPriceMax - drag.startPriceMin) / 2) * clampedScale;

    this._priceScale.setRange(mid - halfSpan, mid + halfSpan);
  }

  private _handleTimeDrag(x: number, drag: DragState): void {
    const dx = x - drag.lastX;
    this._timeScale.scrollByPixels(dx);
  }
}
