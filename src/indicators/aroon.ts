export interface AroonResult { up: Float64Array; down: Float64Array; }

export function computeAroon(high: Float64Array, low: Float64Array, length: number, period: number): AroonResult {
  const up = new Float64Array(length), down = new Float64Array(length);
  for (let i = 0; i < period; i++) { up[i] = NaN; down[i] = NaN; }
  for (let i = period; i < length; i++) {
    let highIdx = i - period, lowIdx = i - period;
    for (let j = i - period; j <= i; j++) {
      if (high[j] >= high[highIdx]) highIdx = j;
      if (low[j] <= low[lowIdx]) lowIdx = j;
    }
    up[i] = ((period - (i - highIdx)) / period) * 100;
    down[i] = ((period - (i - lowIdx)) / period) * 100;
  }
  return { up, down };
}
