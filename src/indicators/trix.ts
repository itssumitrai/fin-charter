import { computeEMA } from './ema';
import { computeEMASkipNaN } from './utils';

export interface TRIXResult { trix: Float64Array; signal: Float64Array; }

export function computeTRIX(close: Float64Array, length: number, period: number, signalPeriod: number): TRIXResult {
  const ema1 = computeEMA(close, length, period);
  // Second and third EMAs chain on NaN-leading output — use NaN-aware variant
  const ema2 = computeEMASkipNaN(ema1, length, period);
  const ema3 = computeEMASkipNaN(ema2, length, period);
  const trix = new Float64Array(length);
  trix[0] = NaN;
  for (let i = 1; i < length; i++) {
    trix[i] = isNaN(ema3[i]) || isNaN(ema3[i - 1]) || ema3[i - 1] === 0 ? NaN : ((ema3[i] - ema3[i - 1]) / ema3[i - 1]) * 100;
  }
  return { trix, signal: computeEMASkipNaN(trix, length, signalPeriod) };
}
