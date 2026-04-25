export function computeALMA(
  close: Float64Array,
  length: number,
  period: number,
  offset: number,
  sigma: number,
): Float64Array {
  const result = new Float64Array(length);

  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  if (length < period) {
    for (let i = period - 1; i < length; i++) {
      result[i] = NaN;
    }
    return result;
  }

  const m = offset * (period - 1);
  const s = period / sigma;
  const s2 = 2 * s * s;

  // Precompute weights
  const weights = new Float64Array(period);
  let wSum = 0;
  for (let j = 0; j < period; j++) {
    const diff = j - m;
    weights[j] = Math.exp(-(diff * diff) / s2);
    wSum += weights[j];
  }

  for (let i = period - 1; i < length; i++) {
    let val = 0;
    for (let j = 0; j < period; j++) {
      val += weights[j] * close[i - period + 1 + j];
    }
    result[i] = val / wSum;
  }

  return result;
}
