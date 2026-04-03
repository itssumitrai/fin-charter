export function computeRSI(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);

  // Fill indices 0 through period-1 with NaN (RSI undefined for first `period` values)
  for (let i = 0; i < period; i++) {
    result[i] = NaN;
  }

  if (length <= period) {
    return result;
  }

  // Compute initial avgGain / avgLoss from first `period` changes
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = close[i] - close[i - 1];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += -change;
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // First RSI at index period
  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    result[period] = 100 - 100 / (1 + avgGain / avgLoss);
  }

  // Wilder's smoothing for subsequent values
  for (let i = period + 1; i < length; i++) {
    const change = close[i] - close[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      result[i] = 100 - 100 / (1 + avgGain / avgLoss);
    }
  }

  return result;
}
