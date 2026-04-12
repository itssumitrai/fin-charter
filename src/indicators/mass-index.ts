import { computeEMASkipNaN } from './utils';

/**
 * Mass Index
 * Single EMA = EMA(high - low, 9)
 * Double EMA = EMA(Single EMA, 9)
 * EMA Ratio = Single EMA / Double EMA
 * Mass Index = Sum(EMA Ratio, period)
 * Standard period = 25
 */
export function computeMassIndex(
  high: Float64Array,
  low: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const result = new Float64Array(length);

  // HL range
  const hl = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    hl[i] = high[i] - low[i];
  }

  const emaPeriod = 9;
  const ema1 = computeEMASkipNaN(hl, length, emaPeriod);
  const ema2 = computeEMASkipNaN(ema1, length, emaPeriod);

  // EMA ratio
  const ratio = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    ratio[i] = isNaN(ema1[i]) || isNaN(ema2[i]) || ema2[i] === 0 ? NaN : ema1[i] / ema2[i];
  }

  // Find first valid ratio
  let firstRatio = 0;
  while (firstRatio < length && isNaN(ratio[firstRatio])) firstRatio++;

  const firstValid = firstRatio + period - 1;
  for (let i = 0; i < Math.min(firstValid, length); i++) {
    result[i] = NaN;
  }

  for (let i = firstValid; i < length; i++) {
    let sum = 0;
    let valid = true;
    for (let j = i - period + 1; j <= i; j++) {
      if (isNaN(ratio[j])) { valid = false; break; }
      sum += ratio[j];
    }
    result[i] = valid ? sum : NaN;
  }

  return result;
}
