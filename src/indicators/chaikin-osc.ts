import { computeEMA } from './ema';

export function computeChaikinOsc(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  length: number,
  fastPeriod: number,
  slowPeriod: number,
): Float64Array {
  const result = new Float64Array(length);

  // Accumulation/Distribution line
  const adLine = new Float64Array(length);
  adLine[0] = 0;
  for (let i = 0; i < length; i++) {
    const hl = high[i] - low[i];
    const mfm = hl === 0 ? 0 : ((close[i] - low[i]) - (high[i] - close[i])) / hl;
    adLine[i] = (i === 0 ? 0 : adLine[i - 1]) + mfm * volume[i];
  }

  const fastEMA = computeEMA(adLine, length, fastPeriod);
  const slowEMA = computeEMA(adLine, length, slowPeriod);

  for (let i = 0; i < length; i++) {
    result[i] = isNaN(fastEMA[i]) || isNaN(slowEMA[i]) ? NaN : fastEMA[i] - slowEMA[i];
  }

  return result;
}
