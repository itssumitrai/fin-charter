import { computeRSI } from './rsi';

export interface StochRSIResult {
  k: Float64Array;
  d: Float64Array;
}

function rollingMean(input: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length).fill(NaN);
  let firstValid = 0;
  while (firstValid < length && isNaN(input[firstValid])) firstValid++;
  if (firstValid + period > length) return result;
  let sum = 0;
  for (let i = firstValid; i < firstValid + period; i++) sum += input[i];
  result[firstValid + period - 1] = sum / period;
  for (let i = firstValid + period; i < length; i++) {
    sum += input[i] - input[i - period];
    result[i] = sum / period;
  }
  return result;
}

export function computeStochRSI(
  close: Float64Array,
  length: number,
  rsiPeriod: number,
  stochPeriod: number,
  kPeriod: number,
  dPeriod: number,
): StochRSIResult {
  const rsi = computeRSI(close, length, rsiPeriod);

  // K_raw: stochastic applied to RSI
  const kRaw = new Float64Array(length).fill(NaN);
  const startIdx = rsiPeriod + stochPeriod - 1;

  for (let i = startIdx; i < length; i++) {
    let minRSI = Infinity;
    let maxRSI = -Infinity;
    for (let j = i - stochPeriod + 1; j <= i; j++) {
      const v = rsi[j];
      if (!isNaN(v)) {
        if (v < minRSI) minRSI = v;
        if (v > maxRSI) maxRSI = v;
      }
    }
    const range = maxRSI - minRSI;
    if (range === 0 || !isFinite(minRSI) || !isFinite(maxRSI)) {
      kRaw[i] = NaN;
    } else {
      kRaw[i] = ((rsi[i] - minRSI) / range) * 100;
    }
  }

  const k = rollingMean(kRaw, length, kPeriod);
  const d = rollingMean(k, length, dPeriod);

  return { k, d };
}

