import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface BaselineRendererOptions {
  basePrice: number;
  topLineColor: string;
  topFillColor: string;
  bottomLineColor: string;
  bottomFillColor: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: BaselineRendererOptions = {
  basePrice: 0,
  topLineColor: '#00E396',
  topFillColor: 'rgba(0, 227, 150, 0.28)',
  bottomLineColor: '#FF3B5C',
  bottomFillColor: 'rgba(255, 59, 92, 0.28)',
  lineWidth: 2,
};

/**
 * BaselineRenderer — draws a close-price line coloured above/below a base price,
 * fills each region with a semi-transparent colour, and renders a dashed
 * horizontal baseline.
 */
export class BaselineRenderer {
  private _options: BaselineRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<BaselineRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
  ): void {
    const { context: ctx, pixelRatio: pr, width } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx > toIdx || store.length === 0) return;

    const opts = this._options;
    const baselineY = Math.round(priceToY(opts.basePrice) * pr);
    const lw = Math.max(1, opts.lineWidth * pr);

    // Build pixel-level point array.
    const points: Array<{ x: number; y: number }> = [];
    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      points.push({
        x: Math.round(indexToX(i) * pr),
        y: Math.round(priceToY(store.close[i]) * pr),
      });
    }
    if (points.length === 0) return;

    ctx.save();

    // ── Helper to clip fill to above or below the baseline ───────────────

    const drawFill = (color: string, above: boolean): void => {
      ctx.save();
      ctx.beginPath();
      if (above) {
        ctx.rect(0, 0, width * pr, baselineY);
      } else {
        ctx.rect(0, baselineY, width * pr, target.height * pr - baselineY);
      }
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let k = 1; k < points.length; k++) ctx.lineTo(points[k].x, points[k].y);
      ctx.lineTo(points[points.length - 1].x, baselineY);
      ctx.lineTo(points[0].x, baselineY);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    drawFill(opts.topFillColor, true);
    drawFill(opts.bottomFillColor, false);

    // ── Helper to clip the line stroke to above or below baseline ────────

    const drawLine = (color: string, above: boolean): void => {
      ctx.save();
      ctx.beginPath();
      if (above) {
        ctx.rect(0, 0, width * pr, baselineY);
      } else {
        ctx.rect(0, baselineY, width * pr, target.height * pr - baselineY);
      }
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let k = 1; k < points.length; k++) ctx.lineTo(points[k].x, points[k].y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();
    };

    drawLine(opts.topLineColor, true);
    drawLine(opts.bottomLineColor, false);

    // ── Dashed baseline ───────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(Math.round(width * pr), baselineY);
    ctx.strokeStyle = opts.topLineColor;
    ctx.lineWidth = Math.max(1, Math.round(pr));
    ctx.setLineDash([4 * pr, 4 * pr]);
    ctx.stroke();

    ctx.restore();
  }
}
