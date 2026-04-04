import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxisDragHandler } from '@/interactions/axis-drag';
import type { AxisRect } from '@/interactions/axis-drag';
import type { PriceScale } from '@/core/price-scale';
import type { TimeScale } from '@/core/time-scale';

function makeMockPriceScale(): PriceScale {
  return {
    position: 'right' as const,
    priceRange: { min: 100, max: 200 },
    setRange: vi.fn(),
    setHeight: vi.fn(),
    autoScale: vi.fn(),
    priceToY: vi.fn((p: number) => p),
    yToPrice: vi.fn((y: number) => y),
    resetAutoScale: vi.fn(),
    tickMarks: vi.fn(() => []),
    animateStep: vi.fn(() => false),
  } as unknown as PriceScale;
}

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

describe('AxisDragHandler', () => {
  let ps: PriceScale;
  let ts: TimeScale;
  let requestInvalidation: ReturnType<typeof vi.fn>;
  let handler: AxisDragHandler;

  // Rects: price axis on the right, time axis on the bottom
  const priceAxisRect: AxisRect = { x: 400, y: 0, w: 60, h: 300 };
  const timeAxisRect: AxisRect = { x: 0, y: 300, w: 400, h: 30 };

  beforeEach(() => {
    ps = makeMockPriceScale();
    ts = makeMockTimeScale();
    requestInvalidation = vi.fn();
    handler = new AxisDragHandler(
      ps, ts, requestInvalidation,
      () => priceAxisRect,
      () => timeAxisRect,
    );
  });

  describe('price axis drag', () => {
    it('initiates drag when pointer down is inside price axis rect', () => {
      handler.onPointerDown(420, 150, 1);
      handler.onPointerMove(420, 170, 1);

      expect(ps.setRange).toHaveBeenCalled();
      expect(requestInvalidation).toHaveBeenCalled();
    });

    it('scales price range based on vertical drag distance', () => {
      handler.onPointerDown(420, 100, 1);

      // Drag down by 20px: scale = 1 + 20 * 0.005 = 1.10
      handler.onPointerMove(420, 120, 1);

      const [min, max] = vi.mocked(ps.setRange).mock.calls[0];
      const mid = (100 + 200) / 2; // 150
      const halfSpan = ((200 - 100) / 2) * 1.10; // 55
      expect(min).toBeCloseTo(mid - halfSpan);
      expect(max).toBeCloseTo(mid + halfSpan);
    });

    it('dragging up contracts the range', () => {
      handler.onPointerDown(420, 100, 1);

      // Drag up by 40px: scale = 1 + (-40) * 0.005 = 0.80
      handler.onPointerMove(420, 60, 1);

      const [min, max] = vi.mocked(ps.setRange).mock.calls[0];
      const mid = 150;
      const halfSpan = 50 * 0.80; // 40
      expect(min).toBeCloseTo(mid - halfSpan);
      expect(max).toBeCloseTo(mid + halfSpan);
    });

    it('clamps scale to a minimum of 0.1', () => {
      handler.onPointerDown(420, 100, 1);

      // Drag up by 300px: scale = 1 + (-300) * 0.005 = -0.5 => clamped to 0.1
      handler.onPointerMove(420, -200, 1);

      const [min, max] = vi.mocked(ps.setRange).mock.calls[0];
      const mid = 150;
      const halfSpan = 50 * 0.1; // 5
      expect(min).toBeCloseTo(mid - halfSpan);
      expect(max).toBeCloseTo(mid + halfSpan);
    });
  });

  describe('time axis drag', () => {
    it('initiates drag when pointer down is inside time axis rect', () => {
      handler.onPointerDown(200, 310, 1);
      handler.onPointerMove(220, 310, 1);

      expect(ts.scrollByPixels).toHaveBeenCalled();
      expect(requestInvalidation).toHaveBeenCalled();
    });

    it('scrolls by pixel delta on horizontal drag', () => {
      handler.onPointerDown(200, 310, 1);
      handler.onPointerMove(230, 310, 1);

      // dx = 230 - 200 = 30
      expect(ts.scrollByPixels).toHaveBeenCalledWith(30);
    });

    it('accumulates incremental scrolls from multiple moves', () => {
      handler.onPointerDown(200, 310, 1);
      handler.onPointerMove(220, 310, 1); // dx = 20
      handler.onPointerMove(250, 310, 1); // dx = 250 - 220 = 30

      expect(ts.scrollByPixels).toHaveBeenCalledTimes(2);
      expect(vi.mocked(ts.scrollByPixels).mock.calls[0][0]).toBe(20);
      expect(vi.mocked(ts.scrollByPixels).mock.calls[1][0]).toBe(30);
    });
  });

  describe('pointer filtering', () => {
    it('ignores pointer down outside both axis rects', () => {
      handler.onPointerDown(200, 150, 1); // main chart area
      handler.onPointerMove(220, 150, 1);

      expect(ps.setRange).not.toHaveBeenCalled();
      expect(ts.scrollByPixels).not.toHaveBeenCalled();
      expect(requestInvalidation).not.toHaveBeenCalled();
    });

    it('ignores move from a different pointer id', () => {
      handler.onPointerDown(420, 150, 1);
      handler.onPointerMove(420, 170, 99);

      expect(ps.setRange).not.toHaveBeenCalled();
      expect(requestInvalidation).not.toHaveBeenCalled();
    });

    it('ignores second pointer down while first is active', () => {
      handler.onPointerDown(420, 150, 1);
      handler.onPointerDown(200, 310, 2); // second pointer in time axis

      // Move second pointer - should be ignored
      handler.onPointerMove(220, 310, 2);
      expect(ts.scrollByPixels).not.toHaveBeenCalled();

      // Move first pointer in price axis - should work
      handler.onPointerMove(420, 170, 1);
      expect(ps.setRange).toHaveBeenCalled();
    });
  });

  describe('pointer up', () => {
    it('stops drag after pointer up', () => {
      handler.onPointerDown(420, 150, 1);
      handler.onPointerMove(420, 170, 1);
      handler.onPointerUp(1);

      vi.mocked(ps.setRange).mockClear();
      requestInvalidation.mockClear();

      handler.onPointerMove(420, 190, 1);

      expect(ps.setRange).not.toHaveBeenCalled();
      expect(requestInvalidation).not.toHaveBeenCalled();
    });

    it('ignores pointer up for non-active pointer', () => {
      handler.onPointerDown(420, 150, 1);
      handler.onPointerUp(99); // different pointer

      // Original pointer should still be active
      handler.onPointerMove(420, 170, 1);
      expect(ps.setRange).toHaveBeenCalled();
    });
  });
});
