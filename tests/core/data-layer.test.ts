import { describe, it, expect, beforeEach } from 'vitest';
import { DataLayer } from '@/core/data-layer';
import type { Bar, ColumnData } from '@/core/types';

const makeBars = (n: number): Bar[] =>
  Array.from({ length: n }, (_, i) => ({
    time: (i + 1) * 1000,
    open: 10 + i,
    high: 12 + i,
    low: 9 + i,
    close: 11 + i,
    volume: 100 + i,
  }));

describe('DataLayer', () => {
  let dl: DataLayer;

  beforeEach(() => {
    dl = new DataLayer();
  });

  // ── setData ────────────────────────────────────────────────────────────────

  it('setData with Bar[] populates the store', () => {
    const bars = makeBars(3);
    dl.setData(bars);
    expect(dl.store.length).toBe(3);
    expect(dl.store.time[0]).toBe(1000);
    expect(dl.store.close[2]).toBe(13);
  });

  it('setData with ColumnData copies into a new store', () => {
    const colData: ColumnData = {
      time: new Float64Array([100, 200, 300]),
      open: new Float64Array([1, 2, 3]),
      high: new Float64Array([2, 3, 4]),
      low: new Float64Array([0, 1, 2]),
      close: new Float64Array([1.5, 2.5, 3.5]),
      volume: new Float64Array([10, 20, 30]),
    };
    dl.setData(colData);
    expect(dl.store.length).toBe(3);
    expect(dl.store.time[1]).toBe(200);
    expect(dl.store.close[2]).toBe(3.5);
  });

  // ── update ─────────────────────────────────────────────────────────────────

  it('update with same timestamp overwrites the last bar in-place', () => {
    dl.setData(makeBars(2));
    const prevLen = dl.store.length;
    dl.update({ time: 2000, open: 99, high: 100, low: 98, close: 99.5, volume: 999 });
    expect(dl.store.length).toBe(prevLen); // no growth
    expect(dl.store.close[1]).toBe(99.5);
    expect(dl.store.volume[1]).toBe(999);
  });

  it('update with new timestamp appends a bar', () => {
    dl.setData(makeBars(2));
    dl.update({ time: 9000, open: 50, high: 55, low: 48, close: 52 });
    expect(dl.store.length).toBe(3);
    expect(dl.store.time[2]).toBe(9000);
    expect(dl.store.volume[2]).toBe(0); // missing volume → 0
  });

  it('update throws when new bar timestamp is before the last bar', () => {
    dl.setData(makeBars(3)); // times: 1000, 2000, 3000
    expect(() =>
      dl.update({ time: 500, open: 1, high: 2, low: 0, close: 1 }),
    ).toThrow();
  });

  it('update does not throw when new bar timestamp equals the last bar', () => {
    dl.setData(makeBars(2)); // last time: 2000
    expect(() =>
      dl.update({ time: 2000, open: 99, high: 100, low: 98, close: 99.5 }),
    ).not.toThrow();
    expect(dl.store.length).toBe(2); // overwrite, no growth
  });

  it('update triggers grow when capacity is full', () => {
    // Fill a store exactly to its capacity by loading data then filling to the brim
    const bars = makeBars(2);
    dl.setData(bars);
    // Manually fill remaining capacity so length === capacity
    const cap = dl.store.capacity;
    for (let i = dl.store.length; i < cap; i++) {
      dl.store.time[i] = (i + 1) * 1000;
      dl.store.open[i] = 1;
      dl.store.high[i] = 2;
      dl.store.low[i] = 0;
      dl.store.close[i] = 1;
      dl.store.length += 1;
    }
    expect(dl.store.length).toBe(dl.store.capacity);
    const oldCap = dl.store.capacity;
    // One more bar should trigger grow
    dl.update({ time: 999_999_000, open: 1, high: 2, low: 0, close: 1 });
    expect(dl.store.capacity).toBeGreaterThan(oldCap);
    expect(dl.store.length).toBe(oldCap + 1);
  });

  // ── findIndex ─────────────────────────────────────────────────────────────

  it('findIndex returns exact index for a known timestamp', () => {
    dl.setData(makeBars(5));
    expect(dl.findIndex(3000)).toBe(2); // time 3000 is at index 2
  });

  it('findIndex returns nearest index for an in-between timestamp', () => {
    dl.setData(makeBars(5));
    // times are 1000,2000,3000,4000,5000 — 2400 is closer to 2000 (index 1)
    expect(dl.findIndex(2400)).toBe(1);
    // 2600 is closer to 3000 (index 2)
    expect(dl.findIndex(2600)).toBe(2);
  });

  it('findIndex clamps below to 0', () => {
    dl.setData(makeBars(5));
    expect(dl.findIndex(-999)).toBe(0);
  });

  it('findIndex clamps above to last index', () => {
    dl.setData(makeBars(5));
    expect(dl.findIndex(999_999)).toBe(4);
  });

  it('findIndex returns 0 for empty store', () => {
    expect(dl.findIndex(1000)).toBe(0);
  });

  // ── barAt ─────────────────────────────────────────────────────────────────

  it('barAt returns a correct Bar for a valid index', () => {
    dl.setData(makeBars(3));
    const bar = dl.barAt(1);
    expect(bar).not.toBeNull();
    expect(bar!.time).toBe(2000);
    expect(bar!.open).toBe(11);
  });

  it('barAt returns null for out-of-bounds indices', () => {
    dl.setData(makeBars(3));
    expect(dl.barAt(-1)).toBeNull();
    expect(dl.barAt(3)).toBeNull();
    expect(dl.barAt(100)).toBeNull();
  });
});
