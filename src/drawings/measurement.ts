import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  distToSegment,
  pointInRect,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const LABEL_PADDING_X = 8;
const LABEL_PADDING_Y = 5;

export class MeasurementDrawing extends BaseDrawing {
  readonly drawingType = 'measurement';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  private _buildLabel(): string {
    if (this.points.length < 2) return '';
    const priceChange = this.points[1].price - this.points[0].price;
    const pct = this.points[0].price !== 0
      ? (priceChange / this.points[0].price) * 100
      : 0;
    const barCount = Math.abs(this.points[1].time - this.points[0].time);
    const sign = priceChange >= 0 ? '+' : '';
    return `${sign}${priceChange.toFixed(2)} (${sign}${pct.toFixed(1)}%) ${barCount} bars`;
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

    // Hit on connector line
    if (distToSegment(x, y, x1, y1, x2, y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }

    // Approximate label area at midpoint
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    if (pointInRect(x, y, mx - 60, my - 28, mx + 60, my)) {
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

            c.save();

            // Dashed connector line
            c.strokeStyle = color;
            c.lineWidth = lw;
            c.setLineDash([6 * r, 4 * r]);
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();
            c.setLineDash([]);

            // Label at midpoint
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const text = self._buildLabel();
            const fontSize = (self.options.fontSize ?? 11) * r;
            c.font = `${fontSize}px sans-serif`;
            const textW = c.measureText(text).width;
            const padX = LABEL_PADDING_X * r;
            const padY = LABEL_PADDING_Y * r;
            const boxW = textW + padX * 2;
            const boxH = fontSize + padY * 2;
            const boxX = mx - boxW / 2;
            const boxY = my - boxH - 4 * r;
            const cornerR = 4 * r;

            // Rounded rect background
            c.fillStyle = color;
            c.globalAlpha = 0.85;
            c.beginPath();
            c.moveTo(boxX + cornerR, boxY);
            c.lineTo(boxX + boxW - cornerR, boxY);
            c.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + cornerR, cornerR);
            c.lineTo(boxX + boxW, boxY + boxH - cornerR);
            c.arcTo(boxX + boxW, boxY + boxH, boxX + boxW - cornerR, boxY + boxH, cornerR);
            c.lineTo(boxX + cornerR, boxY + boxH);
            c.arcTo(boxX, boxY + boxH, boxX, boxY + boxH - cornerR, cornerR);
            c.lineTo(boxX, boxY + cornerR);
            c.arcTo(boxX, boxY, boxX + cornerR, boxY, cornerR);
            c.closePath();
            c.fill();

            // White text
            c.globalAlpha = 1;
            c.fillStyle = '#ffffff';
            c.textBaseline = 'top';
            c.fillText(text, boxX + padX, boxY + padY);

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

export function createMeasurement(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): MeasurementDrawing {
  return new MeasurementDrawing(id, points, options);
}
