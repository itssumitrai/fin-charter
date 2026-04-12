import { computeSMA } from './sma';

/**
 * Detrended Price Oscillator (DPO)
 * Formula: close[i] - SMA(close, period)[i - floor(period/2) - 1]
 * This removes the trend to highlight cycles.
 */
export function computeDPO(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const sma = computeSMA(close, length, period);
  const shift = Math.floor(period / 2) + 1;

  // Valid values start at index (period - 1 + shift)
  const firstValid = period - 1 + shift;
  for (let i = 0; i < firstValid; i++) {
    result[i] = NaN;
  }

  for (let i = firstValid; i < length; i++) {
    result[i] = close[i] - sma[i - shift];
  }

  return result;
}
