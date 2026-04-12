import { computeEMA } from './ema';
import { computeEMASkipNaN } from './utils';

/**
 * Double Exponential Moving Average (DEMA)
 * Formula: 2 * EMA(close, period) - EMA(EMA(close, period), period)
 */
export function computeDEMA(close: Float64Array, length: number, period: number): Float64Array {
  const ema1 = computeEMA(close, length, period);
  const ema2 = computeEMASkipNaN(ema1, length, period);
  const result = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = isNaN(ema1[i]) || isNaN(ema2[i]) ? NaN : 2 * ema1[i] - ema2[i];
  }
  return result;
}
