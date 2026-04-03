import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { Bar } from '@/core/types';
import { TimeScale } from '@/core/time-scale';
import { PriceScale } from '@/core/price-scale';

// ── Mock RAF and ResizeObserver ─────────────────────────────────────────────

let rafCallbacks: Array<FrameRequestCallback> = [];
let rafId = 0;

// Mock canvas getContext for jsdom
function createMockContext(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    save: noop,
    restore: noop,
    setLineDash: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 0 }),
    canvas: null as unknown as HTMLCanvasElement,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineJoin: 'round',
    lineCap: 'round',
    setTransform: noop,
    scale: noop,
    translate: noop,
    rotate: noop,
    clip: noop,
    rect: noop,
    arc: noop,
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    fillText: noop,
    strokeText: noop,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

  // Mock HTMLCanvasElement.getContext to return a mock 2d context
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    const ctx = createMockContext();
    (ctx as Record<string, unknown>).canvas = this;
    return ctx;
  } as never);

  // Mock ResizeObserver
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
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

function makeBars(n: number, startTime = 1000): Bar[] {
  const bars: Bar[] = [];
  for (let i = 0; i < n; i++) {
    const base = 100 + i;
    bars.push({
      time: startTime + i * 60,
      open: base,
      high: base + 5,
      low: base - 3,
      close: base + 2,
      volume: 1000 + i,
    });
  }
  return bars;
}

describe('createChart', () => {
  let container: HTMLElement;
  let chart: IChartApi;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    chart?.remove();
    container.remove();
  });

  it('creates a chart with DOM elements', () => {
    chart = createChart(container, { width: 600, height: 300 });

    // Should have a wrapper div with 2 canvases
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.tagName).toBe('DIV');

    const canvases = wrapper.querySelectorAll('canvas');
    expect(canvases.length).toBe(2);
  });

  it('adds and removes a candlestick series', () => {
    chart = createChart(container);
    const series = chart.addCandlestickSeries();

    expect(series.seriesType()).toBe('candlestick');

    // Set data
    const bars = makeBars(10);
    series.setData(bars);

    // Verify data is accessible
    const bar = series.dataByIndex(0);
    expect(bar).not.toBeNull();
    expect(bar!.time).toBe(1000);

    // Remove
    chart.removeSeries(series);
  });

  it('crosshair handler uses new primary series DataLayer after original series is removed', () => {
    // Regression: CrosshairHandler must not hold a stale DataLayer reference
    // after the primary series is removed.
    chart = createChart(container, { width: 600, height: 300 });

    // Series A – becomes the primary; crosshair handler is created pointing to its DataLayer
    const seriesA = chart.addCandlestickSeries();
    seriesA.setData(makeBars(5, 1000)); // times 1000, 1060, ..., 1240

    // Remove series A – handler must be reset
    chart.removeSeries(seriesA);

    // Series B – must become the new primary and the crosshair handler should
    // reference its DataLayer (not the stale one from series A)
    const seriesB = chart.addCandlestickSeries();
    seriesB.setData(makeBars(3, 5000)); // times 5000, 5060, 5120

    // Painting must not throw (would fail if handler uses freed DataLayer)
    expect(() => flushRAF()).not.toThrow();

    // The chart should correctly render series B's data
    const bar = seriesB.dataByIndex(0);
    expect(bar).not.toBeNull();
    expect(bar!.time).toBe(5000);
  });

  it('crosshair handler is replaced with next series when primary is removed while others remain', () => {
    chart = createChart(container, { width: 600, height: 300 });

    const seriesA = chart.addCandlestickSeries();
    seriesA.setData(makeBars(5, 1000));

    const seriesB = chart.addCandlestickSeries();
    seriesB.setData(makeBars(3, 5000));

    // Remove the primary series while series B still exists
    chart.removeSeries(seriesA);

    // Series B is now primary; painting must not throw
    expect(() => flushRAF()).not.toThrow();

    const bar = seriesB.dataByIndex(0);
    expect(bar).not.toBeNull();
    expect(bar!.time).toBe(5000);
  });

  it('adds a line series with initial data', () => {
    chart = createChart(container);
    const bars = makeBars(5);
    const series = chart.addLineSeries({ data: bars, color: '#ff0000' });

    expect(series.seriesType()).toBe('line');
    expect(series.dataByIndex(0)?.time).toBe(1000);
    expect(series.dataByIndex(4)?.time).toBe(1000 + 4 * 60);
  });

  it('real-time update appends a bar', () => {
    chart = createChart(container);
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(3));

    const newBar: Bar = {
      time: 2000,
      open: 200,
      high: 210,
      low: 195,
      close: 205,
    };
    series.update(newBar);

    // Bar at index 3 should be the new bar
    const b = series.dataByIndex(3);
    expect(b).not.toBeNull();
    expect(b!.time).toBe(2000);
    expect(b!.close).toBe(205);
  });

  it('applyOptions updates chart options', () => {
    chart = createChart(container, { width: 400, height: 200 });

    chart.applyOptions({
      layout: { backgroundColor: '#000000' },
    });

    const opts = chart.options();
    expect(opts.layout.backgroundColor).toBe('#000000');
    // Other defaults should be preserved
    expect(opts.layout.fontSize).toBe(11);
  });

  it('timeScale() returns a TimeScale instance', () => {
    chart = createChart(container);
    const ts = chart.timeScale();
    expect(ts).toBeInstanceOf(TimeScale);
  });

  it('priceScale() returns a PriceScale instance', () => {
    chart = createChart(container);
    const ps = chart.priceScale();
    expect(ps).toBeInstanceOf(PriceScale);
  });

  it('resize updates canvas dimensions', () => {
    chart = createChart(container, { width: 400, height: 200 });
    chart.resize(800, 600);

    const opts = chart.options();
    expect(opts.width).toBe(800);
    expect(opts.height).toBe(600);

    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper.style.width).toBe('800px');
    expect(wrapper.style.height).toBe('600px');
  });

  it('remove cleans up DOM', () => {
    chart = createChart(container);
    chart.remove();

    expect(container.children.length).toBe(0);
    // Calling remove again should be a no-op
    chart.remove();
  });

  it('paint runs on RAF after requestRepaint', () => {
    chart = createChart(container);
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(20));

    // RAF should have been scheduled
    expect(rafCallbacks.length).toBeGreaterThan(0);

    // Flushing should not throw
    flushRAF();
  });

  it('adds area, bar, baseline, hollow-candle, histogram series', () => {
    chart = createChart(container);

    const area = chart.addAreaSeries();
    expect(area.seriesType()).toBe('area');

    const bar = chart.addBarSeries();
    expect(bar.seriesType()).toBe('bar');

    const baseline = chart.addBaselineSeries();
    expect(baseline.seriesType()).toBe('baseline');

    const hollow = chart.addHollowCandleSeries();
    expect(hollow.seriesType()).toBe('hollow-candle');

    const hist = chart.addHistogramSeries();
    expect(hist.seriesType()).toBe('histogram');
  });

  it('subscribeCrosshairMove / unsubscribeCrosshairMove', () => {
    chart = createChart(container);
    const cb = vi.fn();
    chart.subscribeCrosshairMove(cb);
    chart.unsubscribeCrosshairMove(cb);
    // No-op verify - just should not throw
  });

  it('subscribeClick / unsubscribeClick', () => {
    chart = createChart(container);
    const cb = vi.fn();
    chart.subscribeClick(cb);
    chart.unsubscribeClick(cb);
  });

  it('addPane / removePane', () => {
    chart = createChart(container);
    const pane = chart.addPane({ height: 150 });
    expect(pane.id).toBeTruthy();
    chart.removePane(pane);
  });
});
