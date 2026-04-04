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

export class ArrowDrawing extends BaseDrawing {
  readonly drawingType = 'arrow';
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

    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }

    if (distToSegment(x, y, x1, y1, x2, y2) < HIT_THRESHOLD) {
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
            const lw = (self.options.lineWidth ?? 1) * r;
            const arrowSize = 10 * r;

            c.save();
            c.strokeStyle = color;
            c.fillStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            // Draw line
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();

            // Draw arrowhead at p2
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const wingAngle = Math.PI / 6;
            c.setLineDash([]);
            c.beginPath();
            c.moveTo(x2, y2);
            c.lineTo(
              x2 - arrowSize * Math.cos(angle - wingAngle),
              y2 - arrowSize * Math.sin(angle - wingAngle),
            );
            c.lineTo(
              x2 - arrowSize * Math.cos(angle + wingAngle),
              y2 - arrowSize * Math.sin(angle + wingAngle),
            );
            c.closePath();
            c.fill();

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

export function createArrow(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): ArrowDrawing {
  return new ArrowDrawing(id, points, options);
}
