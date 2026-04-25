export function computeAD(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  length: number,
): Float64Array {
  const result = new Float64Array(length);
  let cum = 0;
  for (let i = 0; i < length; i++) {
    const hl = high[i] - low[i];
    const mfm = hl === 0 ? 0 : ((close[i] - low[i]) - (high[i] - close[i])) / hl;
    cum += mfm * volume[i];
    result[i] = cum;
  }
  return result;
}
