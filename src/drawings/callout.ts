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

const PADDING = 6;
const BG_ALPHA = 0.88;
const ARROW_HEAD_SIZE = 8;

/**
 * Callout: a text label connected by an arrow to a specific bar/price point.
 * Points: p1 = target (arrow tip), p2 = label anchor (text box position).
 */
export class CalloutDrawing extends BaseDrawing {
  readonly drawingType = 'callout';
  readonly requiredPoints = 2;

  private _bbox: { x: number; y: number; w: number; h: number } | null = null;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, { fontSize: 13, text: 'Note', ...options });
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const tx = ctx.timeScale.indexToX(this.points[0].time);
    const ty = ctx.priceScale.priceToY(this.points[0].price);
    const lx = ctx.timeScale.indexToX(this.points[1].time);
    const ly = ctx.priceScale.priceToY(this.points[1].price);

    // Target handle
    if (Math.hypot(x - tx, y - ty) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    // Label handle
    if (Math.hypot(x - lx, y - ly) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }

    // Label bounding box
    if (this._bbox) {
      const { x: bx, y: by, w, h } = this._bbox;
      if (pointInRect(x, y, bx, by, bx + w, by + h)) {
        return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
      }
    }

    // Arrow line
    if (distToSegment(x, y, tx, ty, lx, ly) < HIT_THRESHOLD) {
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
            const text = self.options.text ?? 'Note';
            const fontSize = self.options.fontSize ?? 13;
            const color = self.options.color ?? '#2196F3';
            const fillColor = self.options.fillColor ?? '#1a1a2e';

            // Target point (arrow tip)
            const tx = ctx.timeScale.indexToX(self.points[0].time) * r;
            const ty = ctx.priceScale.priceToY(self.points[0].price) * r;
            // Label anchor
            const lx = ctx.timeScale.indexToX(self.points[1].time) * r;
            const ly = ctx.priceScale.priceToY(self.points[1].price) * r;

            c.save();
            c.font = `${fontSize * r}px sans-serif`;
            const metrics = c.measureText(text);
            const textW = metrics.width;
            const textH = fontSize * r;
            const pad = PADDING * r;

            const boxW = textW + pad * 2;
            const boxH = textH + pad * 2;
            const boxX = lx - boxW / 2;
            const boxY = ly - boxH / 2;

            // Update bbox in CSS pixels for hit-testing
            self._bbox = {
              x: (lx - boxW / 2) / r,
              y: (ly - boxH / 2) / r,
              w: boxW / r,
              h: boxH / r,
            };

            // --- Draw arrow from label border to target ---
            // Find the closest point on the label box edge toward the target
            const clampX = Math.max(boxX, Math.min(lx + boxW / 2, tx));
            const clampY = Math.max(boxY, Math.min(ly + boxH / 2, ty));

            const angle = Math.atan2(ty - ly, tx - lx);
            const arrowLen = ARROW_HEAD_SIZE * r;

            // Arrow shaft
            c.strokeStyle = color;
            c.lineWidth = (self.options.lineWidth ?? 1.5) * r;
            c.setLineDash([]);
            c.beginPath();
            c.moveTo(clampX, clampY);
            c.lineTo(tx, ty);
            c.stroke();

            // Arrowhead at target
            c.fillStyle = color;
            c.beginPath();
            c.moveTo(tx, ty);
            c.lineTo(
              tx - arrowLen * Math.cos(angle - Math.PI / 6),
              ty - arrowLen * Math.sin(angle - Math.PI / 6),
            );
            c.lineTo(
              tx - arrowLen * Math.cos(angle + Math.PI / 6),
              ty - arrowLen * Math.sin(angle + Math.PI / 6),
            );
            c.closePath();
            c.fill();

            // --- Draw label box ---
            c.globalAlpha = BG_ALPHA;
            c.fillStyle = fillColor;
            c.beginPath();
            const cornerR = 3 * r;
            c.roundRect(boxX, boxY, boxW, boxH, cornerR);
            c.fill();
            c.globalAlpha = 1;

            // Box border
            c.strokeStyle = color;
            c.lineWidth = r;
            c.beginPath();
            c.roundRect(boxX, boxY, boxW, boxH, cornerR);
            c.stroke();

            // Text
            c.fillStyle = color;
            c.textBaseline = 'middle';
            c.textAlign = 'center';
            c.fillText(text, lx, ly);
            c.textAlign = 'start';

            // Selection handles
            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(tx - hs, ty - hs, hs * 2, hs * 2);
              c.fillRect(lx - hs, ly - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createCallout(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): CalloutDrawing {
  return new CalloutDrawing(id, points, options);
}
