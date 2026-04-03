import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextMetricsCache } from '@/renderers/text-cache';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a mock CanvasRenderingContext2D whose measureText returns a width
 * equal to the character code of the first character of the string (so each
 * distinct character has a deterministic, non-equal width).
 */
function makeMockCtx() {
  const ctx = {
    font: '12px Arial',
    measureText: vi.fn((text: string) => ({ width: text.charCodeAt(0) })),
  };
  return ctx as unknown as CanvasRenderingContext2D & { measureText: ReturnType<typeof vi.fn> };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TextMetricsCache', () => {
  let cache: TextMetricsCache;
  let ctx: ReturnType<typeof makeMockCtx>;

  beforeEach(() => {
    cache = new TextMetricsCache();
    ctx = makeMockCtx();
  });

  // ── prepare ───────────────────────────────────────────────────────────────

  describe('prepare', () => {
    it('calls ctx.measureText for every financial character', () => {
      cache.prepare(ctx, '12px Arial');
      // At minimum digits, punctuation, and letters are measured.
      // We expect at least 70 calls.
      expect(ctx.measureText.mock.calls.length).toBeGreaterThanOrEqual(70);
    });

    it('sets ctx.font during measurement and restores it afterwards', () => {
      ctx.font = 'original';
      cache.prepare(ctx, '14px Roboto');
      expect(ctx.font).toBe('original');
    });

    it('skips re-measurement when called again with the same font', () => {
      cache.prepare(ctx, '12px Arial');
      const callsAfterFirst = ctx.measureText.mock.calls.length;
      cache.prepare(ctx, '12px Arial');
      expect(ctx.measureText.mock.calls.length).toBe(callsAfterFirst);
    });

    it('re-measures when the font changes', () => {
      cache.prepare(ctx, '12px Arial');
      const callsAfterFirst = ctx.measureText.mock.calls.length;
      cache.prepare(ctx, '16px Mono');
      expect(ctx.measureText.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    });
  });

  // ── measureWidth ──────────────────────────────────────────────────────────

  describe('measureWidth', () => {
    it('returns the sum of cached character widths', () => {
      cache.prepare(ctx, '12px Arial');
      ctx.measureText.mockClear();

      // Width = sum of char codes for '1', '2', '3'
      const expected = '1'.charCodeAt(0) + '2'.charCodeAt(0) + '3'.charCodeAt(0);
      expect(cache.measureWidth('123')).toBe(expected);
    });

    it('does not call ctx.measureText for pre-cached characters', () => {
      cache.prepare(ctx, '12px Arial');
      ctx.measureText.mockClear();

      cache.measureWidth('0123456789');
      expect(ctx.measureText).not.toHaveBeenCalled();
    });

    it('falls back to ctx.measureText for unknown characters', () => {
      cache.prepare(ctx, '12px Arial');
      ctx.measureText.mockClear();

      // '€' is not in the financial character set
      const width = cache.measureWidth('€');
      expect(ctx.measureText).toHaveBeenCalledWith('€');
      expect(width).toBe('€'.charCodeAt(0));
    });

    it('caches the result of a fallback measurement', () => {
      cache.prepare(ctx, '12px Arial');
      ctx.measureText.mockClear();

      cache.measureWidth('€');
      const callsAfterFirst = ctx.measureText.mock.calls.length;
      cache.measureWidth('€');
      // No additional calls — the result should be cached now.
      expect(ctx.measureText.mock.calls.length).toBe(callsAfterFirst);
    });

    it('returns 0 for an empty string', () => {
      cache.prepare(ctx, '12px Arial');
      expect(cache.measureWidth('')).toBe(0);
    });

    it('returns correct width for a mixed string including spaces', () => {
      cache.prepare(ctx, '12px Arial');
      ctx.measureText.mockClear();

      const text = '1 2';
      const expected =
        '1'.charCodeAt(0) + ' '.charCodeAt(0) + '2'.charCodeAt(0);
      expect(cache.measureWidth(text)).toBe(expected);
    });
  });
});
