import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

export class HorizontalLineDrawing extends BaseDrawing {
  readonly drawingType = 'horizontal-line';
  readonly requiredPoints = 1;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 1) return null;
    const lineY = ctx.priceScale.priceToY(this.points[0].price);
    if (Math.abs(y - lineY) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'ns-resize' };
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
            const y = Math.round(ctx.priceScale.priceToY(self.points[0].price) * r);
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.beginPath();
            c.moveTo(0, y);
            c.lineTo(target.width, y);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(target.width / 2 - hs, y - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createHorizontalLine(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): HorizontalLineDrawing {
  return new HorizontalLineDrawing(id, points, options);
}
