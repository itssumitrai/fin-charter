export function computeParabolicSAR(
  high: Float64Array,
  low: Float64Array,
  length: number,
  afStep = 0.02,
  afMax = 0.20,
): Float64Array {
  const result = new Float64Array(length);

  if (length === 0) return result;

  // Initialize with uptrend
  let trend: 'up' | 'down' = 'up';
  let sar = low[0];
  let ep = high[0];
  let af = afStep;

  result[0] = sar;

  for (let i = 1; i < length; i++) {
    // Calculate new SAR
    let newSar = sar + af * (ep - sar);

    if (trend === 'up') {
      // Clamp SAR to not exceed prior two lows
      if (i >= 2) newSar = Math.min(newSar, low[i - 1], low[i - 2]);
      else if (i >= 1) newSar = Math.min(newSar, low[i - 1]);

      if (low[i] < newSar) {
        // Reverse to downtrend
        trend = 'down';
        newSar = ep; // SAR becomes prior EP (the highest high)
        ep = low[i];
        af = afStep;
      } else {
        // Stay in uptrend
        if (high[i] > ep) {
          ep = high[i];
          af = Math.min(af + afStep, afMax);
        }
      }
    } else {
      // Downtrend: clamp SAR to not be below prior two highs
      if (i >= 2) newSar = Math.max(newSar, high[i - 1], high[i - 2]);
      else if (i >= 1) newSar = Math.max(newSar, high[i - 1]);

      if (high[i] > newSar) {
        // Reverse to uptrend
        trend = 'up';
        newSar = ep; // SAR becomes prior EP (the lowest low)
        ep = high[i];
        af = afStep;
      } else {
        // Stay in downtrend
        if (low[i] < ep) {
          ep = low[i];
          af = Math.min(af + afStep, afMax);
        }
      }
    }

    sar = newSar;
    result[i] = sar;
  }

  return result;
}
