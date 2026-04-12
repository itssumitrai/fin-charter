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

// Gann Fan angles: [angle in degrees, label]
const GANN_ANGLES: Array<[number, string]> = [
  [75.96, '4x1'],
  [63.43, '2x1'],
  [45,    '1x1'],
  [26.57, '1x2'],
  [14.04, '1x4'],
];

export class GannFanDrawing extends BaseDrawing {
  readonly drawingType = 'gann-fan';
  readonly requiredPoints = 1;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 1) return null;

    const ax = ctx.timeScale.indexToX(this.points[0].time);
    const ay = ctx.priceScale.priceToY(this.points[0].price);

    if (Math.hypot(x - ax, y - ay) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }

    const lines = this._getFanEndpoints(ax, ay, ctx.chartWidth, ctx.chartHeight);
    for (const { x2, y2 } of lines) {
      if (distToSegment(x, y, ax, ay, x2, y2) < HIT_THRESHOLD) {
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
        if (!ctx || self.points.length < 1) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r, width: w, height: h } = target;
            const ax = ctx.timeScale.indexToX(self.points[0].time) * r;
            const ay = ctx.priceScale.priceToY(self.points[0].price) * r;
            const color = self.options.color ?? '#FF6D00';
            const lw = (self.options.lineWidth ?? 1) * r;
            const showLabels = self.options.showLabels !== false;
            const fontSize = (self.options.fontSize ?? 10) * r;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.fillStyle = color;
            c.font = `${fontSize}px sans-serif`;
            c.textBaseline = 'top';

            const lines = self._getFanEndpoints(ax / r, ay / r, w / r, h / r);
            for (const { x2, y2, label } of lines) {
              const ex = x2 * r;
              const ey = y2 * r;
              c.beginPath();
              c.moveTo(ax, ay);
              c.lineTo(ex, ey);
              c.stroke();
              if (showLabels) {
                c.fillText(label, ex - 24 * r, ey + 2 * r);
              }
            }

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(ax - hs, ay - hs, hs * 2, hs * 2);
            }

            c.restore();
          },
        };
      },
    };
  }

  /** Compute far endpoint for each fan line given the anchor in CSS pixel coords. */
  _getFanEndpoints(
    ax: number,
    ay: number,
    width: number,
    height: number,
  ): Array<{ x2: number; y2: number; label: string }> {
    return GANN_ANGLES.map(([deg, label]) => {
      const rad = (deg * Math.PI) / 180;
      const dx = width - ax;
      const dy = Math.tan(rad) * dx;
      return { x2: ax + dx, y2: ay + dy, label };
    });
  }
}

export function createGannFan(
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): GannFanDrawing {
  return new GannFanDrawing(id, points, options);
}
