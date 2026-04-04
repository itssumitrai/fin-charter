import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

export class VerticalLineDrawing extends BaseDrawing {
  readonly drawingType = 'vertical-line';
  readonly requiredPoints = 1;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 1) return null;
    const lineX = ctx.timeScale.indexToX(this.points[0].time);
    if (Math.abs(x - lineX) < HIT_THRESHOLD) {
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
            const x = Math.round(ctx.timeScale.indexToX(self.points[0].time) * r);
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x, target.height);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x - hs, target.height / 2 - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createVerticalLine(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): VerticalLineDrawing {
  return new VerticalLineDrawing(id, points, options);
}
