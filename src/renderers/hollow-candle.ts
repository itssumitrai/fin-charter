import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface HollowCandleRendererOptions {
  upColor: string;
  downColor: string;
  wickColor: string;
}

const DEFAULT_OPTIONS: HollowCandleRendererOptions = {
  upColor: '#00E396',
  downColor: '#FF3B5C',
  wickColor: '#737375',
};

/**
 * HollowCandleRenderer — draws candles where:
 * - Up candles (close >= open) are hollow: only the border is drawn (stroke).
 * - Down candles are filled.
 *
 * The wick is always drawn as a thin filled rectangle.
 */
export class HollowCandleRenderer {
  private _options: HollowCandleRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<HollowCandleRendererOptions>): void {
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
    const halfBody = Math.max(1, Math.round((barWidth * pr) / 2));
    const wickWidth = Math.max(1, Math.round(pr));
    const borderWidth = Math.max(1, Math.round(pr));

    ctx.save();

    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const open = store.open[i];
      const close = store.close[i];
      const high = store.high[i];
      const low = store.low[i];
      const isUp = close >= open;

      const color = isUp ? opts.upColor : opts.downColor;

      const cx = Math.round(indexToX(i) * pr);
      const openY = Math.round(priceToY(open) * pr);
      const closeY = Math.round(priceToY(close) * pr);
      const highY = Math.round(priceToY(high) * pr);
      const lowY = Math.round(priceToY(low) * pr);

      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      // ── Wick ──────────────────────────────────────────────────────────────
      ctx.fillStyle = opts.wickColor;
      ctx.fillRect(cx - Math.floor(wickWidth / 2), highY, wickWidth, lowY - highY);

      if (isUp) {
        // Hollow: stroke only.
        ctx.strokeStyle = color;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(
          cx - halfBody + borderWidth / 2,
          bodyTop + borderWidth / 2,
          halfBody * 2 - borderWidth,
          bodyHeight - borderWidth,
        );
      } else {
        // Filled.
        ctx.fillStyle = color;
        ctx.fillRect(cx - halfBody, bodyTop, halfBody * 2, bodyHeight);
      }
    }

    ctx.restore();
  }
}
