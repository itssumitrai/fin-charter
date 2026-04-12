import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

// Fibonacci sequence values used for time zone offsets
const FIB_SEQUENCE = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89] as const;
const FILL_ALPHA = 0.06;

export class FibonacciTimezoneDrawing extends BaseDrawing {
  readonly drawingType = 'fibonacci-timezone';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  /** Returns x positions (CSS pixels) for each Fibonacci zone line. */
  private _getZoneXs(): number[] | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;
    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const unit = x2 - x1;
    if (unit === 0) return null;
    return FIB_SEQUENCE.map(n => x1 + n * unit);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const zoneXs = this._getZoneXs();
    if (!zoneXs) return null;
    void y;
    for (const zx of zoneXs) {
      if (Math.abs(x - zx) < HIT_THRESHOLD) {
        return { drawingId: this.id, part: 'body', cursorStyle: 'ew-resize' };
      }
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 2) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r, height: h } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time);
            const x2 = ctx.timeScale.indexToX(self.points[1].time);
            const unit = x2 - x1;
            if (unit === 0) return;

            const color = self.options.color ?? '#9C27B0';
            const lw = (self.options.lineWidth ?? 1) * r;
            const showLabels = self.options.showLabels !== false;
            const fontSize = (self.options.fontSize ?? 10) * r;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            c.setLineDash([]);
            c.font = `${fontSize}px sans-serif`;
            c.textBaseline = 'top';
            c.fillStyle = color;

            for (let i = 0; i < FIB_SEQUENCE.length; i++) {
              const n = FIB_SEQUENCE[i];
              const zx = (x1 + n * unit) * r;

              // Alternating shaded band between consecutive Fibonacci lines
              if (i < FIB_SEQUENCE.length - 1) {
                const nextX = (x1 + FIB_SEQUENCE[i + 1] * unit) * r;
                if (i % 2 === 0) {
                  c.globalAlpha = FILL_ALPHA;
                  c.fillStyle = color;
                  c.fillRect(zx, 0, nextX - zx, h);
                  c.fillStyle = color;
                  c.globalAlpha = 1;
                }
              }

              // Vertical line
              c.globalAlpha = 1;
              c.beginPath();
              c.moveTo(zx, 0);
              c.lineTo(zx, h);
              c.stroke();

              // Label
              if (showLabels) {
                c.fillStyle = color;
                c.fillText(String(n), zx + 2 * r, 4 * r);
              }
            }

            // Selection handles on anchor points
            if (self.selected) {
              const ax1 = ctx.timeScale.indexToX(self.points[0].time) * r;
              const ax2 = ctx.timeScale.indexToX(self.points[1].time) * r;
              const midY = h / 2;
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(ax1 - hs, midY - hs, hs * 2, hs * 2);
              c.fillRect(ax2 - hs, midY - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createFibonacciTimezone(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): FibonacciTimezoneDrawing {
  return new FibonacciTimezoneDrawing(id, points, options);
}
