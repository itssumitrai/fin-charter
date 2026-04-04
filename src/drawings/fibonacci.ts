import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] as const;
const FIB_LABELS = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
const FIB_FILL_ALPHA = 0.06;

export class FibonacciDrawing extends BaseDrawing {
  readonly drawingType = 'fibonacci';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  private _getLevelYs(): number[] | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;
    const p1 = ctx.priceScale.priceToY(this.points[0].price);
    const p2 = ctx.priceScale.priceToY(this.points[1].price);
    return FIB_LEVELS.map(l => p1 + (p2 - p1) * l);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const levels = this._getLevelYs();
    if (!levels) return null;
    for (const ly of levels) {
      if (Math.abs(y - ly) < HIT_THRESHOLD) {
        return { drawingId: this.id, part: 'body', cursorStyle: 'ns-resize' };
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
            const { context: c, pixelRatio: r, width: w } = target;
            const p1y = ctx.priceScale.priceToY(self.points[0].price) * r;
            const p2y = ctx.priceScale.priceToY(self.points[1].price) * r;
            const color = self.options.color ?? '#FF9800';
            const lw = (self.options.lineWidth ?? 1) * r;
            const fontSize = (self.options.fontSize ?? 11) * r;

            c.save();

            // Compute level Y positions
            const levelYs = FIB_LEVELS.map(l => p1y + (p2y - p1y) * l);

            // Draw shaded zones between levels
            for (let i = 0; i < levelYs.length - 1; i++) {
              c.fillStyle = color;
              c.globalAlpha = FIB_FILL_ALPHA * (i % 2 === 0 ? 1 : 0.5);
              const top = Math.min(levelYs[i], levelYs[i + 1]);
              const bot = Math.max(levelYs[i], levelYs[i + 1]);
              c.fillRect(0, top, w, bot - top);
            }

            c.globalAlpha = 1;
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.font = `${fontSize}px sans-serif`;
            c.fillStyle = color;
            c.textBaseline = 'bottom';

            // Draw level lines and labels
            for (let i = 0; i < levelYs.length; i++) {
              const ly = levelYs[i];
              c.beginPath();
              c.moveTo(0, ly);
              c.lineTo(w, ly);
              c.stroke();
              c.fillText(FIB_LABELS[i], 4 * r, ly - 2 * r);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createFibonacci(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): FibonacciDrawing {
  return new FibonacciDrawing(id, points, options);
}
