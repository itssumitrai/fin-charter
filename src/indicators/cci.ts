export function computeCCI(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period = 20,
): Float64Array {
  const result = new Float64Array(length);

  // Typical price
  const tp = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    tp[i] = (high[i] + low[i] + close[i]) / 3;
  }

  for (let i = 0; i < length; i++) {
    if (i < period - 1) {
      result[i] = NaN;
      continue;
    }

    // SMA of TP over window
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += tp[j];
    }
    const sma = sum / period;

    // Mean deviation
    let meanDev = 0;
    for (let j = i - period + 1; j <= i; j++) {
      meanDev += Math.abs(tp[j] - sma);
    }
    meanDev /= period;

    result[i] = meanDev === 0 ? 0 : (tp[i] - sma) / (0.015 * meanDev);
  }

  return result;
}
