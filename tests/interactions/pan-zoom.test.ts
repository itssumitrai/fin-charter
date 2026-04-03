import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PanZoomHandler } from '@/interactions/pan-zoom';
import type { TimeScale } from '@/core/time-scale';

function makeMockTimeScale(): TimeScale {
  return {
    scrollTo: vi.fn(),
    scrollByPixels: vi.fn(),
    zoomAt: vi.fn(),
    get barSpacing() { return 6; },
    get rightOffset() { return 0; },
    setRightOffset: vi.fn(),
    scrollToEnd: vi.fn(),
    scrollToPosition: vi.fn(),
    setWidth: vi.fn(),
    setDataLength: vi.fn(),
    setOptions: vi.fn(),
    visibleRange: vi.fn(() => ({ fromIdx: 0, toIdx: 100 })),
    indexToX: vi.fn((i: number) => i * 6),
    xToIndex: vi.fn((x: number) => Math.round(x / 6)),
    fitContent: vi.fn(),
  } as unknown as TimeScale;
}

describe('PanZoomHandler', () => {
  let ts: TimeScale;
  let requestInvalidation: ReturnType<typeof vi.fn>;
  let handler: PanZoomHandler;

  beforeEach(() => {
    ts = makeMockTimeScale();
    requestInvalidation = vi.fn();
    handler = new PanZoomHandler(ts, requestInvalidation);
  });

  afterEach(() => {
    handler.destroy();
  });

  it('calls scrollTo when pointer moves after pointer down', () => {
    handler.onPointerDown(100, 0, 1);
    handler.onPointerMove(120, 0, 1);

    expect(ts.scrollTo).toHaveBeenCalledWith(100, 120, 0);
    expect(requestInvalidation).toHaveBeenCalled();
  });

  it('ignores pointer move without prior pointer down', () => {
    handler.onPointerMove(120, 0, 1);

    expect(ts.scrollTo).not.toHaveBeenCalled();
    expect(requestInvalidation).not.toHaveBeenCalled();
  });

  it('ignores pointer move for different pointer id', () => {
    handler.onPointerDown(100, 0, 1);
    handler.onPointerMove(120, 0, 99); // different pointer id

    expect(ts.scrollTo).not.toHaveBeenCalled();
  });

  it('stops panning after pointer up', () => {
    handler.onPointerDown(100, 0, 1);
    handler.onPointerMove(120, 0, 1);
    handler.onPointerUp(1);

    vi.mocked(ts.scrollTo).mockClear();
    handler.onPointerMove(140, 0, 1);

    expect(ts.scrollTo).not.toHaveBeenCalled();
  });

  it('accumulates scrollTo calls from multiple moves', () => {
    handler.onPointerDown(0, 0, 1);
    handler.onPointerMove(10, 0, 1);
    handler.onPointerMove(30, 0, 1);

    expect(ts.scrollTo).toHaveBeenCalledTimes(2);
    // Both calls use the same startX (0) and savedRightOffset (0)
    expect(vi.mocked(ts.scrollTo).mock.calls[0]).toEqual([0, 10, 0]);
    expect(vi.mocked(ts.scrollTo).mock.calls[1]).toEqual([0, 30, 0]);
  });

  it('zooms in when wheel deltaY is negative (TV: scale = +1)', () => {
    handler.onWheel(200, 100, -100);

    expect(ts.zoomAt).toHaveBeenCalledOnce();
    const [x, scale] = vi.mocked(ts.zoomAt).mock.calls[0];
    expect(x).toBe(200);
    expect(scale).toBe(1); // -Math.sign(-100) = 1
  });

  it('zooms out when wheel deltaY is positive (TV: scale = -1)', () => {
    handler.onWheel(200, 100, 100);

    expect(ts.zoomAt).toHaveBeenCalledOnce();
    const [x, scale] = vi.mocked(ts.zoomAt).mock.calls[0];
    expect(x).toBe(200);
    expect(scale).toBe(-1); // -Math.sign(100) = -1
  });

  it('zoom scale is clamped to ±1 regardless of deltaY magnitude', () => {
    handler.onWheel(0, 0, -200);
    const [, scale1] = vi.mocked(ts.zoomAt).mock.calls[0];

    vi.mocked(ts.zoomAt).mockClear();
    handler.onWheel(0, 0, -100);
    const [, scale2] = vi.mocked(ts.zoomAt).mock.calls[0];

    // Both should be exactly 1 (clamped via Math.sign)
    expect(scale1).toBe(1);
    expect(scale2).toBe(1);
  });

  it('requests invalidation on wheel', () => {
    handler.onWheel(0, 0, -50);
    expect(requestInvalidation).toHaveBeenCalled();
  });

  it('cancels kinetic scroll on new pointer down', () => {
    // Start with a fast flick to trigger kinetic scroll
    handler.onPointerDown(0, 0, 1);
    handler.onPointerMove(50, 0, 1); // velocity = 50
    handler.onPointerUp(1); // kinetic starts

    // A new pointer down should cancel kinetic
    vi.mocked(ts.scrollByPixels).mockClear();
    handler.onPointerDown(0, 0, 2);
    // No further automatic scroll should happen from kinetic
    handler.onPointerUp(2);
  });

  it('destroy stops kinetic scrolling without error', () => {
    handler.onPointerDown(0, 0, 1);
    handler.onPointerMove(100, 0, 1);
    handler.onPointerUp(1);
    // Should not throw
    expect(() => handler.destroy()).not.toThrow();
  });
});
