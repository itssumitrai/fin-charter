import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface ColumnRendererOptions {
  upColor: string;
  downColor: string;
}

const DEFAULT_OPTIONS: ColumnRendererOptions = {
  upColor: '#00E396',
  downColor: '#FF3B5C',
};

/**
 * ColumnRenderer — draws vertical bars from the chart bottom up to the close
 * price, coloured by whether close >= open.
 */
export class ColumnRenderer {
  private _options: ColumnRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<ColumnRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
    barWidth?: number,
  ): void {
    const { context: ctx, pixelRatio: pr, height } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx > toIdx || store.length === 0) return;

    const { upColor, downColor } = this._options;
    const bottomY = Math.round(height * pr);
    const halfBar = Math.max(1, Math.round(((barWidth ?? 6) * pr) / 2));

    ctx.save();
    ctx.setLineDash([]);

    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const x = Math.round(indexToX(i) * pr);
      const yClose = Math.round(priceToY(store.close[i]) * pr);
      const isUp = store.close[i] >= store.open[i];

      ctx.fillStyle = isUp ? upColor : downColor;
      ctx.fillRect(x - halfBar, yClose, halfBar * 2, bottomY - yClose);
    }

    ctx.restore();
  }
}
