import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import { BaseDrawing, HIT_THRESHOLD, distToSegment, applyLineStyle, type AnchorPoint, type DrawingOptions, type DrawingHitTestResult } from './base';

export class BrushDrawing extends BaseDrawing {
  readonly drawingType = 'brush';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    for (let i = 0; i < this.points.length - 1; i++) {
      const x1 = ctx.timeScale.indexToX(this.points[i].time);
      const y1 = ctx.priceScale.priceToY(this.points[i].price);
      const x2 = ctx.timeScale.indexToX(this.points[i + 1].time);
      const y2 = ctx.priceScale.priceToY(this.points[i + 1].price);
      if (distToSegment(x, y, x1, y1, x2, y2) < HIT_THRESHOLD) {
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
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;
            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.beginPath();
            const x0 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y0 = ctx.priceScale.priceToY(self.points[0].price) * r;
            c.moveTo(x0, y0);
            for (let i = 1; i < self.points.length; i++) {
              const xi = ctx.timeScale.indexToX(self.points[i].time) * r;
              const yi = ctx.priceScale.priceToY(self.points[i].price) * r;
              c.lineTo(xi, yi);
            }
            c.stroke();
            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              for (const pt of self.points) {
                const xi = ctx.timeScale.indexToX(pt.time) * r;
                const yi = ctx.priceScale.priceToY(pt.price) * r;
                c.fillRect(xi - hs, yi - hs, hs * 2, hs * 2);
              }
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createBrush(id: string, points: AnchorPoint[], options: DrawingOptions): BrushDrawing {
  return new BrushDrawing(id, points, options);
}
