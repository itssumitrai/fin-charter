import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  distToSegment,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

export class RayDrawing extends BaseDrawing {
  readonly drawingType = 'ray';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  /** Compute the point where the ray exits the chart bounds. */
  private _extendedEnd(
    x1: number, y1: number,
    x2: number, y2: number,
    w: number, h: number,
  ): [number, number] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return [x2, y2];

    // Find the largest t such that p1 + t*(p2-p1) is still within [0,w] x [0,h]
    let tMax = 1e9;
    if (dx > 0) tMax = Math.min(tMax, (w - x1) / dx);
    else if (dx < 0) tMax = Math.min(tMax, -x1 / dx);
    if (dy > 0) tMax = Math.min(tMax, (h - y1) / dy);
    else if (dy < 0) tMax = Math.min(tMax, -y1 / dy);

    return [x1 + tMax * dx, y1 + tMax * dy];
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);

    // Check handles first
    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }

    const [ex, ey] = this._extendedEnd(x1, y1, x2, y2, ctx.chartWidth, ctx.chartHeight);
    if (distToSegment(x, y, x1, y1, ex, ey) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
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
            const { context: c, pixelRatio: r } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const w = target.width;
            const h = target.height;
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            const dx = x2 - x1;
            const dy = y2 - y1;
            let tMax = 1e9;
            if (dx > 0) tMax = Math.min(tMax, (w - x1) / dx);
            else if (dx < 0) tMax = Math.min(tMax, -x1 / dx);
            if (dy > 0) tMax = Math.min(tMax, (h - y1) / dy);
            else if (dy < 0) tMax = Math.min(tMax, -y1 / dy);
            const ex = x1 + tMax * dx;
            const ey = y1 + tMax * dy;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(ex, ey);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x1 - hs, y1 - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, y2 - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createRay(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): RayDrawing {
  return new RayDrawing(id, points, options);
}
