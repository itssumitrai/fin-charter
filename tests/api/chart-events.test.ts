import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { Bar } from '@/core/types';

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

function createTestChart(): { container: HTMLElement; chart: IChartApi } {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  const chart = createChart(container, { autoSize: false, width: 800, height: 600, symbol: 'AAPL' });
  return { container, chart };
}

describe('Chart Event Subscriptions', () => {
  let container: HTMLElement;
  let chart: IChartApi;

  beforeEach(() => {
    const setup = createTestChart();
    container = setup.container;
    chart = setup.chart;
  });

  afterEach(() => {
    chart?.remove();
    container?.remove();
  });

  // ── 1. subscribeDblClick ──────────────────────────────────────────────────

  describe('subscribeDblClick', () => {
    it('fires callback with payload on dblclick', () => {
      const cb = vi.fn();
      chart.subscribeDblClick(cb);

      // Need data so the chart has a price scale reference
      const series = chart.addSeries({ type: 'candlestick' });
      series.setData(makeBars(10));
      flushRAF();

      // Find overlay canvas (last canvas in the wrapper, or the one with pointer-events)
      const wrapper = container.firstElementChild as HTMLDivElement;
      const canvases = wrapper.querySelectorAll('canvas');
      const overlayCanvas = canvases[1]; // overlay canvas is typically the second one

      overlayCanvas.dispatchEvent(
        new MouseEvent('dblclick', { clientX: 400, clientY: 300, bubbles: true }),
      );

      expect(cb).toHaveBeenCalledTimes(1);
      const payload = cb.mock.calls[0][0];
      expect(payload).toHaveProperty('x');
      expect(payload).toHaveProperty('y');
      expect(payload).toHaveProperty('time');
      expect(payload).toHaveProperty('price');
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribeDblClick(cb);
      chart.unsubscribeDblClick(cb);

      const series = chart.addSeries({ type: 'candlestick' });
      series.setData(makeBars(10));
      flushRAF();

      const wrapper = container.firstElementChild as HTMLDivElement;
      const canvases = wrapper.querySelectorAll('canvas');
      const overlayCanvas = canvases[1];

      overlayCanvas.dispatchEvent(
        new MouseEvent('dblclick', { clientX: 400, clientY: 300, bubbles: true }),
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribeDblClick(cb1);
      chart.subscribeDblClick(cb2);

      const series = chart.addSeries({ type: 'candlestick' });
      series.setData(makeBars(10));
      flushRAF();

      const wrapper = container.firstElementChild as HTMLDivElement;
      const canvases = wrapper.querySelectorAll('canvas');
      const overlayCanvas = canvases[1];

      overlayCanvas.dispatchEvent(
        new MouseEvent('dblclick', { clientX: 400, clientY: 300, bubbles: true }),
      );

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  // ── 2. subscribeDrawingEvent ──────────────────────────────────────────────

  describe('subscribeDrawingEvent', () => {
    it('fires callback with type "created" on addDrawing', () => {
      const cb = vi.fn();
      chart.subscribeDrawingEvent(cb);

      const series = chart.addSeries({ type: 'candlestick' });
      const bars = makeBars(10);
      series.setData(bars);

      chart.addDrawing(
        'trendline',
        [
          { time: bars[2].time, price: bars[2].close },
          { time: bars[7].time, price: bars[7].close },
        ],
        { color: '#ff0000' },
      );

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toMatchObject({
        type: 'created',
        drawingType: 'trendline',
      });
      expect(cb.mock.calls[0][0].drawingId).toBeTruthy();
    });

    it('fires callback with type "removed" on removeDrawing', () => {
      const cb = vi.fn();

      const series = chart.addSeries({ type: 'candlestick' });
      const bars = makeBars(10);
      series.setData(bars);

      const drawing = chart.addDrawing(
        'horizontal-line',
        [{ time: bars[5].time, price: bars[5].close }],
        { color: '#00ff00' },
      );

      chart.subscribeDrawingEvent(cb);
      chart.removeDrawing(drawing);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toMatchObject({
        type: 'removed',
        drawingId: drawing.id,
        drawingType: 'horizontal-line',
      });
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribeDrawingEvent(cb);
      chart.unsubscribeDrawingEvent(cb);

      const series = chart.addSeries({ type: 'candlestick' });
      const bars = makeBars(10);
      series.setData(bars);

      chart.addDrawing(
        'trendline',
        [
          { time: bars[1].time, price: bars[1].close },
          { time: bars[5].time, price: bars[5].close },
        ],
        { color: '#ff0000' },
      );

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribeDrawingEvent(cb1);
      chart.subscribeDrawingEvent(cb2);

      const series = chart.addSeries({ type: 'candlestick' });
      const bars = makeBars(10);
      series.setData(bars);

      chart.addDrawing(
        'trendline',
        [
          { time: bars[0].time, price: bars[0].close },
          { time: bars[9].time, price: bars[9].close },
        ],
        { color: '#ff0000' },
      );

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  // ── 3. subscribeIndicatorEvent ────────────────────────────────────────────

  describe('subscribeIndicatorEvent', () => {
    it('fires callback with type "added" on addIndicator', () => {
      const cb = vi.fn();
      chart.subscribeIndicatorEvent(cb);

      const series = chart.addSeries({ type: 'candlestick' });
      series.setData(makeBars(20));

      chart.addIndicator('sma', { source: series, params: { period: 5 } });

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toMatchObject({
        type: 'added',
        indicatorType: 'sma',
      });
      expect(cb.mock.calls[0][0].indicatorId).toBeTruthy();
      expect(cb.mock.calls[0][0].paneId).toBeTruthy();
    });

    it('fires callback with type "removed" on removeIndicator', () => {
      const cb = vi.fn();

      const series = chart.addSeries({ type: 'candlestick' });
      series.setData(makeBars(20));

      const indicator = chart.addIndicator('sma', { source: series, params: { period: 5 } });

      chart.subscribeIndicatorEvent(cb);
      chart.removeIndicator(indicator);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toMatchObject({
        type: 'removed',
        indicatorType: 'sma',
      });
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribeIndicatorEvent(cb);
      chart.unsubscribeIndicatorEvent(cb);

      const series = chart.addSeries({ type: 'candlestick' });
      series.setData(makeBars(20));

      chart.addIndicator('sma', { source: series, params: { period: 5 } });

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribeIndicatorEvent(cb1);
      chart.subscribeIndicatorEvent(cb2);

      const series = chart.addSeries({ type: 'candlestick' });
      series.setData(makeBars(20));

      chart.addIndicator('sma', { source: series, params: { period: 5 } });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  // ── 4. subscribeResize ────────────────────────────────────────────────────

  describe('subscribeResize', () => {
    it('fires callback with dimensions on resize', () => {
      const cb = vi.fn();
      chart.subscribeResize(cb);

      chart.resize(800, 600);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toEqual({ width: 800, height: 600 });
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribeResize(cb);
      chart.unsubscribeResize(cb);

      chart.resize(800, 600);

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribeResize(cb1);
      chart.subscribeResize(cb2);

      chart.resize(1024, 768);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0]).toEqual({ width: 1024, height: 768 });
      expect(cb2.mock.calls[0][0]).toEqual({ width: 1024, height: 768 });
    });
  });

  // ── 5. subscribeSymbolChange ──────────────────────────────────────────────

  describe('subscribeSymbolChange', () => {
    it('fires callback with previous and current symbol', () => {
      const cb = vi.fn();
      chart.subscribeSymbolChange(cb);

      chart.applyOptions({ symbol: 'MSFT' });

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toEqual({ previous: 'AAPL', current: 'MSFT' });
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribeSymbolChange(cb);
      chart.unsubscribeSymbolChange(cb);

      chart.applyOptions({ symbol: 'MSFT' });

      expect(cb).not.toHaveBeenCalled();
    });

    it('does not fire when symbol is unchanged', () => {
      const cb = vi.fn();
      chart.subscribeSymbolChange(cb);

      chart.applyOptions({ symbol: 'AAPL' });

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribeSymbolChange(cb1);
      chart.subscribeSymbolChange(cb2);

      chart.applyOptions({ symbol: 'GOOG' });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0]).toEqual({ previous: 'AAPL', current: 'GOOG' });
    });
  });

  // ── 6. subscribeChartTypeChange ───────────────────────────────────────────

  describe('subscribeChartTypeChange', () => {
    it('fires callback with seriesType on addLineSeries', () => {
      const cb = vi.fn();
      chart.subscribeChartTypeChange(cb);

      chart.addSeries({ type: 'line' });

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toEqual({ seriesType: 'line' });
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribeChartTypeChange(cb);
      chart.unsubscribeChartTypeChange(cb);

      chart.addSeries({ type: 'line' });

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribeChartTypeChange(cb1);
      chart.subscribeChartTypeChange(cb2);

      chart.addSeries({ type: 'area' });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0]).toEqual({ seriesType: 'area' });
    });
  });

  // ── 7. subscribePreferencesChange ─────────────────────────────────────────

  describe('subscribePreferencesChange', () => {
    it('fires callback with options on applyOptions', () => {
      const cb = vi.fn();
      chart.subscribePreferencesChange(cb);

      const opts = { layout: { backgroundColor: '#000' } };
      chart.applyOptions(opts);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toEqual(opts);
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribePreferencesChange(cb);
      chart.unsubscribePreferencesChange(cb);

      chart.applyOptions({ layout: { backgroundColor: '#000' } });

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribePreferencesChange(cb1);
      chart.subscribePreferencesChange(cb2);

      const opts = { layout: { textColor: '#fff' } };
      chart.applyOptions(opts);

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0]).toEqual(opts);
      expect(cb2.mock.calls[0][0]).toEqual(opts);
    });
  });

  // ── 8. subscribeLayoutChange ──────────────────────────────────────────────

  describe('subscribeLayoutChange', () => {
    it('fires callback with pane-added on addPane', () => {
      const cb = vi.fn();
      chart.subscribeLayoutChange(cb);

      const pane = chart.addPane({ height: 150 });

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toMatchObject({
        action: 'pane-added',
        paneId: pane.id,
      });
    });

    it('fires callback with pane-removed on removePane', () => {
      const cb = vi.fn();

      const pane = chart.addPane({ height: 150 });
      const paneId = pane.id;

      chart.subscribeLayoutChange(cb);
      chart.removePane(pane);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toEqual({
        action: 'pane-removed',
        paneId,
      });
    });

    it('does not fire after unsubscribe', () => {
      const cb = vi.fn();
      chart.subscribeLayoutChange(cb);
      chart.unsubscribeLayoutChange(cb);

      chart.addPane({ height: 150 });

      expect(cb).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      chart.subscribeLayoutChange(cb1);
      chart.subscribeLayoutChange(cb2);

      const pane = chart.addPane({ height: 150 });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb1.mock.calls[0][0]).toMatchObject({
        action: 'pane-added',
        paneId: pane.id,
      });
    });
  });
});
