import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { ISeriesApi } from '@/api/series-api';
import type { Bar, SeriesType } from '@/core/types';

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

  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe('Series subscribeVisibilityChange', () => {
  let container: HTMLElement;
  let chart: IChartApi;
  let series: ISeriesApi<SeriesType>;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    chart = createChart(container, { autoSize: false, width: 800, height: 600 });
    series = chart.addSeries({ type: 'candlestick' });
    series.setData(makeBars(10));
  });

  afterEach(() => {
    chart?.remove();
    container?.remove();
  });

  it('fires callback(false) when visibility set to false', () => {
    const cb = vi.fn();
    series.subscribeVisibilityChange(cb);

    series.applyOptions({ visible: false });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(false);
  });

  it('fires callback(true) when visibility set back to true', () => {
    const cb = vi.fn();

    // First hide the series
    series.applyOptions({ visible: false });

    // Then subscribe and show it
    series.subscribeVisibilityChange(cb);
    series.applyOptions({ visible: true });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(true);
  });

  it('does not fire when visibility does not change', () => {
    const cb = vi.fn();
    series.subscribeVisibilityChange(cb);

    // Series is visible by default; setting visible: true should not emit
    series.applyOptions({ visible: true });

    expect(cb).not.toHaveBeenCalled();
  });

  it('does not fire when applying non-visibility options', () => {
    const cb = vi.fn();
    series.subscribeVisibilityChange(cb);

    // Apply an option that does not affect visibility
    series.applyOptions({ color: '#ff0000' } as Record<string, unknown>);

    expect(cb).not.toHaveBeenCalled();
  });

  it('does not fire after unsubscribe', () => {
    const cb = vi.fn();
    series.subscribeVisibilityChange(cb);
    series.unsubscribeVisibilityChange(cb);

    series.applyOptions({ visible: false });

    expect(cb).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    series.subscribeVisibilityChange(cb1);
    series.subscribeVisibilityChange(cb2);

    series.applyOptions({ visible: false });

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb1).toHaveBeenCalledWith(false);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledWith(false);
  });

  it('only unsubscribes the specific callback', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    series.subscribeVisibilityChange(cb1);
    series.subscribeVisibilityChange(cb2);

    series.unsubscribeVisibilityChange(cb1);
    series.applyOptions({ visible: false });

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledWith(false);
  });
});
