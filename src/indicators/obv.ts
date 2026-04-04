export function computeOBV(
  close: Float64Array,
  volume: Float64Array,
  length: number
): Float64Array {
  const result = new Float64Array(length);

  // Index 0 seeded at 0
  result[0] = 0;

  for (let i = 1; i < length; i++) {
    if (close[i] > close[i - 1]) {
      result[i] = result[i - 1] + volume[i];
    } else if (close[i] < close[i - 1]) {
      result[i] = result[i - 1] - volume[i];
    } else {
      result[i] = result[i - 1];
    }
  }

  return result;
}
