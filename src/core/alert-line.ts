// ─── Alert Lines ────────────────────────────────────────────────────────────

export type AlertTriggerMode = 'crossing-up' | 'crossing-down' | 'crossing-either';

export type AlertLineCallback = (alert: AlertLine, direction: 'up' | 'down') => void;

export interface AlertLineOptions {
  price: number;
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  title: string;
  triggerMode: AlertTriggerMode;
  /** Whether the alert is armed (will fire callbacks on crossing). */
  armed: boolean;
  /** Show a bell icon on the price axis. */
  axisLabelVisible: boolean;
  axisLabelColor?: string;
  axisLabelTextColor?: string;
}

export const DEFAULT_ALERT_LINE_OPTIONS: AlertLineOptions = {
  price: 0,
  color: '#FF9800',
  lineWidth: 1,
  lineStyle: 'dashed',
  title: '',
  triggerMode: 'crossing-either',
  armed: true,
  axisLabelVisible: true,
};

/**
 * AlertLine — a price level that fires callbacks when the current price
 * crosses it. Distinct from PriceLine: alerts have armed/disarmed state,
 * trigger modes, and can be dragged to adjust the price.
 */
export class AlertLine {
  readonly id: string;
  private _options: AlertLineOptions;
  private _callbacks: AlertLineCallback[] = [];
  private _lastPrice: number | null = null;
  private _requestRepaint: (() => void) | null;

  constructor(id: string, options: AlertLineOptions, requestRepaint?: () => void) {
    this.id = id;
    this._options = { ...DEFAULT_ALERT_LINE_OPTIONS, ...options };
    this._requestRepaint = requestRepaint ?? null;
  }

  get options(): Readonly<AlertLineOptions> {
    return { ...this._options };
  }

  applyOptions(opts: Partial<AlertLineOptions>): void {
    Object.assign(this._options, opts);
    this._requestRepaint?.();
  }

  /** Subscribe to alert trigger events. */
  onTriggered(callback: AlertLineCallback): void {
    this._callbacks.push(callback);
  }

  /** Unsubscribe from alert trigger events. */
  offTriggered(callback: AlertLineCallback): void {
    const idx = this._callbacks.indexOf(callback);
    if (idx >= 0) this._callbacks.splice(idx, 1);
  }

  /** Arm or disarm the alert. */
  setArmed(armed: boolean): void {
    this._options.armed = armed;
    this._requestRepaint?.();
  }

  isArmed(): boolean {
    return this._options.armed;
  }

  /**
   * Check if the current price has crossed the alert level since the last
   * check, and fire callbacks if so. Called by the chart on each data update.
   */
  checkCrossing(currentPrice: number): void {
    if (!this._options.armed) return;

    const alertPrice = this._options.price;
    const prevPrice = this._lastPrice;
    this._lastPrice = currentPrice;

    if (prevPrice === null) return;

    const crossedUp = prevPrice <= alertPrice && currentPrice > alertPrice;
    const crossedDown = prevPrice >= alertPrice && currentPrice < alertPrice;

    const { triggerMode } = this._options;
    let direction: 'up' | 'down' | null = null;

    if (crossedUp && (triggerMode === 'crossing-up' || triggerMode === 'crossing-either')) {
      direction = 'up';
    } else if (crossedDown && (triggerMode === 'crossing-down' || triggerMode === 'crossing-either')) {
      direction = 'down';
    }

    if (direction) {
      for (const cb of this._callbacks) cb(this, direction);
    }
  }

  /** Serialize to a plain object for chart state save/restore. */
  serialize(): { id: string; options: AlertLineOptions } {
    return { id: this.id, options: { ...this._options } };
  }
}
