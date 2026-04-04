import type { Periodicity, SeriesType } from 'fin-charter';
import type { QuoteMeta } from './yahoo-finance';

export type ChartTypeLabel =
  | 'Candlestick' | 'Line' | 'Area' | 'Bar'
  | 'Baseline' | 'HollowCandle' | 'HeikinAshi';

export const CHART_TYPE_TO_SERIES: Record<ChartTypeLabel, SeriesType> = {
  Candlestick: 'candlestick',
  Line: 'line',
  Area: 'area',
  Bar: 'bar',
  Baseline: 'baseline',
  HollowCandle: 'hollow-candle',
  HeikinAshi: 'heikin-ashi',
};

export const PERIODICITIES: { label: string; value: Periodicity }[] = [
  { label: '1m',  value: { interval: 1, unit: 'minute' } },
  { label: '5m',  value: { interval: 5, unit: 'minute' } },
  { label: '15m', value: { interval: 15, unit: 'minute' } },
  { label: '1h',  value: { interval: 1, unit: 'hour' } },
  { label: '4h',  value: { interval: 4, unit: 'hour' } },
  { label: '1D',  value: { interval: 1, unit: 'day' } },
  { label: '1W',  value: { interval: 1, unit: 'week' } },
  { label: '1M',  value: { interval: 1, unit: 'month' } },
];

export const TIMEZONE_OPTIONS = [
  { label: 'Exchange', value: 'exchange' },
  { label: 'UTC', value: 'UTC' },
  { label: 'New York', value: 'America/New_York' },
  { label: 'Chicago', value: 'America/Chicago' },
  { label: 'London', value: 'Europe/London' },
  { label: 'Berlin', value: 'Europe/Berlin' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Mumbai', value: 'Asia/Kolkata' },
];

// ─── Reactive state ─────────────────────────────────────────────────

let _symbol = $state('AAPL');
let _periodicity = $state<Periodicity>({ interval: 1, unit: 'day' });
let _periodicityLabel = $state('1D');
let _chartType = $state<ChartTypeLabel>('Candlestick');
let _timezone = $state('exchange');
let _sidebarOpen = $state(true);
let _comparisonMode = $state(false);
let _comparisonSymbols = $state<string[]>([]);
let _activeIndicators = $state<string[]>([]);
let _activeDrawingTool = $state<string | null>(null);
let _meta = $state<QuoteMeta | null>(null);
let _loading = $state(false);

export const appStore = {
  get symbol() { return _symbol; },
  set symbol(v: string) { _symbol = v; },

  get periodicity() { return _periodicity; },
  get periodicityLabel() { return _periodicityLabel; },
  setPeriodicity(label: string, value: Periodicity) {
    _periodicityLabel = label;
    _periodicity = value;
  },

  get chartType() { return _chartType; },
  set chartType(v: ChartTypeLabel) { _chartType = v; },

  get timezone() { return _timezone; },
  set timezone(v: string) { _timezone = v; },

  get sidebarOpen() { return _sidebarOpen; },
  set sidebarOpen(v: boolean) { _sidebarOpen = v; },

  get comparisonMode() { return _comparisonMode; },
  set comparisonMode(v: boolean) { _comparisonMode = v; },

  get comparisonSymbols() { return _comparisonSymbols; },
  addComparison(sym: string) { _comparisonSymbols = [..._comparisonSymbols, sym]; },
  removeComparison(sym: string) { _comparisonSymbols = _comparisonSymbols.filter(s => s !== sym); },

  get activeIndicators() { return _activeIndicators; },
  addIndicator(id: string) { _activeIndicators = [..._activeIndicators, id]; },
  removeIndicator(id: string) { _activeIndicators = _activeIndicators.filter(i => i !== id); },

  get activeDrawingTool() { return _activeDrawingTool; },
  set activeDrawingTool(v: string | null) { _activeDrawingTool = v; },

  get meta() { return _meta; },
  set meta(v: QuoteMeta | null) { _meta = v; },

  get loading() { return _loading; },
  set loading(v: boolean) { _loading = v; },

  get resolvedTimezone(): string {
    if (_timezone === 'exchange' && _meta) return _meta.timezone;
    if (_timezone === 'exchange') return 'America/New_York';
    return _timezone;
  },
};
