import { computeSMA } from './sma';

export interface BollingerResult {
  upper: Float64Array;
  middle: Float64Array;
  lower: Float64Array;
}

export function computeBollinger(
  close: Float64Array,
  length: number,
  period: number,
  stdDev: number,
): BollingerResult {
  const upper = new Float64Array(length);
  const middle = computeSMA(close, length, period);
  const lower = new Float64Array(length);

  for (let i = 0; i < length; i++) {
    if (i < period - 1) {
      upper[i] = NaN;
      lower[i] = NaN;
    } else {
      const mean = middle[i];
      // Compute population standard deviation over the window
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = close[j] - mean;
        variance += diff * diff;
      }
      const sd = Math.sqrt(variance / period);
      upper[i] = mean + stdDev * sd;
      lower[i] = mean - stdDev * sd;
    }
  }

  return { upper, middle, lower };
}
