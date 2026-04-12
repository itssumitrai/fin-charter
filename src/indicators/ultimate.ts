/**
 * Ultimate Oscillator
 * Buying Pressure (BP) = close - min(low, prior_close)
 * True Range (TR) = max(high, prior_close) - min(low, prior_close)
 * Average(period) = sum(BP, period) / sum(TR, period)
 * UO = 100 * (4 * Avg(p1) + 2 * Avg(p2) + Avg(p3)) / (4 + 2 + 1)
 * Standard defaults: p1=7, p2=14, p3=28
 */
export function computeUltimate(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  p1: number,
  p2: number,
  p3: number,
): Float64Array {
  const result = new Float64Array(length);
  const longestPeriod = Math.max(p1, p2, p3);

  // Need at least longestPeriod + 1 bars (the +1 is for prior close)
  const firstValid = longestPeriod; // index longestPeriod is the longestPeriod-th bar after the first

  for (let i = 0; i < firstValid; i++) {
    result[i] = NaN;
  }

  // Precompute BP and TR arrays
  const bp = new Float64Array(length);
  const tr = new Float64Array(length);
  bp[0] = NaN;
  tr[0] = NaN;

  for (let i = 1; i < length; i++) {
    const priorClose = close[i - 1];
    const minLow = Math.min(low[i], priorClose);
    const maxHigh = Math.max(high[i], priorClose);
    bp[i] = close[i] - minLow;
    tr[i] = maxHigh - minLow;
  }

  // Rolling sums helper using precomputed arrays
  const rollingSum = (arr: Float64Array, idx: number, period: number): number => {
    let s = 0;
    for (let j = idx - period + 1; j <= idx; j++) {
      if (isNaN(arr[j])) return NaN;
      s += arr[j];
    }
    return s;
  };

  for (let i = firstValid; i < length; i++) {
    const bpSum1 = rollingSum(bp, i, p1);
    const trSum1 = rollingSum(tr, i, p1);
    const bpSum2 = rollingSum(bp, i, p2);
    const trSum2 = rollingSum(tr, i, p2);
    const bpSum3 = rollingSum(bp, i, p3);
    const trSum3 = rollingSum(tr, i, p3);

    if (
      isNaN(bpSum1) || trSum1 === 0 ||
      isNaN(bpSum2) || trSum2 === 0 ||
      isNaN(bpSum3) || trSum3 === 0
    ) {
      result[i] = NaN;
      continue;
    }

    const avg1 = bpSum1 / trSum1;
    const avg2 = bpSum2 / trSum2;
    const avg3 = bpSum3 / trSum3;
    result[i] = (100 * (4 * avg1 + 2 * avg2 + avg3)) / 7;
  }

  return result;
}
