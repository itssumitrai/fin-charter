export interface DMIResult {
  plusDI: Float64Array;
  minusDI: Float64Array;
}

/**
 * Directional Movement Index (DMI) - exports +DI and -DI lines
 * Uses Wilder smoothing (same algorithm as ADX but only returns DI lines).
 */
export function computeDMI(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number,
): DMIResult {
  const plusDI = new Float64Array(length);
  const minusDI = new Float64Array(length);

  for (let i = 0; i < period; i++) {
    plusDI[i] = NaN;
    minusDI[i] = NaN;
  }

  if (length <= period) {
    return { plusDI, minusDI };
  }

  let smoothedTR = 0;
  let smoothedPlusDM = 0;
  let smoothedMinusDM = 0;

  for (let i = 1; i <= period; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    const hl = high[i] - low[i];
    const hpc = Math.abs(high[i] - close[i - 1]);
    const lpc = Math.abs(low[i] - close[i - 1]);
    const tr = Math.max(hl, hpc, lpc);
    smoothedTR += tr;
    smoothedPlusDM += plusDM;
    smoothedMinusDM += minusDM;
  }

  const di = (dm: number, trVal: number): number => (trVal === 0 ? 0 : (dm / trVal) * 100);

  plusDI[period] = di(smoothedPlusDM, smoothedTR);
  minusDI[period] = di(smoothedMinusDM, smoothedTR);

  for (let i = period + 1; i < length; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    const hl = high[i] - low[i];
    const hpc = Math.abs(high[i] - close[i - 1]);
    const lpc = Math.abs(low[i] - close[i - 1]);
    const tr = Math.max(hl, hpc, lpc);
    smoothedTR = smoothedTR - smoothedTR / period + tr;
    smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM;
    smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM;
    plusDI[i] = di(smoothedPlusDM, smoothedTR);
    minusDI[i] = di(smoothedMinusDM, smoothedTR);
  }

  return { plusDI, minusDI };
}
