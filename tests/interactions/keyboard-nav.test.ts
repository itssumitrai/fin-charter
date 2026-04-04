import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyboardNavHandler } from '@/interactions/keyboard-nav';
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

describe('KeyboardNavHandler', () => {
  let ts: TimeScale;
  let requestInvalidation: ReturnType<typeof vi.fn>;
  let handler: KeyboardNavHandler;

  beforeEach(() => {
    ts = makeMockTimeScale();
    requestInvalidation = vi.fn();
    handler = new KeyboardNavHandler(ts, requestInvalidation);
  });

  describe('ArrowLeft', () => {
    it('scrolls right by 1 bar spacing (shows older data)', () => {
      handler.onKeyDown('ArrowLeft', false);

      expect(ts.scrollByPixels).toHaveBeenCalledWith(6); // 1 * barSpacing
      expect(requestInvalidation).toHaveBeenCalled();
    });

    it('scrolls right by 10 bar spacings when shift is held', () => {
      handler.onKeyDown('ArrowLeft', true);

      expect(ts.scrollByPixels).toHaveBeenCalledWith(60); // 10 * barSpacing
      expect(requestInvalidation).toHaveBeenCalled();
    });
  });

  describe('ArrowRight', () => {
    it('scrolls left by 1 bar spacing (shows newer data)', () => {
      handler.onKeyDown('ArrowRight', false);

      expect(ts.scrollByPixels).toHaveBeenCalledWith(-6); // -1 * barSpacing
      expect(requestInvalidation).toHaveBeenCalled();
    });

    it('scrolls left by 10 bar spacings when shift is held', () => {
      handler.onKeyDown('ArrowRight', true);

      expect(ts.scrollByPixels).toHaveBeenCalledWith(-60); // -10 * barSpacing
      expect(requestInvalidation).toHaveBeenCalled();
    });
  });

  describe('Zoom in (ArrowUp / +)', () => {
    it('zooms in on ArrowUp', () => {
      handler.onKeyDown('ArrowUp', false);

      expect(ts.zoomAt).toHaveBeenCalledWith(0, 1);
      expect(requestInvalidation).toHaveBeenCalled();
    });

    it('zooms in on + key', () => {
      handler.onKeyDown('+', false);

      expect(ts.zoomAt).toHaveBeenCalledWith(0, 1);
      expect(requestInvalidation).toHaveBeenCalled();
    });
  });

  describe('Zoom out (ArrowDown / -)', () => {
    it('zooms out on ArrowDown', () => {
      handler.onKeyDown('ArrowDown', false);

      expect(ts.zoomAt).toHaveBeenCalledWith(0, -1);
      expect(requestInvalidation).toHaveBeenCalled();
    });

    it('zooms out on - key', () => {
      handler.onKeyDown('-', false);

      expect(ts.zoomAt).toHaveBeenCalledWith(0, -1);
      expect(requestInvalidation).toHaveBeenCalled();
    });
  });

  describe('Home', () => {
    it('scrolls to start (oldest data) via scrollToPosition', () => {
      handler.onKeyDown('Home', false);

      expect(ts.scrollToPosition).toHaveBeenCalledWith(Number.MAX_SAFE_INTEGER);
      expect(requestInvalidation).toHaveBeenCalled();
    });
  });

  describe('End', () => {
    it('scrolls to end (latest data)', () => {
      handler.onKeyDown('End', false);

      expect(ts.scrollToEnd).toHaveBeenCalled();
      expect(requestInvalidation).toHaveBeenCalled();
    });
  });

  it('does not request invalidation for unrecognized keys', () => {
    handler.onKeyDown('a', false);
    handler.onKeyDown('Enter', false);
    handler.onKeyDown('Tab', false);

    expect(requestInvalidation).not.toHaveBeenCalled();
  });
});
