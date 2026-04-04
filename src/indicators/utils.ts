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
