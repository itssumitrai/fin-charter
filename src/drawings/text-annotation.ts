import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  pointInRect,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const PADDING = 4;
const BG_ALPHA = 0.85;

export class TextAnnotationDrawing extends BaseDrawing {
  readonly drawingType = 'text-annotation';
  readonly requiredPoints = 1;

  // Cached bounding box in CSS pixels (updated each render)
  private _bbox: { x: number; y: number; w: number; h: number } | null = null;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, { fontSize: 14, text: '', ...options });
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    if (!this._bbox) return null;
    const { x: bx, y: by, w, h } = this._bbox;
    if (pointInRect(x, y, bx, by, bx + w, by + h)) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 1) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const text = self.options.text ?? '';
            if (!text) return;

            const fontSize = self.options.fontSize ?? 14;
            const anchorX = ctx.timeScale.indexToX(self.points[0].time);
            const anchorY = ctx.priceScale.priceToY(self.points[0].price);

            // Measure text in CSS pixels first
            c.save();
            c.font = `${fontSize * r}px sans-serif`;
            const metrics = c.measureText(text);
            const textW = metrics.width / r;
            const textH = fontSize;

            // Update bbox in CSS pixels for hit-testing
            self._bbox = {
              x: anchorX - PADDING,
              y: anchorY - textH - PADDING,
              w: textW + PADDING * 2,
              h: textH + PADDING * 2,
            };

            // Scaled coords
            const sx = anchorX * r;
            const sy = anchorY * r;
            const pad = PADDING * r;
            const bw = metrics.width + pad * 2;
            const bh = fontSize * r + pad * 2;

            // Background
            const color = self.options.color ?? '#2196F3';
            const fillColor = self.options.fillColor;
            if (fillColor) {
              c.globalAlpha = BG_ALPHA;
              c.fillStyle = fillColor;
              c.fillRect(sx - pad, sy - fontSize * r - pad, bw, bh);
              c.globalAlpha = 1;
            }

            // Text
            c.fillStyle = color;
            c.textBaseline = 'bottom';
            c.fillText(text, sx, sy);

            // Selection border
            if (self.selected) {
              c.strokeStyle = color;
              c.lineWidth = r;
              c.setLineDash([3 * r, 2 * r]);
              c.strokeRect(sx - pad, sy - fontSize * r - pad, bw, bh);
            }

            c.restore();
          },
        };
      },
    };
  }
}

export function createTextAnnotation(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): TextAnnotationDrawing {
  return new TextAnnotationDrawing(id, points, options);
}
