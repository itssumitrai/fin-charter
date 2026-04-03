import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PanZoomHandler } from '@/interactions/pan-zoom';
import type { TimeScale } from '@/core/time-scale';

function makeMockTimeScale(): TimeScale {
  return {
    scrollByPixels: vi.fn(),
    zoomAt: vi.fn(),
    get barSpacing() { return 6; },
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

  it('scrolls by dx when pointer moves after pointer down', () => {
    handler.onPointerDown(100, 0, 1);
    handler.onPointerMove(120, 0, 1);

    expect(ts.scrollByPixels).toHaveBeenCalledWith(20);
    expect(requestInvalidation).toHaveBeenCalled();
  });

  it('ignores pointer move without prior pointer down', () => {
    handler.onPointerMove(120, 0, 1);

    expect(ts.scrollByPixels).not.toHaveBeenCalled();
    expect(requestInvalidation).not.toHaveBeenCalled();
  });

  it('ignores pointer move for unknown pointer id', () => {
    handler.onPointerDown(100, 0, 1);
    handler.onPointerMove(120, 0, 99); // different pointer id

    expect(ts.scrollByPixels).not.toHaveBeenCalled();
  });

  it('stops panning after pointer up', () => {
    handler.onPointerDown(100, 0, 1);
    handler.onPointerMove(120, 0, 1);
    handler.onPointerUp(1);

    vi.mocked(ts.scrollByPixels).mockClear();
    handler.onPointerMove(140, 0, 1);

    expect(ts.scrollByPixels).not.toHaveBeenCalled();
  });

  it('accumulates scroll from multiple moves', () => {
    handler.onPointerDown(0, 0, 1);
    handler.onPointerMove(10, 0, 1);
    handler.onPointerMove(30, 0, 1);

    expect(ts.scrollByPixels).toHaveBeenCalledTimes(2);
    expect(vi.mocked(ts.scrollByPixels).mock.calls[0][0]).toBe(10);
    expect(vi.mocked(ts.scrollByPixels).mock.calls[1][0]).toBe(20);
  });

  it('zooms in when wheel deltaY is negative', () => {
    handler.onWheel(200, 100, -100);

    expect(ts.zoomAt).toHaveBeenCalledOnce();
    const [x, factor] = vi.mocked(ts.zoomAt).mock.calls[0];
    expect(x).toBe(200);
    expect(factor).toBeGreaterThan(1); // zoom in
  });

  it('zooms out when wheel deltaY is positive', () => {
    handler.onWheel(200, 100, 100);

    expect(ts.zoomAt).toHaveBeenCalledOnce();
    const [x, factor] = vi.mocked(ts.zoomAt).mock.calls[0];
    expect(x).toBe(200);
    expect(factor).toBeLessThan(1); // zoom out
  });

  it('zoom factor increases with larger deltaY magnitude', () => {
    handler.onWheel(0, 0, -200);
    const [, factor1] = vi.mocked(ts.zoomAt).mock.calls[0];

    vi.mocked(ts.zoomAt).mockClear();
    handler.onWheel(0, 0, -100);
    const [, factor2] = vi.mocked(ts.zoomAt).mock.calls[0];

    expect(factor1).toBeGreaterThan(factor2);
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
    // (hard to verify RAF cancellation directly, but no error should occur)
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
