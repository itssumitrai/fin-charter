export interface PriceRange {
  min: number;
  max: number;
}

/**
 * TV-style scale margins: 20% top padding, 10% bottom padding.
 * These are applied in the coordinate conversion (priceToY / yToPrice),
 * NOT in autoScale. autoScale stores raw min/max from the data.
 */
const TOP_MARGIN = 0.2;
const BOTTOM_MARGIN = 0.1;

export class PriceScale {
  public readonly position: 'left' | 'right';

  private _height: number = 0;
  private _min: number = 0;
  private _max: number = 1;
  /** When true, setRange() was called manually and autoScale() will not override it. */
  private _manualRange: boolean = false;

  constructor(position: 'left' | 'right') {
    this.position = position;
  }

  setHeight(height: number): void {
    this._height = height;
  }

  /**
   * Auto-scale to fit [minPrice, maxPrice].
   * Margins are handled in coordinate conversion, not here.
   * Ignored when a manual range is active.
   */
  autoScale(minPrice: number, maxPrice: number): void {
    if (this._manualRange) return;
    if (minPrice === maxPrice) {
      // Flat price — create a symmetric window around the single price
      const margin = Math.abs(minPrice) * 0.05 || 0.05;
      this._min = minPrice - margin;
      this._max = maxPrice + margin;
    } else {
      this._min = minPrice;
      this._max = maxPrice;
    }
  }

  /**
   * Manually override the price range.
   * Subsequent autoScale() calls will be ignored until resetAutoScale() is called.
   */
  setRange(min: number, max: number): void {
    this._manualRange = true;
    this._min = min;
    this._max = max;
  }

  /** Re-enable auto-scaling (next autoScale() call will take effect). */
  resetAutoScale(): void {
    this._manualRange = false;
  }

  /**
   * Map a price to a y-pixel coordinate using TV's formula:
   *   topPx = height * TOP_MARGIN
   *   bottomPx = height * BOTTOM_MARGIN
   *   innerHeight = height - topPx - bottomPx
   *   invCoord = bottomPx + (innerHeight - 1) * (price - min) / (max - min)
   *   y = height - 1 - invCoord
   */
  priceToY(price: number): number {
    if (this._height === 0 || this._max === this._min) return 0;

    const topPx = this._height * TOP_MARGIN;
    const bottomPx = this._height * BOTTOM_MARGIN;
    const innerHeight = this._height - topPx - bottomPx;

    const invCoord = bottomPx + (innerHeight - 1) * (price - this._min) / (this._max - this._min);
    return this._height - 1 - invCoord;
  }

  /** Inverse of priceToY. */
  yToPrice(y: number): number {
    if (this._height === 0 || this._max === this._min) return this._min;

    const topPx = this._height * TOP_MARGIN;
    const bottomPx = this._height * BOTTOM_MARGIN;
    const innerHeight = this._height - topPx - bottomPx;

    // y = height - 1 - invCoord  =>  invCoord = height - 1 - y
    const invCoord = this._height - 1 - y;
    // invCoord = bottomPx + (innerHeight - 1) * (price - min) / (max - min)
    const ratio = (invCoord - bottomPx) / (innerHeight - 1);
    return this._min + ratio * (this._max - this._min);
  }

  get priceRange(): PriceRange {
    return { min: this._min, max: this._max };
  }
}
