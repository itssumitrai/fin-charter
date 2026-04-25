import { computeEMA } from './ema';

export function computeZLEMA(
  close: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const lag = Math.floor((period - 1) / 2);
  const adjusted = new Float64Array(length);

  for (let i = 0; i < length; i++) {
    if (i < lag) {
      adjusted[i] = close[i];
    } else {
      adjusted[i] = close[i] + (close[i] - close[i - lag]);
    }
  }

  return computeEMA(adjusted, length, period);
}
