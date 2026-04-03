import type { EventHandler } from './event-router';
import type { TimeScale } from '../core/time-scale';

/** TV uses 0.997 for kinetic damping. */
const KINETIC_DAMPING = 0.997;
const KINETIC_MIN_VELOCITY = 0.5;
/** Number of recent positions to track for velocity calculation. */
const KINETIC_TRACK_COUNT = 4;

interface TrackedPosition {
  x: number;
  time: number;
}

/**
 * Pan and zoom handler following TradingView lightweight-charts' model.
 *
 * Pan:
 * - On pointer down: store scrollStartX and savedRightOffset
 * - On pointer move: timeScale.scrollTo(scrollStartX, currentX, savedRightOffset)
 * - Dragging right → x increases → shift is negative → rightOffset decreases
 *   → chart moves toward future/recent data.
 *
 * Zoom (wheel):
 * - TV negates deltaY and clamps to ±1 for the zoom scale.
 * - timeScale.zoomAt(x, scale)
 */
export class PanZoomHandler implements EventHandler {
  private _timeScale: TimeScale;
  private _requestInvalidation: () => void;

  private _scrollStartX: number = 0;
  private _savedRightOffset: number = 0;
  private _isPanning: boolean = false;
  private _activePointerId: number = -1;

  /** Track last N positions for kinetic velocity calculation. */
  private _positions: TrackedPosition[] = [];

  private _kineticRafId: number | null = null;

  constructor(timeScale: TimeScale, requestInvalidation: () => void) {
    this._timeScale = timeScale;
    this._requestInvalidation = requestInvalidation;
  }

  onPointerDown(x: number, _y: number, pointerId: number): void {
    this._cancelKinetic();
    this._isPanning = true;
    this._activePointerId = pointerId;
    this._scrollStartX = x;
    this._savedRightOffset = this._timeScale.rightOffset;
    this._positions = [{ x, time: performance.now() }];
  }

  onPointerMove(x: number, _y: number, pointerId: number): void {
    if (!this._isPanning || pointerId !== this._activePointerId) return;

    this._timeScale.scrollTo(this._scrollStartX, x, this._savedRightOffset);

    // Track position for kinetic velocity
    const now = performance.now();
    this._positions.push({ x, time: now });
    if (this._positions.length > KINETIC_TRACK_COUNT) {
      this._positions.shift();
    }

    this._requestInvalidation();
  }

  onPointerUp(pointerId: number): void {
    if (pointerId !== this._activePointerId || !this._isPanning) return;
    this._isPanning = false;
    this._activePointerId = -1;

    // Compute velocity from tracked positions
    const velocity = this._computeVelocity();

    if (Math.abs(velocity) > KINETIC_MIN_VELOCITY) {
      this._startKinetic(velocity);
    }
  }

  onWheel(x: number, _y: number, deltaY: number): void {
    // TV negates deltaY and clamps to ±1 for zoom scale
    const scale = -Math.sign(deltaY);
    if (scale === 0) return;
    this._timeScale.zoomAt(x, scale);
    this._requestInvalidation();
  }

  destroy(): void {
    this._cancelKinetic();
    this._isPanning = false;
    this._activePointerId = -1;
    this._positions = [];
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Compute velocity (pixels per millisecond) from tracked positions,
   * then convert to pixels-per-frame (~16ms).
   */
  private _computeVelocity(): number {
    if (this._positions.length < 2) return 0;
    const first = this._positions[0];
    const last = this._positions[this._positions.length - 1];
    const dt = last.time - first.time;
    if (dt === 0) return 0;
    // pixels per ms, scaled to ~16ms frame
    return ((last.x - first.x) / dt) * 16;
  }

  private _startKinetic(initialVelocity: number): void {
    let velocity = initialVelocity;

    const step = () => {
      velocity *= KINETIC_DAMPING;

      if (Math.abs(velocity) < KINETIC_MIN_VELOCITY) {
        this._kineticRafId = null;
        return;
      }

      // Negative velocity = dragging left = showing older data
      // scrollByPixels with negative = rightOffset decreases = showing newer data
      // We want kinetic to continue in the direction of the drag, so negate:
      this._timeScale.scrollByPixels(-velocity);
      this._requestInvalidation();
      this._kineticRafId = requestAnimationFrame(step);
    };

    this._kineticRafId = requestAnimationFrame(step);
  }

  private _cancelKinetic(): void {
    if (this._kineticRafId !== null) {
      cancelAnimationFrame(this._kineticRafId);
      this._kineticRafId = null;
    }
  }
}
