import { computeEMA } from './ema';
import { computeATR } from './atr';

export interface KeltnerResult {
  upper: Float64Array;
  middle: Float64Array;
  lower: Float64Array;
}

export function computeKeltner(
  close: Float64Array,
  high: Float64Array,
  low: Float64Array,
  length: number,
  emaPeriod = 20,
  atrPeriod = 10,
  multiplier = 2.0,
): KeltnerResult {
  const middle = computeEMA(close, length, emaPeriod);
  const atr = computeATR(high, low, close, length, atrPeriod);

  const upper = new Float64Array(length);
  const lower = new Float64Array(length);

  for (let i = 0; i < length; i++) {
    if (isNaN(middle[i]) || isNaN(atr[i])) {
      upper[i] = NaN;
      lower[i] = NaN;
    } else {
      upper[i] = middle[i] + multiplier * atr[i];
      lower[i] = middle[i] - multiplier * atr[i];
    }
  }

  return { upper, middle, lower };
}
