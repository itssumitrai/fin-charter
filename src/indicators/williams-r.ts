export function computeWilliamsR(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number
): Float64Array {
  const result = new Float64Array(length);

  // NaN for indices [0, period-2]
  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  for (let i = period - 1; i < length; i++) {
    let highestHigh = high[i];
    let lowestLow = low[i];

    for (let j = i - period + 1; j <= i; j++) {
      if (high[j] > highestHigh) highestHigh = high[j];
      if (low[j] < lowestLow) lowestLow = low[j];
    }

    const range = highestHigh - lowestLow;
    if (range === 0) {
      result[i] = 0;
    } else {
      result[i] = ((highestHigh - close[i]) / range) * -100;
    }
  }

  return result;
}
