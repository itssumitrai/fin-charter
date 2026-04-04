import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { ISeriesApi } from '@/api/series-api';
import type { Bar } from '@/core/types';
import type { SeriesMarker } from '@/core/series-markers';

// ── Mock setup ────────────────────────────────────────────────────────────────

let rafCallbacks: Array<FrameRequestCallback> = [];
let rafId = 0;

function createMockContext(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    clearRect: noop, fillRect: noop, strokeRect: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
    stroke: noop, fill: noop, save: noop, restore: noop,
    setLineDash: noop, arc: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 0 }),
    canvas: null as unknown as HTMLCanvasElement,
    strokeStyle: '', fillStyle: '', lineWidth: 1, lineJoin: 'round', lineCap: 'round',
    setTransform: noop, scale: noop, translate: noop, rotate: noop,
    clip: noop, rect: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    fillText: noop, strokeText: noop,
    font: '', textAlign: 'start', textBaseline: 'alphabetic', globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { rafCallbacks.push(cb); return ++rafId; });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    const ctx = createMockContext();
    (ctx as Record<string, unknown>).canvas = this;
    return ctx;
  } as never);
  (globalThis as Record<string, unknown>).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});

afterEach(() => { vi.restoreAllMocks(); });

function flushRAF(): void {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
}

function makeBars(n: number, startTime = 1000): Bar[] {
  const bars: Bar[] = [];
  for (let i = 0; i < n; i++) {
    const base = 100 + i;
    bars.push({ time: startTime + i * 60, open: base, high: base + 5, low: base - 3, close: base + 2, volume: 1000 + i });
  }
  return bars;
}

describe('SeriesMarkers', () => {
  let container: HTMLElement;
  let chart: IChartApi;
  let series: ISeriesApi<'candlestick'>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    chart = createChart(container, { width: 600, height: 300 });
    series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(20));
  });

  afterEach(() => {
    chart?.remove();
    container.remove();
  });

  it('stores and retrieves markers', () => {
    const markers: SeriesMarker[] = [
      { time: 1060, position: 'aboveBar', shape: 'arrowDown', color: '#ff0000', text: 'Sell' },
      { time: 1120, position: 'belowBar', shape: 'arrowUp', color: '#00ff00', text: 'Buy' },
    ];
    series.setMarkers(markers);

    const stored = series.getMarkers();
    expect(stored).toHaveLength(2);
    expect(stored[0].time).toBe(1060);
    expect(stored[1].time).toBe(1120);
  });

  it('sorts markers by time', () => {
    const markers: SeriesMarker[] = [
      { time: 1300, position: 'inBar', shape: 'circle', color: '#ff0000' },
      { time: 1060, position: 'aboveBar', shape: 'square', color: '#00ff00' },
    ];
    series.setMarkers(markers);

    const stored = series.getMarkers();
    expect(stored[0].time).toBe(1060);
    expect(stored[1].time).toBe(1300);
  });

  it('replaces markers on subsequent setMarkers calls', () => {
    series.setMarkers([{ time: 1060, position: 'aboveBar', shape: 'circle', color: '#ff0000' }]);
    expect(series.getMarkers()).toHaveLength(1);

    series.setMarkers([
      { time: 1060, position: 'belowBar', shape: 'arrowUp', color: '#00ff00' },
      { time: 1120, position: 'inBar', shape: 'square', color: '#0000ff' },
    ]);
    expect(series.getMarkers()).toHaveLength(2);
  });

  it('defaults size to undefined (renderer uses 1)', () => {
    const marker: SeriesMarker = { time: 1060, position: 'aboveBar', shape: 'circle', color: '#ff0000' };
    series.setMarkers([marker]);
    expect(series.getMarkers()[0].size).toBeUndefined();
  });

  it('accepts optional id and size', () => {
    const marker: SeriesMarker = {
      time: 1060, position: 'aboveBar', shape: 'arrowDown', color: '#ff0000',
      text: 'Test', size: 2, id: 'marker-1',
    };
    series.setMarkers([marker]);
    const stored = series.getMarkers()[0];
    expect(stored.id).toBe('marker-1');
    expect(stored.size).toBe(2);
  });

  it('renders without errors when markers are set', () => {
    series.setMarkers([
      { time: 1060, position: 'aboveBar', shape: 'arrowDown', color: '#ff0000' },
      { time: 1120, position: 'belowBar', shape: 'arrowUp', color: '#00ff00' },
      { time: 1180, position: 'inBar', shape: 'circle', color: '#0000ff' },
      { time: 1240, position: 'aboveBar', shape: 'square', color: '#ffff00' },
    ]);
    expect(() => flushRAF()).not.toThrow();
  });
});
