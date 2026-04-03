import { computeEMA } from './ema';

export interface MACDResult {
  macd: Float64Array;
  signal: Float64Array;
  histogram: Float64Array;
}

export function computeMACD(
  close: Float64Array,
  length: number,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): MACDResult {
  const macd = new Float64Array(length);
  const signal = new Float64Array(length);
  const histogram = new Float64Array(length);

  const fastEMA = computeEMA(close, length, fastPeriod);
  const slowEMA = computeEMA(close, length, slowPeriod);

  // MACD line = fastEMA - slowEMA; NaN before slowPeriod-1
  for (let i = 0; i < length; i++) {
    if (i < slowPeriod - 1) {
      macd[i] = NaN;
    } else {
      macd[i] = fastEMA[i] - slowEMA[i];
    }
  }

  // Signal = EMA of MACD values
  // First valid MACD is at index slowPeriod-1
  // First signal = SMA of first signalPeriod MACD values (starting at slowPeriod-1)
  const firstSignalIdx = slowPeriod - 1 + signalPeriod - 1;

  for (let i = 0; i < firstSignalIdx; i++) {
    signal[i] = NaN;
    histogram[i] = NaN;
  }

  if (firstSignalIdx >= length) {
    return { macd, signal, histogram };
  }

  // Compute initial signal SMA from first signalPeriod MACD values
  let sum = 0;
  for (let i = slowPeriod - 1; i <= firstSignalIdx; i++) {
    sum += macd[i];
  }
  signal[firstSignalIdx] = sum / signalPeriod;
  histogram[firstSignalIdx] = macd[firstSignalIdx] - signal[firstSignalIdx];

  const k = 2 / (signalPeriod + 1);

  for (let i = firstSignalIdx + 1; i < length; i++) {
    signal[i] = macd[i] * k + signal[i - 1] * (1 - k);
    histogram[i] = macd[i] - signal[i];
  }

  return { macd, signal, histogram };
}
