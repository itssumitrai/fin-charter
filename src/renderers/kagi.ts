import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface KagiRendererOptions {
  reversalAmount: number;
  yangColor: string;
  yinColor: string;
  yangWidth: number;
  yinWidth: number;
}

const DEFAULT_OPTIONS: KagiRendererOptions = {
  reversalAmount: 1,
  yangColor: '#00E396',
  yinColor: '#FF3B5C',
  yangWidth: 3,
  yinWidth: 1,
};

/** A single vertical segment of the Kagi chart. */
interface KagiSegment {
  /** Source bar index where this segment starts. */
  startIndex: number;
  /** Source bar index where this segment ends. */
  endIndex: number;
  /** Price at the start of the segment. */
  startPrice: number;
  /** Price at the end of the segment. */
  endPrice: number;
  /** True if yang (thick/bullish), false if yin (thin/bearish). */
  isYang: boolean;
}

/**
 * KagiRenderer — draws Kagi chart vertical lines with yang/yin thickness.
 *
 * Kagi charts emphasize trend direction using line thickness:
 * - Yang (thick, green) lines when price exceeds a previous high
 * - Yin (thin, red) lines when price drops below a previous low
 * - Horizontal connectors join segments on direction changes
 */
export class KagiRenderer {
  private _options: KagiRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<KagiRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  private _buildSegments(store: ColumnStore, fromIdx: number, toIdx: number): KagiSegment[] {
    const { reversalAmount } = this._options;
    const end = Math.min(toIdx, store.length - 1);
    if (fromIdx > end) return [];
    if (reversalAmount <= 0) return [];

    const segments: KagiSegment[] = [];

    // Track current direction: 1 = up, -1 = down
    let direction = 0;
    let currentPrice = store.close[fromIdx];
    let segStartIndex = fromIdx;
    let segStartPrice = currentPrice;

    // Track shoulder (previous high) and waist (previous low) for yang/yin transitions.
    let prevHigh = currentPrice;
    let prevLow = currentPrice;
    let isYang = true;

    for (let i = fromIdx + 1; i <= end; i++) {
      const close = store.close[i];

      if (direction === 0) {
        // Establish initial direction.
        const diff = close - currentPrice;
        if (Math.abs(diff) >= reversalAmount) {
          direction = diff > 0 ? 1 : -1;
          isYang = direction > 0;
          segments.push({
            startIndex: segStartIndex,
            endIndex: i,
            startPrice: segStartPrice,
            endPrice: close,
            isYang,
          });
          segStartIndex = i;
          segStartPrice = close;
          currentPrice = close;
          if (direction > 0) {
            prevHigh = close;
          } else {
            prevLow = close;
          }
        }
        continue;
      }

      const delta = close - currentPrice;
      const sameDirection = (direction > 0 && delta > 0) || (direction < 0 && delta < 0);

      if (sameDirection) {
        // Extend in same direction — update the current segment endpoint.
        currentPrice = close;
        // Update shoulder/waist.
        if (direction > 0) {
          if (close > prevHigh) {
            prevHigh = close;
            isYang = true; // broke above previous high -> yang
          }
        } else {
          if (close < prevLow) {
            prevLow = close;
            isYang = false; // broke below previous low -> yin
          }
        }
        // Update the last segment's endpoint instead of adding a new one.
        if (segments.length > 0) {
          const last = segments[segments.length - 1];
          last.endIndex = i;
          last.endPrice = close;
          last.isYang = isYang;
        }
      } else if (Math.abs(delta) >= reversalAmount) {
        // Reversal detected.
        // Record shoulder or waist from the current segment before reversing.
        if (direction > 0) {
          prevHigh = currentPrice;
        } else {
          prevLow = currentPrice;
        }

        direction = -direction;

        // Check yang/yin transition on reversal.
        if (direction > 0 && close > prevHigh) {
          isYang = true;
          prevHigh = close;
        } else if (direction < 0 && close < prevLow) {
          isYang = false;
          prevLow = close;
        }

        segments.push({
          startIndex: segStartIndex,
          endIndex: i,
          startPrice: segStartPrice,
          endPrice: close,
          isYang,
        });

        segStartIndex = i;
        segStartPrice = close;
        currentPrice = close;
      }
      // If reversal amount not reached, ignore this bar.
    }

    return segments;
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
    _barWidth: number,
  ): void {
    const { context: ctx, pixelRatio: pr } = target;
    const { fromIdx, toIdx } = range;

    if (fromIdx >= toIdx || store.length === 0) return;

    const opts = this._options;
    const segments = this._buildSegments(store, fromIdx, toIdx);
    if (segments.length === 0) return;

    ctx.save();
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s];
      const color = seg.isYang ? opts.yangColor : opts.yinColor;
      const width = (seg.isYang ? opts.yangWidth : opts.yinWidth) * pr;

      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      const x1 = Math.round(indexToX(seg.startIndex) * pr);
      const x2 = Math.round(indexToX(seg.endIndex) * pr);
      const y1 = Math.round(priceToY(seg.startPrice) * pr);
      const y2 = Math.round(priceToY(seg.endPrice) * pr);

      ctx.beginPath();

      // Kagi: each segment is a vertical line at the segment's end X position.
      // A horizontal connector bridges from the previous segment's X to this one.
      if (s > 0) {
        const prevSeg = segments[s - 1];
        const prevX = Math.round(indexToX(prevSeg.endIndex) * pr);
        // Horizontal connector at the start price level.
        ctx.moveTo(prevX, y1);
        ctx.lineTo(x2, y1);
      } else {
        ctx.moveTo(x2, y1);
      }

      // Vertical line from startPrice to endPrice at a single X.
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
