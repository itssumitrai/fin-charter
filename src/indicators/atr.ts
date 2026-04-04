export function computeATR(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number
): Float64Array {
  const result = new Float64Array(length);

  // NaN for indices [0, period-1]
  for (let i = 0; i <= period - 1; i++) {
    result[i] = NaN;
  }

  if (length <= period) {
    return result;
  }

  // Compute TRs for indices 1..period and average for first ATR at index period
  let sumTR = 0;
  for (let i = 1; i <= period; i++) {
    const hl = high[i] - low[i];
    const hpc = Math.abs(high[i] - close[i - 1]);
    const lpc = Math.abs(low[i] - close[i - 1]);
    sumTR += Math.max(hl, hpc, lpc);
  }

  let atr = sumTR / period;
  result[period] = atr;

  // Wilder smoothing: ATR = (prev * (period-1) + TR) / period
  for (let i = period + 1; i < length; i++) {
    const hl = high[i] - low[i];
    const hpc = Math.abs(high[i] - close[i - 1]);
    const lpc = Math.abs(low[i] - close[i - 1]);
    const tr = Math.max(hl, hpc, lpc);

    atr = (atr * (period - 1) + tr) / period;
    result[i] = atr;
  }

  return result;
}
