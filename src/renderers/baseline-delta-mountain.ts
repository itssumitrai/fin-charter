import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface BaselineDeltaMountainRendererOptions {
  basePrice: number;
  topLineColor: string;
  topFillColor: string;
  bottomLineColor: string;
  bottomFillColor: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: BaselineDeltaMountainRendererOptions = {
  basePrice: 0,
  topLineColor: '#22AB94',
  topFillColor: 'rgba(34, 171, 148, 0.56)',
  bottomLineColor: '#F7525F',
  bottomFillColor: 'rgba(247, 82, 95, 0.56)',
  lineWidth: 2,
};

/**
 * BaselineDeltaMountainRenderer — like BaselineRenderer but with solid gradient
 * fills instead of flat semi-transparent colour.
 *
 * Above baseline: gradient from topFillColor (at the line) fading to transparent
 * at the baseline.  Below baseline: gradient from transparent at the baseline
 * fading to bottomFillColor at the line.
 */
export class BaselineDeltaMountainRenderer {
  private _options: BaselineDeltaMountainRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<BaselineDeltaMountainRendererOptions>): void {
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

    if (fromIdx >= toIdx || store.length === 0) return;

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

    // ── Helper to draw gradient fill clipped above or below the baseline ──

    const drawGradientFill = (fillColor: string, above: boolean): void => {
      ctx.save();

      // Clip to the region above or below the baseline.
      ctx.beginPath();
      if (above) {
        ctx.rect(0, 0, width * pr, baselineY);
      } else {
        ctx.rect(0, baselineY, width * pr, target.height * pr - baselineY);
      }
      ctx.clip();

      // Find the extreme Y in this region for the gradient range.
      let extremeY = baselineY;
      for (let k = 0; k < points.length; k++) {
        if (above) {
          extremeY = Math.min(extremeY, points[k].y);
        } else {
          extremeY = Math.max(extremeY, points[k].y);
        }
      }

      // Build gradient: colour at the line, transparent at the baseline.
      const gradient = ctx.createLinearGradient(0, extremeY, 0, baselineY);
      if (above) {
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, fillColor);
      }

      // Trace the close-price path, then close back along the baseline.
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let k = 1; k < points.length; k++) ctx.lineTo(points[k].x, points[k].y);
      ctx.lineTo(points[points.length - 1].x, baselineY);
      ctx.lineTo(points[0].x, baselineY);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.restore();
    };

    drawGradientFill(opts.topFillColor, true);
    drawGradientFill(opts.bottomFillColor, false);

    // ── Helper to clip the line stroke to above or below the baseline ────

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

    // ── Dashed baseline ──────────────────────────────────────────────────
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
