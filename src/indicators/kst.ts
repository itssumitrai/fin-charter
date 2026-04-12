import { computeSMA } from './sma';
import { computeROC } from './roc';

export interface KSTResult {
  kst: Float64Array;
  signal: Float64Array;
}

/**
 * Know Sure Thing (KST)
 * KST = (ROC(10) SMA10) * 1 + (ROC(13) SMA13) * 2 + (ROC(15) SMA15) * 3 + (ROC(20) SMA20) * 4
 * Signal = SMA(KST, 9)
 */
export function computeKST(close: Float64Array, length: number): KSTResult {
  const kst = new Float64Array(length);
  const signal = new Float64Array(length);

  // Standard KST parameters
  const rocPeriods = [10, 13, 15, 20];
  const smaPeriods = [10, 13, 15, 20];
  const weights = [1, 2, 3, 4];
  const signalPeriod = 9;

  // Compute each smoothed ROC
  const rocArrays = rocPeriods.map((rp) => computeROC(close, length, rp));
  const smaArrays = rocArrays.map((roc, idx) => computeSMA(roc, length, smaPeriods[idx]));

  // First valid index: max of (rocPeriod + smaPeriod - 1) across all components
  const firstValid = Math.max(...rocPeriods.map((rp, idx) => rp + smaPeriods[idx] - 1));

  for (let i = 0; i < firstValid; i++) {
    kst[i] = NaN;
  }

  for (let i = firstValid; i < length; i++) {
    let val = 0;
    for (let c = 0; c < 4; c++) {
      const v = smaArrays[c][i];
      if (isNaN(v)) { val = NaN; break; }
      val += v * weights[c];
    }
    kst[i] = val;
  }

  // Signal = SMA of KST
  const kstSMA = computeSMA(kst, length, signalPeriod);
  for (let i = 0; i < length; i++) {
    signal[i] = kstSMA[i];
  }

  return { kst, signal };
}
