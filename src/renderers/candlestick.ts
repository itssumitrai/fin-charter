import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface CandlestickRendererOptions {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  borderUpColor: string;
  borderDownColor: string;
}

const DEFAULT_OPTIONS: CandlestickRendererOptions = {
  upColor: '#00E396',
  downColor: '#FF3B5C',
  wickUpColor: '#00E396',
  wickDownColor: '#FF3B5C',
  borderUpColor: '#00E396',
  borderDownColor: '#FF3B5C',
};

/**
 * CandlestickRenderer — draws OHLC candles with body and wick rectangles.
 *
 * All pixel coordinates are multiplied by `target.pixelRatio` and rounded to
 * integers for crisp HiDPI rendering.
 */
export class CandlestickRenderer {
  private _options: CandlestickRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<CandlestickRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  options(): CandlestickRendererOptions {
    return { ...this._options };
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

    // Physical half-width of the candle body (at least 1 physical pixel).
    const halfBody = Math.max(1, Math.round((barWidth * pr) / 2));
    // Wick width: 1 physical pixel.
    const wickWidth = Math.max(1, Math.round(pr));

    ctx.save();

    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const open = store.open[i];
      const close = store.close[i];
      const high = store.high[i];
      const low = store.low[i];
      const isUp = close >= open;

      const bodyColor = isUp ? opts.upColor : opts.downColor;
      const wickColor = isUp ? opts.wickUpColor : opts.wickDownColor;
      const borderColor = isUp ? opts.borderUpColor : opts.borderDownColor;

      const cx = Math.round(indexToX(i) * pr);
      const openY = Math.round(priceToY(open) * pr);
      const closeY = Math.round(priceToY(close) * pr);
      const highY = Math.round(priceToY(high) * pr);
      const lowY = Math.round(priceToY(low) * pr);

      // ── Wick ──────────────────────────────────────────────────────────────
      ctx.fillStyle = wickColor;
      ctx.fillRect(cx - Math.floor(wickWidth / 2), highY, wickWidth, lowY - highY);

      // ── Body ──────────────────────────────────────────────────────────────
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - halfBody, bodyTop, halfBody * 2, bodyHeight);

      // ── Body border ───────────────────────────────────────────────────────
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = wickWidth;
      ctx.strokeRect(cx - halfBody + 0.5, bodyTop + 0.5, halfBody * 2 - 1, bodyHeight - 1);
    }

    ctx.restore();
  }
}
