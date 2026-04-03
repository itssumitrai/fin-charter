export function computeEMA(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);

  // Fill indices before period-1 with NaN
  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  if (length < period) {
    for (let i = period - 1; i < length; i++) {
      result[i] = NaN;
    }
    return result;
  }

  // First EMA value = SMA of first period values
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += close[i];
  }
  result[period - 1] = sum / period;

  // k = 2 / (period + 1)
  const k = 2 / (period + 1);

  // Apply EMA formula
  for (let i = period; i < length; i++) {
    result[i] = close[i] * k + result[i - 1] * (1 - k);
  }

  return result;
}
