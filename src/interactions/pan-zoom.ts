import type { EventHandler } from './event-router';
import type { TimeScale } from '../core/time-scale';

const KINETIC_DAMPING = 0.95;
const KINETIC_MIN_VELOCITY = 0.5;

interface PointerState {
  x: number;
  lastX: number;
  velocity: number;
}

export class PanZoomHandler implements EventHandler {
  private _timeScale: TimeScale;
  private _requestInvalidation: () => void;
  private _activePointers: Map<number, PointerState> = new Map();
  private _kineticRafId: number | null = null;

  constructor(timeScale: TimeScale, requestInvalidation: () => void) {
    this._timeScale = timeScale;
    this._requestInvalidation = requestInvalidation;
  }

  onPointerDown(x: number, _y: number, pointerId: number): void {
    // Cancel any ongoing kinetic scroll when user touches
    this._cancelKinetic();
    this._activePointers.set(pointerId, { x, lastX: x, velocity: 0 });
  }

  onPointerMove(x: number, _y: number, pointerId: number): void {
    const state = this._activePointers.get(pointerId);
    if (!state) return;

    const dx = x - state.x;
    state.velocity = dx;
    state.lastX = state.x;
    state.x = x;

    this._timeScale.scrollByPixels(dx);
    this._requestInvalidation();
  }

  onPointerUp(pointerId: number): void {
    const state = this._activePointers.get(pointerId);
    if (!state) return;

    const velocity = state.velocity;
    this._activePointers.delete(pointerId);

    // Start kinetic scrolling if velocity is significant
    if (Math.abs(velocity) > KINETIC_MIN_VELOCITY && this._activePointers.size === 0) {
      this._startKinetic(velocity);
    }
  }

  onWheel(x: number, _y: number, deltaY: number): void {
    // Zoom factor: scroll up (deltaY < 0) = zoom in, scroll down = zoom out
    const factor =
      deltaY < 0
        ? 1 + Math.abs(deltaY) * 0.005
        : 1 / (1 + Math.abs(deltaY) * 0.005);

    this._timeScale.zoomAt(x, factor);
    this._requestInvalidation();
  }

  destroy(): void {
    this._cancelKinetic();
    this._activePointers.clear();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _startKinetic(initialVelocity: number): void {
    let velocity = initialVelocity;

    const step = () => {
      velocity *= KINETIC_DAMPING;

      if (Math.abs(velocity) < KINETIC_MIN_VELOCITY) {
        this._kineticRafId = null;
        return;
      }

      this._timeScale.scrollByPixels(velocity);
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
