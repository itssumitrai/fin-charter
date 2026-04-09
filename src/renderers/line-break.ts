import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface LineBreakRendererOptions {
  breakCount: number;
  upColor: string;
  downColor: string;
}

const DEFAULT_OPTIONS: LineBreakRendererOptions = {
  breakCount: 3,
  upColor: '#00E396',
  downColor: '#FF3B5C',
};

interface LineBreakBlock {
  /** Source bar index that generated this block. */
  sourceIndex: number;
  /** Open price (previous block's close). */
  open: number;
  /** Close price (current close). */
  close: number;
  /** True = up block, false = down block. */
  isUp: boolean;
}

/**
 * LineBreakRenderer — draws Three Line Break (or N-Line Break) chart.
 *
 * Each block opens at the previous close and closes at the current close.
 * A new block is only drawn when the current close breaks above the highest
 * high or below the lowest low of the last N blocks. This filters out minor
 * price fluctuations.
 */
export class LineBreakRenderer {
  private _options: LineBreakRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<LineBreakRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  private _buildBlocks(store: ColumnStore, fromIdx: number, toIdx: number): LineBreakBlock[] {
    const breakCount = Number.isFinite(this._options.breakCount)
      ? Math.max(1, Math.floor(this._options.breakCount))
      : DEFAULT_OPTIONS.breakCount;
    const end = Math.min(toIdx, store.length - 1);
    if (fromIdx > end) return [];

    const blocks: LineBreakBlock[] = [];

    // The first block is always created from the first two bars.
    if (fromIdx === end) return blocks;

    let prevClose = store.close[fromIdx];

    for (let i = fromIdx + 1; i <= end; i++) {
      const close = store.close[i];
      if (close === prevClose) continue; // No movement, skip.

      if (blocks.length === 0) {
        // Always create the first block.
        blocks.push({
          sourceIndex: i,
          open: prevClose,
          close,
          isUp: close > prevClose,
        });
        prevClose = close;
        continue;
      }

      // Determine the highest high and lowest low of the last N blocks.
      const lookback = Math.min(breakCount, blocks.length);
      let highestHigh = -Infinity;
      let lowestLow = Infinity;

      for (let b = blocks.length - lookback; b < blocks.length; b++) {
        const block = blocks[b];
        const blockHigh = Math.max(block.open, block.close);
        const blockLow = Math.min(block.open, block.close);
        if (blockHigh > highestHigh) highestHigh = blockHigh;
        if (blockLow < lowestLow) lowestLow = blockLow;
      }

      const lastBlock = blocks[blocks.length - 1];

      if (lastBlock.isUp) {
        // In an up trend:
        // - Continue up if close > highest high of last N
        // - Reverse down if close < lowest low of last N
        if (close > highestHigh) {
          blocks.push({
            sourceIndex: i,
            open: prevClose,
            close,
            isUp: true,
          });
          prevClose = close;
        } else if (close < lowestLow) {
          blocks.push({
            sourceIndex: i,
            open: prevClose,
            close,
            isUp: false,
          });
          prevClose = close;
        }
        // Otherwise, no block drawn (close is within the range).
      } else {
        // In a down trend:
        // - Continue down if close < lowest low of last N
        // - Reverse up if close > highest high of last N
        if (close < lowestLow) {
          blocks.push({
            sourceIndex: i,
            open: prevClose,
            close,
            isUp: false,
          });
          prevClose = close;
        } else if (close > highestHigh) {
          blocks.push({
            sourceIndex: i,
            open: prevClose,
            close,
            isUp: true,
          });
          prevClose = close;
        }
      }
    }

    return blocks;
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

    if (fromIdx > toIdx || store.length === 0) return;

    const opts = this._options;
    const blocks = this._buildBlocks(store, fromIdx, toIdx);
    if (blocks.length === 0) return;

    const halfBody = Math.max(1, Math.round((barWidth * pr) / 2));
    const borderWidth = Math.max(1, Math.round(pr));

    ctx.save();

    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      const cx = Math.round(indexToX(block.sourceIndex) * pr);
      const openY = Math.round(priceToY(block.open) * pr);
      const closeY = Math.round(priceToY(block.close) * pr);

      const top = Math.min(openY, closeY);
      const bottom = Math.max(openY, closeY);
      const height = Math.max(1, bottom - top);

      // Fill the block body (no wicks, unlike candlesticks).
      ctx.fillStyle = block.isUp ? opts.upColor : opts.downColor;
      ctx.fillRect(cx - halfBody, top, halfBody * 2, height);

      // Border for definition.
      ctx.strokeStyle = block.isUp ? opts.upColor : opts.downColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(cx - halfBody + 0.5, top + 0.5, halfBody * 2 - 1, height - 1);
    }

    ctx.restore();
  }
}
