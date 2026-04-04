import { slidingMax, slidingMin } from './utils';

export interface DonchianResult {
  upper: Float64Array;
  middle: Float64Array;
  lower: Float64Array;
}

export function computeDonchian(
  high: Float64Array,
  low: Float64Array,
  length: number,
  period = 20,
): DonchianResult {
  const upper = slidingMax(high, length, period);
  const lower = slidingMin(low, length, period);
  const middle = new Float64Array(length);

  for (let i = 0; i < length; i++) {
    middle[i] = (upper[i] + lower[i]) / 2;
  }

  return { upper, middle, lower };
}
