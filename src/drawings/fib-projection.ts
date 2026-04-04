import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const PROJ_LEVELS = [0, 0.618, 1, 1.618, 2.618] as const;
const PROJ_LABELS = ['0%', '61.8%', '100%', '161.8%', '261.8%'];
const FIB_FILL_ALPHA = 0.06;

export class FibProjectionDrawing extends BaseDrawing {
  readonly drawingType = 'fib-projection';
  readonly requiredPoints = 3;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  private _getLevelYs(): number[] | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 3) return null;
    const move = this.points[1].price - this.points[0].price;
    return PROJ_LEVELS.map(ratio => {
      const price = this.points[2].price + move * ratio;
      return ctx.priceScale.priceToY(price);
    });
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
        if (!ctx || self.points.length < 3) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r, width: w } = target;
            const move = self.points[1].price - self.points[0].price;
            const levelYs = PROJ_LEVELS.map(ratio => {
              const price = self.points[2].price + move * ratio;
              return ctx.priceScale.priceToY(price) * r;
            });

            const color = self.options.color ?? '#9C27B0';
            const lw = (self.options.lineWidth ?? 1) * r;
            const fontSize = (self.options.fontSize ?? 11) * r;

            c.save();

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

            for (let i = 0; i < levelYs.length; i++) {
              const ly = levelYs[i];
              c.beginPath();
              c.moveTo(0, ly);
              c.lineTo(w, ly);
              c.stroke();
              c.fillText(PROJ_LABELS[i], 4 * r, ly - 2 * r);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createFibProjection(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): FibProjectionDrawing {
  return new FibProjectionDrawing(id, points, options);
}
