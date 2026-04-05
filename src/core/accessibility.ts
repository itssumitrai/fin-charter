// ─── Chart Accessibility ────────────────────────────────────────────────────

export interface BarData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * ChartAccessibility manages ARIA live regions and focus management for
 * screen-reader support on financial charts. It provides methods to announce
 * price changes, OHLCV bar data, and manage keyboard navigation state.
 */
export class ChartAccessibility {
  private _container: HTMLElement | null = null;
  private _liveRegion: HTMLElement | null = null;
  private _description: string = '';
  private _focusedBarIndex: number = -1;
  private _totalBars: number = 0;
  private _disposed = false;

  /**
   * Create a hidden ARIA live region inside the given container.
   * The live region is used to announce dynamic content to screen readers.
   */
  createAriaLiveRegion(container: HTMLElement): HTMLElement {
    if (this._disposed) throw new Error('ChartAccessibility has been disposed');

    // Remove existing live region if present
    if (this._liveRegion && this._liveRegion.parentNode) {
      this._liveRegion.parentNode.removeChild(this._liveRegion);
      this._liveRegion = null;
    }

    this._container = container;

    // Ensure container has a role for accessibility
    if (!container.getAttribute('role')) {
      container.setAttribute('role', 'img');
    }

    const region = container.ownerDocument.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    // Visually hidden but available to screen readers
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });

    container.appendChild(region);
    this._liveRegion = region;
    return region;
  }

  /**
   * Announce the current price and change to screen readers.
   * @param price - The current price value.
   * @param change - The price change (positive or negative).
   */
  announcePrice(price: number, change: number): void {
    if (!this._liveRegion || this._disposed) return;

    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged';
    const absChange = Math.abs(change);
    const message = `Price ${price.toFixed(2)}, ${direction} ${absChange.toFixed(2)}`;
    this._liveRegion.textContent = message;
  }

  /**
   * Announce OHLCV bar data to screen readers.
   * @param bar - The bar data to announce.
   */
  announceBar(bar: BarData): void {
    if (!this._liveRegion || this._disposed) return;

    const parts = [
      `Open ${bar.open.toFixed(2)}`,
      `High ${bar.high.toFixed(2)}`,
      `Low ${bar.low.toFixed(2)}`,
      `Close ${bar.close.toFixed(2)}`,
    ];
    if (bar.volume !== undefined) {
      parts.push(`Volume ${bar.volume.toLocaleString()}`);
    }
    this._liveRegion.textContent = parts.join(', ');
  }

  /**
   * Set a description on the chart container as aria-label.
   * @param description - The description text.
   */
  setChartDescription(description: string): void {
    this._description = description;
    if (this._container && !this._disposed) {
      this._container.setAttribute('aria-label', description);
    }
  }

  /** Get the current chart description. */
  getChartDescription(): string {
    return this._description;
  }

  /**
   * Set the chart container as focusable and focus it.
   * This enables keyboard navigation on the chart.
   */
  focusChart(): void {
    if (!this._container || this._disposed) return;
    if (!this._container.getAttribute('tabindex')) {
      this._container.setAttribute('tabindex', '0');
    }
    this._container.focus();
  }

  /**
   * Set the total number of bars for keyboard navigation.
   */
  setTotalBars(count: number): void {
    const normalizedCount = Math.max(0, count);
    this._totalBars = normalizedCount;

    if (this._totalBars === 0) {
      this._focusedBarIndex = -1;
    } else if (this._focusedBarIndex >= this._totalBars) {
      this._focusedBarIndex = this._totalBars - 1;
    }
  }

  /**
   * Get the currently focused bar index for keyboard navigation.
   * Returns -1 if no bar is focused.
   */
  get focusedBarIndex(): number {
    return this._focusedBarIndex;
  }

  /** Get total bars available for navigation. */
  get totalBars(): number {
    return this._totalBars;
  }

  /**
   * Move focus to the next bar (right arrow key).
   * Returns the new focused bar index, or -1 if at the end.
   */
  focusNextBar(): number {
    if (this._totalBars <= 0) return -1;
    if (this._focusedBarIndex < this._totalBars - 1) {
      this._focusedBarIndex++;
      return this._focusedBarIndex;
    }
    return -1;
  }

  /**
   * Move focus to the previous bar (left arrow key).
   * Returns the new focused bar index, or -1 if at the beginning.
   */
  focusPreviousBar(): number {
    if (this._totalBars <= 0) return -1;
    if (this._focusedBarIndex > 0) {
      this._focusedBarIndex--;
      return this._focusedBarIndex;
    } else if (this._focusedBarIndex === -1 && this._totalBars > 0) {
      this._focusedBarIndex = 0;
      return this._focusedBarIndex;
    }
    return -1;
  }

  /**
   * Move focus to the first bar.
   */
  focusFirstBar(): number {
    if (this._totalBars <= 0) return -1;
    this._focusedBarIndex = 0;
    return this._focusedBarIndex;
  }

  /**
   * Move focus to the last bar.
   */
  focusLastBar(): number {
    if (this._totalBars <= 0) return -1;
    this._focusedBarIndex = this._totalBars - 1;
    return this._focusedBarIndex;
  }

  /**
   * Reset focused bar index.
   */
  resetFocus(): void {
    this._focusedBarIndex = -1;
  }

  /**
   * Get the ARIA live region element (or null if not created).
   */
  get liveRegion(): HTMLElement | null {
    return this._liveRegion;
  }

  /**
   * Clean up: remove the live region from the DOM and reset state.
   */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;

    if (this._liveRegion && this._liveRegion.parentNode) {
      this._liveRegion.parentNode.removeChild(this._liveRegion);
    }
    this._liveRegion = null;
    this._container = null;
    this._focusedBarIndex = -1;
    this._totalBars = 0;
  }
}
