export function computeROC(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period; i++) result[i] = NaN;
  for (let i = period; i < length; i++) {
    const prev = close[i - period];
    result[i] = prev === 0 ? NaN : ((close[i] - prev) / prev) * 100;
  }
  return result;
}
