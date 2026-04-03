export function computeVolume(volume: Float64Array, length: number): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = volume[i];
  }
  return result;
}
