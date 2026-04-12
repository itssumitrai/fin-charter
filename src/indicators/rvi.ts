export interface RVIResult {
  rvi: Float64Array;
  signal: Float64Array;
}

/**
 * Relative Vigor Index (RVI)
 * Numerator: symmetrically-weighted average of (close - open)
 * Denominator: symmetrically-weighted average of (high - low)
 * Signal: 4-bar symmetrical weighted MA of RVI
 */
export function computeRVI(
  open: Float64Array,
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): RVIResult {
  const rvi = new Float64Array(length);
  const signal = new Float64Array(length);

  // Need at least 3 prior bars for the 4-element symmetric weight pattern
  // and then `period` bars for the rolling sum
  const minBars = period + 3;

  for (let i = 0; i < minBars - 1; i++) {
    rvi[i] = NaN;
    signal[i] = NaN;
  }

  // Symmetric weights: [1, 2, 2, 1] / 6
  const w = [1, 2, 2, 1];
  const wSum = 6;

  for (let i = minBars - 1; i < length; i++) {
    let numSum = 0;
    let denSum = 0;
    // Sum `period` bars of symmetrically-weighted numerator/denominator
    for (let k = 0; k < period; k++) {
      const idx = i - k;
      let num = 0;
      let den = 0;
      for (let j = 0; j < 4; j++) {
        const ii = idx - (3 - j);
        num += w[j] * (close[ii] - open[ii]);
        den += w[j] * (high[ii] - low[ii]);
      }
      numSum += num;
      denSum += den;
    }
    rvi[i] = denSum === 0 ? 0 : numSum / denSum;
  }

  // Signal = 4-bar symmetrical WMA of RVI
  for (let i = 0; i < minBars + 2; i++) {
    signal[i] = NaN;
  }
  for (let i = minBars + 2; i < length; i++) {
    if (isNaN(rvi[i]) || isNaN(rvi[i - 1]) || isNaN(rvi[i - 2]) || isNaN(rvi[i - 3])) {
      signal[i] = NaN;
      continue;
    }
    signal[i] = (rvi[i] * w[3] + rvi[i - 1] * w[2] + rvi[i - 2] * w[1] + rvi[i - 3] * w[0]) / wSum;
  }

  return { rvi, signal };
}
