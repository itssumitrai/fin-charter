import type { IndicatorRegistration } from '../core/registry';
import { registerIndicator } from '../core/registry';
import { computeSMA } from './sma';
import { computeEMA } from './ema';
import { computeRSI } from './rsi';
import { computeMACD } from './macd';
import { computeBollinger } from './bollinger';
import { computeVWAP } from './vwap';
import { computeStochastic } from './stochastic';
import { computeATR } from './atr';
import { computeADX } from './adx';
import { computeOBV } from './obv';
import { computeWilliamsR } from './williams-r';
import { computeIchimoku } from './ichimoku';
import { computeParabolicSAR } from './parabolic-sar';
import { computeKeltner } from './keltner';
import { computeDonchian } from './donchian';
import { computeCCI } from './cci';
import { computePivotPoints } from './pivot-points';
import { computeAroon } from './aroon';
import { computeAwesomeOscillator } from './awesome-oscillator';
import { computeChaikinMF } from './chaikin-mf';
import { computeCoppock } from './coppock';
import { computeElderForce } from './elder-force';
import { computeTRIX } from './trix';
import { computeSupertrend } from './supertrend';
import { computeVWMA } from './vwma';
import { computeChoppiness } from './choppiness';
import { computeMFI } from './mfi';
import { computeROC } from './roc';
import { computeLinearRegression } from './linear-regression';

export const SMA: IndicatorRegistration = {
  type: 'sma',
  overlay: true,
  defaultParams: { period: 20 },
  compute(store, params) {
    return { value: computeSMA(store.close, store.length, params.period) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(SMA);

export const EMA: IndicatorRegistration = {
  type: 'ema',
  overlay: true,
  defaultParams: { period: 20 },
  compute(store, params) {
    return { value: computeEMA(store.close, store.length, params.period) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(EMA);

export const RSI: IndicatorRegistration = {
  type: 'rsi',
  overlay: false,
  defaultParams: { period: 14 },
  compute(store, params) {
    return { value: computeRSI(store.close, store.length, params.period) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(RSI);

export const MACD: IndicatorRegistration = {
  type: 'macd',
  overlay: false,
  defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  compute(store, params) {
    const r = computeMACD(store.close, store.length, params.fastPeriod, params.slowPeriod, params.signalPeriod);
    return { macd: r.macd, signal: r.signal, histogram: r.histogram };
  },
  colorMap(_primaryColor) {
    return { macd: '#2962ff', signal: '#ff6d00', histogram: '#00E396' };
  },
};
registerIndicator(MACD);

export const BOLLINGER: IndicatorRegistration = {
  type: 'bollinger',
  overlay: true,
  defaultParams: { period: 20, stdDev: 2 },
  compute(store, params) {
    const r = computeBollinger(store.close, store.length, params.period, params.stdDev);
    return { upper: r.upper, middle: r.middle, lower: r.lower };
  },
  colorMap(primaryColor) {
    return { upper: '#42a5f5', middle: primaryColor, lower: '#42a5f5' };
  },
};
registerIndicator(BOLLINGER);

export const VWAP: IndicatorRegistration = {
  type: 'vwap',
  overlay: true,
  defaultParams: {},
  compute(store, _params) {
    return { value: computeVWAP(store.high, store.low, store.close, store.volume, store.length, store.time) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(VWAP);

export const STOCHASTIC: IndicatorRegistration = {
  type: 'stochastic',
  overlay: false,
  defaultParams: { kPeriod: 14, dPeriod: 3 },
  compute(store, params) {
    const r = computeStochastic(store.high, store.low, store.close, store.length, params.kPeriod, params.dPeriod);
    return { k: r.k, d: r.d };
  },
  colorMap(primaryColor) {
    return { k: primaryColor, d: '#ff6d00' };
  },
};
registerIndicator(STOCHASTIC);

export const ATR: IndicatorRegistration = {
  type: 'atr',
  overlay: false,
  defaultParams: { period: 14 },
  compute(store, params) {
    return { value: computeATR(store.high, store.low, store.close, store.length, params.period) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(ATR);

export const ADX: IndicatorRegistration = {
  type: 'adx',
  overlay: false,
  defaultParams: { period: 14 },
  compute(store, params) {
    const r = computeADX(store.high, store.low, store.close, store.length, params.period);
    return { adx: r.adx, plusDI: r.plusDI, minusDI: r.minusDI };
  },
  colorMap(primaryColor) {
    return { adx: primaryColor, plusDI: '#00E396', minusDI: '#FF3B5C' };
  },
};
registerIndicator(ADX);

export const OBV: IndicatorRegistration = {
  type: 'obv',
  overlay: false,
  defaultParams: {},
  compute(store, _params) {
    return { value: computeOBV(store.close, store.volume, store.length) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(OBV);

export const WILLIAMS_R: IndicatorRegistration = {
  type: 'williams-r',
  overlay: false,
  defaultParams: { period: 14 },
  compute(store, params) {
    return { value: computeWilliamsR(store.high, store.low, store.close, store.length, params.period) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(WILLIAMS_R);

export const ICHIMOKU: IndicatorRegistration = {
  type: 'ichimoku',
  overlay: true,
  defaultParams: { tenkanPeriod: 9, kijunPeriod: 26, senkouPeriod: 52 },
  compute(store, params) {
    const r = computeIchimoku(store.high, store.low, store.close, store.length, params.tenkanPeriod, params.kijunPeriod, params.senkouPeriod);
    return { tenkan: r.tenkan, kijun: r.kijun, senkouA: r.senkouA, senkouB: r.senkouB, chikou: r.chikou };
  },
  colorMap(_primaryColor) {
    return { tenkan: '#2962ff', kijun: '#FF3B5C', senkouA: '#00E396', senkouB: '#ee6823', chikou: '#9c27b0' };
  },
};
registerIndicator(ICHIMOKU);

export const PARABOLIC_SAR: IndicatorRegistration = {
  type: 'parabolic-sar',
  overlay: true,
  defaultParams: { afStep: 0.02, afMax: 0.20 },
  compute(store, params) {
    return { value: computeParabolicSAR(store.high, store.low, store.length, params.afStep, params.afMax) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(PARABOLIC_SAR);

export const KELTNER: IndicatorRegistration = {
  type: 'keltner',
  overlay: true,
  defaultParams: { emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
  compute(store, params) {
    const r = computeKeltner(store.close, store.high, store.low, store.length, params.emaPeriod, params.atrPeriod, params.multiplier);
    return { upper: r.upper, middle: r.middle, lower: r.lower };
  },
  colorMap(primaryColor) {
    return { upper: '#42a5f5', middle: primaryColor, lower: '#42a5f5' };
  },
};
registerIndicator(KELTNER);

export const DONCHIAN: IndicatorRegistration = {
  type: 'donchian',
  overlay: true,
  defaultParams: { period: 20 },
  compute(store, params) {
    const r = computeDonchian(store.high, store.low, store.length, params.period);
    return { upper: r.upper, middle: r.middle, lower: r.lower };
  },
  colorMap(primaryColor) {
    return { upper: '#42a5f5', middle: primaryColor, lower: '#42a5f5' };
  },
};
registerIndicator(DONCHIAN);

export const CCI: IndicatorRegistration = {
  type: 'cci',
  overlay: false,
  defaultParams: { period: 20 },
  compute(store, params) {
    return { value: computeCCI(store.high, store.low, store.close, store.length, params.period) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(CCI);

export const PIVOT_POINTS: IndicatorRegistration = {
  type: 'pivot-points',
  overlay: false,
  defaultParams: {},
  compute(store, _params) {
    const r = computePivotPoints(store.high, store.low, store.close, store.length);
    return { pp: r.pp, r1: r.r1, r2: r.r2, r3: r.r3, s1: r.s1, s2: r.s2, s3: r.s3 };
  },
  colorMap(primaryColor) {
    return { pp: primaryColor, r1: '#FF3B5C', r2: '#FF3B5C', r3: '#FF3B5C', s1: '#00E396', s2: '#00E396', s3: '#00E396' };
  },
};
registerIndicator(PIVOT_POINTS);

export const AROON: IndicatorRegistration = {
  type: 'aroon',
  overlay: false,
  defaultParams: { period: 25 },
  compute(store, params) {
    const r = computeAroon(store.high, store.low, store.length, params.period ?? 25);
    return { up: r.up, down: r.down };
  },
  colorMap(_primaryColor) {
    return { up: '#00E396', down: '#FF3B5C' };
  },
};
registerIndicator(AROON);

export const AWESOME_OSCILLATOR: IndicatorRegistration = {
  type: 'awesome-oscillator',
  overlay: false,
  defaultParams: { fastPeriod: 5, slowPeriod: 34 },
  compute(store, params) {
    return { histogram: computeAwesomeOscillator(store.high, store.low, store.length, params.fastPeriod ?? 5, params.slowPeriod ?? 34) };
  },
  colorMap(primaryColor) {
    return { histogram: primaryColor };
  },
};
registerIndicator(AWESOME_OSCILLATOR);

export const CHAIKIN_MF: IndicatorRegistration = {
  type: 'chaikin-mf',
  overlay: false,
  defaultParams: { period: 20 },
  compute(store, params) {
    return { value: computeChaikinMF(store.high, store.low, store.close, store.volume, store.length, params.period ?? 20) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(CHAIKIN_MF);

export const COPPOCK: IndicatorRegistration = {
  type: 'coppock',
  overlay: false,
  defaultParams: { wmaPeriod: 10, longROC: 14, shortROC: 11 },
  compute(store, params) {
    return { value: computeCoppock(store.close, store.length, params.wmaPeriod ?? 10, params.longROC ?? 14, params.shortROC ?? 11) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(COPPOCK);

export const ELDER_FORCE: IndicatorRegistration = {
  type: 'elder-force',
  overlay: false,
  defaultParams: { period: 13 },
  compute(store, params) {
    return { value: computeElderForce(store.close, store.volume, store.length, params.period ?? 13) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(ELDER_FORCE);

export const TRIX: IndicatorRegistration = {
  type: 'trix',
  overlay: false,
  defaultParams: { period: 15, signalPeriod: 9 },
  compute(store, params) {
    const r = computeTRIX(store.close, store.length, params.period ?? 15, params.signalPeriod ?? 9);
    return { trix: r.trix, signal: r.signal };
  },
  colorMap(primaryColor) {
    return { trix: primaryColor, signal: '#ff6d00' };
  },
};
registerIndicator(TRIX);

export const SUPERTREND: IndicatorRegistration = {
  type: 'supertrend',
  overlay: true,
  defaultParams: { period: 10, multiplier: 3 },
  compute(store, params) {
    const r = computeSupertrend(store.high, store.low, store.close, store.length, params.period ?? 10, params.multiplier ?? 3);
    return { value: r.value };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(SUPERTREND);

export const VWMA: IndicatorRegistration = {
  type: 'vwma',
  overlay: true,
  defaultParams: { period: 20 },
  compute(store, params) {
    return { value: computeVWMA(store.close, store.volume, store.length, params.period ?? 20) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(VWMA);

export const CHOPPINESS: IndicatorRegistration = {
  type: 'choppiness',
  overlay: false,
  defaultParams: { period: 14 },
  compute(store, params) {
    return { value: computeChoppiness(store.high, store.low, store.close, store.length, params.period ?? 14) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(CHOPPINESS);

export const MFI: IndicatorRegistration = {
  type: 'mfi',
  overlay: false,
  defaultParams: { period: 14 },
  compute(store, params) {
    return { value: computeMFI(store.high, store.low, store.close, store.volume, store.length, params.period ?? 14) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(MFI);

export const ROC: IndicatorRegistration = {
  type: 'roc',
  overlay: false,
  defaultParams: { period: 12 },
  compute(store, params) {
    return { value: computeROC(store.close, store.length, params.period ?? 12) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(ROC);

export const LINEAR_REGRESSION: IndicatorRegistration = {
  type: 'linear-regression',
  overlay: true,
  defaultParams: { period: 20 },
  compute(store, params) {
    return { value: computeLinearRegression(store.close, store.length, params.period ?? 20) };
  },
  colorMap(primaryColor) {
    return { value: primaryColor };
  },
};
registerIndicator(LINEAR_REGRESSION);

export const allIndicators: IndicatorRegistration[] = [
  SMA,
  EMA,
  RSI,
  MACD,
  BOLLINGER,
  VWAP,
  STOCHASTIC,
  ATR,
  ADX,
  OBV,
  WILLIAMS_R,
  ICHIMOKU,
  PARABOLIC_SAR,
  KELTNER,
  DONCHIAN,
  CCI,
  PIVOT_POINTS,
  AROON,
  AWESOME_OSCILLATOR,
  CHAIKIN_MF,
  COPPOCK,
  ELDER_FORCE,
  TRIX,
  SUPERTREND,
  VWMA,
  CHOPPINESS,
  MFI,
  ROC,
  LINEAR_REGRESSION,
];
