import type { ColumnStore } from '../core/types';
import { createColumnStore } from '../core/types';

export function aggregateOHLC(source: ColumnStore, targetIntervalSec: number): ColumnStore {
  if (source.length === 0) return createColumnStore(0);

  let bucketCount = 0;
  let lastBucket = -1;
  for (let i = 0; i < source.length; i++) {
    const bucket = Math.floor(source.time[i] / targetIntervalSec) * targetIntervalSec;
    if (bucket !== lastBucket) { bucketCount++; lastBucket = bucket; }
  }

  const result = createColumnStore(Math.max(bucketCount * 2, 64));
  result.length = bucketCount;
  let outIdx = -1;
  lastBucket = -1;

  for (let i = 0; i < source.length; i++) {
    const bucket = Math.floor(source.time[i] / targetIntervalSec) * targetIntervalSec;
    if (bucket !== lastBucket) {
      outIdx++;
      lastBucket = bucket;
      result.time[outIdx] = bucket;
      result.open[outIdx] = source.open[i];
      result.high[outIdx] = source.high[i];
      result.low[outIdx] = source.low[i];
      result.close[outIdx] = source.close[i];
      result.volume[outIdx] = source.volume[i];
    } else {
      if (source.high[i] > result.high[outIdx]) result.high[outIdx] = source.high[i];
      if (source.low[i] < result.low[outIdx]) result.low[outIdx] = source.low[i];
      result.close[outIdx] = source.close[i];
      result.volume[outIdx] += source.volume[i];
    }
  }
  return result;
}
