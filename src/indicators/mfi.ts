export function computeMFI(high: Float64Array, low: Float64Array, close: Float64Array, volume: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period; i++) result[i] = NaN;
  for (let i = period; i < length; i++) {
    let posFlow = 0, negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const tp = (high[j] + low[j] + close[j]) / 3;
      const prevTp = (high[j - 1] + low[j - 1] + close[j - 1]) / 3;
      const rawMF = tp * volume[j];
      if (tp > prevTp) posFlow += rawMF;
      else if (tp < prevTp) negFlow += rawMF;
    }
    result[i] = negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow);
  }
  return result;
}
