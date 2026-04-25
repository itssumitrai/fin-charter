import { computeSMA } from './sma';

function rollingMeanFromIndex(input: Float64Array, length: number, period: number, startIdx: number): Float64Array {
  const result = new Float64Array(length).fill(NaN);
  if (startIdx + period > length) return result;
  let sum = 0;
  for (let i = startIdx; i < startIdx + period; i++) sum += input[i];
  result[startIdx + period - 1] = sum / period;
  for (let i = startIdx + period; i < length; i++) {
    sum += input[i] - input[i - period];
    result[i] = sum / period;
  }
  return result;
}

export function computeEMV(
  high: Float64Array,
  low: Float64Array,
  volume: Float64Array,
  length: number,
  period: number,
): Float64Array {
  if (length < 2) {
    const result = new Float64Array(length).fill(NaN);
    return result;
  }

  // rawEMV is only valid from index 1 onwards
  const rawEMV = new Float64Array(length);
  for (let i = 1; i < length; i++) {
    const midpoint = (high[i] + low[i]) / 2;
    const prevMidpoint = (high[i - 1] + low[i - 1]) / 2;
    const distance = midpoint - prevMidpoint;
    const hl = high[i] - low[i];
    const boxRatio = hl === 0 ? 0 : (volume[i] / 1e6) / hl;
    rawEMV[i] = boxRatio === 0 ? 0 : distance / boxRatio;
  }

  // Compute SMA of rawEMV starting from index 1 (index 0 is undefined)
  return rollingMeanFromIndex(rawEMV, length, period, 1);
}
