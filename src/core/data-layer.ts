import {
  type Bar,
  type ColumnData,
  type ColumnStore,
  barsToColumnStore,
  createColumnStore,
} from './types';
import { MinMaxSegmentTree } from './segment-tree';

export class DataLayer {
  public store: ColumnStore;
  public readonly segmentTree: MinMaxSegmentTree;

  constructor() {
    this.store = createColumnStore(2048);
    this.segmentTree = new MinMaxSegmentTree(2048);
  }

  /** Load data. Accepts either an array of Bar objects or a ColumnData (typed arrays). */
  setData(data: Bar[] | ColumnData): void {
    if (Array.isArray(data)) {
      this.store = barsToColumnStore(data);
    } else {
      // ColumnData — copy into a new ColumnStore
      const len = data.time.length;
      const capacity = Math.max(Math.ceil(len * 1.5), 2048);
      const store = createColumnStore(capacity);
      store.length = len;
      store.time.set(data.time);
      store.open.set(data.open);
      store.high.set(data.high);
      store.low.set(data.low);
      store.close.set(data.close);
      store.volume.set(data.volume);
      this.store = store;
    }
    this.segmentTree.build(this.store.high, this.store.low, this.store.length);
  }

  /**
   * Upsert a single bar:
   * - If the timestamp matches the last bar, overwrite in-place.
   * - Otherwise append (growing the store if needed).
   */
  update(bar: Bar): void {
    const { store } = this;
    if (store.length > 0 && store.time[store.length - 1] === bar.time) {
      // Overwrite last bar
      const i = store.length - 1;
      store.open[i] = bar.open;
      store.high[i] = bar.high;
      store.low[i] = bar.low;
      store.close[i] = bar.close;
      store.volume[i] = bar.volume ?? 0;
      this.segmentTree.update(i, bar.high, bar.low);
    } else {
      // Guard: out-of-order bars would corrupt the binary search in findIndex()
      if (store.length > 0 && bar.time < store.time[store.length - 1]) {
        throw new Error(
          `update(): bar.time (${bar.time}) must be >= last bar time (${store.time[store.length - 1]})`,
        );
      }
      // Append
      if (store.length >= store.capacity) {
        this.grow();
      }
      const i = store.length;
      this.store.time[i] = bar.time;
      this.store.open[i] = bar.open;
      this.store.high[i] = bar.high;
      this.store.low[i] = bar.low;
      this.store.close[i] = bar.close;
      this.store.volume[i] = bar.volume ?? 0;
      this.store.length += 1;
      this.segmentTree.append(bar.high, bar.low);
    }
  }

  /**
   * Binary search for the index whose time is closest to `time`.
   * Result is clamped to [0, length-1].
   */
  findIndex(time: number): number {
    const { store } = this;
    if (store.length === 0) return 0;

    let lo = 0;
    let hi = store.length - 1;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const t = store.time[mid];
      if (t === time) return mid;
      if (t < time) lo = mid + 1;
      else hi = mid - 1;
    }

    // lo is the insertion point; nearest is lo or lo-1
    if (lo >= store.length) return store.length - 1;
    if (lo === 0) return 0;

    const diffLo = Math.abs(store.time[lo] - time);
    const diffHi = Math.abs(store.time[lo - 1] - time);
    return diffLo < diffHi ? lo : lo - 1;
  }

  /** Return the Bar at `index`, or null if out of bounds. */
  barAt(index: number): Bar | null {
    const { store } = this;
    if (index < 0 || index >= store.length) return null;
    return {
      time: store.time[index],
      open: store.open[index],
      high: store.high[index],
      low: store.low[index],
      close: store.close[index],
      volume: store.volume[index],
    };
  }

  /**
   * Prepend bars to the beginning of the store.
   * Accepts either an array of Bar objects or a ColumnData (typed arrays).
   * The prepended data must be strictly older than the existing data.
   */
  prepend(data: Bar[] | ColumnData): void {
    // Validate ColumnData column lengths before conversion
    if (!Array.isArray(data)) {
      const len = data.time.length;
      for (const field of ['open', 'high', 'low', 'close', 'volume'] as const) {
        if (data[field].length !== len) {
          throw new Error(`ColumnData field '${field}' has length ${data[field].length}, expected ${len}`);
        }
      }
    }

    const bars: Bar[] = Array.isArray(data)
      ? data
      : Array.from({ length: data.time.length }, (_, i) => ({
          time: data.time[i],
          open: data.open[i],
          high: data.high[i],
          low: data.low[i],
          close: data.close[i],
          volume: data.volume[i],
        }));

    if (bars.length === 0) return;

    // Validate that prepended bars are strictly increasing by time
    for (let i = 1; i < bars.length; i++) {
      if (bars[i - 1].time >= bars[i].time) {
        throw new Error('Prepended bars must be strictly increasing by time');
      }
    }
    const oldLen = this.store.length;
    if (oldLen > 0 && bars[bars.length - 1].time >= this.store.time[0]) {
      throw new Error('Prepended bars must be strictly older than existing data');
    }
    const newLen = oldLen + bars.length;
    const newCapacity = Math.max(Math.ceil(newLen * 1.5), 2048);
    const newStore = createColumnStore(newCapacity);
    newStore.length = newLen;

    // Copy new data at front
    for (let i = 0; i < bars.length; i++) {
      newStore.time[i] = bars[i].time;
      newStore.open[i] = bars[i].open;
      newStore.high[i] = bars[i].high;
      newStore.low[i] = bars[i].low;
      newStore.close[i] = bars[i].close;
      newStore.volume[i] = bars[i].volume ?? 0;
    }

    // Copy existing data after new data using typed array set
    for (const field of ['time', 'open', 'high', 'low', 'close', 'volume'] as const) {
      newStore[field].set(this.store[field].subarray(0, oldLen), bars.length);
    }

    this.store = newStore;
    this.segmentTree.build(this.store.high, this.store.low, this.store.length);
  }

  /**
   * Query the min low and max high in the range [fromIdx, toIdx] (inclusive).
   * O(log n) time via segment tree.
   */
  queryMinMax(fromIdx: number, toIdx: number): { min: number; max: number } {
    return this.segmentTree.query(fromIdx, toIdx);
  }

  /** Double the capacity of the store, preserving existing data. */
  private grow(): void {
    const { store } = this;
    const newCapacity = store.capacity * 2;
    const next = createColumnStore(newCapacity);
    next.length = store.length;
    next.time.set(store.time.subarray(0, store.length));
    next.open.set(store.open.subarray(0, store.length));
    next.high.set(store.high.subarray(0, store.length));
    next.low.set(store.low.subarray(0, store.length));
    next.close.set(store.close.subarray(0, store.length));
    next.volume.set(store.volume.subarray(0, store.length));
    this.store = next;
  }
}
