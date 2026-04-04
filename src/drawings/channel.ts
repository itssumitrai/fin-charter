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

const FILL_ALPHA = 0.08;

export class ChannelDrawing extends BaseDrawing {
  readonly drawingType = 'channel';
  readonly requiredPoints = 3;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 3) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);
    const x3 = ctx.timeScale.indexToX(this.points[2].time);
    const y3 = ctx.priceScale.priceToY(this.points[2].price);

    // Offset vector = p3 - p1
    const ox = x3 - x1;
    const oy = y3 - y1;

    // Second line: (p1+offset) -> (p2+offset)
    const sx1 = x1 + ox;
    const sy1 = y1 + oy;
    const sx2 = x2 + ox;
    const sy2 = y2 + oy;

    // Check handles
    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x3, y - y3) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle3', cursorStyle: 'grab' };
    }

    if (distToSegment(x, y, x1, y1, x2, y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    if (distToSegment(x, y, sx1, sy1, sx2, sy2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 3) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const x3 = ctx.timeScale.indexToX(self.points[2].time) * r;
            const y3 = ctx.priceScale.priceToY(self.points[2].price) * r;

            const ox = x3 - x1;
            const oy = y3 - y1;
            const sx1 = x1 + ox;
            const sy1 = y1 + oy;
            const sx2 = x2 + ox;
            const sy2 = y2 + oy;

            const color = self.options.color ?? '#2196F3';
            const fillColor = self.options.fillColor ?? color;
            const lw = (self.options.lineWidth ?? 1) * r;

            c.save();

            // Fill between lines
            c.globalAlpha = FILL_ALPHA;
            c.fillStyle = fillColor;
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.lineTo(sx2, sy2);
            c.lineTo(sx1, sy1);
            c.closePath();
            c.fill();

            // Draw both lines
            c.globalAlpha = 1;
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();

            c.beginPath();
            c.moveTo(sx1, sy1);
            c.lineTo(sx2, sy2);
            c.stroke();

            // Selection handles
            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x1 - hs, y1 - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, y2 - hs, hs * 2, hs * 2);
              c.fillRect(x3 - hs, y3 - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createChannel(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): ChannelDrawing {
  return new ChannelDrawing(id, points, options);
}
