export function computeLinearRegression(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period - 1; i++) result[i] = NaN;
  for (let i = period - 1; i < length; i++) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let j = 0; j < period; j++) {
      const x = j, y = close[i - period + 1 + j];
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    }
    const n = period;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    result[i] = intercept + slope * (period - 1);
  }
  return result;
}
