import { describe, it, expect } from 'vitest';
import {
  createColumnStore,
  barsToColumnStore,
  InvalidationLevel,
  type Bar,
} from '@/core/types';

describe('createColumnStore', () => {
  it('creates an empty store with the requested capacity', () => {
    const store = createColumnStore(512);
    expect(store.capacity).toBe(512);
    expect(store.length).toBe(0);
    expect(store.time).toBeInstanceOf(Float64Array);
    expect(store.time.length).toBe(512);
    expect(store.open).toBeInstanceOf(Float64Array);
    expect(store.high).toBeInstanceOf(Float64Array);
    expect(store.low).toBeInstanceOf(Float64Array);
    expect(store.close).toBeInstanceOf(Float64Array);
    expect(store.volume).toBeInstanceOf(Float64Array);
  });

  it('initialises all arrays with zeros', () => {
    const store = createColumnStore(4);
    expect(Array.from(store.time)).toEqual([0, 0, 0, 0]);
  });
});

describe('barsToColumnStore', () => {
  const bars: Bar[] = [
    { time: 1000, open: 10, high: 12, low: 9, close: 11, volume: 100 },
    { time: 2000, open: 11, high: 13, low: 10, close: 12 },
  ];

  it('converts bars correctly', () => {
    const store = barsToColumnStore(bars);
    expect(store.length).toBe(2);
    expect(store.time[0]).toBe(1000);
    expect(store.time[1]).toBe(2000);
    expect(store.open[0]).toBe(10);
    expect(store.high[0]).toBe(12);
    expect(store.low[0]).toBe(9);
    expect(store.close[0]).toBe(11);
    expect(store.volume[0]).toBe(100);
    // missing volume defaults to 0
    expect(store.volume[1]).toBe(0);
  });

  it('capacity is at least 2048 for small inputs', () => {
    const store = barsToColumnStore(bars);
    expect(store.capacity).toBe(2048);
  });

  it('capacity is ceil(length * 1.5) when large enough', () => {
    const manyBars: Bar[] = Array.from({ length: 2000 }, (_, i) => ({
      time: i,
      open: 1,
      high: 2,
      low: 0,
      close: 1,
    }));
    const store = barsToColumnStore(manyBars);
    expect(store.capacity).toBe(Math.ceil(2000 * 1.5));
    expect(store.length).toBe(2000);
  });
});

describe('InvalidationLevel', () => {
  it('has the correct numeric values', () => {
    expect(InvalidationLevel.None).toBe(0);
    expect(InvalidationLevel.Cursor).toBe(1);
    expect(InvalidationLevel.Light).toBe(2);
    expect(InvalidationLevel.Full).toBe(3);
  });

  it('values are ordered ascending', () => {
    expect(InvalidationLevel.None).toBeLessThan(InvalidationLevel.Cursor);
    expect(InvalidationLevel.Cursor).toBeLessThan(InvalidationLevel.Light);
    expect(InvalidationLevel.Light).toBeLessThan(InvalidationLevel.Full);
  });
});
