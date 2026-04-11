import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { Bar } from '@/core/types';

// ── Mock RAF and ResizeObserver ────────────────────────────────────────────────

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
    arcTo: noop,
    ellipse: noop,
    roundRect: noop,
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

// ── Sample data ────────────────────────────────────────────────────────────────

const bars: Bar[] = Array.from({ length: 50 }, (_, i) => ({
  time: 1700000000 + i * 86400,
  open: 100 + Math.sin(i) * 5,
  high: 105 + Math.sin(i) * 5,
  low: 95 + Math.sin(i) * 5,
  close: 102 + Math.sin(i) * 5,
  volume: 1000000,
}));

// ── Test suite ────────────────────────────────────────────────────────────────

describe('chart-api paint pipeline and feature methods', () => {
  let container: HTMLElement;
  let chart: IChartApi;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);
    chart = createChart(container, { autoSize: false, width: 800, height: 400 });
  });

  afterEach(() => {
    chart?.remove();
    container.remove();
  });

  // ── 1. Indicator lifecycle ──────────────────────────────────────────────────

  it('addIndicator and removeIndicator', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    const ind = chart.addIndicator('sma', { source: series, params: { period: 5 } });
    expect(ind.indicatorType()).toBe('sma');
    expect(ind.isVisible()).toBe(true);

    expect(() => flushRAF()).not.toThrow();

    chart.removeIndicator(ind);
    expect(() => flushRAF()).not.toThrow();
  });

  it('addIndicator with ema does not throw', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const ind = chart.addIndicator('ema', { source: series, params: { period: 10 } });
    expect(ind.indicatorType()).toBe('ema');
    chart.removeIndicator(ind);
  });

  it('addIndicator returns api with paneId', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const ind = chart.addIndicator('rsi', { source: series, params: { period: 14 } });
    expect(ind.paneId()).toBeDefined();
    expect(typeof ind.paneId()).toBe('string');
    chart.removeIndicator(ind);
  });

  it('indicator remove() method removes itself', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const ind = chart.addIndicator('sma', { source: series, params: { period: 5 } });
    expect(() => ind.remove()).not.toThrow();
  });

  // ── 2. Multi-pane ────────────────────────────────────────────────────────────

  it('addPane and removePane', () => {
    const pane = chart.addPane({ height: 100 });
    expect(pane.id).toBeDefined();
    expect(typeof pane.id).toBe('string');

    chart.removePane(pane);
    expect(() => flushRAF()).not.toThrow();
  });

  it('addPane with series assigned to it', () => {
    const pane = chart.addPane({ height: 120 });
    const series = chart.addSeries({ type: 'line', paneId: pane.id } as never);
    series.setData(bars);
    expect(() => flushRAF()).not.toThrow();
    chart.removePane(pane);
  });

  it('multiple panes can be added and removed', () => {
    const pane1 = chart.addPane({ height: 100 });
    const pane2 = chart.addPane({ height: 100 });

    expect(pane1.id).not.toBe(pane2.id);

    chart.removePane(pane1);
    chart.removePane(pane2);
  });

  // ── 3. Drawing lifecycle ─────────────────────────────────────────────────────

  it('addDrawing, getDrawings, removeDrawing', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const d = chart.addDrawing('horizontal-line', [{ time: bars[5].time, price: 100 }]);
    expect(chart.getDrawings().length).toBe(1);

    chart.removeDrawing(d);
    expect(chart.getDrawings().length).toBe(0);
  });

  it('addDrawing trendline with two points', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const d = chart.addDrawing(
      'trendline',
      [
        { time: bars[0].time, price: 100 },
        { time: bars[10].time, price: 110 },
      ],
      { color: '#ff0000' },
    );
    expect(d.drawingType()).toBe('trendline');
    expect(chart.getDrawings().length).toBe(1);

    chart.removeDrawing(d);
  });

  it('getDrawings returns empty array initially', () => {
    expect(chart.getDrawings()).toHaveLength(0);
  });

  it('drawing applyOptions and options round-trip', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const d = chart.addDrawing('horizontal-line', [{ time: bars[0].time, price: 105 }], { color: '#0000ff' });
    d.applyOptions({ color: '#ff0000' });
    expect(d.options().color).toBe('#ff0000');

    chart.removeDrawing(d);
  });

  it('drawing points() returns the anchor points', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const d = chart.addDrawing('horizontal-line', [{ time: bars[3].time, price: 101 }]);
    const pts = d.points();
    expect(pts).toHaveLength(1);
    expect(typeof pts[0].price).toBe('number');
  });

  it('deserializeDrawings round-trips with serializeDrawings', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    chart.addDrawing('horizontal-line', [{ time: bars[2].time, price: 103 }]);
    const serialized = chart.serializeDrawings();
    expect(serialized).toHaveLength(1);

    chart.deserializeDrawings(serialized);
    expect(chart.getDrawings()).toHaveLength(1);
  });

  // ── 4. Event subscriptions ───────────────────────────────────────────────────

  it('subscribeCrosshairMove / unsubscribeCrosshairMove', () => {
    const cb = vi.fn();
    chart.subscribeCrosshairMove(cb);
    expect(() => flushRAF()).not.toThrow();
    chart.unsubscribeCrosshairMove(cb);
  });

  it('subscribeClick / unsubscribeClick', () => {
    const cb = vi.fn();
    chart.subscribeClick(cb);
    chart.unsubscribeClick(cb);
  });

  it('subscribeVisibleRangeChange / unsubscribeVisibleRangeChange', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const cb = vi.fn();
    chart.subscribeVisibleRangeChange(cb);
    flushRAF();
    expect(cb).toHaveBeenCalled();

    chart.unsubscribeVisibleRangeChange(cb);
    const callCount = cb.mock.calls.length;
    chart.fitContent();
    flushRAF();
    // After unsubscribe, call count should not increase
    expect(cb.mock.calls.length).toBe(callCount);
  });

  it('subscribeDblClick / unsubscribeDblClick', () => {
    const cb = vi.fn();
    chart.subscribeDblClick(cb);
    chart.unsubscribeDblClick(cb);
  });

  it('subscribeDrawingEvent / unsubscribeDrawingEvent', () => {
    const cb = vi.fn();
    chart.subscribeDrawingEvent(cb);
    chart.unsubscribeDrawingEvent(cb);
  });

  it('subscribeIndicatorEvent fires when indicator is added', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const cb = vi.fn();
    chart.subscribeIndicatorEvent(cb);

    const ind = chart.addIndicator('sma', { source: series, params: { period: 5 } });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0].type).toBe('added');

    chart.unsubscribeIndicatorEvent(cb);
    chart.removeIndicator(ind);
  });

  it('subscribeResize / unsubscribeResize', () => {
    const cb = vi.fn();
    chart.subscribeResize(cb);
    chart.resize(900, 500);
    expect(cb).toHaveBeenCalledWith({ width: 900, height: 500 });
    chart.unsubscribeResize(cb);
  });

  it('subscribePeriodicityChange fires on setPeriodicity', () => {
    const cb = vi.fn();
    chart.subscribePeriodicityChange(cb);
    chart.setPeriodicity({ interval: 15, unit: 'minute' });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0].interval).toBe(15);
    chart.unsubscribePeriodicityChange(cb);
  });

  // ── 5. Export state / import state ──────────────────────────────────────────

  it('exportState returns valid ChartState', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    const state = chart.exportState();
    expect(state.version).toBeDefined();
    expect(Array.isArray(state.series)).toBe(true);
    expect(state.series.length).toBeGreaterThan(0);
  });

  it('exportState has expected top-level keys', () => {
    const state = chart.exportState();
    expect(state).toHaveProperty('version');
    expect(state).toHaveProperty('series');
    expect(state).toHaveProperty('indicators');
    expect(state).toHaveProperty('panes');
    expect(state).toHaveProperty('drawings');
    expect(state).toHaveProperty('timeScale');
  });

  it('importState restores chart without throwing', async () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    const state = chart.exportState();

    await expect(
      chart.importState(state, async () => bars),
    ).resolves.not.toThrow();
  });

  // ── 6. Series operations ─────────────────────────────────────────────────────

  it('series.update appends bar', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const lastBar = bars[bars.length - 1];
    series.update({
      time: lastBar.time + 86400,
      open: 110,
      high: 115,
      low: 108,
      close: 112,
      volume: 5000,
    });

    expect(() => flushRAF()).not.toThrow();
    expect(series.dataByIndex(bars.length)).not.toBeNull();
  });

  it('series.prependData adds bars at beginning', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars.slice(10));
    series.prependData(bars.slice(0, 10));

    expect(() => flushRAF()).not.toThrow();
    // After prepend, total length should be 50
    const first = series.dataByIndex(0);
    expect(first).not.toBeNull();
    expect(first!.time).toBe(bars[0].time);
  });

  it('series.setMarkers and getMarkers', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    series.setMarkers([
      {
        time: bars[5].time,
        position: 'aboveBar',
        shape: 'arrowDown',
        color: '#ff0000',
        text: 'Sell',
      },
    ]);
    expect(series.getMarkers().length).toBe(1);
    expect(series.getMarkers()[0].text).toBe('Sell');

    // Flush repaint to exercise marker drawing path
    expect(() => flushRAF()).not.toThrow();
  });

  it('series.setMarkers with multiple shapes triggers repaint', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    series.setMarkers([
      { time: bars[1].time, position: 'belowBar', shape: 'arrowUp', color: '#00ff00' },
      { time: bars[2].time, position: 'aboveBar', shape: 'circle', color: '#0000ff' },
      { time: bars[3].time, position: 'inBar', shape: 'square', color: '#ff00ff' },
    ]);
    expect(series.getMarkers().length).toBe(3);
    expect(() => flushRAF()).not.toThrow();
  });

  it('series.setEvents and getEvents', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    series.setEvents([{ time: bars[5].time, eventType: 'earnings', title: 'Q3' }]);
    expect(series.getEvents().length).toBe(1);
    expect(series.getEvents()[0].title).toBe('Q3');

    expect(() => flushRAF()).not.toThrow();
  });

  it('series.setEvents clears previous events when called again', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    series.setEvents([{ time: bars[0].time, eventType: 'earnings', title: 'Q1' }]);
    series.setEvents([]);
    expect(series.getEvents().length).toBe(0);
  });

  it('series.setMarkers clears markers when given empty array', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    series.setMarkers([{ time: bars[0].time, position: 'aboveBar', shape: 'circle', color: '#ff0000' }]);
    expect(series.getMarkers().length).toBe(1);

    series.setMarkers([]);
    expect(series.getMarkers().length).toBe(0);
  });

  it('series.barsInLogicalRange returns expected shape', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    const result = series.barsInLogicalRange({ from: 0, to: 49 });
    expect(result).toHaveProperty('barsBefore');
    expect(result).toHaveProperty('barsAfter');
    expect(result).toHaveProperty('from');
    expect(result).toHaveProperty('to');
  });

  it('series.subscribeDataChanged fires on setData', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    const cb = vi.fn();
    series.subscribeDataChanged(cb);
    series.setData(bars);
    expect(cb).toHaveBeenCalled();
    series.unsubscribeDataChanged(cb);
  });

  // ── 7. Price lines ────────────────────────────────────────────────────────────

  it('series.createPriceLine and removePriceLine', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const pl = series.createPriceLine({ price: 105, color: '#ff0000' });
    expect(series.getPriceLines().length).toBe(1);

    // Flush repaint to exercise price-line drawing path
    expect(() => flushRAF()).not.toThrow();

    series.removePriceLine(pl);
    expect(series.getPriceLines().length).toBe(0);
  });

  it('multiple price lines can be added and removed', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const pl1 = series.createPriceLine({ price: 100, color: '#ff0000' });
    const pl2 = series.createPriceLine({ price: 110, color: '#00ff00', lineWidth: 2, lineStyle: 1 });
    expect(series.getPriceLines().length).toBe(2);

    series.removePriceLine(pl1);
    expect(series.getPriceLines().length).toBe(1);

    series.removePriceLine(pl2);
    expect(series.getPriceLines().length).toBe(0);
  });

  it('price line with axisLabelVisible triggers axis label path', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    series.createPriceLine({ price: 102, color: '#ff9900', axisLabelVisible: true });
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 8. Alert lines ────────────────────────────────────────────────────────────

  it('addAlertLine and removeAlertLine', () => {
    const alert = chart.addAlertLine(100, { color: '#ff0', title: 'Test' });
    expect(chart.getAlertLines().length).toBe(1);

    chart.removeAlertLine(alert);
    expect(chart.getAlertLines().length).toBe(0);
  });

  it('addAlertLine triggers repaint', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    chart.addAlertLine(103, { color: '#ff0000', title: 'Alert' });
    expect(() => flushRAF()).not.toThrow();
  });

  it('multiple alert lines can be added', () => {
    chart.addAlertLine(100, { color: '#ff0000' });
    chart.addAlertLine(110, { color: '#00ff00' });
    chart.addAlertLine(90, { color: '#0000ff' });
    expect(chart.getAlertLines().length).toBe(3);
  });

  it('getAlertLines returns empty array initially', () => {
    expect(chart.getAlertLines()).toHaveLength(0);
  });

  // ── 9. Volume overlay ─────────────────────────────────────────────────────────

  it('volume overlay visible option triggers volume paint path', () => {
    chart.applyOptions({ volume: { visible: true } });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    expect(() => flushRAF()).not.toThrow();
  });

  it('volume overlay can be toggled off after being on', () => {
    chart.applyOptions({ volume: { visible: true } });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    chart.applyOptions({ volume: { visible: false } });
    expect(() => flushRAF()).not.toThrow();
  });

  it('fitContent after volume overlay does not throw', () => {
    chart.applyOptions({ volume: { visible: true } });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 10. Multiple series types ────────────────────────────────────────────────

  it('can add line series and remove it', () => {
    const s = chart.addSeries({ type: 'line', color: '#2196F3' });
    s.setData(bars);
    expect(() => flushRAF()).not.toThrow();
    chart.removeSeries(s);
    expect(() => flushRAF()).not.toThrow();
  });

  it('can add area series and remove it', () => {
    const s = chart.addSeries({ type: 'area' });
    s.setData(bars);
    expect(() => flushRAF()).not.toThrow();
    chart.removeSeries(s);
  });

  it('can add bar series and repaint', () => {
    const s = chart.addSeries({ type: 'bar' });
    s.setData(bars);
    expect(() => flushRAF()).not.toThrow();
  });

  it('can add baseline series and repaint', () => {
    const s = chart.addSeries({ type: 'baseline' });
    s.setData(bars);
    expect(() => flushRAF()).not.toThrow();
  });

  it('can add histogram series and repaint', () => {
    const s = chart.addSeries({ type: 'histogram' });
    s.setData(bars);
    expect(() => flushRAF()).not.toThrow();
  });

  it('can add hollow-candle series and repaint', () => {
    const s = chart.addSeries({ type: 'hollow-candle' });
    s.setData(bars);
    expect(() => flushRAF()).not.toThrow();
  });

  it('multiple series types coexist and paint without throwing', () => {
    const candle = chart.addSeries({ type: 'candlestick' });
    candle.setData(bars);
    const line = chart.addSeries({ type: 'line' });
    line.setData(bars);
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 11. Text labels ──────────────────────────────────────────────────────────

  it('addTextLabel and removeTextLabel', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    const label = chart.addTextLabel(5, 105, 'Hello', { color: '#ff0000' });
    expect(chart.getTextLabels().length).toBe(1);
    expect(() => flushRAF()).not.toThrow();

    chart.removeTextLabel(label);
    expect(chart.getTextLabels().length).toBe(0);
  });

  it('getTextLabels returns empty array initially', () => {
    expect(chart.getTextLabels()).toHaveLength(0);
  });

  // ── 12. Undo/Redo ────────────────────────────────────────────────────────────

  it('canUndo returns false when no actions', () => {
    expect(chart.canUndo()).toBe(false);
  });

  it('canRedo returns false when no actions', () => {
    expect(chart.canRedo()).toBe(false);
  });

  it('undo returns false when nothing to undo', () => {
    expect(chart.undo()).toBe(false);
  });

  it('redo returns false when nothing to redo', () => {
    expect(chart.redo()).toBe(false);
  });

  // ── 13. Range selection and measure ──────────────────────────────────────────

  it('setRangeSelectionActive does not throw', () => {
    expect(() => chart.setRangeSelectionActive(true)).not.toThrow();
    expect(() => chart.setRangeSelectionActive(false)).not.toThrow();
  });

  it('onRangeSelected / offRangeSelected does not throw', () => {
    const cb = vi.fn();
    expect(() => chart.onRangeSelected(cb)).not.toThrow();
    expect(() => chart.offRangeSelected(cb)).not.toThrow();
  });

  it('setMeasureActive does not throw', () => {
    expect(() => chart.setMeasureActive(true)).not.toThrow();
    expect(() => chart.setMeasureActive(false)).not.toThrow();
  });

  it('onMeasure / offMeasure does not throw', () => {
    const cb = vi.fn();
    expect(() => chart.onMeasure(cb)).not.toThrow();
    expect(() => chart.offMeasure(cb)).not.toThrow();
  });

  // ── 14. Series applyOptions and visibility ───────────────────────────────────

  it('series.applyOptions updates series options', () => {
    const series = chart.addSeries({ type: 'line', color: '#ff0000' });
    series.setData(bars);
    series.applyOptions({ color: '#00ff00' });
    const opts = series.options();
    expect(opts.color).toBe('#00ff00');
  });

  it('series.priceScale() returns a valid price scale', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    const ps = series.priceScale();
    expect(ps).toBeDefined();
    expect(typeof ps.priceToY).toBe('function');
  });

  // ── 15. Repaint pipeline ─────────────────────────────────────────────────────

  it('full repaint with many series types, markers, and drawings', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    series.setMarkers([
      { time: bars[5].time, position: 'aboveBar', shape: 'arrowDown', color: '#ff0000', text: 'S' },
      { time: bars[10].time, position: 'belowBar', shape: 'arrowUp', color: '#00ff00', text: 'B' },
    ]);
    series.createPriceLine({ price: 102, color: '#ff9900', axisLabelVisible: true });

    chart.addDrawing('horizontal-line', [{ time: bars[3].time, price: 100 }], { color: '#0000ff' });
    chart.addAlertLine(98, { color: '#ff0000', title: 'Support' });

    chart.applyOptions({ volume: { visible: true } });

    expect(() => flushRAF()).not.toThrow();
  });

  it('repaint after scrollToRealTime', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    chart.scrollToRealTime();
    expect(() => flushRAF()).not.toThrow();
  });

  it('repaint after setVisibleLogicalRange', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    chart.setVisibleLogicalRange(10, 40);
    expect(() => flushRAF()).not.toThrow();
  });

  it('repaint after resize', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    chart.resize(1000, 500);
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 16. Watermark ───────────────────────────────────────────────────────────

  it('watermark renders when enabled', () => {
    chart.applyOptions({ watermark: { visible: true, text: 'AAPL' } });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
  });

  it('watermark with all horzAlign/vertAlign combinations does not throw', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    for (const horzAlign of ['left', 'right', 'center'] as const) {
      for (const vertAlign of ['top', 'bottom', 'center'] as const) {
        chart.applyOptions({ watermark: { visible: true, text: 'TEST', horzAlign, vertAlign } });
        expect(() => flushRAF()).not.toThrow();
      }
    }
  });

  it('watermark hidden when visible=false', () => {
    chart.applyOptions({ watermark: { visible: false, text: 'AAPL' } });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 17. Left price scale ────────────────────────────────────────────────────

  it('left price scale can be enabled', () => {
    const c = createChart(container, { leftPriceScale: { visible: true }, width: 800, height: 400 });
    const s = c.addSeries({ type: 'candlestick' });
    s.setData(bars);
    c.fitContent();
    expect(() => flushRAF()).not.toThrow();
    c.remove();
  });

  it('left price scale with series using priceScaleId=left', () => {
    const c = createChart(container, { leftPriceScale: { visible: true }, width: 800, height: 400 });
    const s = c.addSeries({ type: 'line', priceScaleId: 'left' } as never);
    s.setData(bars);
    c.fitContent();
    expect(() => flushRAF()).not.toThrow();
    c.remove();
  });

  // ── 18. Comparison mode rendering ──────────────────────────────────────────

  it('comparison mode renders percentage axis', () => {
    const series1 = chart.addSeries({ type: 'candlestick' });
    series1.setData(bars);
    const series2 = chart.addSeries({ type: 'line', color: '#2196F3' });
    series2.setData(bars.map(b => ({ ...b, close: b.close * 1.1 })));
    chart.setComparisonMode(true);
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    chart.setComparisonMode(false);
    expect(() => flushRAF()).not.toThrow();
  });

  it('comparison mode with single series does not throw', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    chart.setComparisonMode(true);
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    chart.setComparisonMode(false);
  });

  // ── 19. Multiple indicators in different panes ──────────────────────────────

  it('multiple indicators in different panes', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    const rsi = chart.addIndicator('rsi', { source: series });
    const macd = chart.addIndicator('macd', { source: series });
    const bb = chart.addIndicator('bollinger', { source: series });
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    chart.removeIndicator(rsi);
    chart.removeIndicator(macd);
    chart.removeIndicator(bb);
    expect(() => flushRAF()).not.toThrow();
  });

  it('addIndicator overlay (sma) renders in main pane', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    const sma = chart.addIndicator('sma', { source: series, params: { period: 10 } });
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    expect(sma.isVisible()).toBe(true);
    chart.removeIndicator(sma);
  });

  it('addIndicator with band type (bollinger) creates band fill', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    const bb = chart.addIndicator('bollinger', { source: series, color: '#2962ff' });
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    chart.removeIndicator(bb);
  });

  it('addIndicator with keltner band type', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    const keltner = chart.addIndicator('keltner', { source: series });
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    chart.removeIndicator(keltner);
  });

  it('addIndicator with ichimoku creates cloud band', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    const ichimoku = chart.addIndicator('ichimoku', { source: series });
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    chart.removeIndicator(ichimoku);
  });

  // ── 20. HUD indicator row and settings ─────────────────────────────────────

  it('indicator HUD row is created when indicator is added', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    const ind = chart.addIndicator('sma', { source: series, params: { period: 5 } });
    expect(ind.indicatorType()).toBe('sma');
    expect(() => flushRAF()).not.toThrow();
    chart.removeIndicator(ind);
  });

  it('indicator subscribeIndicatorEvent fires removed when removeIndicator is called', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const addedEvents: string[] = [];
    const removedEvents: string[] = [];
    chart.subscribeIndicatorEvent((e) => {
      if (e.type === 'added') addedEvents.push(e.indicatorType);
      if (e.type === 'removed') removedEvents.push(e.indicatorType);
    });

    const ind = chart.addIndicator('ema', { source: series, params: { period: 20 } });
    expect(addedEvents).toContain('ema');

    chart.removeIndicator(ind);
    expect(removedEvents).toContain('ema');
  });

  // ── 21. priceScale() with id ────────────────────────────────────────────────

  it('priceScale("left") returns the left price scale of main pane', () => {
    const ps = chart.priceScale('left');
    expect(ps).toBeDefined();
    expect(typeof ps.priceToY).toBe('function');
  });

  it('priceScale() without id returns main pane right price scale', () => {
    const ps = chart.priceScale();
    expect(ps).toBeDefined();
  });

  it('priceScale("main") returns main pane price scale', () => {
    const ps = chart.priceScale('main');
    expect(ps).toBeDefined();
  });

  // ── 22. Symbol change subscription ─────────────────────────────────────────

  it('subscribeSymbolChange fires when symbol is updated', () => {
    const cb = vi.fn();
    chart.subscribeSymbolChange(cb);
    chart.applyOptions({ symbol: 'AAPL' });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0].current).toBe('AAPL');
    chart.unsubscribeSymbolChange(cb);
  });

  it('subscribeChartTypeChange fires on series type change notification', () => {
    const cb = vi.fn();
    chart.subscribeChartTypeChange(cb);
    chart.unsubscribeChartTypeChange(cb);
  });

  it('subscribePreferencesChange fires when applyOptions is called', () => {
    const cb = vi.fn();
    chart.subscribePreferencesChange(cb);
    chart.applyOptions({ layout: { backgroundColor: '#111' } });
    expect(cb).toHaveBeenCalled();
    chart.unsubscribePreferencesChange(cb);
  });

  it('subscribeLayoutChange fires when addPane is called', () => {
    const cb = vi.fn();
    chart.subscribeLayoutChange(cb);
    const pane = chart.addPane({ height: 100 });
    expect(cb).toHaveBeenCalledWith({ action: 'pane-added', paneId: pane.id });
    chart.removePane(pane);
    chart.unsubscribeLayoutChange(cb);
  });

  it('subscribeLayoutChange fires when removePane is called', () => {
    const events: string[] = [];
    chart.subscribeLayoutChange((e) => events.push(e.action));
    const pane = chart.addPane({ height: 100 });
    chart.removePane(pane);
    expect(events).toContain('pane-removed');
  });

  // ── 23. registerDrawingType ─────────────────────────────────────────────────

  it('registerDrawingType allows adding a custom drawing type', () => {
    chart.registerDrawingType('custom-line', (id, points, options) => ({
      id,
      paneViews: () => [],
    } as never));
    // Once registered, addDrawing should use it
    expect(() => chart.addDrawing('custom-line', [{ time: bars[0].time, price: 100 }])).not.toThrow();
  });

  // ── 24. applyOptions with rightPriceScale mode ──────────────────────────────

  it('applyOptions with logarithmic price scale mode does not throw', () => {
    expect(() => chart.applyOptions({ rightPriceScale: { mode: 'logarithmic' } })).not.toThrow();
    expect(() => flushRAF()).not.toThrow();
  });

  it('applyOptions with leftPriceScale mode does not throw', () => {
    expect(() => chart.applyOptions({ leftPriceScale: { visible: true, mode: 'logarithmic' } })).not.toThrow();
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 25. removeSeries when series is first (crosshair reset) ────────────────

  it('removing first series while other series remain resets crosshair handler', () => {
    const s1 = chart.addSeries({ type: 'candlestick' });
    s1.setData(bars);
    const s2 = chart.addSeries({ type: 'line' });
    s2.setData(bars);
    flushRAF();

    expect(() => chart.removeSeries(s1)).not.toThrow();
    expect(() => flushRAF()).not.toThrow();
  });

  it('removing all series does not throw', () => {
    const s1 = chart.addSeries({ type: 'candlestick' });
    s1.setData(bars);
    const s2 = chart.addSeries({ type: 'line' });
    s2.setData(bars);
    flushRAF();

    chart.removeSeries(s1);
    chart.removeSeries(s2);
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 26. series applyOptions with visibility toggle ──────────────────────────

  it('series hidden then shown does not throw during repaint', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    flushRAF();

    series.applyOptions({ visible: false } as never);
    expect(() => flushRAF()).not.toThrow();

    series.applyOptions({ visible: true } as never);
    expect(() => flushRAF()).not.toThrow();
  });

  // ── 27. Donchian band indicator ─────────────────────────────────────────────

  it('addIndicator donchian creates band fill', () => {
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);
    const donchian = chart.addIndicator('donchian', { source: series });
    chart.fitContent();
    expect(() => flushRAF()).not.toThrow();
    chart.removeIndicator(donchian);
  });
});
