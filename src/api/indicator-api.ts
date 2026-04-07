import type { SeriesType } from '../core/types';
import type { ISeriesApi, SeriesApi } from './series-api';
import type { IndicatorType, IndicatorOptions } from './options';

// ─── IIndicatorApi ─────────────────────────────────────────────────────────

export interface IIndicatorApi {
  readonly id: string;
  indicatorType(): IndicatorType;
  applyOptions(options: Partial<IndicatorOptions>): void;
  options(): IndicatorOptions;
  paneId(): string;
  isVisible(): boolean;
  remove(): void;
  label(): string;
}

// ─── IndicatorApi ──────────────────────────────────────────────────────────

export class IndicatorApi implements IIndicatorApi {
  public readonly id: string;
  private _type: IndicatorType;
  private _options: IndicatorOptions;
  private _paneId: string;
  private _visible: boolean;
  private _label: string;

  /** The line/histogram series created internally for this indicator. */
  public internalSeries: ISeriesApi<SeriesType>[] = [];

  /** If we auto-created a pane for this indicator, track it for cleanup. */
  public autoCreatedPaneId: string | null = null;

  /** Upper/lower series references for band-fill rendering (bollinger, keltner, donchian, ichimoku cloud).
   *  Stores the concrete SeriesApi (not ISeriesApi) to access getDataLayer(). */
  public bandSeries: { upper: SeriesApi<SeriesType>; lower: SeriesApi<SeriesType> } | null = null;

  /** Fill color between upper and lower bands. */
  public bandFillColor: string = '';

  /** Called by remove() to clean up via ChartApi. */
  public _removeCallback: () => void;

  /** Subscription callback for source dataChanged, stored for unsubscribe. */
  public _dataChangedCallback: (() => void) | null = null;

  constructor(
    id: string,
    type: IndicatorType,
    options: IndicatorOptions,
    paneId: string,
    removeCallback: () => void,
  ) {
    this.id = id;
    this._type = type;
    this._options = { ...options };
    this._paneId = paneId;
    this._visible = options.visible !== false;
    this._label = options.label ?? this._autoLabel();
    this._removeCallback = removeCallback;
  }

  indicatorType(): IndicatorType {
    return this._type;
  }

  applyOptions(options: Partial<IndicatorOptions>): void {
    this._options = { ...this._options, ...options };
    if (options.visible !== undefined) {
      this._visible = options.visible !== false;
    }
    if (options.label !== undefined) {
      this._label = options.label ?? this._autoLabel();
    }
  }

  options(): IndicatorOptions {
    return { ...this._options };
  }

  paneId(): string {
    return this._paneId;
  }

  isVisible(): boolean {
    return this._visible;
  }

  remove(): void {
    this._removeCallback();
  }

  label(): string {
    return this._label;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _autoLabel(): string {
    const params = this._options.params ?? {};
    switch (this._type) {
      case 'sma':
        return `SMA ${params.period ?? 20}`;
      case 'ema':
        return `EMA ${params.period ?? 20}`;
      case 'rsi':
        return `RSI ${params.period ?? 14}`;
      case 'macd':
        return `MACD ${params.fastPeriod ?? 12},${params.slowPeriod ?? 26},${params.signalPeriod ?? 9}`;
      case 'bollinger':
        return `BB ${params.period ?? 20},${params.stdDev ?? 2}`;
      case 'vwap':
        return 'VWAP';
      case 'stochastic':
        return `Stoch ${params.kPeriod ?? 14},${params.dPeriod ?? 3}`;
      case 'atr':
        return `ATR ${params.period ?? 14}`;
      case 'adx':
        return `ADX ${params.period ?? 14}`;
      case 'obv':
        return 'OBV';
      case 'williams-r':
        return `W%R ${params.period ?? 14}`;
      default:
        return (this._type as string).toUpperCase();
    }
  }
}
