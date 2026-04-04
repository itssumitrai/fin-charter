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

export class PitchforkDrawing extends BaseDrawing {
  readonly drawingType = 'pitchfork';
  readonly requiredPoints = 3;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  /** Given pivot (px,py), midpoint (mx,my), and extension factor, return end point. */
  private _extendLine(
    x1: number, y1: number,
    x2: number, y2: number,
    factor: number,
  ): [number, number] {
    return [x1 + (x2 - x1) * factor, y1 + (y2 - y1) * factor];
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 3) return null;

    const px = ctx.timeScale.indexToX(this.points[0].time);
    const py = ctx.priceScale.priceToY(this.points[0].price);
    const p2x = ctx.timeScale.indexToX(this.points[1].time);
    const p2y = ctx.priceScale.priceToY(this.points[1].price);
    const p3x = ctx.timeScale.indexToX(this.points[2].time);
    const p3y = ctx.priceScale.priceToY(this.points[2].price);

    // Midpoint of p2/p3
    const mx = (p2x + p3x) / 2;
    const my = (p2y + p3y) / 2;

    const [medEndX, medEndY] = this._extendLine(px, py, mx, my, 2);
    const dx = mx - px;
    const dy = my - py;
    const [upperEndX, upperEndY] = [p2x + dx, p2y + dy];
    const [lowerEndX, lowerEndY] = [p3x + dx, p3y + dy];

    // Check handles
    if (Math.hypot(x - px, y - py) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - p2x, y - p2y) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - p3x, y - p3y) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle3', cursorStyle: 'grab' };
    }

    if (distToSegment(x, y, px, py, medEndX, medEndY) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    if (distToSegment(x, y, p2x, p2y, upperEndX, upperEndY) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    if (distToSegment(x, y, p3x, p3y, lowerEndX, lowerEndY) < HIT_THRESHOLD) {
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
            const px = ctx.timeScale.indexToX(self.points[0].time) * r;
            const py = ctx.priceScale.priceToY(self.points[0].price) * r;
            const p2x = ctx.timeScale.indexToX(self.points[1].time) * r;
            const p2y = ctx.priceScale.priceToY(self.points[1].price) * r;
            const p3x = ctx.timeScale.indexToX(self.points[2].time) * r;
            const p3y = ctx.priceScale.priceToY(self.points[2].price) * r;

            const mx = (p2x + p3x) / 2;
            const my = (p2y + p3y) / 2;
            const dx = mx - px;
            const dy = my - py;

            const medEndX = px + dx * 2;
            const medEndY = py + dy * 2;
            const upperEndX = p2x + dx;
            const upperEndY = p2y + dy;
            const lowerEndX = p3x + dx;
            const lowerEndY = p3y + dy;

            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            // Median line
            c.beginPath();
            c.moveTo(px, py);
            c.lineTo(medEndX, medEndY);
            c.stroke();

            // Upper tine
            c.beginPath();
            c.moveTo(p2x, p2y);
            c.lineTo(upperEndX, upperEndY);
            c.stroke();

            // Lower tine
            c.beginPath();
            c.moveTo(p3x, p3y);
            c.lineTo(lowerEndX, lowerEndY);
            c.stroke();

            // Selection handles
            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(px - hs, py - hs, hs * 2, hs * 2);
              c.fillRect(p2x - hs, p2y - hs, hs * 2, hs * 2);
              c.fillRect(p3x - hs, p3y - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createPitchfork(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): PitchforkDrawing {
  return new PitchforkDrawing(id, points, options);
}
