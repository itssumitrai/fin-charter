/**
 * Weighted Moving Average (WMA)
 * Most recent bar has weight = period, second = period-1, ..., oldest = 1.
 * Denominator = period * (period + 1) / 2
 */
export function computeWMA(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const denom = (period * (period + 1)) / 2;

  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  for (let i = period - 1; i < length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += close[i - j] * (period - j);
    }
    result[i] = weightedSum / denom;
  }

  return result;
}
