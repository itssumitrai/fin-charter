import { describe, it, expect } from 'vitest';
import { computeVolumeProfile } from '@/indicators/volume-profile';
import type { ColumnStore } from '@/core/types';

function makeStore(length: number): ColumnStore {
  const capacity = Math.max(length, 1);
  const time = new Float64Array(capacity);
  const open = new Float64Array(capacity);
  const high = new Float64Array(capacity);
  const low = new Float64Array(capacity);
  const close = new Float64Array(capacity);
  const volume = new Float64Array(capacity);
  for (let i = 0; i < length; i++) {
    time[i] = 1000 + i * 60;
    open[i] = 100 + (i % 5);
    high[i] = 105 + (i % 5);
    low[i] = 95 + (i % 5);
    close[i] = 102 + (i % 5);
    volume[i] = 1000 + i * 100;
  }
  return { time, open, high, low, close, volume, length, capacity };
}

describe('computeVolumeProfile', () => {
  it('computes bins from bar data', () => {
    const store = makeStore(100);
    const result = computeVolumeProfile(store, 0, 99);

    expect(result.bins.length).toBe(24); // default binCount
    expect(result.totalVolume).toBeGreaterThan(0);
    expect(result.poc).toBeGreaterThan(0);
  });

  it('POC is the price level with highest volume', () => {
    const store = makeStore(50);
    const result = computeVolumeProfile(store, 0, 49);

    const maxBin = result.bins.reduce((max, b) => b.volume > max.volume ? b : max, result.bins[0]);
    expect(result.poc).toBe(maxBin.price);
  });

  it('value area contains ~70% of total volume', () => {
    const store = makeStore(200);
    const result = computeVolumeProfile(store, 0, 199);

    // Sum volume within value area
    const vaVolume = result.bins
      .filter(b => b.price >= result.val && b.price <= result.vah)
      .reduce((sum, b) => sum + b.volume, 0);

    expect(vaVolume / result.totalVolume).toBeGreaterThanOrEqual(0.65);
  });

  it('respects custom binCount', () => {
    const store = makeStore(50);
    const result = computeVolumeProfile(store, 0, 49, { binCount: 10 });
    expect(result.bins.length).toBe(10);
  });

  it('tracks buy/sell volume', () => {
    const store = makeStore(50);
    const result = computeVolumeProfile(store, 0, 49);
    const totalBuySell = result.bins.reduce((sum, b) => sum + b.buyVolume + b.sellVolume, 0);
    expect(totalBuySell).toBe(result.totalVolume);
  });

  it('handles empty range', () => {
    const store = makeStore(0);
    const result = computeVolumeProfile(store, 0, -1);
    expect(result.bins.length).toBe(0);
    expect(result.totalVolume).toBe(0);
  });

  it('handles single bar', () => {
    const store = makeStore(1);
    const result = computeVolumeProfile(store, 0, 0);
    expect(result.bins.length).toBe(24);
    expect(result.totalVolume).toBe(store.volume[0]);
  });

  it('clamps invalid binCount to default', () => {
    const store = makeStore(50);
    const r1 = computeVolumeProfile(store, 0, 49, { binCount: 0 });
    expect(r1.bins.length).toBe(24); // fallback to default
    const r2 = computeVolumeProfile(store, 0, 49, { binCount: NaN });
    expect(r2.bins.length).toBe(24);
    const r3 = computeVolumeProfile(store, 0, 49, { binCount: -5 });
    expect(r3.bins.length).toBe(24);
  });

  it('clamps valueAreaPercent to [0, 1]', () => {
    const store = makeStore(50);
    const r1 = computeVolumeProfile(store, 0, 49, { valueAreaPercent: 2 });
    expect(r1.bins.length).toBe(24); // should not crash
    const r2 = computeVolumeProfile(store, 0, 49, { valueAreaPercent: -0.5 });
    expect(r2.bins.length).toBe(24);
  });
});
