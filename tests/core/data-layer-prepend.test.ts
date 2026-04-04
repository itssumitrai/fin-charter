import { describe, it, expect, beforeEach } from 'vitest';
import { DataLayer } from '@/core/data-layer';
import { SeriesApi } from '@/api/series-api';
import { PriceScale } from '@/core/price-scale';
import type { Bar, ColumnData } from '@/core/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build n bars with times starting at `startTime`, step 1000. */
const makeBars = (n: number, startTime = 1000): Bar[] =>
  Array.from({ length: n }, (_, i) => ({
    time: startTime + i * 1000,
    open: 10 + i,
    high: 12 + i,
    low: 9 + i,
    close: 11 + i,
    volume: 100 + i,
  }));

const barsToColumnData = (bars: Bar[]): ColumnData => ({
  time: new Float64Array(bars.map((b) => b.time)),
  open: new Float64Array(bars.map((b) => b.open)),
  high: new Float64Array(bars.map((b) => b.high)),
  low: new Float64Array(bars.map((b) => b.low)),
  close: new Float64Array(bars.map((b) => b.close)),
  volume: new Float64Array(bars.map((b) => b.volume ?? 0)),
});

// ── DataLayer.prepend ─────────────────────────────────────────────────────────

describe('DataLayer.prepend', () => {
  let dl: DataLayer;

  beforeEach(() => {
    dl = new DataLayer();
  });

  it('increases store length by the number of prepended bars', () => {
    dl.setData(makeBars(5, 6000));
    dl.prepend(makeBars(3, 1000)); // times 1000, 2000, 3000
    expect(dl.store.length).toBe(8);
  });

  it('prepended bars appear at the beginning of the store', () => {
    const existing = makeBars(3, 4000); // times 4000, 5000, 6000
    const older = makeBars(2, 1000);    // times 1000, 2000
    dl.setData(existing);
    dl.prepend(older);

    expect(dl.store.time[0]).toBe(1000);
    expect(dl.store.time[1]).toBe(2000);
  });

  it('existing data follows the prepended data', () => {
    const existing = makeBars(3, 4000); // times 4000, 5000, 6000
    const older = makeBars(2, 1000);    // times 1000, 2000
    dl.setData(existing);
    dl.prepend(older);

    expect(dl.store.time[2]).toBe(4000);
    expect(dl.store.time[3]).toBe(5000);
    expect(dl.store.time[4]).toBe(6000);
  });

  it('existing OHLCV values are preserved after prepend', () => {
    const existing = makeBars(2, 4000);
    dl.setData(existing);
    const origClose0 = existing[0].close;
    const origClose1 = existing[1].close;

    dl.prepend(makeBars(3, 1000));

    // existing bars are now at indices 3 and 4
    expect(dl.store.close[3]).toBe(origClose0);
    expect(dl.store.close[4]).toBe(origClose1);
  });

  it('prepended OHLCV values are stored correctly', () => {
    dl.setData(makeBars(2, 5000));
    const older = makeBars(2, 1000); // open: 10, 11; close: 11, 12
    dl.prepend(older);

    expect(dl.store.open[0]).toBe(older[0].open);
    expect(dl.store.high[0]).toBe(older[0].high);
    expect(dl.store.low[0]).toBe(older[0].low);
    expect(dl.store.close[0]).toBe(older[0].close);
    expect(dl.store.volume[0]).toBe(older[0].volume);
  });

  it('prepend to an empty store works', () => {
    const bars = makeBars(4, 1000);
    dl.prepend(bars);

    expect(dl.store.length).toBe(4);
    expect(dl.store.time[0]).toBe(1000);
    expect(dl.store.time[3]).toBe(4000);
  });

  it('prepend with empty array is a no-op', () => {
    dl.setData(makeBars(3, 1000));
    dl.prepend([]);
    expect(dl.store.length).toBe(3);
  });

  it('accepts ColumnData as input', () => {
    dl.setData(makeBars(2, 5000));
    const older = makeBars(3, 1000);
    dl.prepend(barsToColumnData(older));

    expect(dl.store.length).toBe(5);
    expect(dl.store.time[0]).toBe(1000);
    expect(dl.store.time[2]).toBe(3000);
    expect(dl.store.time[3]).toBe(5000);
  });

  it('multiple sequential prepends accumulate correctly', () => {
    dl.setData(makeBars(2, 7000));  // times 7000, 8000
    dl.prepend(makeBars(2, 4000));  // times 4000, 5000
    dl.prepend(makeBars(3, 1000));  // times 1000, 2000, 3000

    expect(dl.store.length).toBe(7);
    expect(dl.store.time[0]).toBe(1000);
    expect(dl.store.time[2]).toBe(3000);
    expect(dl.store.time[3]).toBe(4000);
    expect(dl.store.time[5]).toBe(7000);
    expect(dl.store.time[6]).toBe(8000);
  });
});

// ── SeriesApi.barsInLogicalRange ──────────────────────────────────────────────

describe('SeriesApi.barsInLogicalRange', () => {
  let series: SeriesApi<'candlestick'>;

  beforeEach(() => {
    const dl = new DataLayer();
    const ps = new PriceScale();
    series = new SeriesApi(
      'candlestick',
      dl,
      ps,
      { visible: true } as never,
      () => {},
    );
    // Load 10 bars: times 1000..10000
    series.setData(makeBars(10, 1000));
  });

  it('barsBefore reflects bars before the from index', () => {
    const result = series.barsInLogicalRange({ from: 3, to: 7 });
    expect(result.barsBefore).toBe(3);
  });

  it('barsAfter reflects bars after the to index', () => {
    // 10 bars, indices 0–9. toIdx = ceil(7) = 7. barsAfter = 9 - 7 = 2
    const result = series.barsInLogicalRange({ from: 3, to: 7 });
    expect(result.barsAfter).toBe(2);
  });

  it('from timestamp matches the bar at fromIdx', () => {
    const result = series.barsInLogicalRange({ from: 2, to: 8 });
    // fromIdx = 2, time = 1000 + 2*1000 = 3000
    expect(result.from).toBe(3000);
  });

  it('to timestamp matches the bar at toIdx', () => {
    const result = series.barsInLogicalRange({ from: 2, to: 8 });
    // toIdx = 8, time = 1000 + 8*1000 = 9000
    expect(result.to).toBe(9000);
  });

  it('from=0 gives barsBefore=0', () => {
    const result = series.barsInLogicalRange({ from: 0, to: 5 });
    expect(result.barsBefore).toBe(0);
  });

  it('to=last index gives barsAfter=0', () => {
    const result = series.barsInLogicalRange({ from: 0, to: 9 });
    expect(result.barsAfter).toBe(0);
  });

  it('to beyond store length clamps to last bar', () => {
    const result = series.barsInLogicalRange({ from: 0, to: 100 });
    expect(result.barsAfter).toBe(0);
    // to should be the last bar's time
    expect(result.to).toBe(10000);
  });

  it('from negative clamps to 0', () => {
    const result = series.barsInLogicalRange({ from: -5, to: 5 });
    expect(result.barsBefore).toBe(0);
    expect(result.from).toBe(1000);
  });

  it('fractional range values are floored/ceiled correctly', () => {
    // from: 2.7 → floor → 2; to: 6.3 → ceil → 7
    const result = series.barsInLogicalRange({ from: 2.7, to: 6.3 });
    expect(result.barsBefore).toBe(2);
    expect(result.barsAfter).toBe(2); // 9 - 7 = 2
    expect(result.from).toBe(3000);
    expect(result.to).toBe(8000);
  });

  it('empty store returns zeroes', () => {
    const dl = new DataLayer();
    const ps = new PriceScale();
    const emptySeries = new SeriesApi(
      'candlestick',
      dl,
      ps,
      { visible: true } as never,
      () => {},
    );
    const result = emptySeries.barsInLogicalRange({ from: 0, to: 10 });
    expect(result.barsBefore).toBe(0);
    expect(result.barsAfter).toBe(0);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
  });
});

// ── SeriesApi.prependData ─────────────────────────────────────────────────────

describe('SeriesApi.prependData', () => {
  it('increases underlying store length', () => {
    const dl = new DataLayer();
    const ps = new PriceScale();
    const series = new SeriesApi(
      'candlestick',
      dl,
      ps,
      { visible: true } as never,
      () => {},
    );
    series.setData(makeBars(5, 6000));
    series.prependData(makeBars(3, 1000));
    expect(dl.store.length).toBe(8);
  });

  it('fires dataChanged callbacks', () => {
    const dl = new DataLayer();
    const ps = new PriceScale();
    const series = new SeriesApi(
      'candlestick',
      dl,
      ps,
      { visible: true } as never,
      () => {},
    );
    series.setData(makeBars(2, 5000));

    let callCount = 0;
    series.subscribeDataChanged(() => { callCount++; });
    series.prependData(makeBars(2, 1000));
    expect(callCount).toBe(1);
  });

  it('triggers repaint callback', () => {
    const dl = new DataLayer();
    const ps = new PriceScale();
    let repaintCount = 0;
    const series = new SeriesApi(
      'candlestick',
      dl,
      ps,
      { visible: true } as never,
      () => { repaintCount++; },
    );
    series.setData(makeBars(2, 5000));
    repaintCount = 0; // reset after setData
    series.prependData(makeBars(2, 1000));
    expect(repaintCount).toBe(1);
  });

  it('accepts ColumnData', () => {
    const dl = new DataLayer();
    const ps = new PriceScale();
    const series = new SeriesApi(
      'candlestick',
      dl,
      ps,
      { visible: true } as never,
      () => {},
    );
    series.setData(makeBars(3, 4000));
    series.prependData(barsToColumnData(makeBars(2, 1000)));
    expect(dl.store.length).toBe(5);
    expect(dl.store.time[0]).toBe(1000);
  });
});
