import { computeWMA } from './wma';

/**
 * Hull Moving Average (HMA)
 * Formula: WMA(2 * WMA(close, floor(period/2)) - WMA(close, period), floor(sqrt(period)))
 */
export function computeHMA(close: Float64Array, length: number, period: number): Float64Array {
  const halfPeriod = Math.max(1, Math.floor(period / 2));
  const sqrtPeriod = Math.max(1, Math.floor(Math.sqrt(period)));

  const wmaHalf = computeWMA(close, length, halfPeriod);
  const wmaFull = computeWMA(close, length, period);

  // Intermediate series: 2 * WMA(n/2) - WMA(n)
  const diff = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    diff[i] = isNaN(wmaHalf[i]) || isNaN(wmaFull[i]) ? NaN : 2 * wmaHalf[i] - wmaFull[i];
  }

  // WMA of the intermediate series using sqrtPeriod, skipping leading NaN
  const result = new Float64Array(length);
  const denom = (sqrtPeriod * (sqrtPeriod + 1)) / 2;

  // Find first valid index in diff
  let start = 0;
  while (start < length && isNaN(diff[start])) start++;

  const firstValid = start + sqrtPeriod - 1;
  for (let i = 0; i < Math.min(firstValid, length); i++) {
    result[i] = NaN;
  }

  for (let i = firstValid; i < length; i++) {
    let weightedSum = 0;
    let valid = true;
    for (let j = 0; j < sqrtPeriod; j++) {
      const val = diff[i - j];
      if (isNaN(val)) { valid = false; break; }
      weightedSum += val * (sqrtPeriod - j);
    }
    result[i] = valid ? weightedSum / denom : NaN;
  }

  return result;
}
