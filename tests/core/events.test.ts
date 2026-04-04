import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChart } from '@/api/chart-api';
import type { IChartApi } from '@/api/chart-api';
import type { ISeriesApi } from '@/api/series-api';
import type { Bar } from '@/core/types';
import type { ChartEvent } from '@/core/series-markers';
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

function makeBars(n: number, startTime = 1000): Bar[] {
  const bars: Bar[] = [];
  for (let i = 0; i < n; i++) {
    const base = 100 + i;
    bars.push({ time: startTime + i * 60, open: base, high: base + 5, low: base - 3, close: base + 2, volume: 1000 + i });
  }
  return bars;
}

describe('ChartEvent type', () => {
  it('ChartEvent extends SeriesMarker', () => {
    // A ChartEvent should satisfy the SeriesMarker shape plus extra fields
    const event: ChartEvent = {
      time: 1000,
      position: 'aboveBar',
      shape: 'circle',
      color: '#ff0000',
      eventType: 'earnings',
      title: 'Q3 Earnings',
    };

    // Verify it satisfies SeriesMarker
    const marker: SeriesMarker = event;
    expect(marker.time).toBe(1000);
    expect(marker.position).toBe('aboveBar');
    expect(marker.shape).toBe('circle');
    expect(marker.color).toBe('#ff0000');

    // Verify ChartEvent-specific fields
    expect(event.eventType).toBe('earnings');
    expect(event.title).toBe('Q3 Earnings');
  });

  it('ChartEvent accepts all EventType values', () => {
    const eventTypes: ChartEvent['eventType'][] = ['earnings', 'dividend', 'split', 'ipo', 'other'];
    for (const eventType of eventTypes) {
      const event: ChartEvent = {
        time: 1000,
        position: 'belowBar',
        shape: 'arrowUp',
        color: '#00ff00',
        eventType,
        title: `${eventType} event`,
      };
      expect(event.eventType).toBe(eventType);
    }
  });

  it('ChartEvent accepts optional fields', () => {
    const event: ChartEvent = {
      time: 1000,
      position: 'aboveBar',
      shape: 'square',
      color: '#0000ff',
      eventType: 'dividend',
      title: 'Quarterly Dividend',
      description: 'Annual dividend payout',
      value: '$1.25',
      text: 'DIV',
      size: 2,
      id: 'event-1',
    };
    expect(event.description).toBe('Annual dividend payout');
    expect(event.value).toBe('$1.25');
    expect(event.text).toBe('DIV');
    expect(event.size).toBe(2);
    expect(event.id).toBe('event-1');
  });
});

describe('setEvents / getEvents', () => {
  let container: HTMLElement;
  let chart: IChartApi;
  let series: ISeriesApi<'candlestick'>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    chart = createChart(container, { width: 600, height: 300 });
    series = chart.addCandlestickSeries();
    series.setData(makeBars(20));
  });

  afterEach(() => {
    chart?.remove();
    container.remove();
  });

  it('round-trips events via setEvents/getEvents', () => {
    const events: ChartEvent[] = [
      { time: 1060, position: 'aboveBar', shape: 'circle', color: '#ff0000', eventType: 'earnings', title: 'Q1 Earnings' },
      { time: 1120, position: 'belowBar', shape: 'arrowUp', color: '#00ff00', eventType: 'dividend', title: 'Dividend', value: '$0.50' },
    ];
    series.setEvents(events);

    const stored = series.getEvents();
    expect(stored).toHaveLength(2);
    expect(stored[0].time).toBe(1060);
    expect(stored[0].eventType).toBe('earnings');
    expect(stored[0].title).toBe('Q1 Earnings');
    expect(stored[1].time).toBe(1120);
    expect(stored[1].eventType).toBe('dividend');
    expect(stored[1].value).toBe('$0.50');
  });

  it('events are sorted by time', () => {
    const events: ChartEvent[] = [
      { time: 1300, position: 'aboveBar', shape: 'circle', color: '#ff0000', eventType: 'split', title: '2:1 Split' },
      { time: 1060, position: 'belowBar', shape: 'arrowDown', color: '#00ff00', eventType: 'ipo', title: 'IPO Day' },
      { time: 1180, position: 'aboveBar', shape: 'square', color: '#0000ff', eventType: 'earnings', title: 'Q2 Earnings' },
    ];
    series.setEvents(events);

    const stored = series.getEvents();
    expect(stored).toHaveLength(3);
    expect(stored[0].time).toBe(1060);
    expect(stored[1].time).toBe(1180);
    expect(stored[2].time).toBe(1300);
  });

  it('getEvents returns empty array initially', () => {
    const events = series.getEvents();
    expect(events).toHaveLength(0);
  });

  it('setEvents replaces existing events', () => {
    series.setEvents([
      { time: 1060, position: 'aboveBar', shape: 'circle', color: '#ff0000', eventType: 'earnings', title: 'Old Event' },
    ]);
    expect(series.getEvents()).toHaveLength(1);

    series.setEvents([
      { time: 1120, position: 'belowBar', shape: 'arrowUp', color: '#00ff00', eventType: 'dividend', title: 'New Event 1' },
      { time: 1180, position: 'aboveBar', shape: 'square', color: '#0000ff', eventType: 'other', title: 'New Event 2' },
    ]);
    expect(series.getEvents()).toHaveLength(2);
    expect(series.getEvents()[0].title).toBe('New Event 1');
  });

  it('setEvents does not mutate the input array', () => {
    const events: ChartEvent[] = [
      { time: 1300, position: 'aboveBar', shape: 'circle', color: '#ff0000', eventType: 'other', title: 'Last' },
      { time: 1060, position: 'belowBar', shape: 'arrowUp', color: '#00ff00', eventType: 'earnings', title: 'First' },
    ];
    const originalOrder = [events[0].time, events[1].time];
    series.setEvents(events);
    // Input array should be unmodified
    expect(events[0].time).toBe(originalOrder[0]);
    expect(events[1].time).toBe(originalOrder[1]);
  });

  it('getEvents returns a readonly snapshot', () => {
    const events: ChartEvent[] = [
      { time: 1060, position: 'aboveBar', shape: 'circle', color: '#ff0000', eventType: 'earnings', title: 'Q1' },
    ];
    series.setEvents(events);

    const snapshot1 = series.getEvents();
    series.setEvents([]);
    const snapshot2 = series.getEvents();

    // snapshot1 is a copy, so it still has the original event
    expect(snapshot1).toHaveLength(1);
    expect(snapshot2).toHaveLength(0);
  });
});
