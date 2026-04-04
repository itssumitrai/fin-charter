import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const ARC_RATIOS = [0.236, 0.382, 0.5, 0.618] as const;
const ARC_LABELS = ['23.6%', '38.2%', '50%', '61.8%'];

export class FibArcDrawing extends BaseDrawing {
  readonly drawingType = 'fib-arc';
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

    // Check handles
    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }

    const totalDist = Math.hypot(x2 - x1, y2 - y1);
    const distFromCenter = Math.hypot(x - x2, y - y2);

    for (const ratio of ARC_RATIOS) {
      const radius = totalDist * ratio;
      if (Math.abs(distFromCenter - radius) < HIT_THRESHOLD) {
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
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;

            const totalDist = Math.hypot(x2 - x1, y2 - y1);
            const color = self.options.color ?? '#FF9800';
            const lw = (self.options.lineWidth ?? 1) * r;
            const fontSize = (self.options.fontSize ?? 11) * r;

            c.save();
            c.strokeStyle = color;
            c.fillStyle = color;
            c.lineWidth = lw;
            c.font = `${fontSize}px sans-serif`;
            c.textBaseline = 'bottom';

            for (let i = 0; i < ARC_RATIOS.length; i++) {
              const radius = totalDist * ARC_RATIOS[i];
              c.beginPath();
              // Upper half arc (counterclockwise from 0 to PI)
              c.arc(x2, y2, radius, 0, Math.PI, true);
              c.stroke();
              // Label at leftmost point of arc
              c.fillText(ARC_LABELS[i], x2 - radius + 2 * r, y2 - 2 * r);
            }

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

export function createFibArc(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): FibArcDrawing {
  return new FibArcDrawing(id, points, options);
}
