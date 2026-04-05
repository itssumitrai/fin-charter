import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface BarOHLCRendererOptions {
  upColor: string;
  downColor: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: BarOHLCRendererOptions = {
  upColor: '#00E396',
  downColor: '#FF3B5C',
  lineWidth: 1,
};

/**
 * BarOHLCRenderer — draws traditional OHLC bar charts:
 * - Vertical line from high to low
 * - Left horizontal tick for open
 * - Right horizontal tick for close
 */
export class BarOHLCRenderer {
  private _options: BarOHLCRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<BarOHLCRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
    barWidth: number,
  ): void {
    const { context: ctx, pixelRatio: pr } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx >= toIdx || store.length === 0) return;

    const opts = this._options;
    const tickLen = Math.max(2, Math.round((barWidth * pr) / 2));
    const lw = Math.max(1, Math.round(opts.lineWidth * pr));

    ctx.save();
    ctx.lineWidth = lw;

    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const open = store.open[i];
      const close = store.close[i];
      const high = store.high[i];
      const low = store.low[i];
      const isUp = close >= open;

      ctx.strokeStyle = isUp ? opts.upColor : opts.downColor;

      const cx = Math.round(indexToX(i) * pr);
      const openY = Math.round(priceToY(open) * pr);
      const closeY = Math.round(priceToY(close) * pr);
      const highY = Math.round(priceToY(high) * pr);
      const lowY = Math.round(priceToY(low) * pr);

      // Vertical high-low line.
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();

      // Left open tick.
      ctx.beginPath();
      ctx.moveTo(cx - tickLen, openY);
      ctx.lineTo(cx, openY);
      ctx.stroke();

      // Right close tick.
      ctx.beginPath();
      ctx.moveTo(cx, closeY);
      ctx.lineTo(cx + tickLen, closeY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
