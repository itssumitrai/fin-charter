import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import { BaseDrawing, HIT_THRESHOLD, type AnchorPoint, type DrawingOptions, type DrawingHitTestResult } from './base';

export class CycleLinesDrawing extends BaseDrawing {
  readonly drawingType = 'cycle-lines';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const interval = x2 - x1;
    if (interval === 0) return null;

    const chartWidth = ctx.chartWidth;
    // Find nearest cycle line
    const offset = ((x - x1) % interval + interval) % interval;
    const nearestX = x - offset;

    // Check all cycle lines that are within chart bounds
    for (let cx = x1 % interval === 0 ? 0 : x1 - Math.floor(x1 / interval) * interval; cx <= chartWidth; cx += Math.abs(interval)) {
      if (Math.abs(x - cx) < HIT_THRESHOLD) {
        return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
      }
    }

    // Also check in a simpler way: distance from cursor to nearest cycle line
    void nearestX;
    const distToNearest = Math.min(offset, Math.abs(interval) - offset);
    if (distToNearest < HIT_THRESHOLD) {
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
            const x1 = ctx.timeScale.indexToX(self.points[0].time);
            const x2 = ctx.timeScale.indexToX(self.points[1].time);
            const interval = x2 - x1;
            if (interval === 0) return;

            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;
            const chartWidth = ctx.chartWidth;
            const chartHeight = ctx.chartHeight;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            c.globalAlpha = 0.6;

            // Draw vertical lines at interval spacing, starting from x1, extending both directions
            const absInterval = Math.abs(interval);
            // Start from x1, go right
            for (let cx = x1; cx <= chartWidth; cx += absInterval) {
              c.beginPath();
              c.moveTo(cx * r, 0);
              c.lineTo(cx * r, chartHeight * r);
              c.stroke();
            }
            // Go left from x1
            for (let cx = x1 - absInterval; cx >= 0; cx -= absInterval) {
              c.beginPath();
              c.moveTo(cx * r, 0);
              c.lineTo(cx * r, chartHeight * r);
              c.stroke();
            }

            if (self.selected) {
              c.globalAlpha = 1;
              c.fillStyle = color;
              const hs = 4 * r;
              const px1 = x1 * r;
              const px2 = x2 * r;
              const midY = (chartHeight / 2) * r;
              c.fillRect(px1 - hs, midY - hs, hs * 2, hs * 2);
              c.fillRect(px2 - hs, midY - hs, hs * 2, hs * 2);
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createCycleLines(id: string, points: AnchorPoint[], options: DrawingOptions): CycleLinesDrawing {
  return new CycleLinesDrawing(id, points, options);
}
