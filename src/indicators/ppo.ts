import { computeEMA } from './ema';
import { computeEMASkipNaN } from './utils';

export interface PPOResult {
  ppo: Float64Array;
  signal: Float64Array;
  histogram: Float64Array;
}

/**
 * Percentage Price Oscillator (PPO)
 * Like MACD but percentage-based:
 * PPO = (EMA(fast) - EMA(slow)) / EMA(slow) * 100
 * Signal = EMA(PPO, signalPeriod)
 * Histogram = PPO - Signal
 */
export function computePPO(
  close: Float64Array,
  length: number,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): PPOResult {
  const ppo = new Float64Array(length);
  const signal = new Float64Array(length);
  const histogram = new Float64Array(length);

  const fastEMA = computeEMA(close, length, fastPeriod);
  const slowEMA = computeEMA(close, length, slowPeriod);

  for (let i = 0; i < length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i]) || slowEMA[i] === 0) {
      ppo[i] = NaN;
    } else {
      ppo[i] = ((fastEMA[i] - slowEMA[i]) / slowEMA[i]) * 100;
    }
  }

  const signalLine = computeEMASkipNaN(ppo, length, signalPeriod);

  for (let i = 0; i < length; i++) {
    signal[i] = signalLine[i];
    histogram[i] = isNaN(ppo[i]) || isNaN(signal[i]) ? NaN : ppo[i] - signal[i];
  }

  return { ppo, signal, histogram };
}
