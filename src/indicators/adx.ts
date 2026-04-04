export interface ADXResult {
  adx: Float64Array;
  plusDI: Float64Array;
  minusDI: Float64Array;
}

export function computeADX(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  period: number
): ADXResult {
  const adx = new Float64Array(length);
  const plusDI = new Float64Array(length);
  const minusDI = new Float64Array(length);

  // +DI / -DI NaN for [0, period-1]
  for (let i = 0; i < period; i++) {
    plusDI[i] = NaN;
    minusDI[i] = NaN;
  }

  // ADX NaN for [0, 2*period-1]
  for (let i = 0; i < 2 * period; i++) {
    adx[i] = NaN;
  }

  if (length <= period) {
    return { adx, plusDI, minusDI };
  }

  // Compute initial Wilder sums from indices 1..period
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

  // First +DI/-DI at index period
  const computeDI = (smoothedDM: number, smoothedTRVal: number): number =>
    smoothedTRVal === 0 ? 0 : (smoothedDM / smoothedTRVal) * 100;

  plusDI[period] = computeDI(smoothedPlusDM, smoothedTR);
  minusDI[period] = computeDI(smoothedMinusDM, smoothedTR);

  // Collect DX values to seed ADX
  const dxValues: number[] = [];
  const dx0 = computeDX(plusDI[period], minusDI[period]);
  dxValues.push(dx0);

  // Wilder smoothing for subsequent bars
  for (let i = period + 1; i < length; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];

    const plusDMi = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDMi = downMove > upMove && downMove > 0 ? downMove : 0;

    const hl = high[i] - low[i];
    const hpc = Math.abs(high[i] - close[i - 1]);
    const lpc = Math.abs(low[i] - close[i - 1]);
    const tr = Math.max(hl, hpc, lpc);

    smoothedTR = smoothedTR - smoothedTR / period + tr;
    smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDMi;
    smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDMi;

    plusDI[i] = computeDI(smoothedPlusDM, smoothedTR);
    minusDI[i] = computeDI(smoothedMinusDM, smoothedTR);

    const dxi = computeDX(plusDI[i], minusDI[i]);
    dxValues.push(dxi);

    // Once we have `period` DX values, compute first ADX
    if (dxValues.length === period) {
      let sumDX = 0;
      for (const v of dxValues) sumDX += v;
      adx[i] = sumDX / period;
    } else if (dxValues.length > period) {
      // Wilder smoothing of ADX
      adx[i] = (adx[i - 1] * (period - 1) + dxi) / period;
    }
  }

  return { adx, plusDI, minusDI };
}

function computeDX(pdi: number, mdi: number): number {
  const sum = pdi + mdi;
  if (sum === 0) return 0;
  return (Math.abs(pdi - mdi) / sum) * 100;
}
