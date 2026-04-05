import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface HLCAreaRendererOptions {
  highLineColor: string;
  lowLineColor: string;
  fillColor: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: HLCAreaRendererOptions = {
  highLineColor: '#00E396',
  lowLineColor: '#FF3B5C',
  fillColor: 'rgba(33, 150, 243, 0.2)',
  lineWidth: 2,
};

/**
 * HLCAreaRenderer — draws two polylines (high and low prices) with a filled
 * area between them.
 */
export class HLCAreaRenderer {
  private _options: HLCAreaRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<HLCAreaRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
  ): void {
    const { context: ctx, pixelRatio: pr } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx >= toIdx || store.length === 0) return;

    const opts = this._options;
    const lw = opts.lineWidth * pr;

    // Build pixel-level point arrays for high and low.
    const highPts: Array<{ x: number; y: number }> = [];
    const lowPts: Array<{ x: number; y: number }> = [];
    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const x = Math.round(indexToX(i) * pr);
      highPts.push({ x, y: Math.round(priceToY(store.high[i]) * pr) });
      lowPts.push({ x, y: Math.round(priceToY(store.low[i]) * pr) });
    }
    if (highPts.length === 0) return;

    ctx.save();

    // ── Filled area between high and low ─────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(highPts[0].x, highPts[0].y);
    for (let i = 1; i < highPts.length; i++) {
      ctx.lineTo(highPts[i].x, highPts[i].y);
    }
    // Trace the low line in reverse to close the shape.
    for (let i = lowPts.length - 1; i >= 0; i--) {
      ctx.lineTo(lowPts[i].x, lowPts[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = opts.fillColor;
    ctx.fill();

    // ── High line ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(highPts[0].x, highPts[0].y);
    for (let i = 1; i < highPts.length; i++) {
      ctx.lineTo(highPts[i].x, highPts[i].y);
    }
    ctx.strokeStyle = opts.highLineColor;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.stroke();

    // ── Low line ─────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(lowPts[0].x, lowPts[0].y);
    for (let i = 1; i < lowPts.length; i++) {
      ctx.lineTo(lowPts[i].x, lowPts[i].y);
    }
    ctx.strokeStyle = opts.lowLineColor;
    ctx.lineWidth = lw;
    ctx.stroke();

    ctx.restore();
  }
}
