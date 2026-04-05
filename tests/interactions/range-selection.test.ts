import { describe, it, expect, vi } from 'vitest';
import { RangeSelectionHandler, MeasureHandler } from '@/interactions/range-selection';
import type { ColumnStore } from '@/core/types';

function makeStore(length: number): ColumnStore {
  const time = new Float64Array(length);
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    time[i] = 1609459200 + i * 86400;
    open[i] = 100 + i;
    high[i] = 110 + i;
    low[i] = 90 + i;
    close[i] = 105 + i;
    volume[i] = 1000 * (i + 1);
  }
  return { time, open, high, low, close, volume, length };
}

function makeTimeScale() {
  return {
    xToIndex: vi.fn((x: number) => Math.round(x / 10)),
    indexToX: vi.fn((i: number) => i * 10),
  };
}

function makePriceScale() {
  return {
    priceToY: vi.fn((p: number) => 400 - p),
    yToPrice: vi.fn((y: number) => 400 - y),
  };
}

// ─── RangeSelectionHandler ────────────────────────────────────────────────

describe('RangeSelectionHandler', () => {
  it('starts inactive', () => {
    const store = makeStore(10);
    const handler = new RangeSelectionHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    expect(handler.active).toBe(false);
    expect(handler.selecting).toBe(false);
  });

  it('ignores pointer events when inactive', () => {
    const store = makeStore(10);
    const repaint = vi.fn();
    const handler = new RangeSelectionHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      repaint,
    );
    expect(handler.onPointerDown(10, 10, 0)).toBeUndefined();
    expect(handler.selecting).toBe(false);
  });

  it('starts selection on pointer down when active', () => {
    const store = makeStore(10);
    const repaint = vi.fn();
    const handler = new RangeSelectionHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      repaint,
    );
    handler.active = true;
    const consumed = handler.onPointerDown(20, 50, 0);
    expect(consumed).toBe(true);
    expect(handler.selecting).toBe(true);
    expect(handler.startX).toBe(20);
    expect(repaint).toHaveBeenCalled();
  });

  it('updates selection on pointer move', () => {
    const store = makeStore(10);
    const handler = new RangeSelectionHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    handler.active = true;
    handler.onPointerDown(10, 50, 0);
    handler.onPointerMove(80, 50, 0);
    expect(handler.endX).toBe(80);
  });

  it('fires callback with stats on pointer up', () => {
    const store = makeStore(10);
    const ts = makeTimeScale();
    const handler = new RangeSelectionHandler(
      ts as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    const cb = vi.fn();
    handler.onRangeSelected(cb);
    handler.active = true;

    handler.onPointerDown(10, 50, 0);
    handler.onPointerMove(80, 50, 0);
    handler.onPointerUp(0);

    expect(cb).toHaveBeenCalledTimes(1);
    const stats = cb.mock.calls[0][0];
    expect(stats).not.toBeNull();
    expect(stats.barCount).toBeGreaterThan(0);
    expect(typeof stats.high).toBe('number');
    expect(typeof stats.low).toBe('number');
    expect(typeof stats.totalVolume).toBe('number');
  });

  it('clears on Escape', () => {
    const store = makeStore(10);
    const repaint = vi.fn();
    const handler = new RangeSelectionHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      repaint,
    );
    handler.active = true;
    handler.onPointerDown(10, 50, 0);
    expect(handler.selecting).toBe(true);
    handler.onKeyDown('Escape', false);
    expect(handler.selecting).toBe(false);
  });

  it('clears selection when deactivated', () => {
    const store = makeStore(10);
    const handler = new RangeSelectionHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    handler.active = true;
    handler.onPointerDown(10, 50, 0);
    handler.active = false;
    expect(handler.selecting).toBe(false);
  });

  it('offRangeSelected removes callback', () => {
    const store = makeStore(10);
    const handler = new RangeSelectionHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    const cb = vi.fn();
    handler.onRangeSelected(cb);
    handler.offRangeSelected(cb);
    handler.active = true;
    handler.onPointerDown(10, 50, 0);
    handler.onPointerMove(80, 50, 0);
    handler.onPointerUp(0);
    // The cb that we expect NOT to fire is the range selected one
    // However, clear() fires cb(null). So the only call would be from clear in the constructor.
    // Let's check that the stats callback was not called with a non-null value
    const nonNullCalls = cb.mock.calls.filter((c: unknown[]) => c[0] !== null);
    expect(nonNullCalls.length).toBe(0);
  });
});

// ─── MeasureHandler ──────────────────────────────────────────────────────

describe('MeasureHandler', () => {
  it('starts inactive', () => {
    const store = makeStore(10);
    const handler = new MeasureHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    expect(handler.active).toBe(false);
    expect(handler.firstPoint).toBeNull();
  });

  it('sets first point on first click', () => {
    const store = makeStore(10);
    const handler = new MeasureHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    handler.active = true;
    handler.onPointerDown(30, 100, 0);
    expect(handler.firstPoint).toEqual({ x: 30, y: 100 });
    expect(handler.secondPoint).toBeNull();
  });

  it('computes result on second click', () => {
    const store = makeStore(10);
    const handler = new MeasureHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    const cb = vi.fn();
    handler.onMeasure(cb);
    handler.active = true;

    handler.onPointerDown(10, 300, 0); // first point
    handler.onPointerDown(80, 200, 0); // second point

    expect(cb).toHaveBeenCalledTimes(1);
    const result = cb.mock.calls[0][0];
    expect(result).not.toBeNull();
    expect(typeof result.priceChange).toBe('number');
    expect(typeof result.percentChange).toBe('number');
    expect(typeof result.barCount).toBe('number');
    expect(typeof result.timeElapsed).toBe('number');
  });

  it('tracks hover after first click', () => {
    const store = makeStore(10);
    const handler = new MeasureHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    handler.active = true;
    handler.onPointerDown(10, 300, 0);
    handler.onPointerMove(50, 250, 0);
    expect(handler.hovering).toBe(true);
    expect(handler.hoverX).toBe(50);
    expect(handler.hoverY).toBe(250);
  });

  it('clears on Escape', () => {
    const store = makeStore(10);
    const handler = new MeasureHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    handler.active = true;
    handler.onPointerDown(10, 300, 0);
    handler.onKeyDown('Escape', false);
    expect(handler.firstPoint).toBeNull();
  });

  it('clears on deactivation', () => {
    const store = makeStore(10);
    const handler = new MeasureHandler(
      makeTimeScale() as never,
      makePriceScale() as never,
      () => store,
      vi.fn(),
    );
    handler.active = true;
    handler.onPointerDown(10, 300, 0);
    handler.active = false;
    expect(handler.firstPoint).toBeNull();
  });
});
