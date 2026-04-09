import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface StepLineRendererOptions {
  color: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: StepLineRendererOptions = {
  color: '#2196F3',
  lineWidth: 2,
};

/**
 * StepLineRenderer — draws a close-price step line (horizontal-then-vertical)
 * over the visible bar range.
 */
export class StepLineRenderer {
  private _options: StepLineRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<StepLineRendererOptions>): void {
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

    if (fromIdx > toIdx || store.length === 0) return;

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
        // Horizontal to new X at previous Y, then vertical to new Y.
        ctx.lineTo(x, Math.round(priceToY(store.close[i - 1]) * pr));
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }
}
