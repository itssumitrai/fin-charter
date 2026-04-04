import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PriceLine } from '@/core/price-line';
import type { PriceLineOptions } from '@/core/price-line';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { ISeriesApi } from '@/api/series-api';
import type { Bar } from '@/core/types';

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

describe('PriceLine', () => {
  it('creates with correct options', () => {
    const opts: PriceLineOptions = {
      price: 150.0,
      color: '#ff0000',
      lineWidth: 2,
      lineStyle: 'dashed',
      title: 'Target',
      axisLabelVisible: true,
    };
    const line = new PriceLine(opts);
    expect(line.options.price).toBe(150.0);
    expect(line.options.color).toBe('#ff0000');
    expect(line.options.lineStyle).toBe('dashed');
    expect(line.options.title).toBe('Target');
    expect(line.options.axisLabelVisible).toBe(true);
  });

  it('applyOptions merges partial options', () => {
    const line = new PriceLine({
      price: 100, color: '#ff0000', lineWidth: 1, lineStyle: 'solid',
      title: 'Old', axisLabelVisible: false,
    });
    line.applyOptions({ price: 200, title: 'New' });
    expect(line.options.price).toBe(200);
    expect(line.options.title).toBe('New');
    expect(line.options.color).toBe('#ff0000'); // unchanged
  });

  it('supports optional axis label colors', () => {
    const line = new PriceLine({
      price: 100, color: '#ff0000', lineWidth: 1, lineStyle: 'solid',
      title: '', axisLabelVisible: true,
      axisLabelColor: '#00ff00', axisLabelTextColor: '#ffffff',
    });
    expect(line.options.axisLabelColor).toBe('#00ff00');
    expect(line.options.axisLabelTextColor).toBe('#ffffff');
  });
});

describe('PriceLine on SeriesApi', () => {
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

  it('creates and retrieves price lines', () => {
    const line = series.createPriceLine({
      price: 110, color: '#ff0000', lineWidth: 1, lineStyle: 'dashed',
      title: 'Support', axisLabelVisible: true,
    });
    expect(line).toBeInstanceOf(PriceLine);
    expect(series.getPriceLines()).toHaveLength(1);
    expect(series.getPriceLines()[0]).toBe(line);
  });

  it('removes a price line', () => {
    const line = series.createPriceLine({
      price: 110, color: '#ff0000', lineWidth: 1, lineStyle: 'solid',
      title: '', axisLabelVisible: false,
    });
    series.removePriceLine(line);
    expect(series.getPriceLines()).toHaveLength(0);
  });

  it('renders without errors when price lines are set', () => {
    series.createPriceLine({
      price: 105, color: '#26a69a', lineWidth: 1, lineStyle: 'dashed',
      title: 'Support', axisLabelVisible: true,
    });
    series.createPriceLine({
      price: 115, color: '#ef5350', lineWidth: 2, lineStyle: 'dotted',
      title: 'Resistance', axisLabelVisible: true,
      axisLabelColor: '#ef5350', axisLabelTextColor: '#ffffff',
    });
    expect(() => flushRAF()).not.toThrow();
  });
});
