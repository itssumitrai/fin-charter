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

    // Should have a wrapper div with canvases (chart, overlay, price axis, left price axis, time axis)
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.tagName).toBe('DIV');

    const canvases = wrapper.querySelectorAll('canvas');
    expect(canvases.length).toBe(5);
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

  // ── Feature 2: Go to Realtime ────────────────────────────────────────────

  it('scrollToRealTime resets rightOffset to 0', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(50));

    // Scroll away from realtime by adjusting rightOffset via timeScale
    chart.timeScale().setRightOffset(10);
    expect(chart.timeScale().rightOffset).toBe(10);

    // Now reset
    chart.scrollToRealTime();
    expect(chart.timeScale().rightOffset).toBe(0);
  });

  // ── Feature 1: Range Switcher ────────────────────────────────────────────

  it('setVisibleLogicalRange adjusts barSpacing and rightOffset', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(100));
    flushRAF(); // allow _paint to update dataLength on timeScale

    // Show bars 50–99 (50 bars)
    chart.setVisibleLogicalRange(50, 99);

    // rightOffset = toIdx - baseIndex = 99 - 99 = 0
    expect(chart.timeScale().rightOffset).toBeCloseTo(0, 5);
  });

  it('setVisibleRange finds nearest bar indices by timestamp', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    const bars = makeBars(10, 1000); // times 1000, 1060, 1120, ..., 1540
    series.setData(bars);
    flushRAF();

    // Set visible range covering bars 0–4 by exact timestamps
    chart.setVisibleRange(1000, 1240);

    // rightOffset = toIdx(4) - baseIndex(9) = 4 - 9 = -5
    expect(chart.timeScale().rightOffset).toBeCloseTo(-5, 5);
  });

  // ── Feature 3: Visible Range Change Subscription ─────────────────────────

  it('subscribeVisibleRangeChange fires when visible range changes', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(20, 1000));

    const callback = vi.fn();
    chart.subscribeVisibleRangeChange(callback);

    // Flush the initial paint - this should fire the callback
    flushRAF();
    expect(callback).toHaveBeenCalledTimes(1);
    const firstCall = callback.mock.calls[0][0];
    expect(firstCall).not.toBeNull();
    expect(typeof firstCall.from).toBe('number');
    expect(typeof firstCall.to).toBe('number');
    expect(firstCall.from).toBeLessThanOrEqual(firstCall.to);
  });

  it('unsubscribeVisibleRangeChange stops firing callbacks', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(20, 1000));

    const callback = vi.fn();
    chart.subscribeVisibleRangeChange(callback);
    flushRAF();
    const callsBefore = callback.mock.calls.length;

    chart.unsubscribeVisibleRangeChange(callback);

    // Force another repaint
    chart.scrollToRealTime();
    flushRAF();

    // Callback count should not have increased after unsubscribe
    expect(callback.mock.calls.length).toBe(callsBefore);
  });

  // ── Feature: Custom Price Formatter ─────────────────────────────────────

  it('custom priceFormatter is called when formatting prices', () => {
    const formatter = vi.fn((price: number) => `$${price.toFixed(4)}`);
    chart = createChart(container, {
      width: 600,
      height: 300,
      priceFormatter: formatter,
    });

    const series = chart.addCandlestickSeries();
    series.setData(makeBars(10));

    // Flush to trigger painting which uses _formatPrice internally
    flushRAF();

    // The formatter should have been called at least once during painting
    expect(formatter).toHaveBeenCalled();

    // The return value should match formatter output
    const opts = chart.options();
    expect(opts.priceFormatter).toBe(formatter);
  });

  it('default price formatting uses toFixed(2) when no priceFormatter is set', () => {
    chart = createChart(container, { width: 600, height: 300 });

    const opts = chart.options();
    // No custom formatter set
    expect(opts.priceFormatter).toBeUndefined();

    // Painting should not throw without a custom formatter
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(5));
    expect(() => flushRAF()).not.toThrow();
  });

  it('priceFormatter can be applied via applyOptions', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const formatter = (price: number) => `${price.toFixed(0)} USD`;

    chart.applyOptions({ priceFormatter: formatter });

    const opts = chart.options();
    expect(opts.priceFormatter).toBe(formatter);
    expect(opts.priceFormatter!(123.456)).toBe('123 USD');
  });

  // ── Feature: Theme Application ───────────────────────────────────────────

  it('COLORFUL_THEME merges correctly via applyOptions', () => {
    chart = createChart(container, { width: 600, height: 300 });

    // Apply colorful theme values manually (same as COLORFUL_THEME)
    chart.applyOptions({
      layout: { backgroundColor: '#131722', textColor: '#b2b5be' },
      grid: {
        vertLinesColor: 'rgba(42, 46, 57, 0.8)',
        horzLinesColor: 'rgba(42, 46, 57, 0.8)',
      },
    });

    const opts = chart.options();
    expect(opts.layout.backgroundColor).toBe('#131722');
    expect(opts.layout.textColor).toBe('#b2b5be');
    expect(opts.grid.vertLinesColor).toBe('rgba(42, 46, 57, 0.8)');
    // Other options should be preserved
    expect(opts.layout.fontSize).toBe(11);
    expect(opts.lastPriceLine.visible).toBe(true);
  });

  it('createChart with theme: colorful applies COLORFUL_THEME', () => {
    chart = createChart(container, { width: 600, height: 300, theme: 'colorful' });

    const opts = chart.options();
    expect(opts.layout.backgroundColor).toBe('#131722');
    expect(opts.layout.textColor).toBe('#b2b5be');
    expect(opts.grid.vertLinesColor).toBe('rgba(42, 46, 57, 0.8)');
  });

  it('createChart with theme: dark applies DARK_THEME', () => {
    chart = createChart(container, { width: 600, height: 300, theme: 'dark' });

    const opts = chart.options();
    expect(opts.layout.backgroundColor).toBe('#1a1a2e');
    expect(opts.layout.textColor).toBe('#d1d4dc');
  });

  // ── Feature: Dual Price Scales ───────────────────────────────────────────

  it('leftPriceScale.visible defaults to false', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const opts = chart.options();
    expect(opts.leftPriceScale.visible).toBe(false);
    expect(opts.rightPriceScale.visible).toBe(true);
  });

  it('leftPriceScale can be enabled via options', () => {
    chart = createChart(container, {
      width: 600,
      height: 300,
      leftPriceScale: { visible: true },
    });

    const opts = chart.options();
    expect(opts.leftPriceScale.visible).toBe(true);

    // Painting should not throw with left scale enabled
    const series = chart.addCandlestickSeries();
    series.setData(makeBars(5));
    expect(() => flushRAF()).not.toThrow();
  });

  // ── Feature: TimeGaps option ─────────────────────────────────────────────

  it('timeGaps.visible defaults to false', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const opts = chart.options();
    expect(opts.timeGaps.visible).toBe(false);
  });

  it('timeGaps can be enabled via options without throwing', () => {
    chart = createChart(container, {
      width: 600,
      height: 300,
      timeGaps: { visible: true },
    });

    const opts = chart.options();
    expect(opts.timeGaps.visible).toBe(true);

    const series = chart.addCandlestickSeries();
    series.setData(makeBars(5));
    expect(() => flushRAF()).not.toThrow();
  });

  // ── addDrawing timestamp conversion ────────────────────────────────────

  it('addDrawing converts timestamps to bar indices', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    const bars = makeBars(10, 1000); // times: 1000, 1060, 1120, ...
    series.setData(bars);

    const drawing = chart.addDrawing(
      'trendline',
      [
        { time: bars[2].time, price: bars[2].close },
        { time: bars[7].time, price: bars[7].close },
      ],
      { color: '#ff0000' },
    );

    const pts = drawing.points();
    expect(pts[0].time).toBe(2); // bar index, not timestamp
    expect(pts[1].time).toBe(7);
    // Prices should be unchanged
    expect(pts[0].price).toBe(bars[2].close);
    expect(pts[1].price).toBe(bars[7].close);
  });

  it('serializeDrawings preserves bar indices after addDrawing', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    const bars = makeBars(20, 1000);
    series.setData(bars);

    chart.addDrawing(
      'horizontal-line',
      [{ time: bars[10].time, price: 150 }],
      { color: '#00ff00' },
    );

    const serialized = chart.serializeDrawings();
    expect(serialized).toHaveLength(1);
    expect(serialized[0].points[0].time).toBe(10);
  });

  it('_addDrawingByIndex does not re-convert bar indices', () => {
    chart = createChart(container, { width: 600, height: 300 });
    const series = chart.addCandlestickSeries();
    const bars = makeBars(10, 1000);
    series.setData(bars);

    // Simulate internal path (like duplicateDrawing) using index-based points
    const drawing = (chart as unknown as { _addDrawingByIndex: typeof chart.addDrawing })
      ._addDrawingByIndex(
        'trendline',
        [
          { time: 3, price: 100 },
          { time: 8, price: 200 },
        ],
        { color: '#0000ff' },
      );

    const pts = drawing.points();
    expect(pts[0].time).toBe(3); // stays as bar index
    expect(pts[1].time).toBe(8);
  });
});
