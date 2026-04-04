export function computeCoppock(close: Float64Array, length: number, wmaPeriod: number, longROC: number, shortROC: number): Float64Array {
  const result = new Float64Array(length);
  const maxLag = Math.max(longROC, shortROC);
  for (let i = 0; i < maxLag + wmaPeriod - 1; i++) result[i] = NaN;
  const roc = new Float64Array(length);
  for (let i = 0; i < maxLag; i++) roc[i] = NaN;
  for (let i = maxLag; i < length; i++) {
    const lr = close[i - longROC] === 0 ? 0 : ((close[i] - close[i - longROC]) / close[i - longROC]) * 100;
    const sr = close[i - shortROC] === 0 ? 0 : ((close[i] - close[i - shortROC]) / close[i - shortROC]) * 100;
    roc[i] = lr + sr;
  }
  for (let i = maxLag + wmaPeriod - 1; i < length; i++) {
    let num = 0, den = 0;
    for (let j = 0; j < wmaPeriod; j++) {
      const w = wmaPeriod - j, val = roc[i - j];
      if (isNaN(val)) { num = NaN; break; }
      num += val * w; den += w;
    }
    result[i] = isNaN(num) ? NaN : num / den;
  }
  return result;
}
