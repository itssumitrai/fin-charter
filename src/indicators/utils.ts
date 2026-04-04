/**
 * EMA that skips leading NaN values in the input.
 * Used when chaining EMAs (e.g., TRIX = triple EMA) where prior stages
 * produce leading NaNs that would poison the SMA seed of a regular EMA.
 */
export function computeEMASkipNaN(data: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);

  // Find first non-NaN index
  let start = 0;
  while (start < length && isNaN(data[start])) start++;

  // Fill everything before the valid EMA region with NaN
  const firstValid = start + period - 1;
  for (let i = 0; i < Math.min(firstValid, length); i++) result[i] = NaN;
  if (firstValid >= length) return result;

  // SMA seed from first `period` valid values
  let sum = 0;
  for (let i = start; i < start + period; i++) sum += data[i];
  result[firstValid] = sum / period;

  const k = 2 / (period + 1);
  for (let i = firstValid + 1; i < length; i++) {
    if (isNaN(data[i])) { result[i] = result[i - 1]; continue; }
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

/**
 * O(n) sliding window maximum using monotone deque.
 * Returns Float64Array where result[i] = max of data[i-period+1..i].
 * Indices [0, period-2] are NaN.
 *
 * Uses a head-pointer instead of Array.shift() to avoid O(n) copies.
 */
export function slidingMax(data: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const deque: number[] = []; // indices of potential maximums
  let head = 0;

  for (let i = 0; i < length; i++) {
    while (head < deque.length && deque[head] <= i - period) head++;
    while (head < deque.length && data[deque[deque.length - 1]] <= data[i]) deque.pop();
    deque.push(i);
    result[i] = i >= period - 1 ? data[deque[head]] : NaN;
  }
  return result;
}

/**
 * O(n) sliding window minimum using monotone deque.
 *
 * Uses a head-pointer instead of Array.shift() to avoid O(n) copies.
 */
export function slidingMin(data: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const deque: number[] = [];
  let head = 0;

  for (let i = 0; i < length; i++) {
    while (head < deque.length && deque[head] <= i - period) head++;
    while (head < deque.length && data[deque[deque.length - 1]] >= data[i]) deque.pop();
    deque.push(i);
    result[i] = i >= period - 1 ? data[deque[head]] : NaN;
  }
  return result;
}
