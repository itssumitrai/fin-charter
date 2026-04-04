import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface VolumeCandleRendererOptions {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  maxBarWidthMultiplier: number;
}

const DEFAULT_OPTIONS: VolumeCandleRendererOptions = {
  upColor: '#22AB94',
  downColor: '#F7525F',
  wickUpColor: '#22AB94',
  wickDownColor: '#F7525F',
  maxBarWidthMultiplier: 3,
};

/**
 * VolumeCandleRenderer — like CandlestickRenderer but the candle body width
 * varies based on volume relative to the maximum volume in the visible range.
 *
 * Width = baseBarWidth * (volume / maxVolume) * maxBarWidthMultiplier,
 * with a minimum of 1 physical pixel.  Wicks are always 1px wide.
 */
export class VolumeCandleRenderer {
  private _options: VolumeCandleRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<VolumeCandleRendererOptions>): void {
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

    // Wick width: 1 physical pixel.
    const wickWidth = Math.max(1, Math.round(pr));

    // Find max volume in visible range.
    let maxVolume = 0;
    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      if (store.volume[i] > maxVolume) maxVolume = store.volume[i];
    }
    // Guard against division by zero when all volumes are 0.
    if (maxVolume === 0) maxVolume = 1;

    ctx.save();

    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const open = store.open[i];
      const close = store.close[i];
      const high = store.high[i];
      const low = store.low[i];
      const volume = store.volume[i];
      const isUp = close >= open;

      const bodyColor = isUp ? opts.upColor : opts.downColor;
      const wickColor = isUp ? opts.wickUpColor : opts.wickDownColor;

      const cx = Math.round(indexToX(i) * pr);
      const openY = Math.round(priceToY(open) * pr);
      const closeY = Math.round(priceToY(close) * pr);
      const highY = Math.round(priceToY(high) * pr);
      const lowY = Math.round(priceToY(low) * pr);

      // Volume-scaled half-body width (at least 1 physical pixel).
      const scaledWidth = barWidth * (volume / maxVolume) * opts.maxBarWidthMultiplier;
      const halfBody = Math.max(1, Math.round((scaledWidth * pr) / 2));

      // ── Wick ──────────────────────────────────────────────────────────────
      ctx.fillStyle = wickColor;
      ctx.fillRect(cx - Math.floor(wickWidth / 2), highY, wickWidth, lowY - highY);

      // ── Body ──────────────────────────────────────────────────────────────
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = bodyColor;
      ctx.fillRect(cx - halfBody, bodyTop, halfBody * 2, bodyHeight);
    }

    ctx.restore();
  }
}
