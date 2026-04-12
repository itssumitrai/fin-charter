import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  pointInRect,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const FILL_ALPHA = 0.15;
const BORDER_ALPHA = 0.6;

/**
 * Date Range: a vertical highlighted zone between two time points.
 * Points: p1 = start time, p2 = end time.
 * Fills the area between the two times with a semi-transparent color.
 */
export class DateRangeDrawing extends BaseDrawing {
  readonly drawingType = 'date-range';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);

    // Handle hit on each vertical border
    if (Math.abs(x - x1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'ew-resize' };
    }
    if (Math.abs(x - x2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'ew-resize' };
    }

    // Hit inside the zone
    if (pointInRect(x, y, x1, 0, x2, ctx.chartHeight)) {
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
            const { context: c, pixelRatio: r, height: h } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;

            const color = self.options.color ?? '#2196F3';
            const fillColor = self.options.fillColor ?? color;
            const lw = (self.options.lineWidth ?? 1) * r;

            const rectX = Math.min(x1, x2);
            const rectW = Math.abs(x2 - x1);

            c.save();

            // Filled zone
            c.globalAlpha = FILL_ALPHA;
            c.fillStyle = fillColor;
            c.fillRect(rectX, 0, rectW, h);

            // Vertical border lines
            c.globalAlpha = BORDER_ALPHA;
            c.strokeStyle = color;
            c.lineWidth = lw;
            c.setLineDash([]);

            c.beginPath();
            c.moveTo(x1, 0);
            c.lineTo(x1, h);
            c.stroke();

            c.beginPath();
            c.moveTo(x2, 0);
            c.lineTo(x2, h);
            c.stroke();

            c.globalAlpha = 1;

            // Selection handles at mid-height
            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              const midY = h / 2;
              c.fillRect(x1 - hs, midY - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, midY - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createDateRange(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): DateRangeDrawing {
  return new DateRangeDrawing(id, points, options);
}
