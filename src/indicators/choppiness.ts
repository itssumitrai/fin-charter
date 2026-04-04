import { computeATR } from './atr';

export function computeChoppiness(high: Float64Array, low: Float64Array, close: Float64Array, length: number, period: number): Float64Array {
  const atr1 = computeATR(high, low, close, length, 1);
  const result = new Float64Array(length);
  for (let i = 0; i < period; i++) result[i] = NaN;
  for (let i = period; i < length; i++) {
    let atrSum = 0, hh = -Infinity, ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      atrSum += isNaN(atr1[j]) ? 0 : atr1[j];
      if (high[j] > hh) hh = high[j];
      if (low[j] < ll) ll = low[j];
    }
    const range = hh - ll;
    result[i] = range === 0 ? NaN : 100 * Math.log10(atrSum / range) / Math.log10(period);
  }
  return result;
}
