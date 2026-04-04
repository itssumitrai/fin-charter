import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface HistogramRendererOptions {
  upColor: string;
  downColor: string;
}

const DEFAULT_OPTIONS: HistogramRendererOptions = {
  upColor: 'rgba(34, 171, 148, 0.5)',
  downColor: 'rgba(247, 82, 95, 0.5)',
};

/**
 * HistogramRenderer — draws vertical bars from the bottom of the pane,
 * coloured by whether close >= open (up) or close < open (down).
 *
 * Typical use-case: volume histogram overlay.
 */
export class HistogramRenderer {
  private _options: HistogramRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<HistogramRendererOptions>): void {
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
    const { context: ctx, pixelRatio: pr, height } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx >= toIdx || store.length === 0) return;

    const opts = this._options;
    const halfBar = Math.max(1, Math.round((barWidth * pr) / 2));
    const bottomY = Math.round(height * pr);

    ctx.save();

    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const close = store.close[i];
      const open = store.open[i];
      const isUp = close >= open;

      ctx.fillStyle = isUp ? opts.upColor : opts.downColor;

      const cx = Math.round(indexToX(i) * pr);
      const topY = Math.round(priceToY(close) * pr);
      const barH = Math.max(1, bottomY - topY);

      ctx.fillRect(cx - halfBar, topY, halfBar * 2, barH);
    }

    ctx.restore();
  }
}
