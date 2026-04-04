import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface PointFigureRendererOptions {
  boxSize: number;
  reversalBoxes: number;
  upColor: string;
  downColor: string;
}

const DEFAULT_OPTIONS: PointFigureRendererOptions = {
  boxSize: 1,
  reversalBoxes: 3,
  upColor: '#22AB94',
  downColor: '#F7525F',
};

/** A column of Xs (rising) or Os (falling). */
interface PFColumn {
  /** Source bar index where this column starts. */
  startIndex: number;
  /** Source bar index where this column ends. */
  endIndex: number;
  /** True = X column (rising), false = O column (falling). */
  isX: boolean;
  /** Lowest box level in this column (in box units = price / boxSize). */
  lowBox: number;
  /** Highest box level in this column (in box units). */
  highBox: number;
}

/**
 * PointFigureRenderer — draws Point & Figure chart with X and O columns.
 *
 * X columns represent rising prices, O columns represent falling prices.
 * A new column starts when price reverses by `reversalBoxes * boxSize`.
 * Each box is drawn as an X (two crossing diagonals) or O (ellipse).
 */
export class PointFigureRenderer {
  private _options: PointFigureRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<PointFigureRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  private _buildColumns(store: ColumnStore, fromIdx: number, toIdx: number): PFColumn[] {
    const { boxSize, reversalBoxes } = this._options;
    if (boxSize <= 0 || reversalBoxes <= 0) return [];

    const end = Math.min(toIdx, store.length - 1);
    if (fromIdx > end) return [];

    const columns: PFColumn[] = [];

    // Initialize from the first close.
    const firstBox = Math.floor(store.close[fromIdx] / boxSize);
    let currentColumn: PFColumn = {
      startIndex: fromIdx,
      endIndex: fromIdx,
      isX: true, // Will be determined by first movement.
      lowBox: firstBox,
      highBox: firstBox,
    };
    let directionEstablished = false;

    for (let i = fromIdx + 1; i <= end; i++) {
      const close = store.close[i];
      const box = Math.floor(close / boxSize);

      if (!directionEstablished) {
        // Determine initial direction from first significant movement.
        if (box > currentColumn.highBox) {
          currentColumn.isX = true;
          currentColumn.highBox = box;
          currentColumn.endIndex = i;
          directionEstablished = true;
        } else if (box < currentColumn.lowBox) {
          currentColumn.isX = false;
          currentColumn.lowBox = box;
          currentColumn.endIndex = i;
          directionEstablished = true;
        }
        continue;
      }

      if (currentColumn.isX) {
        // Currently in an X (rising) column.
        if (box > currentColumn.highBox) {
          // Extend upward.
          currentColumn.highBox = box;
          currentColumn.endIndex = i;
        } else if (currentColumn.highBox - box >= reversalBoxes) {
          // Reversal down — save current column and start O column.
          columns.push({ ...currentColumn });
          currentColumn = {
            startIndex: i,
            endIndex: i,
            isX: false,
            // New O column starts one box below the previous high.
            lowBox: box,
            highBox: currentColumn.highBox - 1,
          };
        }
      } else {
        // Currently in an O (falling) column.
        if (box < currentColumn.lowBox) {
          // Extend downward.
          currentColumn.lowBox = box;
          currentColumn.endIndex = i;
        } else if (box - currentColumn.lowBox >= reversalBoxes) {
          // Reversal up — save current column and start X column.
          columns.push({ ...currentColumn });
          currentColumn = {
            startIndex: i,
            endIndex: i,
            isX: true,
            // New X column starts one box above the previous low.
            lowBox: currentColumn.lowBox + 1,
            highBox: box,
          };
        }
      }
    }

    // Push the last column.
    if (directionEstablished) {
      columns.push(currentColumn);
    }

    return columns;
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
    const columns = this._buildColumns(store, fromIdx, toIdx);
    if (columns.length === 0) return;

    const halfBody = Math.max(1, Math.round((barWidth * pr) / 2));
    const markLineWidth = Math.max(1, Math.round(1.5 * pr));
    // Padding inside each box so marks don't touch edges.
    const pad = Math.max(1, Math.round(2 * pr));

    ctx.save();
    ctx.lineWidth = markLineWidth;
    ctx.lineCap = 'round';

    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      // Use the midpoint index for the column x-position.
      const midIndex = Math.round((col.startIndex + col.endIndex) / 2);
      const cx = Math.round(indexToX(midIndex) * pr);

      ctx.strokeStyle = col.isX ? opts.upColor : opts.downColor;

      for (let box = col.lowBox; box <= col.highBox; box++) {
        const boxTopPrice = (box + 1) * opts.boxSize;
        const boxBottomPrice = box * opts.boxSize;
        const topY = Math.round(priceToY(boxTopPrice) * pr);
        const bottomY = Math.round(priceToY(boxBottomPrice) * pr);

        // Box boundaries with padding.
        const left = cx - halfBody + pad;
        const right = cx + halfBody - pad;
        const top = topY + pad;
        const bottom = bottomY - pad;

        if (col.isX) {
          // Draw X: two crossing diagonal lines.
          ctx.beginPath();
          ctx.moveTo(left, top);
          ctx.lineTo(right, bottom);
          ctx.moveTo(right, top);
          ctx.lineTo(left, bottom);
          ctx.stroke();
        } else {
          // Draw O: ellipse.
          const centerX = cx;
          const centerY = (top + bottom) / 2;
          const radiusX = Math.max(1, (right - left) / 2);
          const radiusY = Math.max(1, (bottom - top) / 2);

          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }
}
