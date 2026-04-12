import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  pointInRect,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const FILL_ALPHA = 0.12;

/**
 * Price Range: a horizontal rectangle between two price levels.
 * Shows the price difference and percentage change as a label in the middle.
 * Points: p1 = first price level, p2 = second price level.
 * The time coordinates of both points determine the horizontal extent.
 */
export class PriceRangeDrawing extends BaseDrawing {
  readonly drawingType = 'price-range';
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

    if (pointInRect(x, y, x1, y1, x2, y2)) {
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

            const color = self.options.color ?? '#4CAF50';
            const fillColor = self.options.fillColor ?? color;
            const lw = (self.options.lineWidth ?? 1) * r;
            const showLabels = self.options.showLabels !== false;

            const rectX = Math.min(x1, x2);
            const rectY = Math.min(y1, y2);
            const rectW = Math.abs(x2 - x1);
            const rectH = Math.abs(y2 - y1);

            c.save();

            // Fill
            c.globalAlpha = FILL_ALPHA;
            c.fillStyle = fillColor;
            c.fillRect(rectX, rectY, rectW, rectH);
            c.globalAlpha = 1;

            // Border lines (top + bottom)
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y1);
            c.stroke();

            c.beginPath();
            c.moveTo(x1, y2);
            c.lineTo(x2, y2);
            c.stroke();

            // Vertical edges (dashed)
            c.setLineDash([4 * r, 3 * r]);
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x1, y2);
            c.stroke();
            c.beginPath();
            c.moveTo(x2, y1);
            c.lineTo(x2, y2);
            c.stroke();
            c.setLineDash([]);

            // Label: price diff + %
            if (showLabels && rectH > 12 * r) {
              const p1 = self.points[0].price;
              const p2 = self.points[1].price;
              const diff = p2 - p1;
              const pct = p1 !== 0 ? (diff / p1) * 100 : 0;
              const sign = diff >= 0 ? '+' : '';
              const label = `${sign}${diff.toFixed(2)}  (${sign}${pct.toFixed(2)}%)`;

              const fontSize = (self.options.fontSize ?? 11) * r;
              c.font = `bold ${fontSize}px sans-serif`;
              c.fillStyle = color;
              c.textBaseline = 'middle';
              c.textAlign = 'center';
              c.fillText(label, rectX + rectW / 2, rectY + rectH / 2);
              c.textAlign = 'start';
            }

            // Selection handles
            if (self.selected) {
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

export function createPriceRange(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): PriceRangeDrawing {
  return new PriceRangeDrawing(id, points, options);
}
