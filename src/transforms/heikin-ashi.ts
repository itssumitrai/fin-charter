import type { ColumnStore } from '../core/types';
import { createColumnStore } from '../core/types';

export function computeHeikinAshi(store: ColumnStore): ColumnStore {
  const len = store.length;
  const ha = createColumnStore(Math.max(len * 2, store.capacity));
  ha.length = len;
  if (len === 0) return ha;

  ha.time.set(store.time.subarray(0, len));
  ha.volume.set(store.volume.subarray(0, len));

  ha.close[0] = (store.open[0] + store.high[0] + store.low[0] + store.close[0]) / 4;
  ha.open[0] = (store.open[0] + store.close[0]) / 2;
  ha.high[0] = Math.max(store.high[0], ha.open[0], ha.close[0]);
  ha.low[0] = Math.min(store.low[0], ha.open[0], ha.close[0]);

  for (let i = 1; i < len; i++) {
    ha.close[i] = (store.open[i] + store.high[i] + store.low[i] + store.close[i]) / 4;
    ha.open[i] = (ha.open[i - 1] + ha.close[i - 1]) / 2;
    ha.high[i] = Math.max(store.high[i], ha.open[i], ha.close[i]);
    ha.low[i] = Math.min(store.low[i], ha.open[i], ha.close[i]);
  }
  return ha;
}
