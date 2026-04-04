import { computeEMASkipNaN } from './utils';

export function computeElderForce(close: Float64Array, volume: Float64Array, length: number, period: number): Float64Array {
  const raw = new Float64Array(length);
  raw[0] = NaN;
  for (let i = 1; i < length; i++) raw[i] = (close[i] - close[i - 1]) * volume[i];
  // raw[0] is NaN — use NaN-aware EMA to skip it during SMA seed
  return computeEMASkipNaN(raw, length, period);
}
