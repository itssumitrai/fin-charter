export interface VortexResult {
  viPlus: Float64Array;
  viMinus: Float64Array;
}

/**
 * Vortex Indicator
 * VM+ = |High[i] - Low[i-1]|
 * VM- = |Low[i] - High[i-1]|
 * TR = max(high[i] - low[i], |high[i] - close[i-1]|, |low[i] - close[i-1]|)
 * VI+ = Sum(VM+, period) / Sum(TR, period)
 * VI- = Sum(VM-, period) / Sum(TR, period)
 */
export function computeVortex(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): VortexResult {
  const viPlus = new Float64Array(length);
  const viMinus = new Float64Array(length);

  for (let i = 0; i < period; i++) {
    viPlus[i] = NaN;
    viMinus[i] = NaN;
  }

  if (length <= period) {
    return { viPlus, viMinus };
  }

  // Precompute bar-by-bar values (from index 1 onward)
  const vmPlus = new Float64Array(length);
  const vmMinus = new Float64Array(length);
  const tr = new Float64Array(length);
  vmPlus[0] = 0;
  vmMinus[0] = 0;
  tr[0] = 0;

  for (let i = 1; i < length; i++) {
    vmPlus[i] = Math.abs(high[i] - low[i - 1]);
    vmMinus[i] = Math.abs(low[i] - high[i - 1]);
    const hl = high[i] - low[i];
    const hpc = Math.abs(high[i] - close[i - 1]);
    const lpc = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(hl, hpc, lpc);
  }

  for (let i = period; i < length; i++) {
    let sumVMP = 0;
    let sumVMM = 0;
    let sumTR = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumVMP += vmPlus[j];
      sumVMM += vmMinus[j];
      sumTR += tr[j];
    }
    viPlus[i] = sumTR === 0 ? NaN : sumVMP / sumTR;
    viMinus[i] = sumTR === 0 ? NaN : sumVMM / sumTR;
  }

  return { viPlus, viMinus };
}
