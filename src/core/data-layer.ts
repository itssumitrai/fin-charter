import {
  type Bar,
  type ColumnData,
  type ColumnStore,
  barsToColumnStore,
  createColumnStore,
} from './types';

export class DataLayer {
  public store: ColumnStore;

  constructor() {
    this.store = createColumnStore(2048);
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
    } else {
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
