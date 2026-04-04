export function computeVWAP(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  length: number
): Float64Array {
  const result = new Float64Array(length);

  let cumulativeTPV = 0; // sum of typicalPrice * volume
  let cumulativeVol = 0;

  for (let i = 0; i < length; i++) {
    const typicalPrice = (high[i] + low[i] + close[i]) / 3;
    cumulativeTPV += typicalPrice * volume[i];
    cumulativeVol += volume[i];

    if (cumulativeVol === 0) {
      result[i] = NaN;
    } else {
      result[i] = cumulativeTPV / cumulativeVol;
    }
  }

  return result;
}
