import { describe, it, expect } from 'vitest';
import { createColumnStore } from '../../src/core/types';
import { computeHeikinAshi } from '../../src/transforms/heikin-ashi';
import { aggregateOHLC } from '../../src/transforms/aggregate';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore(bars: { time: number; open: number; high: number; low: number; close: number; volume: number }[]) {
  const store = createColumnStore(Math.max(bars.length * 2, 64));
  store.length = bars.length;
  for (let i = 0; i < bars.length; i++) {
    store.time[i] = bars[i].time;
    store.open[i] = bars[i].open;
    store.high[i] = bars[i].high;
    store.low[i] = bars[i].low;
    store.close[i] = bars[i].close;
    store.volume[i] = bars[i].volume;
  }
  return store;
}

function approx(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) < eps;
}

// ─── Heikin-Ashi ──────────────────────────────────────────────────────────────

describe('computeHeikinAshi', () => {
  it('handles empty store', () => {
    const empty = createColumnStore(0);
    const ha = computeHeikinAshi(empty);
    expect(ha.length).toBe(0);
  });

  it('first bar: HA_Close = (O+H+L+C)/4, HA_Open = (O+C)/2', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8, close: 12, volume: 100 },
    ]);
    const ha = computeHeikinAshi(store);

    const expectedClose = (10 + 14 + 8 + 12) / 4; // 11
    const expectedOpen = (10 + 12) / 2;            // 11

    expect(ha.length).toBe(1);
    expect(approx(ha.close[0], expectedClose)).toBe(true);
    expect(approx(ha.open[0], expectedOpen)).toBe(true);
  });

  it('first bar: HA_High = max(H, HA_Open, HA_Close)', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8, close: 12, volume: 100 },
    ]);
    const ha = computeHeikinAshi(store);
    const haOpen = (10 + 12) / 2;
    const haClose = (10 + 14 + 8 + 12) / 4;
    expect(approx(ha.high[0], Math.max(14, haOpen, haClose))).toBe(true);
  });

  it('first bar: HA_Low = min(L, HA_Open, HA_Close)', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8, close: 12, volume: 100 },
    ]);
    const ha = computeHeikinAshi(store);
    const haOpen = (10 + 12) / 2;
    const haClose = (10 + 14 + 8 + 12) / 4;
    expect(approx(ha.low[0], Math.min(8, haOpen, haClose))).toBe(true);
  });

  it('subsequent bars: HA_Open uses previous HA open/close', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
    ]);
    const ha = computeHeikinAshi(store);

    const ha0Open  = (10 + 12) / 2;
    const ha0Close = (10 + 14 + 8 + 12) / 4;
    const expectedOpen1 = (ha0Open + ha0Close) / 2;
    expect(approx(ha.open[1], expectedOpen1)).toBe(true);
  });

  it('subsequent bars: HA_Close = (O+H+L+C)/4 of source bar', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
    ]);
    const ha = computeHeikinAshi(store);
    const expectedClose1 = (12 + 16 + 10 + 14) / 4; // 13
    expect(approx(ha.close[1], expectedClose1)).toBe(true);
  });

  it('subsequent bars: HA_High = max(source.high, HA_Open, HA_Close)', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
    ]);
    const ha = computeHeikinAshi(store);
    const haOpen1 = ha.open[1];
    const haClose1 = ha.close[1];
    expect(approx(ha.high[1], Math.max(16, haOpen1, haClose1))).toBe(true);
  });

  it('subsequent bars: HA_Low = min(source.low, HA_Open, HA_Close)', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
    ]);
    const ha = computeHeikinAshi(store);
    const haOpen1 = ha.open[1];
    const haClose1 = ha.close[1];
    expect(approx(ha.low[1], Math.min(10, haOpen1, haClose1))).toBe(true);
  });

  it('preserves time unchanged', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
      { time: 3000, open: 14, high: 18, low: 12, close: 16, volume: 300 },
    ]);
    const ha = computeHeikinAshi(store);
    expect(ha.time[0]).toBe(1000);
    expect(ha.time[1]).toBe(2000);
    expect(ha.time[2]).toBe(3000);
  });

  it('preserves volume unchanged', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
      { time: 3000, open: 14, high: 18, low: 12, close: 16, volume: 300 },
    ]);
    const ha = computeHeikinAshi(store);
    expect(ha.volume[0]).toBe(100);
    expect(ha.volume[1]).toBe(200);
    expect(ha.volume[2]).toBe(300);
  });

  it('HA_High >= HA_Open and HA_High >= HA_Close for all bars', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
      { time: 3000, open: 14, high: 18, low: 12, close: 16, volume: 300 },
    ]);
    const ha = computeHeikinAshi(store);
    for (let i = 0; i < ha.length; i++) {
      expect(ha.high[i]).toBeGreaterThanOrEqual(ha.open[i]);
      expect(ha.high[i]).toBeGreaterThanOrEqual(ha.close[i]);
    }
  });

  it('HA_Low <= HA_Open and HA_Low <= HA_Close for all bars', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
      { time: 3000, open: 14, high: 18, low: 12, close: 16, volume: 300 },
    ]);
    const ha = computeHeikinAshi(store);
    for (let i = 0; i < ha.length; i++) {
      expect(ha.low[i]).toBeLessThanOrEqual(ha.open[i]);
      expect(ha.low[i]).toBeLessThanOrEqual(ha.close[i]);
    }
  });

  it('output length equals input length', () => {
    const store = makeStore([
      { time: 1000, open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 2000, open: 12, high: 16, low: 10, close: 14, volume: 200 },
    ]);
    const ha = computeHeikinAshi(store);
    expect(ha.length).toBe(store.length);
  });
});

// ─── OHLC Aggregation ────────────────────────────────────────────────────────

describe('aggregateOHLC', () => {
  const MIN = 60;    // seconds
  const FIVE_MIN = 5 * MIN;

  it('handles empty store', () => {
    const empty = createColumnStore(0);
    const result = aggregateOHLC(empty, FIVE_MIN);
    expect(result.length).toBe(0);
  });

  it('handles single bar', () => {
    const store = makeStore([
      { time: 0, open: 10, high: 14, low: 8, close: 12, volume: 500 },
    ]);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.length).toBe(1);
    expect(result.open[0]).toBe(10);
    expect(result.high[0]).toBe(14);
    expect(result.low[0]).toBe(8);
    expect(result.close[0]).toBe(12);
    expect(result.volume[0]).toBe(500);
  });

  it('aggregates 5 one-minute bars into 1 five-minute bar', () => {
    const bars = [0, 60, 120, 180, 240].map((t, i) => ({
      time: t,
      open: 10 + i,
      high: 15 + i,
      low: 8 + i,
      close: 12 + i,
      volume: 100,
    }));
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.length).toBe(1);
  });

  it('open is the first bar in the bucket', () => {
    const bars = [0, 60, 120, 180, 240].map((t, i) => ({
      time: t,
      open: 10 + i,
      high: 20,
      low: 5,
      close: 12 + i,
      volume: 100,
    }));
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.open[0]).toBe(10); // first bar open
  });

  it('close is the last bar in the bucket', () => {
    const bars = [0, 60, 120, 180, 240].map((t, i) => ({
      time: t,
      open: 10 + i,
      high: 20,
      low: 5,
      close: 12 + i,
      volume: 100,
    }));
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.close[0]).toBe(16); // last bar close = 12 + 4
  });

  it('high is the maximum high across bars in bucket', () => {
    const bars = [
      { time: 0,   open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 60,  open: 12, high: 20, low: 10, close: 14, volume: 100 },
      { time: 120, open: 14, high: 16, low: 12, close: 15, volume: 100 },
    ];
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.high[0]).toBe(20);
  });

  it('low is the minimum low across bars in bucket', () => {
    const bars = [
      { time: 0,   open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 60,  open: 12, high: 20, low: 3,  close: 14, volume: 100 },
      { time: 120, open: 14, high: 16, low: 12, close: 15, volume: 100 },
    ];
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.low[0]).toBe(3);
  });

  it('volume is the sum across bars in bucket', () => {
    const bars = [0, 60, 120, 180, 240].map((t) => ({
      time: t,
      open: 10, high: 14, low: 8, close: 12,
      volume: 100,
    }));
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.volume[0]).toBe(500);
  });

  it('bucket time aligns to interval boundary (floor)', () => {
    // bars at 60, 120, 180 all fall in the [0, 300) 5-min bucket
    const bars = [60, 120, 180].map((t) => ({
      time: t,
      open: 10, high: 14, low: 8, close: 12, volume: 100,
    }));
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.length).toBe(1);
    expect(result.time[0]).toBe(0); // floor(60 / 300) * 300 = 0
  });

  it('produces correct count for two separate 5-minute buckets', () => {
    // First bucket: t=0..240, second bucket: t=300..540
    const bars = [
      ...([0, 60, 120, 180, 240].map((t) => ({ time: t, open: 10, high: 14, low: 8,  close: 12, volume: 100 }))),
      ...([300, 360, 420, 480, 540].map((t) => ({ time: t, open: 20, high: 24, low: 18, close: 22, volume: 200 }))),
    ];
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.length).toBe(2);
  });

  it('second bucket has correct open, high, low, close, volume', () => {
    const bars = [
      ...([0, 60, 120, 180, 240].map((t) => ({ time: t, open: 10, high: 14, low: 8,  close: 12, volume: 100 }))),
      { time: 300, open: 20, high: 28, low: 18, close: 22, volume: 200 },
      { time: 360, open: 22, high: 25, low: 17, close: 24, volume: 300 },
      { time: 420, open: 24, high: 30, low: 20, close: 26, volume: 150 },
    ];
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.length).toBe(2);
    expect(result.open[1]).toBe(20);   // first bar open of second bucket
    expect(result.high[1]).toBe(30);   // max high
    expect(result.low[1]).toBe(17);    // min low
    expect(result.close[1]).toBe(26);  // last bar close
    expect(result.volume[1]).toBe(650); // 200+300+150
  });

  it('second bucket time aligns to interval boundary', () => {
    const bars = [
      { time: 0,   open: 10, high: 14, low: 8,  close: 12, volume: 100 },
      { time: 300, open: 20, high: 24, low: 18, close: 22, volume: 200 },
    ];
    const store = makeStore(bars);
    const result = aggregateOHLC(store, FIVE_MIN);
    expect(result.time[0]).toBe(0);
    expect(result.time[1]).toBe(300);
  });
});
