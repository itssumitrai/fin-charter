export interface StochasticResult {
  k: Float64Array;
  d: Float64Array;
}

export function computeStochastic(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  kPeriod: number,
  dPeriod: number
): StochasticResult {
  const k = new Float64Array(length);
  const d = new Float64Array(length);

  // Fill NaN for indices where K is undefined: [0, kPeriod-2]
  for (let i = 0; i < kPeriod - 1; i++) {
    k[i] = NaN;
  }

  // Fill NaN for all d values: [0, kPeriod+dPeriod-3]
  const dStart = kPeriod + dPeriod - 2;
  for (let i = 0; i < dStart; i++) {
    d[i] = NaN;
  }

  // Compute %K
  for (let i = kPeriod - 1; i < length; i++) {
    let highestHigh = high[i];
    let lowestLow = low[i];

    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (high[j] > highestHigh) highestHigh = high[j];
      if (low[j] < lowestLow) lowestLow = low[j];
    }

    const range = highestHigh - lowestLow;
    if (range === 0) {
      k[i] = 0;
    } else {
      k[i] = ((close[i] - lowestLow) / range) * 100;
    }
  }

  // Compute %D = SMA of %K over dPeriod
  // D is valid from index kPeriod-1 + dPeriod-1 = kPeriod+dPeriod-2
  for (let i = dStart; i < length; i++) {
    let sum = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) {
      sum += k[j];
    }
    d[i] = sum / dPeriod;
  }

  return { k, d };
}
