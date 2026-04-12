/**
 * Weighted Moving Average (WMA)
 * Most recent bar has weight = period, second = period-1, ..., oldest = 1.
 * Denominator = period * (period + 1) / 2
 */
export function computeWMA(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const denom = (period * (period + 1)) / 2;

  for (let i = 0; i < period - 1 && i < length; i++) result[i] = NaN;

  if (length >= period) {
    // Compute first WMA value
    let weightedSum = 0;
    let plainSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += close[period - 1 - j] * (period - j);
      plainSum += close[period - 1 - j];
    }
    result[period - 1] = weightedSum / denom;

    // Slide the window
    for (let i = period; i < length; i++) {
      // New value enters with weight=period, all others shift down by 1
      weightedSum = weightedSum - plainSum + period * close[i];
      plainSum = plainSum - close[i - period] + close[i];
      result[i] = weightedSum / denom;
    }
  }

  return result;
}
