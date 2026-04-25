export function computePVT(
  close: Float64Array,
  volume: Float64Array,
  length: number,
): Float64Array {
  const result = new Float64Array(length);
  result[0] = 0;
  for (let i = 1; i < length; i++) {
    const prev = close[i - 1];
    const change = prev === 0 ? 0 : (close[i] - prev) / prev;
    result[i] = result[i - 1] + change * volume[i];
  }
  return result;
}
