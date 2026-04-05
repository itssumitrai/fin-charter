import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface ColoredLineRendererOptions {
  upColor: string;
  downColor: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: ColoredLineRendererOptions = {
  upColor: '#00E396',
  downColor: '#FF3B5C',
  lineWidth: 2,
};

/**
 * ColoredLineRenderer — draws a close-price polyline where each segment is
 * coloured green (upColor) when price rises and red (downColor) when it falls.
 */
export class ColoredLineRenderer {
  private _options: ColoredLineRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<ColoredLineRendererOptions>): void {
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

    const { upColor, downColor, lineWidth } = this._options;
    const lw = lineWidth * pr;

    ctx.save();
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);

    for (let i = Math.max(fromIdx, 1); i <= toIdx && i < store.length; i++) {
      const x0 = Math.round(indexToX(i - 1) * pr);
      const y0 = Math.round(priceToY(store.close[i - 1]) * pr);
      const x1 = Math.round(indexToX(i) * pr);
      const y1 = Math.round(priceToY(store.close[i]) * pr);

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = store.close[i] >= store.close[i - 1] ? upColor : downColor;
      ctx.stroke();
    }

    ctx.restore();
  }
}
