import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import { BaseDrawing, HIT_THRESHOLD, distToSegment, applyLineStyle, type AnchorPoint, type DrawingOptions, type DrawingHitTestResult } from './base';

export class TriangleDrawing extends BaseDrawing {
  readonly drawingType = 'triangle';
  readonly requiredPoints = 3;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 3) return null;

    const px = [0, 1, 2].map(i => ctx.timeScale.indexToX(this.points[i].time));
    const py = [0, 1, 2].map(i => ctx.priceScale.priceToY(this.points[i].price));

    if (Math.hypot(x - px[0], y - py[0]) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    if (Math.hypot(x - px[1], y - py[1]) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    if (Math.hypot(x - px[2], y - py[2]) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle3', cursorStyle: 'grab' };

    if (
      distToSegment(x, y, px[0], py[0], px[1], py[1]) < HIT_THRESHOLD ||
      distToSegment(x, y, px[1], py[1], px[2], py[2]) < HIT_THRESHOLD ||
      distToSegment(x, y, px[2], py[2], px[0], py[0]) < HIT_THRESHOLD
    ) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }

    if (this.options.fillColor) {
      if (pointInTriangle(x, y, px[0], py[0], px[1], py[1], px[2], py[2])) {
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
        if (!ctx || self.points.length < 3) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const px = [0, 1, 2].map(i => ctx.timeScale.indexToX(self.points[i].time) * r);
            const py = [0, 1, 2].map(i => ctx.priceScale.priceToY(self.points[i].price) * r);

            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;
            c.save();
            c.beginPath();
            c.moveTo(px[0], py[0]);
            c.lineTo(px[1], py[1]);
            c.lineTo(px[2], py[2]);
            c.closePath();

            if (self.options.fillColor) {
              c.fillStyle = self.options.fillColor;
              c.fill();
            }

            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              for (let i = 0; i < 3; i++) {
                c.fillRect(px[i] - hs, py[i] - hs, hs * 2, hs * 2);
              }
            }
            c.restore();
          },
        };
      },
    };
  }
}

function pointInTriangle(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
): boolean {
  const d1 = sign(px, py, x1, y1, x2, y2);
  const d2 = sign(px, py, x2, y2, x3, y3);
  const d3 = sign(px, py, x3, y3, x1, y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function sign(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}

export function createTriangle(id: string, points: AnchorPoint[], options: DrawingOptions): TriangleDrawing {
  return new TriangleDrawing(id, points, options);
}
