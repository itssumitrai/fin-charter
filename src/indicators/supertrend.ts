import { computeATR } from './atr';

export interface SupertrendResult { value: Float64Array; direction: Float64Array; }

export function computeSupertrend(high: Float64Array, low: Float64Array, close: Float64Array, length: number, period: number, multiplier: number): SupertrendResult {
  const atr = computeATR(high, low, close, length, period);
  const value = new Float64Array(length), direction = new Float64Array(length);
  for (let i = 0; i < period; i++) { value[i] = NaN; direction[i] = NaN; }
  let prevUpper = 0, prevLower = 0, prevDir = 1;
  for (let i = period; i < length; i++) {
    const mid = (high[i] + low[i]) / 2;
    let upper = mid + multiplier * atr[i];
    let lower = mid - multiplier * atr[i];
    if (i > period) {
      if (!(lower > prevLower || close[i - 1] < prevLower)) lower = prevLower;
      if (!(upper < prevUpper || close[i - 1] > prevUpper)) upper = prevUpper;
    }
    let dir: number;
    if (i === period) dir = close[i] > upper ? 1 : -1;
    else if (prevDir === 1) dir = close[i] < lower ? -1 : 1;
    else dir = close[i] > upper ? 1 : -1;
    value[i] = dir === 1 ? lower : upper;
    direction[i] = dir;
    prevUpper = upper; prevLower = lower; prevDir = dir;
  }
  return { value, direction };
}
