import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface LineRendererOptions {
  color: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: LineRendererOptions = {
  color: '#2196F3',
  lineWidth: 2,
};

/**
 * LineRenderer — draws a close-price polyline over the visible bar range.
 *
 * Coordinates are multiplied by `target.pixelRatio` and rounded to integer
 * pixels so the line remains crisp on HiDPI displays.
 */
export class LineRenderer {
  private _options: LineRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<LineRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  options(): LineRendererOptions {
    return this._options;
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

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * pr;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);

    ctx.beginPath();

    let started = false;
    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const x = Math.round(indexToX(i) * pr);
      const y = Math.round(priceToY(store.close[i]) * pr);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }
}
