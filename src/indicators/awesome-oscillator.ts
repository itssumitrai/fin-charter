import { computeSMA } from './sma';

export function computeAwesomeOscillator(high: Float64Array, low: Float64Array, length: number, fastPeriod: number, slowPeriod: number): Float64Array {
  const median = new Float64Array(length);
  for (let i = 0; i < length; i++) median[i] = (high[i] + low[i]) / 2;
  const fast = computeSMA(median, length, fastPeriod);
  const slow = computeSMA(median, length, slowPeriod);
  const result = new Float64Array(length);
  for (let i = 0; i < length; i++) result[i] = isNaN(fast[i]) || isNaN(slow[i]) ? NaN : fast[i] - slow[i];
  return result;
}
