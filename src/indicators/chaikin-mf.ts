export function computeChaikinMF(high: Float64Array, low: Float64Array, close: Float64Array, volume: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period - 1; i++) result[i] = NaN;
  for (let i = period - 1; i < length; i++) {
    let mfvSum = 0, volSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const hl = high[j] - low[j];
      const mfm = hl === 0 ? 0 : ((close[j] - low[j]) - (high[j] - close[j])) / hl;
      mfvSum += mfm * volume[j];
      volSum += volume[j];
    }
    result[i] = volSum === 0 ? 0 : mfvSum / volSum;
  }
  return result;
}
