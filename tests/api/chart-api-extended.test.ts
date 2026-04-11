import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { Bar } from '@/core/types';
import type { MarketSession } from '@/core/market-session';

// ── Mock RAF and ResizeObserver ─────────────────────────────────────────────

let rafCallbacks: Array<FrameRequestCallback> = [];
let rafId = 0;

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
    drawImage: noop,
    toDataURL: () => 'data:image/png;base64,',
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

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    const ctx = createMockContext();
    (ctx as Record<string, unknown>).canvas = this;
    return ctx;
  } as never);

  // Mock toDataURL on canvas elements
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,abc123');

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

describe('chart-api extended coverage', () => {
  let container: HTMLElement;
  let chart: IChartApi;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    chart = createChart(container, { width: 600, height: 300 });
  });

  afterEach(() => {
    chart?.remove();
    container.remove();
  });

  // ── 1. Screenshot ────────────────────────────────────────────────────────

  it('takeScreenshot returns an HTMLCanvasElement', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(10));
    flushRAF();

    let result: HTMLCanvasElement | undefined;
    expect(() => {
      result = chart.takeScreenshot();
    }).not.toThrow();
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(HTMLCanvasElement);
  });

  it('takeScreenshot works with no series data', () => {
    let result: HTMLCanvasElement | undefined;
    expect(() => {
      result = chart.takeScreenshot();
    }).not.toThrow();
    expect(result).toBeInstanceOf(HTMLCanvasElement);
  });

  // ── 2. Export ─────────────────────────────────────────────────────────────

  it('exportCSV returns a string with headers when series has data', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(5));
    flushRAF();

    let csv: string | undefined;
    expect(() => {
      csv = chart.exportCSV();
    }).not.toThrow();
    expect(typeof csv).toBe('string');
    expect(csv).toContain('Date');
    expect(csv).toContain('Open');
    expect(csv).toContain('High');
    expect(csv).toContain('Low');
    expect(csv).toContain('Close');
  });

  it('exportCSV returns empty string when no series', () => {
    const csv = chart.exportCSV();
    expect(typeof csv).toBe('string');
    expect(csv).toBe('');
  });

  it('exportSVG returns a string containing <svg', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(5));
    flushRAF();

    let svg: string | undefined;
    expect(() => {
      svg = chart.exportSVG();
    }).not.toThrow();
    expect(typeof svg).toBe('string');
    // The SVG export wraps a PNG image in an SVG tag (may have <?xml?> preamble)
    expect(svg).toContain('<svg');
  });

  it('exportPDF returns a Blob', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(5));
    flushRAF();

    let blob: Blob | undefined;
    expect(() => {
      blob = chart.exportPDF();
    }).not.toThrow();
    expect(blob).toBeInstanceOf(Blob);
  });

  // ── 3. fitContent ─────────────────────────────────────────────────────────

  it('fitContent does not throw', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(20));
    expect(() => chart.fitContent()).not.toThrow();
  });

  it('fitContent works with no series', () => {
    expect(() => chart.fitContent()).not.toThrow();
  });

  // ── 4. scrollToRealTime ───────────────────────────────────────────────────

  it('scrollToRealTime does not throw', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(10));
    expect(() => chart.scrollToRealTime()).not.toThrow();
  });

  // ── 5. setVisibleRange / setVisibleLogicalRange ───────────────────────────

  it('setVisibleRange does not throw with valid timestamps', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    const bars = makeBars(20);
    series.setData(bars);
    flushRAF();

    expect(() => chart.setVisibleRange(bars[0].time, bars[10].time)).not.toThrow();
  });

  it('setVisibleRange is a no-op when no series data', () => {
    // chart has no series yet — should not throw
    expect(() => chart.setVisibleRange(1000, 2000)).not.toThrow();
  });

  it('setVisibleLogicalRange does not throw with valid indices', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(50));
    flushRAF();

    expect(() => chart.setVisibleLogicalRange(0, 49)).not.toThrow();
  });

  it('setVisibleLogicalRange does not throw with no series', () => {
    expect(() => chart.setVisibleLogicalRange(0, 10)).not.toThrow();
  });

  // ── 6. Market sessions round-trip ─────────────────────────────────────────

  it('setMarketSessions and getMarketSessions round-trip', () => {
    const sessions: MarketSession[] = [
      { id: 'regular', label: 'Regular', startMinute: 570, endMinute: 960, bgColor: 'transparent' },
      { id: 'premarket', label: 'Pre', startMinute: 240, endMinute: 570, bgColor: 'rgba(33,150,243,0.06)' },
    ];

    expect(() => chart.setMarketSessions(sessions)).not.toThrow();
    const result = chart.getMarketSessions();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('regular');
    expect(result[1].id).toBe('premarket');
  });

  it('getMarketSessions returns empty array by default', () => {
    expect(chart.getMarketSessions()).toEqual([]);
  });

  // ── 7. Session filter round-trip ──────────────────────────────────────────

  it('setSessionFilter and getSessionFilter round-trip with "regular"', () => {
    expect(() => chart.setSessionFilter('regular')).not.toThrow();
    expect(chart.getSessionFilter()).toBe('regular');
  });

  it('setSessionFilter and getSessionFilter round-trip with "extended"', () => {
    chart.setSessionFilter('extended');
    expect(chart.getSessionFilter()).toBe('extended');
  });

  it('setSessionFilter and getSessionFilter round-trip with "all"', () => {
    chart.setSessionFilter('all');
    expect(chart.getSessionFilter()).toBe('all');
  });

  it('getSessionFilter defaults to "all"', () => {
    expect(chart.getSessionFilter()).toBe('all');
  });

  // ── 8. Comparison mode round-trip ─────────────────────────────────────────

  it('setComparisonMode(true) and isComparisonMode() round-trip', () => {
    expect(chart.isComparisonMode()).toBe(false);
    chart.setComparisonMode(true);
    expect(chart.isComparisonMode()).toBe(true);
  });

  it('setComparisonMode(false) disables comparison mode', () => {
    chart.setComparisonMode(true);
    chart.setComparisonMode(false);
    expect(chart.isComparisonMode()).toBe(false);
  });

  it('setComparisonMode does not throw', () => {
    expect(() => chart.setComparisonMode(true)).not.toThrow();
    expect(() => chart.setComparisonMode(false)).not.toThrow();
  });

  // ── 9. Periodicity round-trip ─────────────────────────────────────────────

  it('setPeriodicity and getPeriodicity round-trip', () => {
    chart.setPeriodicity({ interval: 5, unit: 'minute' });
    const p = chart.getPeriodicity();
    expect(p.interval).toBe(5);
    expect(p.unit).toBe('minute');
  });

  it('getPeriodicity returns default value initially', () => {
    const p = chart.getPeriodicity();
    expect(p).toBeDefined();
    expect(p.interval).toBeDefined();
    expect(p.unit).toBeDefined();
  });

  it('setPeriodicity does not throw for all units', () => {
    const units = ['second', 'minute', 'hour', 'day', 'week', 'month'] as const;
    for (const unit of units) {
      expect(() => chart.setPeriodicity({ interval: 1, unit })).not.toThrow();
    }
  });

  // ── 10. Drawing tools ─────────────────────────────────────────────────────

  it('setActiveDrawingTool with "trendline" does not throw', () => {
    expect(() => chart.setActiveDrawingTool('trendline')).not.toThrow();
  });

  it('setActiveDrawingTool with null clears the active tool', () => {
    chart.setActiveDrawingTool('trendline');
    expect(() => chart.setActiveDrawingTool(null)).not.toThrow();
  });

  it('setActiveDrawingTool with various types does not throw', () => {
    const types = ['trendline', 'horizontal-line', 'rectangle', 'fibonacci'];
    for (const type of types) {
      expect(() => chart.setActiveDrawingTool(type)).not.toThrow();
    }
    expect(() => chart.setActiveDrawingTool(null)).not.toThrow();
  });

  // ── 11. Resize ────────────────────────────────────────────────────────────

  it('resize does not throw', () => {
    expect(() => chart.resize(1000, 500)).not.toThrow();
  });

  it('resize updates options width and height', () => {
    chart.resize(1000, 500);
    const opts = chart.options();
    expect(opts.width).toBe(1000);
    expect(opts.height).toBe(500);
  });

  it('resize updates wrapper styles', () => {
    chart.resize(800, 400);
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper.style.width).toBe('800px');
    expect(wrapper.style.height).toBe('400px');
  });

  // ── 12. options() ─────────────────────────────────────────────────────────

  it('options() returns an object with expected keys', () => {
    const opts = chart.options();
    expect(opts).toBeDefined();
    expect(typeof opts).toBe('object');
    expect(opts).toHaveProperty('layout');
    expect(opts).toHaveProperty('grid');
    expect(opts).toHaveProperty('width');
    expect(opts).toHaveProperty('height');
    expect(opts).toHaveProperty('leftPriceScale');
    expect(opts).toHaveProperty('rightPriceScale');
    expect(opts).toHaveProperty('timeScale');
  });

  it('options() layout has expected sub-keys', () => {
    const opts = chart.options();
    expect(opts.layout).toHaveProperty('backgroundColor');
    expect(opts.layout).toHaveProperty('textColor');
    expect(opts.layout).toHaveProperty('fontSize');
  });

  // ── 13. applyOptions ─────────────────────────────────────────────────────

  it('applyOptions({ layout: { backgroundColor } }) updates backgroundColor', () => {
    chart.applyOptions({ layout: { backgroundColor: '#000000' } });
    expect(chart.options().layout.backgroundColor).toBe('#000000');
  });

  it('applyOptions preserves other options when updating a nested key', () => {
    const before = chart.options().layout.fontSize;
    chart.applyOptions({ layout: { backgroundColor: '#111111' } });
    expect(chart.options().layout.fontSize).toBe(before);
  });

  it('applyOptions does not throw with empty object', () => {
    expect(() => chart.applyOptions({})).not.toThrow();
  });

  it('applyOptions can update multiple fields at once', () => {
    chart.applyOptions({
      layout: { backgroundColor: '#ffffff', textColor: '#000000' },
    });
    const opts = chart.options();
    expect(opts.layout.backgroundColor).toBe('#ffffff');
    expect(opts.layout.textColor).toBe('#000000');
  });

  // ── 14. refreshCSSTheme ───────────────────────────────────────────────────

  it('refreshCSSTheme does not throw', () => {
    expect(() => chart.refreshCSSTheme()).not.toThrow();
  });

  it('refreshCSSTheme can be called multiple times without throwing', () => {
    expect(() => {
      chart.refreshCSSTheme();
      chart.refreshCSSTheme();
    }).not.toThrow();
  });

  // ── 15. remove ────────────────────────────────────────────────────────────

  it('remove does not throw', () => {
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const localChart = createChart(localContainer, { width: 400, height: 200 });
    expect(() => localChart.remove()).not.toThrow();
    localContainer.remove();
  });

  it('remove cleans up DOM wrapper', () => {
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const localChart = createChart(localContainer, { width: 400, height: 200 });
    expect(localContainer.children.length).toBeGreaterThan(0);
    localChart.remove();
    expect(localContainer.children.length).toBe(0);
    localContainer.remove();
  });

  it('calling remove twice does not throw (idempotent)', () => {
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const localChart = createChart(localContainer, { width: 400, height: 200 });
    expect(() => {
      localChart.remove();
      localChart.remove();
    }).not.toThrow();
    localContainer.remove();
  });

  it('calling options() after remove does not crash', () => {
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const localChart = createChart(localContainer, { width: 400, height: 200 });
    localChart.remove();
    expect(() => localChart.options()).not.toThrow();
    localContainer.remove();
  });

  it('calling fitContent after remove does not crash', () => {
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const localChart = createChart(localContainer, { width: 400, height: 200 });
    localChart.remove();
    expect(() => localChart.fitContent()).not.toThrow();
    localContainer.remove();
  });
});
