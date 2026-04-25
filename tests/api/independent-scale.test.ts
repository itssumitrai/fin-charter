import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { Bar } from '@/core/types';
import '@/series/candlestick';
import '@/series/line';

// ── Helpers ─────────────────────────────────────────────────────────────────

function createMockContext(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    clearRect: noop, fillRect: noop, strokeRect: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
    stroke: noop, fill: noop, save: noop, restore: noop,
    setLineDash: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 0 }),
    canvas: null as unknown as HTMLCanvasElement,
    strokeStyle: '', fillStyle: '', lineWidth: 1,
    lineJoin: 'round', lineCap: 'round',
    setTransform: noop, scale: noop, translate: noop, rotate: noop,
    clip: noop, rect: noop, arc: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop,
    fillText: noop, strokeText: noop,
    font: '', textAlign: 'start', textBaseline: 'alphabetic', globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

let rafCallbacks: Array<FrameRequestCallback> = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    const ctx = createMockContext();
    (ctx as Record<string, unknown>).canvas = this;
    return ctx;
  } as never);
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {} unobserve() {} disconnect() {}
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

function flushRAF(): void {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
}

function makeBars(n: number, basePrice: number, startTime = 1_700_000_000): Bar[] {
  return Array.from({ length: n }, (_, i) => ({
    time: startTime + i * 86400,
    open: basePrice + i,
    high: basePrice + i + 5,
    low: basePrice + i - 3,
    close: basePrice + i + 2,
    volume: 1000 + i,
  }));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('independentScale option', () => {
  let container: HTMLElement;
  let chart: IChartApi;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    chart = createChart(container, { width: 800, height: 400 });
  });

  afterEach(() => {
    chart.remove();
    container.remove();
  });

  it('series created without independentScale have no independent scale', () => {
    const s = chart.addSeries({ type: 'line', color: '#2962ff' });
    s.setData(makeBars(30, 100));
    // Accessing internal state via cast
    const internal = (chart as unknown as { _series: Array<{ independentPriceScale: unknown }> })._series;
    expect(internal.length).toBe(1);
    expect(internal[0].independentPriceScale).toBeNull();
  });

  it('series created with independentScale:true have their own PriceScale', () => {
    const s = chart.addSeries({ type: 'line', color: '#ff0000', independentScale: true });
    s.setData(makeBars(30, 200));
    const internal = (chart as unknown as { _series: Array<{ independentPriceScale: unknown }> })._series;
    expect(internal.length).toBe(1);
    expect(internal[0].independentPriceScale).not.toBeNull();
  });

  it('independent scale is distinct from the pane shared scale', () => {
    const s1 = chart.addSeries({ type: 'line', color: '#2962ff' });
    const s2 = chart.addSeries({ type: 'line', color: '#ff0000', independentScale: true });
    s1.setData(makeBars(20, 100));
    s2.setData(makeBars(20, 3000)); // very different price range

    const internal = (chart as unknown as {
      _series: Array<{ independentPriceScale: { priceRange: { min: number; max: number } } | null }>;
      _paneMap: Map<string, { priceScale: { priceRange: { min: number; max: number } } }>;
    })._series;

    flushRAF(); // trigger _paint() so scales are auto-scaled

    const paneScale = (chart as unknown as {
      _paneMap: Map<string, { priceScale: { priceRange: { min: number; max: number } } }>;
    })._paneMap.get('main')!.priceScale;

    const indScale = internal[1].independentPriceScale!;

    // pane scale should reflect s1's price range (~97–127)
    expect(paneScale.priceRange.min).toBeLessThan(200);
    expect(paneScale.priceRange.max).toBeLessThan(200);

    // independent scale should reflect s2's price range (~2997–3027)
    expect(indScale.priceRange.min).toBeGreaterThan(2000);
    expect(indScale.priceRange.max).toBeGreaterThan(2000);
  });

  it('independent and shared scales auto-scale independently', () => {
    // s1 lives in [100..130], s2 lives in [5000..5030] with independentScale
    const s1 = chart.addSeries({ type: 'line', color: '#aaa' });
    const s2 = chart.addSeries({ type: 'line', color: '#bbb', independentScale: true });
    s1.setData(makeBars(10, 100));
    s2.setData(makeBars(10, 5000));

    flushRAF();

    const pane = (chart as unknown as {
      _paneMap: Map<string, { priceScale: { priceRange: { min: number; max: number } } }>;
    })._paneMap.get('main')!;

    const internalSeries = (chart as unknown as {
      _series: Array<{ independentPriceScale: { priceRange: { min: number; max: number } } | null }>;
    })._series;

    // Shared scale covers only s1 (s2 is excluded because it has independentScale)
    expect(pane.priceScale.priceRange.max).toBeLessThan(500);

    // Independent scale covers s2's range
    const indRange = internalSeries[1].independentPriceScale!.priceRange;
    expect(indRange.min).toBeGreaterThan(4900);
    expect(indRange.max).toBeGreaterThan(5000);
  });

  it('multiple independent-scale series each get separate PriceScale instances', () => {
    const s1 = chart.addSeries({ type: 'line', independentScale: true });
    const s2 = chart.addSeries({ type: 'line', independentScale: true });
    s1.setData(makeBars(5, 100));
    s2.setData(makeBars(5, 900));

    const internal = (chart as unknown as {
      _series: Array<{ independentPriceScale: object | null }>;
    })._series;

    expect(internal[0].independentPriceScale).not.toBeNull();
    expect(internal[1].independentPriceScale).not.toBeNull();
    // They should be different objects
    expect(internal[0].independentPriceScale).not.toBe(internal[1].independentPriceScale);
  });

  it('removing a series with independentScale does not throw', () => {
    const s = chart.addSeries({ type: 'line', independentScale: true });
    s.setData(makeBars(10, 200));
    flushRAF();
    expect(() => chart.removeSeries(s)).not.toThrow();
    const internal = (chart as unknown as { _series: unknown[] })._series;
    expect(internal.length).toBe(0);
  });

  it('paint does not throw with mixed scales', () => {
    const s1 = chart.addSeries({ type: 'candlestick' });
    const s2 = chart.addSeries({ type: 'line', color: '#f00', independentScale: true });
    s1.setData(makeBars(20, 150));
    s2.setData(makeBars(20, 5000));
    expect(() => flushRAF()).not.toThrow();
  });

  it('independentScale series does not affect shared scale when data changes', () => {
    const s1 = chart.addSeries({ type: 'line' });
    const s2 = chart.addSeries({ type: 'line', independentScale: true });
    s1.setData(makeBars(10, 100));
    s2.setData(makeBars(10, 9999));
    flushRAF();

    const pane = (chart as unknown as {
      _paneMap: Map<string, { priceScale: { priceRange: { min: number; max: number } } }>;
    })._paneMap.get('main')!;

    // Push s2 data way higher — shared scale must not change dramatically
    const prevMax = pane.priceScale.priceRange.max;

    s2.setData(makeBars(10, 99999));
    flushRAF();

    // The shared scale is still tracking only s1's range
    expect(Math.abs(pane.priceScale.priceRange.max - prevMax)).toBeLessThan(50);
  });

  it('series with independentScale:false behaves like default (no independent scale)', () => {
    const s = chart.addSeries({ type: 'line', independentScale: false });
    s.setData(makeBars(5, 100));
    const internal = (chart as unknown as {
      _series: Array<{ independentPriceScale: unknown }>;
    })._series;
    expect(internal[0].independentPriceScale).toBeNull();
  });
});
