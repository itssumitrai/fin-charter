import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import { BaseDrawing, HIT_THRESHOLD, distToSegment, applyLineStyle, type AnchorPoint, type DrawingOptions, type DrawingHitTestResult } from './base';

export class RegressionChannelDrawing extends BaseDrawing {
  readonly drawingType = 'regression-channel';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  private _bandOffset(): number {
    if (this.points.length < 2) return 0;
    return Math.abs(this.points[1].price - this.points[0].price) * 0.1;
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

    const offset = this._bandOffset();
    const dy = offset === 0 ? 0 : ctx.priceScale.priceToY(this.points[0].price - offset) - ctx.priceScale.priceToY(this.points[0].price);

    // Main regression line
    if (distToSegment(x, y, x1, y1, x2, y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    // Upper band
    if (distToSegment(x, y, x1, y1 + dy, x2, y2 + dy) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'edge', cursorStyle: 'move' };
    }
    // Lower band
    if (distToSegment(x, y, x1, y1 - dy, x2, y2 - dy) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'edge', cursorStyle: 'move' };
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

            const offset = self._bandOffset();
            const rawY0 = ctx.priceScale.priceToY(self.points[0].price);
            const rawYOff = ctx.priceScale.priceToY(self.points[0].price - offset);
            const dy = (rawYOff - rawY0) * r;

            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;
            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            // Main line
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();

            // Upper band
            c.globalAlpha = 0.5;
            c.beginPath();
            c.moveTo(x1, y1 + dy);
            c.lineTo(x2, y2 + dy);
            c.stroke();

            // Lower band
            c.beginPath();
            c.moveTo(x1, y1 - dy);
            c.lineTo(x2, y2 - dy);
            c.stroke();

            if (self.options.fillColor) {
              c.globalAlpha = 0.1;
              c.fillStyle = self.options.fillColor;
              c.beginPath();
              c.moveTo(x1, y1 + dy);
              c.lineTo(x2, y2 + dy);
              c.lineTo(x2, y2 - dy);
              c.lineTo(x1, y1 - dy);
              c.closePath();
              c.fill();
            }

            if (self.selected) {
              c.globalAlpha = 1;
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

export function createRegressionChannel(id: string, points: AnchorPoint[], options: DrawingOptions): RegressionChannelDrawing {
  return new RegressionChannelDrawing(id, points, options);
}
