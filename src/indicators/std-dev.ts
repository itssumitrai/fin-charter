import { computeSMA } from './sma';

export function computeStdDev(
  close: Float64Array,
  length: number,
  period: number,
  multiplier: number,
): Float64Array {
  const result = new Float64Array(length);
  const mean = computeSMA(close, length, period);

  for (let i = 0; i < length; i++) {
    if (i < period - 1) {
      result[i] = NaN;
    } else {
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = close[j] - mean[i];
        variance += diff * diff;
      }
      result[i] = Math.sqrt(variance / period) * multiplier;
    }
  }

  return result;
}
