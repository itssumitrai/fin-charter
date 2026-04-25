import { computeSMA } from './sma';

export function computeBOP(
  open: Float64Array,
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const raw = new Float64Array(length);

  for (let i = 0; i < length; i++) {
    const hl = high[i] - low[i];
    raw[i] = hl === 0 ? 0 : (close[i] - open[i]) / hl;
  }

  return computeSMA(raw, length, period);
}
