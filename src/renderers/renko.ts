import type { ColumnStore, IRenderTarget, VisibleRange } from '../core/types';

export interface RenkoRendererOptions {
  boxSize: number;
  upColor: string;
  downColor: string;
}

const DEFAULT_OPTIONS: RenkoRendererOptions = {
  boxSize: 1,
  upColor: '#00E396',
  downColor: '#FF3B5C',
};

interface RenkoBrick {
  /** The bar index in the source data that triggered this brick. */
  sourceIndex: number;
  /** Bottom price of the brick. */
  bottom: number;
  /** Top price of the brick. */
  top: number;
  /** True = up brick, false = down brick. */
  isUp: boolean;
}

/**
 * RenkoRenderer — builds Renko bricks from close prices and draws them.
 *
 * Renko charts filter out noise by only drawing a new brick when price moves
 * by at least `boxSize` in one direction. Up bricks are filled with `upColor`,
 * down bricks with `downColor`.
 */
export class RenkoRenderer {
  private _options: RenkoRendererOptions = { ...DEFAULT_OPTIONS };

  applyOptions(options: Partial<RenkoRendererOptions>): void {
    this._options = { ...this._options, ...options };
  }

  /**
   * Build Renko bricks from the close prices in the store for the given range.
   * We walk from `fromIdx` to `toIdx` and emit bricks whenever the close price
   * departs from the current brick level by at least `boxSize`.
   */
  private _buildBricks(store: ColumnStore, fromIdx: number, toIdx: number): RenkoBrick[] {
    const { boxSize } = this._options;
    if (boxSize <= 0) return [];

    const bricks: RenkoBrick[] = [];
    const end = Math.min(toIdx, store.length - 1);
    if (fromIdx > end) return bricks;

    // Anchor the first brick base to the nearest boxSize multiple below the first close.
    let basePrice = Math.floor(store.close[fromIdx] / boxSize) * boxSize;
    let direction: 'up' | 'down' | null = null;

    for (let i = fromIdx; i <= end; i++) {
      const close = store.close[i];

      // How many full boxes has price moved from basePrice?
      const delta = close - basePrice;
      const boxes = Math.floor(Math.abs(delta) / boxSize);

      if (boxes === 0) continue;

      const movingUp = delta > 0;

      if (direction === null) {
        // First movement establishes direction.
        direction = movingUp ? 'up' : 'down';
        for (let b = 0; b < boxes; b++) {
          if (movingUp) {
            const bottom = basePrice + b * boxSize;
            bricks.push({ sourceIndex: i, bottom, top: bottom + boxSize, isUp: true });
          } else {
            const top = basePrice - b * boxSize;
            bricks.push({ sourceIndex: i, bottom: top - boxSize, top, isUp: false });
          }
        }
        basePrice += (movingUp ? boxes : -boxes) * boxSize;
      } else if ((direction === 'up' && movingUp) || (direction === 'down' && !movingUp)) {
        // Continuation in same direction.
        for (let b = 0; b < boxes; b++) {
          if (movingUp) {
            const bottom = basePrice + b * boxSize;
            bricks.push({ sourceIndex: i, bottom, top: bottom + boxSize, isUp: true });
          } else {
            const top = basePrice - b * boxSize;
            bricks.push({ sourceIndex: i, bottom: top - boxSize, top, isUp: false });
          }
        }
        basePrice += (movingUp ? boxes : -boxes) * boxSize;
      } else {
        // Reversal — need at least 2 boxes in opposite direction to reverse
        // (standard Renko rule: reversal needs to exceed the previous brick).
        if (boxes >= 2) {
          direction = movingUp ? 'up' : 'down';
          // Reversal bricks start from the current base level. The first brick
          // overlaps the previous brick's base, which is standard Renko behavior.
          for (let b = 0; b < boxes; b++) {
            if (movingUp) {
              const bottom = basePrice + b * boxSize;
              bricks.push({ sourceIndex: i, bottom, top: bottom + boxSize, isUp: true });
            } else {
              const top = basePrice - b * boxSize;
              bricks.push({ sourceIndex: i, bottom: top - boxSize, top, isUp: false });
            }
          }
          basePrice += (movingUp ? boxes : -boxes) * boxSize;
        }
      }
    }

    return bricks;
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
    const bricks = this._buildBricks(store, fromIdx, toIdx);
    if (bricks.length === 0) return;

    const halfBody = Math.max(1, Math.round((barWidth * pr) / 2));

    ctx.save();

    for (let b = 0; b < bricks.length; b++) {
      const brick = bricks[b];
      const cx = Math.round(indexToX(brick.sourceIndex) * pr);
      const topY = Math.round(priceToY(brick.top) * pr);
      const bottomY = Math.round(priceToY(brick.bottom) * pr);
      const height = Math.max(1, bottomY - topY);

      ctx.fillStyle = brick.isUp ? opts.upColor : opts.downColor;
      ctx.fillRect(cx - halfBody, topY, halfBody * 2, height);

      // Thin border for definition.
      ctx.strokeStyle = brick.isUp ? opts.upColor : opts.downColor;
      ctx.lineWidth = Math.max(1, Math.round(pr));
      ctx.strokeRect(cx - halfBody + 0.5, topY + 0.5, halfBody * 2 - 1, height - 1);
    }

    ctx.restore();
  }
}
