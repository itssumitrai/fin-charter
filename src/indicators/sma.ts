export function computeSMA(close: Float64Array, length: number, period: number): Float64Array {
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

  // Compute initial sum for first window
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += close[i];
  }
  result[period - 1] = sum / period;

  // Sliding window O(1) per bar
  for (let i = period; i < length; i++) {
    sum += close[i] - close[i - period];
    result[i] = sum / period;
  }

  return result;
}
