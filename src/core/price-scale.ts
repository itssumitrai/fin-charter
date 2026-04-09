export type PriceScaleMode = 'linear' | 'logarithmic';

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

/**
 * Exponential lerp factor for price scale animation.
 * Each frame, current values move 25% of the remaining distance toward the target.
 * Converges in ~10-12 frames (~170ms at 60fps) — snappy but smooth.
 */
const SCALE_LERP = 0.25;

/**
 * When the animated value is within this fraction of the target range,
 * snap to avoid endless micro-adjustments.
 */
const SCALE_SNAP_THRESHOLD = 0.0005;

export class PriceScale {
  public readonly position: 'left' | 'right';

  private _height: number = 0;
  /** Current (animated) min/max used by priceToY. */
  private _min: number = 0;
  private _max: number = 1;
  /** Target min/max that autoScale sets. Current values chase these. */
  private _targetMin: number = 0;
  private _targetMax: number = 1;
  /** True after the first autoScale call — before that, we snap instead of animating. */
  private _initialized: boolean = false;
  /** True while current min/max are still converging toward target. */
  private _animating: boolean = false;
  /** When true, setRange() was called manually and autoScale() will not override it. */
  private _manualRange: boolean = false;
  private _comparisonMode: boolean = false;
  private _mode: PriceScaleMode = 'linear';

  constructor(position: 'left' | 'right') {
    this.position = position;
  }

  /** Get the current scale mode. */
  get mode(): PriceScaleMode {
    return this._mode;
  }

  /** Set the scale mode (linear or logarithmic). */
  setMode(mode: PriceScaleMode): void {
    this._mode = mode;
  }

  setHeight(height: number): void {
    this._height = height;
  }

  /**
   * Auto-scale to fit [minPrice, maxPrice].
   * Margins are handled in coordinate conversion, not here.
   * Ignored when a manual range is active.
   *
   * On the first call, values snap immediately. On subsequent calls,
   * target values are set and current values animate toward them via tick().
   */
  autoScale(minPrice: number, maxPrice: number): void {
    if (this._manualRange) return;
    if (minPrice === maxPrice) {
      // Flat price — create a symmetric window around the single price
      const margin = Math.abs(minPrice) * 0.05 || 0.05;
      minPrice -= margin;
      maxPrice += margin;
    }

    if (!this._initialized) {
      // First call — snap immediately, no animation
      if (this._mode === 'logarithmic' && minPrice <= 0) minPrice = 1e-10;
      this._min = minPrice;
      this._max = maxPrice;
      this._targetMin = minPrice;
      this._targetMax = maxPrice;
      this._initialized = true;
      return;
    }

    // Skip if target hasn't meaningfully changed
    const range = this._targetMax - this._targetMin;
    const eps = range * 1e-6 || 1e-10;
    if (Math.abs(this._targetMin - minPrice) < eps &&
        Math.abs(this._targetMax - maxPrice) < eps) {
      return;
    }

    this._targetMin = minPrice;
    this._targetMax = maxPrice;
    if (this._mode === 'logarithmic' && this._targetMin <= 0) {
      this._targetMin = 1e-10;
    }
    this._animating = true;
  }

  /**
   * Advance the price scale animation by one frame.
   * Returns true if still animating (caller should schedule another repaint).
   */
  tick(): boolean {
    if (!this._animating) return false;

    this._min += (this._targetMin - this._min) * SCALE_LERP;
    this._max += (this._targetMax - this._max) * SCALE_LERP;

    // Snap when close enough to avoid endless micro-adjustments
    const range = Math.abs(this._targetMax - this._targetMin);
    const threshold = range * SCALE_SNAP_THRESHOLD;
    if (Math.abs(this._min - this._targetMin) < threshold &&
        Math.abs(this._max - this._targetMax) < threshold) {
      this._min = this._targetMin;
      this._max = this._targetMax;
      this._animating = false;
    }

    return this._animating;
  }

  /** True while the scale is animating toward a new target range. */
  get isAnimating(): boolean {
    return this._animating;
  }

  /** Reset animation state — snap current values to target immediately. */
  snapToTarget(): void {
    this._min = this._targetMin;
    this._max = this._targetMax;
    this._animating = false;
  }

  /**
   * Manually override the price range.
   * Subsequent autoScale() calls will be ignored until resetAutoScale() is called.
   */
  setRange(min: number, max: number): void {
    this._manualRange = true;
    this._min = min;
    this._max = max;
    this._targetMin = min;
    this._targetMax = max;
    this._animating = false;
  }

  /** Re-enable auto-scaling (next autoScale() call will take effect). */
  resetAutoScale(): void {
    this._manualRange = false;
  }

  /**
   * Enable or disable comparison mode.
   * In comparison mode the scale operates in "percent space" — callers pass
   * percentage-change values (e.g. +12.5 for +12.5%) instead of raw prices.
   * priceToY / yToPrice work identically; the caller is responsible for the
   * raw-price → percentage conversion before calling priceToY.
   */
  setComparisonMode(enabled: boolean): void {
    this._comparisonMode = enabled;
  }

  /** Returns true when comparison mode is active. */
  isComparisonMode(): boolean {
    return this._comparisonMode;
  }

  /**
   * Map a price to a y-pixel coordinate.
   *
   * In linear mode: equal vertical distance for equal price change.
   * In logarithmic mode: equal vertical distance for equal percentage change.
   */
  priceToY(price: number): number {
    if (this._height === 0 || this._max === this._min) return 0;

    const topPx = this._height * TOP_MARGIN;
    const bottomPx = this._height * BOTTOM_MARGIN;
    const innerHeight = this._height - topPx - bottomPx;

    let ratio: number;
    if (this._mode === 'logarithmic' && this._min > 0 && price > 0) {
      const logMin = Math.log(this._min);
      const logMax = Math.log(this._max);
      ratio = (Math.log(price) - logMin) / (logMax - logMin);
    } else {
      ratio = (price - this._min) / (this._max - this._min);
    }

    const invCoord = bottomPx + (innerHeight - 1) * ratio;
    return this._height - 1 - invCoord;
  }

  /** Inverse of priceToY. */
  yToPrice(y: number): number {
    if (this._height === 0 || this._max === this._min) return this._min;

    const topPx = this._height * TOP_MARGIN;
    const bottomPx = this._height * BOTTOM_MARGIN;
    const innerHeight = this._height - topPx - bottomPx;

    const invCoord = this._height - 1 - y;
    const ratio = (invCoord - bottomPx) / (innerHeight - 1);

    if (this._mode === 'logarithmic' && this._min > 0) {
      const logMin = Math.log(this._min);
      const logMax = Math.log(this._max);
      return Math.exp(logMin + ratio * (logMax - logMin));
    }

    return this._min + ratio * (this._max - this._min);
  }

  get priceRange(): PriceRange {
    return { min: this._min, max: this._max };
  }
}
