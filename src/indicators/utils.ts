/**
 * O(n) sliding window maximum using monotone deque.
 * Returns Float64Array where result[i] = max of data[i-period+1..i].
 * Indices [0, period-2] are NaN.
 */
export function slidingMax(data: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const deque: number[] = []; // indices of potential maximums

  for (let i = 0; i < length; i++) {
    while (deque.length > 0 && deque[0] <= i - period) deque.shift();
    while (deque.length > 0 && data[deque[deque.length - 1]] <= data[i]) deque.pop();
    deque.push(i);
    result[i] = i >= period - 1 ? data[deque[0]] : NaN;
  }
  return result;
}

/**
 * O(n) sliding window minimum using monotone deque.
 */
export function slidingMin(data: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  const deque: number[] = [];

  for (let i = 0; i < length; i++) {
    while (deque.length > 0 && deque[0] <= i - period) deque.shift();
    while (deque.length > 0 && data[deque[deque.length - 1]] >= data[i]) deque.pop();
    deque.push(i);
    result[i] = i >= period - 1 ? data[deque[0]] : NaN;
  }
  return result;
}
