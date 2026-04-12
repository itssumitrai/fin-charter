import { computeEMASkipNaN } from './utils';

export interface TSIResult {
  tsi: Float64Array;
}

/**
 * True Strength Index (TSI)
 * 1. Momentum = close[i] - close[i-1]
 * 2. Double-smoothed momentum: EMA(EMA(momentum, shortPeriod), longPeriod) ... wait,
 *    standard TSI smooths momentum first by longPeriod then by shortPeriod.
 * 3. Double-smoothed absolute momentum: same smoothing applied to |momentum|
 * 4. TSI = 100 * doubleSmoothed / doubleSmoothedAbs
 */
export function computeTSI(
  close: Float64Array,
  length: number,
  longPeriod: number,
  shortPeriod: number,
): TSIResult {
  const tsi = new Float64Array(length);

  if (length < 2) {
    tsi.fill(NaN);
    return { tsi };
  }

  // Momentum series (1-bar difference)
  const momentum = new Float64Array(length);
  const absMomentum = new Float64Array(length);
  momentum[0] = NaN;
  absMomentum[0] = NaN;
  for (let i = 1; i < length; i++) {
    momentum[i] = close[i] - close[i - 1];
    absMomentum[i] = Math.abs(momentum[i]);
  }

  // Double smooth: first EMA with longPeriod, then EMA with shortPeriod
  const ema1 = computeEMASkipNaN(momentum, length, longPeriod);
  const ema2 = computeEMASkipNaN(ema1, length, shortPeriod);

  const absEma1 = computeEMASkipNaN(absMomentum, length, longPeriod);
  const absEma2 = computeEMASkipNaN(absEma1, length, shortPeriod);

  for (let i = 0; i < length; i++) {
    if (isNaN(ema2[i]) || isNaN(absEma2[i]) || absEma2[i] === 0) {
      tsi[i] = NaN;
    } else {
      tsi[i] = 100 * (ema2[i] / absEma2[i]);
    }
  }

  return { tsi };
}
