import { computeEMA } from './ema';
import { computeEMASkipNaN } from './utils';

/**
 * Triple Exponential Moving Average (TEMA)
 * Formula: 3 * EMA1 - 3 * EMA2 + EMA3
 * Where EMA2 = EMA(EMA1), EMA3 = EMA(EMA2)
 */
export function computeTEMA(close: Float64Array, length: number, period: number): Float64Array {
  const ema1 = computeEMA(close, length, period);
  const ema2 = computeEMASkipNaN(ema1, length, period);
  const ema3 = computeEMASkipNaN(ema2, length, period);
  const result = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = isNaN(ema1[i]) || isNaN(ema2[i]) || isNaN(ema3[i])
      ? NaN
      : 3 * ema1[i] - 3 * ema2[i] + ema3[i];
  }
  return result;
}
