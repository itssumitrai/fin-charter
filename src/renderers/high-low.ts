import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface HighLowRendererOptions {
  color: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: HighLowRendererOptions = {
  color: '#2196F3',
  lineWidth: 1,
};

/**
 * HighLowRenderer — draws simple vertical lines from high to low for each bar,
 * without open/close tick marks.
 */
export class HighLowRenderer {
  private _options: HighLowRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<HighLowRendererOptions>): void {
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

    const { color, lineWidth } = this._options;
    const lw = lineWidth * pr;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'butt';
    ctx.setLineDash([]);

    ctx.beginPath();
    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const x = Math.round(indexToX(i) * pr);
      const yHigh = Math.round(priceToY(store.high[i]) * pr);
      const yLow = Math.round(priceToY(store.low[i]) * pr);
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
    }
    ctx.stroke();

    ctx.restore();
  }
}
