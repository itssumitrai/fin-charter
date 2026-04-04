import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface ColoredMountainRendererOptions {
  upColor: string;
  downColor: string;
  upFillColor: string;
  downFillColor: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: ColoredMountainRendererOptions = {
  upColor: '#22AB94',
  downColor: '#F7525F',
  upFillColor: 'rgba(34, 171, 148, 0.28)',
  downFillColor: 'rgba(247, 82, 95, 0.28)',
  lineWidth: 2,
};

/**
 * ColoredMountainRenderer — like AreaRenderer but the line and fill are coloured
 * per-segment based on close-price direction. Up segments use upColor/upFillColor,
 * down segments use downColor/downFillColor.
 */
export class ColoredMountainRenderer {
  private _options: ColoredMountainRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<ColoredMountainRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
  ): void {
    const { context: ctx, pixelRatio: pr, height } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx >= toIdx || store.length === 0) return;

    const opts = this._options;
    const lw = opts.lineWidth * pr;
    const bottomY = Math.round(height * pr);

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

      const isUp = store.close[i] >= store.close[i - 1];
      const fillColor = isUp ? opts.upFillColor : opts.downFillColor;
      const lineColor = isUp ? opts.upColor : opts.downColor;

      // Fill between the segment and the chart bottom.
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1, bottomY);
      ctx.lineTo(x0, bottomY);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Stroke the line segment.
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = lineColor;
      ctx.stroke();
    }

    ctx.restore();
  }
}
