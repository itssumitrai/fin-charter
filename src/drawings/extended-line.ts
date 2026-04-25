import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import { BaseDrawing, HIT_THRESHOLD, applyLineStyle, type AnchorPoint, type DrawingOptions, type DrawingHitTestResult } from './base';

export class ExtendedLineDrawing extends BaseDrawing {
  readonly drawingType = 'extended-line';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);

    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };

    // Compute extended endpoints at x=0 and x=chartWidth
    const [ex1, ey1, ex2, ey2] = this._extendedEndpoints(x1, y1, x2, y2, ctx.chartWidth);

    // Distance from point to the extended line segment
    const dx = ex2 - ex1;
    const dy = ey2 - ey1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return null;
    const t = ((x - ex1) * dx + (y - ey1) * dy) / lenSq;
    const nearX = ex1 + t * dx;
    const nearY = ey1 + t * dy;
    if (Math.hypot(x - nearX, y - nearY) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  private _extendedEndpoints(x1: number, y1: number, x2: number, y2: number, chartWidth: number): [number, number, number, number] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0) {
      return [x1, 0, x1, 1e6];
    }
    const slope = dy / dx;
    const yAtX0 = y1 - slope * x1;
    const yAtXMax = y1 + slope * (chartWidth - x1);
    return [0, yAtX0, chartWidth, yAtXMax];
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
            const x1 = ctx.timeScale.indexToX(self.points[0].time);
            const y1 = ctx.priceScale.priceToY(self.points[0].price);
            const x2 = ctx.timeScale.indexToX(self.points[1].time);
            const y2 = ctx.priceScale.priceToY(self.points[1].price);

            const [ex1, ey1, ex2, ey2] = self._extendedEndpoints(x1, y1, x2, y2, ctx.chartWidth);

            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;
            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.beginPath();
            c.moveTo(ex1 * r, ey1 * r);
            c.lineTo(ex2 * r, ey2 * r);
            c.stroke();
            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x1 * r - hs, y1 * r - hs, hs * 2, hs * 2);
              c.fillRect(x2 * r - hs, y2 * r - hs, hs * 2, hs * 2);
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createExtendedLine(id: string, points: AnchorPoint[], options: DrawingOptions): ExtendedLineDrawing {
  return new ExtendedLineDrawing(id, points, options);
}
