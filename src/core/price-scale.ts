export interface PriceRange {
  min: number;
  max: number;
}

/** Margin fraction added above and below auto-scaled price range. */
const AUTO_SCALE_MARGIN = 0.05;

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
   * Auto-scale to fit [minPrice, maxPrice] with a 5% margin on each side.
   * Ignored when a manual range is active.
   */
  autoScale(minPrice: number, maxPrice: number): void {
    if (this._manualRange) return;
    this._applyRange(minPrice, maxPrice);
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
   * Map a price to a y-pixel coordinate.
   * Price range is mapped linearly with Y axis inverted (top = max, bottom = min).
   */
  priceToY(price: number): number {
    if (this._height === 0 || this._max === this._min) return 0;
    return this._height * (1 - (price - this._min) / (this._max - this._min));
  }

  /** Inverse of priceToY. */
  yToPrice(y: number): number {
    if (this._height === 0 || this._max === this._min) return this._min;
    return this._min + (1 - y / this._height) * (this._max - this._min);
  }

  get priceRange(): PriceRange {
    return { min: this._min, max: this._max };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _applyRange(minPrice: number, maxPrice: number): void {
    const span = maxPrice - minPrice;
    if (span === 0) {
      // Flat price — create a symmetric ±5% window around the single price
      const margin = Math.abs(minPrice) * AUTO_SCALE_MARGIN || AUTO_SCALE_MARGIN;
      this._min = minPrice - margin;
      this._max = maxPrice + margin;
    } else {
      const margin = span * AUTO_SCALE_MARGIN;
      this._min = minPrice - margin;
      this._max = maxPrice + margin;
    }
  }
}
