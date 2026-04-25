export function computeCMO(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);

  for (let i = 0; i < period; i++) {
    result[i] = NaN;
  }

  for (let i = period; i < length; i++) {
    let sumUp = 0;
    let sumDown = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const change = close[j] - close[j - 1];
      if (change > 0) {
        sumUp += change;
      } else {
        sumDown += -change;
      }
    }
    const total = sumUp + sumDown;
    result[i] = total === 0 ? 0 : ((sumUp - sumDown) / total) * 100;
  }

  return result;
}
