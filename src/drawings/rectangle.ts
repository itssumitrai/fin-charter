import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  pointInRect,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const FILL_ALPHA = 0.15;

export class RectangleDrawing extends BaseDrawing {
  readonly drawingType = 'rectangle';
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

    if (pointInRect(x, y, x1, y1, x2, y2)) {
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

            const color = self.options.color ?? '#2196F3';
            const fillColor = self.options.fillColor ?? color;
            const lw = (self.options.lineWidth ?? 1) * r;
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.abs(x2 - x1);
            const rh = Math.abs(y2 - y1);

            c.save();

            // Fill
            c.globalAlpha = FILL_ALPHA;
            c.fillStyle = fillColor;
            c.fillRect(rx, ry, rw, rh);

            // Stroke
            c.globalAlpha = 1;
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.strokeRect(rx, ry, rw, rh);

            // Selection handles
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

export function createRectangle(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): RectangleDrawing {
  return new RectangleDrawing(id, points, options);
}
