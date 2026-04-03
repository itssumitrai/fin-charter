import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface AreaRendererOptions {
  lineColor: string;
  lineWidth: number;
  topColor: string;
  bottomColor: string;
}

const DEFAULT_OPTIONS: AreaRendererOptions = {
  lineColor: '#2196F3',
  lineWidth: 2,
  topColor: 'rgba(33, 150, 243, 0.4)',
  bottomColor: 'rgba(33, 150, 243, 0)',
};

/**
 * AreaRenderer — draws a close-price line with a gradient fill from the line
 * down to the bottom of the pane.
 */
export class AreaRenderer {
  private _options: AreaRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<AreaRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
  ): void {
    const { context: ctx, pixelRatio: pr, height } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx >= toIdx || store.length === 0) return;

    const opts = this._options;
    const bottomY = Math.round(height * pr);

    // Build the close-price polyline.
    const points: Array<{ x: number; y: number }> = [];
    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      points.push({
        x: Math.round(indexToX(i) * pr),
        y: Math.round(priceToY(store.close[i]) * pr),
      });
    }
    if (points.length === 0) return;

    ctx.save();

    // ── Gradient fill ─────────────────────────────────────────────────────
    const minY = points.reduce((m, p) => Math.min(m, p.y), points[0].y);
    const gradient = ctx.createLinearGradient(0, minY, 0, bottomY);
    gradient.addColorStop(0, opts.topColor);
    gradient.addColorStop(1, opts.bottomColor);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    // Close the fill path down to the bottom edge.
    ctx.lineTo(points[points.length - 1].x, bottomY);
    ctx.lineTo(points[0].x, bottomY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // ── Line ─────────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = opts.lineColor;
    ctx.lineWidth = opts.lineWidth * pr;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.restore();
  }
}
