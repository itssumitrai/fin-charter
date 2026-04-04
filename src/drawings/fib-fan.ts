import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  distToSegment,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const FAN_RATIOS = [0.236, 0.382, 0.5, 0.618, 0.786] as const;
const FAN_LABELS = ['23.6%', '38.2%', '50%', '61.8%', '78.6%'];

export class FibFanDrawing extends BaseDrawing {
  readonly drawingType = 'fib-fan';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  /** Extend a line from (x1,y1) through (tx,ty) to the chart edge. */
  private _extendToEdge(
    x1: number, y1: number,
    tx: number, ty: number,
    w: number, h: number,
  ): [number, number] {
    const dx = tx - x1;
    const dy = ty - y1;
    if (dx === 0 && dy === 0) return [tx, ty];
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

    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }

    for (const ratio of FAN_RATIOS) {
      const ty = y1 + (y2 - y1) * ratio;
      const [ex, ey] = this._extendToEdge(x1, y1, x2, ty, ctx.chartWidth, ctx.chartHeight);
      if (distToSegment(x, y, x1, y1, ex, ey) < HIT_THRESHOLD) {
        return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
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
            const { context: c, pixelRatio: r } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const w = target.width;
            const h = target.height;

            const color = self.options.color ?? '#FF9800';
            const lw = (self.options.lineWidth ?? 1) * r;
            const fontSize = (self.options.fontSize ?? 11) * r;

            c.save();
            c.strokeStyle = color;
            c.fillStyle = color;
            c.lineWidth = lw;
            c.font = `${fontSize}px sans-serif`;
            c.textBaseline = 'bottom';

            for (let i = 0; i < FAN_RATIOS.length; i++) {
              const ty = y1 + (y2 - y1) * FAN_RATIOS[i];
              const dx = x2 - x1;
              const dy = ty - y1;
              let tMax = 1e9;
              if (dx > 0) tMax = Math.min(tMax, (w - x1) / dx);
              else if (dx < 0) tMax = Math.min(tMax, -x1 / dx);
              if (dy > 0) tMax = Math.min(tMax, (h - y1) / dy);
              else if (dy < 0) tMax = Math.min(tMax, -y1 / dy);
              const ex = x1 + tMax * dx;
              const ey = y1 + tMax * dy;

              c.beginPath();
              c.moveTo(x1, y1);
              c.lineTo(ex, ey);
              c.stroke();

              // Label near the end of the line
              c.fillText(FAN_LABELS[i], ex - 40 * r, ey - 2 * r);
            }

            if (self.selected) {
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

export function createFibFan(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): FibFanDrawing {
  return new FibFanDrawing(id, points, options);
}
