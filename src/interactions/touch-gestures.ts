/**
 * Touch gesture handlers for mobile: pinch-to-zoom and two-finger pan.
 *
 * Works alongside the existing PanZoomHandler by detecting multi-touch
 * gestures and translating them into timeScale operations.
 */
import type { EventHandler } from './event-router';
import type { TimeScale } from '../core/time-scale';

export interface TouchGestureOptions {
  /** Enable pinch-to-zoom (default: true). */
  pinchZoom?: boolean;
  /** Enable two-finger pan (default: true). */
  twoFingerPan?: boolean;
  /** Enable momentum scrolling after pan release (default: true). */
  momentum?: boolean;
  /** Momentum friction factor 0–1 (default: 0.95). */
  momentumFriction?: number;
}

const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  pinchZoom: true,
  twoFingerPan: true,
  momentum: true,
  momentumFriction: 0.95,
};

interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

/**
 * TouchGestureHandler — detects pinch-to-zoom and two-finger pan
 * on touch devices and applies them to the chart's TimeScale.
 */
export class TouchGestureHandler implements EventHandler {
  private _options: Required<TouchGestureOptions>;
  private _timeScale: TimeScale;
  private _requestRepaint: () => void;
  private _activeTouches: Map<number, TouchPoint> = new Map();
  private _initialPinchDistance: number | null = null;
  private _initialBarSpacing: number | null = null;
  private _lastPanX: number | null = null;
  private _velocityX = 0;
  private _momentumRafId: number | null = null;

  constructor(
    timeScale: TimeScale,
    requestRepaint: () => void,
    options?: TouchGestureOptions,
  ) {
    this._timeScale = timeScale;
    this._requestRepaint = requestRepaint;
    this._options = { ...DEFAULT_OPTIONS, ...options };
    // Clamp momentumFriction to valid (0, 1) range
    this._options.momentumFriction = Math.max(0, Math.min(1, this._options.momentumFriction));
  }

  get activeTouchCount(): number {
    return this._activeTouches.size;
  }

  onPointerDown(x: number, y: number, pointerId: number): boolean | void {
    this._activeTouches.set(pointerId, { id: pointerId, x, y });
    this._stopMomentum();

    if (this._activeTouches.size === 2) {
      // Start pinch/pan tracking
      const points = [...this._activeTouches.values()];
      this._initialPinchDistance = this._distance(points[0], points[1]);
      this._initialBarSpacing = this._timeScale.barSpacing;
      this._lastPanX = (points[0].x + points[1].x) / 2;
      return true; // consume to prevent single-finger pan
    }
  }

  onPointerMove(x: number, y: number, pointerId: number): boolean | void {
    const touch = this._activeTouches.get(pointerId);
    if (!touch) return;

    const prevX = touch.x;
    touch.x = x;
    touch.y = y;

    if (this._activeTouches.size !== 2) return;

    const points = [...this._activeTouches.values()];

    // Pinch-to-zoom
    if (this._options.pinchZoom && this._initialPinchDistance !== null && this._initialBarSpacing !== null) {
      const currentDist = this._distance(points[0], points[1]);
      const scale = currentDist / this._initialPinchDistance;
      const newSpacing = this._initialBarSpacing * scale;
      const clamped = Math.max(
        this._timeScale.minBarSpacing,
        Math.min(this._timeScale.maxBarSpacing, newSpacing),
      );
      this._timeScale.setBarSpacing(clamped);
    }

    // Two-finger pan
    if (this._options.twoFingerPan && this._lastPanX !== null) {
      const currentMidX = (points[0].x + points[1].x) / 2;
      const deltaX = currentMidX - this._lastPanX;
      this._velocityX = deltaX;
      this._timeScale.scrollBy(deltaX);
      this._lastPanX = currentMidX;
    }

    this._requestRepaint();
    return true;
  }

  onPointerUp(pointerId: number): boolean | void {
    this._activeTouches.delete(pointerId);

    if (this._activeTouches.size < 2) {
      // Gesture ended
      if (this._options.momentum && Math.abs(this._velocityX) > 1) {
        this._startMomentum();
      }
      this._initialPinchDistance = null;
      this._initialBarSpacing = null;
      this._lastPanX = null;
    }
  }

  dispose(): void {
    this._stopMomentum();
    this._activeTouches.clear();
  }

  private _distance(a: TouchPoint, b: TouchPoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private _startMomentum(): void {
    const savedVelocity = this._velocityX;
    this._stopMomentum();
    this._velocityX = savedVelocity;
    const friction = this._options.momentumFriction;
    const tick = () => {
      this._velocityX *= friction;
      if (Math.abs(this._velocityX) < 0.5) {
        this._velocityX = 0;
        this._momentumRafId = null;
        return;
      }
      this._timeScale.scrollBy(this._velocityX);
      this._requestRepaint();
      this._momentumRafId = requestAnimationFrame(tick);
    };
    this._momentumRafId = requestAnimationFrame(tick);
  }

  private _stopMomentum(): void {
    if (this._momentumRafId !== null) {
      cancelAnimationFrame(this._momentumRafId);
      this._momentumRafId = null;
    }
    this._velocityX = 0;
  }
}
