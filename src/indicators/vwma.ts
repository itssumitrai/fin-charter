export function computeVWMA(close: Float64Array, volume: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period - 1; i++) result[i] = NaN;
  for (let i = period - 1; i < length; i++) {
    let sumCV = 0, sumV = 0;
    for (let j = i - period + 1; j <= i; j++) { sumCV += close[j] * volume[j]; sumV += volume[j]; }
    result[i] = sumV === 0 ? NaN : sumCV / sumV;
  }
  return result;
}
