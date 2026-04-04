/**
 * Per-indicator settings definitions: computational params + visual styles.
 *
 * Each indicator has:
 *  - `params`: numeric inputs (period, stdDev, etc.)
 *  - `styles`: per-output visual config (color, lineWidth, plus histogram/fill options)
 */

export interface ParamDef {
  key: string;
  label: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface StyleDef {
  key: string;
  label: string;
  type: 'color' | 'lineWidth';
  default: string | number;
}

export interface IndicatorSettingsDef {
  id: string;
  name: string;
  params: ParamDef[];
  styles: StyleDef[];
}

export const INDICATOR_SETTINGS: Record<string, IndicatorSettingsDef> = {
  sma: {
    id: 'sma',
    name: 'Simple Moving Average',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 500 },
    ],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  ema: {
    id: 'ema',
    name: 'Exponential Moving Average',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 500 },
    ],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  bollinger: {
    id: 'bollinger',
    name: 'Bollinger Bands',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 500 },
      { key: 'stdDev', label: 'Std Dev', default: 2, min: 0.1, max: 5, step: 0.1 },
    ],
    styles: [
      { key: 'upperColor', label: 'Upper Band', type: 'color', default: '#42a5f5' },
      { key: 'middleColor', label: 'Middle Line', type: 'color', default: '#2962ff' },
      { key: 'lowerColor', label: 'Lower Band', type: 'color', default: '#42a5f5' },
      { key: 'backgroundColor', label: 'Fill', type: 'color', default: 'rgba(66,165,245,0.1)' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  vwap: {
    id: 'vwap',
    name: 'VWAP',
    params: [],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  ichimoku: {
    id: 'ichimoku',
    name: 'Ichimoku Cloud',
    params: [
      { key: 'tenkanPeriod', label: 'Tenkan Period', default: 9, min: 1, max: 100 },
      { key: 'kijunPeriod', label: 'Kijun Period', default: 26, min: 1, max: 100 },
      { key: 'senkouPeriod', label: 'Senkou Period', default: 52, min: 1, max: 200 },
    ],
    styles: [
      { key: 'tenkanColor', label: 'Tenkan-sen', type: 'color', default: '#2962ff' },
      { key: 'kijunColor', label: 'Kijun-sen', type: 'color', default: '#F7525F' },
      { key: 'senkouAColor', label: 'Senkou A', type: 'color', default: '#22AB94' },
      { key: 'senkouBColor', label: 'Senkou B', type: 'color', default: '#ee6823' },
      { key: 'chikouColor', label: 'Chikou', type: 'color', default: '#9c27b0' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  'parabolic-sar': {
    id: 'parabolic-sar',
    name: 'Parabolic SAR',
    params: [
      { key: 'afStep', label: 'AF Step', default: 0.02, min: 0.001, max: 0.1, step: 0.001 },
      { key: 'afMax', label: 'AF Max', default: 0.20, min: 0.01, max: 1, step: 0.01 },
    ],
    styles: [
      { key: 'color', label: 'Dots', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Size', type: 'lineWidth', default: 2 },
    ],
  },
  keltner: {
    id: 'keltner',
    name: 'Keltner Channel',
    params: [
      { key: 'emaPeriod', label: 'EMA Period', default: 20, min: 1, max: 500 },
      { key: 'atrPeriod', label: 'ATR Period', default: 10, min: 1, max: 100 },
      { key: 'multiplier', label: 'Multiplier', default: 2, min: 0.1, max: 10, step: 0.1 },
    ],
    styles: [
      { key: 'upperColor', label: 'Upper Band', type: 'color', default: '#42a5f5' },
      { key: 'middleColor', label: 'Middle Line', type: 'color', default: '#2962ff' },
      { key: 'lowerColor', label: 'Lower Band', type: 'color', default: '#42a5f5' },
      { key: 'backgroundColor', label: 'Fill', type: 'color', default: 'rgba(66,165,245,0.1)' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  donchian: {
    id: 'donchian',
    name: 'Donchian Channel',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 500 },
    ],
    styles: [
      { key: 'upperColor', label: 'Upper Band', type: 'color', default: '#42a5f5' },
      { key: 'middleColor', label: 'Middle Line', type: 'color', default: '#2962ff' },
      { key: 'lowerColor', label: 'Lower Band', type: 'color', default: '#42a5f5' },
      { key: 'backgroundColor', label: 'Fill', type: 'color', default: 'rgba(66,165,245,0.1)' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  supertrend: {
    id: 'supertrend',
    name: 'Supertrend',
    params: [
      { key: 'period', label: 'Period', default: 10, min: 1, max: 100 },
      { key: 'multiplier', label: 'Multiplier', default: 3, min: 0.1, max: 10, step: 0.1 },
    ],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  vwma: {
    id: 'vwma',
    name: 'Volume Weighted MA',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 500 },
    ],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  'linear-regression': {
    id: 'linear-regression',
    name: 'Linear Regression',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 500 },
    ],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  rsi: {
    id: 'rsi',
    name: 'Relative Strength Index',
    params: [
      { key: 'period', label: 'Period', default: 14, min: 1, max: 100 },
    ],
    styles: [
      { key: 'color', label: 'RSI Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  macd: {
    id: 'macd',
    name: 'MACD',
    params: [
      { key: 'fastPeriod', label: 'Fast Period', default: 12, min: 1, max: 100 },
      { key: 'slowPeriod', label: 'Slow Period', default: 26, min: 1, max: 200 },
      { key: 'signalPeriod', label: 'Signal Period', default: 9, min: 1, max: 100 },
    ],
    styles: [
      { key: 'macdColor', label: 'MACD Line', type: 'color', default: '#2962ff' },
      { key: 'signalColor', label: 'Signal Line', type: 'color', default: '#ff6d00' },
      { key: 'histUpColor', label: 'Histogram Up', type: 'color', default: 'rgba(34,171,148,0.4)' },
      { key: 'histDownColor', label: 'Histogram Down', type: 'color', default: 'rgba(247,82,95,0.4)' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  stochastic: {
    id: 'stochastic',
    name: 'Stochastic',
    params: [
      { key: 'kPeriod', label: '%K Period', default: 14, min: 1, max: 100 },
      { key: 'dPeriod', label: '%D Period', default: 3, min: 1, max: 100 },
    ],
    styles: [
      { key: 'kColor', label: '%K Line', type: 'color', default: '#2962ff' },
      { key: 'dColor', label: '%D Line', type: 'color', default: '#ff6d00' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  atr: {
    id: 'atr',
    name: 'Average True Range',
    params: [
      { key: 'period', label: 'Period', default: 14, min: 1, max: 100 },
    ],
    styles: [
      { key: 'color', label: 'ATR Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  adx: {
    id: 'adx',
    name: 'Average Directional Index',
    params: [
      { key: 'period', label: 'Period', default: 14, min: 1, max: 100 },
    ],
    styles: [
      { key: 'adxColor', label: 'ADX Line', type: 'color', default: '#2962ff' },
      { key: 'plusDIColor', label: '+DI Line', type: 'color', default: '#22AB94' },
      { key: 'minusDIColor', label: '-DI Line', type: 'color', default: '#F7525F' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  obv: {
    id: 'obv',
    name: 'On-Balance Volume',
    params: [],
    styles: [
      { key: 'color', label: 'OBV Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  'williams-r': {
    id: 'williams-r',
    name: 'Williams %R',
    params: [
      { key: 'period', label: 'Period', default: 14, min: 1, max: 100 },
    ],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  cci: {
    id: 'cci',
    name: 'Commodity Channel Index',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 200 },
    ],
    styles: [
      { key: 'color', label: 'CCI Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  aroon: {
    id: 'aroon',
    name: 'Aroon',
    params: [
      { key: 'period', label: 'Period', default: 25, min: 1, max: 200 },
    ],
    styles: [
      { key: 'upColor', label: 'Aroon Up', type: 'color', default: '#22AB94' },
      { key: 'downColor', label: 'Aroon Down', type: 'color', default: '#F7525F' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  'awesome-oscillator': {
    id: 'awesome-oscillator',
    name: 'Awesome Oscillator',
    params: [
      { key: 'fastPeriod', label: 'Fast Period', default: 5, min: 1, max: 100 },
      { key: 'slowPeriod', label: 'Slow Period', default: 34, min: 1, max: 200 },
    ],
    styles: [
      { key: 'histUpColor', label: 'Histogram Up', type: 'color', default: 'rgba(34,171,148,0.4)' },
      { key: 'histDownColor', label: 'Histogram Down', type: 'color', default: 'rgba(247,82,95,0.4)' },
    ],
  },
  'chaikin-mf': {
    id: 'chaikin-mf',
    name: 'Chaikin Money Flow',
    params: [
      { key: 'period', label: 'Period', default: 20, min: 1, max: 200 },
    ],
    styles: [
      { key: 'color', label: 'CMF Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  coppock: {
    id: 'coppock',
    name: 'Coppock Curve',
    params: [
      { key: 'wmaPeriod', label: 'WMA Period', default: 10, min: 1, max: 100 },
      { key: 'longROC', label: 'Long ROC', default: 14, min: 1, max: 100 },
      { key: 'shortROC', label: 'Short ROC', default: 11, min: 1, max: 100 },
    ],
    styles: [
      { key: 'color', label: 'Coppock Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  'elder-force': {
    id: 'elder-force',
    name: 'Elder Force Index',
    params: [
      { key: 'period', label: 'Period', default: 13, min: 1, max: 100 },
    ],
    styles: [
      { key: 'color', label: 'Force Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  trix: {
    id: 'trix',
    name: 'TRIX',
    params: [
      { key: 'period', label: 'Period', default: 15, min: 1, max: 100 },
      { key: 'signalPeriod', label: 'Signal Period', default: 9, min: 1, max: 100 },
    ],
    styles: [
      { key: 'trixColor', label: 'TRIX Line', type: 'color', default: '#2962ff' },
      { key: 'signalColor', label: 'Signal Line', type: 'color', default: '#ff6d00' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  choppiness: {
    id: 'choppiness',
    name: 'Choppiness Index',
    params: [
      { key: 'period', label: 'Period', default: 14, min: 1, max: 100 },
    ],
    styles: [
      { key: 'color', label: 'Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  mfi: {
    id: 'mfi',
    name: 'Money Flow Index',
    params: [
      { key: 'period', label: 'Period', default: 14, min: 1, max: 100 },
    ],
    styles: [
      { key: 'color', label: 'MFI Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  roc: {
    id: 'roc',
    name: 'Rate of Change',
    params: [
      { key: 'period', label: 'Period', default: 12, min: 1, max: 200 },
    ],
    styles: [
      { key: 'color', label: 'ROC Line', type: 'color', default: '#2962ff' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
  'pivot-points': {
    id: 'pivot-points',
    name: 'Pivot Points',
    params: [],
    styles: [
      { key: 'ppColor', label: 'Pivot (PP)', type: 'color', default: '#2962ff' },
      { key: 'resistanceColor', label: 'Resistance (R1-R3)', type: 'color', default: '#F7525F' },
      { key: 'supportColor', label: 'Support (S1-S3)', type: 'color', default: '#22AB94' },
      { key: 'lineWidth', label: 'Line Width', type: 'lineWidth', default: 2 },
    ],
  },
};

/** Build the colors map expected by the library from user style settings. */
export function stylesToColorMap(
  indicatorId: string,
  styles: Record<string, string | number>,
): Record<string, string> | undefined {
  switch (indicatorId) {
    case 'bollinger':
      return {
        upper: (styles.upperColor as string) ?? '#42a5f5',
        middle: (styles.middleColor as string) ?? '#2962ff',
        lower: (styles.lowerColor as string) ?? '#42a5f5',
      };
    case 'macd':
      return {
        macd: (styles.macdColor as string) ?? '#2962ff',
        signal: (styles.signalColor as string) ?? '#ff6d00',
        histogram: (styles.histUpColor as string) ?? 'rgba(34,171,148,0.4)',
      };
    case 'stochastic':
      return {
        k: (styles.kColor as string) ?? '#2962ff',
        d: (styles.dColor as string) ?? '#ff6d00',
      };
    case 'adx':
      return {
        adx: (styles.adxColor as string) ?? '#2962ff',
        plusDI: (styles.plusDIColor as string) ?? '#22AB94',
        minusDI: (styles.minusDIColor as string) ?? '#F7525F',
      };
    case 'ichimoku':
      return {
        tenkan: (styles.tenkanColor as string) ?? '#2962ff',
        kijun: (styles.kijunColor as string) ?? '#F7525F',
        senkouA: (styles.senkouAColor as string) ?? '#22AB94',
        senkouB: (styles.senkouBColor as string) ?? '#ee6823',
        chikou: (styles.chikouColor as string) ?? '#9c27b0',
      };
    case 'keltner':
      return {
        upper: (styles.upperColor as string) ?? '#42a5f5',
        middle: (styles.middleColor as string) ?? '#2962ff',
        lower: (styles.lowerColor as string) ?? '#42a5f5',
      };
    case 'donchian':
      return {
        upper: (styles.upperColor as string) ?? '#42a5f5',
        middle: (styles.middleColor as string) ?? '#2962ff',
        lower: (styles.lowerColor as string) ?? '#42a5f5',
      };
    case 'pivot-points':
      return {
        pp: (styles.ppColor as string) ?? '#2962ff',
        r1: (styles.resistanceColor as string) ?? '#F7525F',
        r2: (styles.resistanceColor as string) ?? '#F7525F',
        r3: (styles.resistanceColor as string) ?? '#F7525F',
        s1: (styles.supportColor as string) ?? '#22AB94',
        s2: (styles.supportColor as string) ?? '#22AB94',
        s3: (styles.supportColor as string) ?? '#22AB94',
      };
    case 'aroon':
      return {
        up: (styles.upColor as string) ?? '#22AB94',
        down: (styles.downColor as string) ?? '#F7525F',
      };
    case 'trix':
      return {
        trix: (styles.trixColor as string) ?? '#2962ff',
        signal: (styles.signalColor as string) ?? '#ff6d00',
      };
    default:
      return undefined;
  }
}
