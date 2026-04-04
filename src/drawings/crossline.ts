import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

export class CrosslineDrawing extends BaseDrawing {
  readonly drawingType = 'crossline';
  readonly requiredPoints = 1;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 1) return null;

    const cx = ctx.timeScale.indexToX(this.points[0].time);
    const cy = ctx.priceScale.priceToY(this.points[0].price);

    // Check handle
    if (Math.hypot(x - cx, y - cy) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }

    // Horizontal line
    if (Math.abs(y - cy) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'ns-resize' };
    }

    // Vertical line
    if (Math.abs(x - cx) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'ew-resize' };
    }

    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 1) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const cx = ctx.timeScale.indexToX(self.points[0].time) * r;
            const cy = ctx.priceScale.priceToY(self.points[0].price) * r;
            const w = target.width;
            const h = target.height;
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            // Horizontal line
            c.beginPath();
            c.moveTo(0, cy);
            c.lineTo(w, cy);
            c.stroke();

            // Vertical line
            c.beginPath();
            c.moveTo(cx, 0);
            c.lineTo(cx, h);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(cx - hs, cy - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createCrossline(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): CrosslineDrawing {
  return new CrosslineDrawing(id, points, options);
}
