import { describe, it, expect, beforeEach } from 'vitest';
import { PriceScale } from '@/core/price-scale';

describe('PriceScale', () => {
  let ps: PriceScale;

  beforeEach(() => {
    ps = new PriceScale('right');
    ps.setHeight(400);
  });

  // ── autoScale ─────────────────────────────────────────────────────────────

  it('autoScale stores raw min/max (margins handled in coordinate conversion)', () => {
    ps.autoScale(100, 200);
    const { min, max } = ps.priceRange;
    // Raw values, no margin added by autoScale
    expect(min).toBe(100);
    expect(max).toBe(200);
  });

  it('autoScale handles flat price range with a symmetric window', () => {
    ps.autoScale(50, 50);
    const { min, max } = ps.priceRange;
    expect(min).toBeLessThan(50);
    expect(max).toBeGreaterThan(50);
    // The window should be symmetric around 50
    expect((min + max) / 2).toBeCloseTo(50);
  });

  // ── priceToY with TV-style margins ────────────────────────────────────────
  // height=400, TOP_MARGIN=0.2, BOTTOM_MARGIN=0.1
  // topPx=80, bottomPx=40, innerHeight=280

  it('priceToY maps maxPrice near the top margin area', () => {
    ps.setRange(0, 100);
    // invCoord = 40 + (280-1) * (100-0)/(100-0) = 40 + 279 = 319
    // y = 400 - 1 - 319 = 80
    expect(ps.priceToY(100)).toBeCloseTo(80);
  });

  it('priceToY maps minPrice near the bottom margin area', () => {
    ps.setRange(0, 100);
    // invCoord = 40 + (280-1) * 0 = 40
    // y = 400 - 1 - 40 = 359
    expect(ps.priceToY(0)).toBeCloseTo(359);
  });

  it('priceToY maps midpoint to the center of the inner area', () => {
    ps.setRange(0, 100);
    // invCoord = 40 + 279 * 0.5 = 40 + 139.5 = 179.5
    // y = 400 - 1 - 179.5 = 219.5
    expect(ps.priceToY(50)).toBeCloseTo(219.5);
  });

  it('priceToY is linear', () => {
    ps.setRange(0, 200);
    // Equal price steps should produce equal pixel steps
    const step1 = ps.priceToY(50) - ps.priceToY(0);
    const step2 = ps.priceToY(100) - ps.priceToY(50);
    expect(step1).toBeCloseTo(step2);
  });

  // ── yToPrice ──────────────────────────────────────────────────────────────

  it('yToPrice is the inverse of priceToY', () => {
    ps.setRange(10, 200);
    for (const price of [10, 50, 100, 150, 200]) {
      expect(ps.yToPrice(ps.priceToY(price))).toBeCloseTo(price);
    }
  });

  it('yToPrice at top margin returns max price', () => {
    ps.setRange(0, 100);
    // y=80 is the top margin boundary where max price maps
    expect(ps.yToPrice(80)).toBeCloseTo(100);
  });

  it('yToPrice at bottom margin returns min price', () => {
    ps.setRange(0, 100);
    // y=359 is the bottom margin boundary where min price maps
    expect(ps.yToPrice(359)).toBeCloseTo(0);
  });

  // ── setRange / resetAutoScale ─────────────────────────────────────────────

  it('setRange overrides auto-scale', () => {
    ps.autoScale(0, 100);
    ps.setRange(200, 500);
    expect(ps.priceRange.min).toBe(200);
    expect(ps.priceRange.max).toBe(500);
  });

  it('autoScale is ignored while a manual range is active', () => {
    ps.setRange(200, 500);
    ps.autoScale(0, 100); // should be ignored
    expect(ps.priceRange.min).toBe(200);
    expect(ps.priceRange.max).toBe(500);
  });

  it('resetAutoScale re-enables autoScale', () => {
    ps.setRange(200, 500);
    ps.resetAutoScale();
    ps.autoScale(0, 100);
    const { min, max } = ps.priceRange;
    // autoScale now stores raw values (no margin added)
    expect(min).toBe(0);
    expect(max).toBe(100);
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('priceToY returns 0 when height is not set', () => {
    const fresh = new PriceScale('left');
    fresh.setRange(0, 100);
    expect(fresh.priceToY(50)).toBe(0);
  });

  it('position is stored correctly', () => {
    expect(ps.position).toBe('right');
    expect(new PriceScale('left').position).toBe('left');
  });

  // ── Logarithmic mode ──────────────────────────────────────────────────

  describe('logarithmic mode', () => {
    beforeEach(() => {
      ps.setMode('logarithmic');
    });

    it('defaults to linear mode', () => {
      const fresh = new PriceScale('right');
      expect(fresh.mode).toBe('linear');
    });

    it('setMode changes the mode', () => {
      expect(ps.mode).toBe('logarithmic');
      ps.setMode('linear');
      expect(ps.mode).toBe('linear');
    });

    it('priceToY maps equal percentage changes to equal pixel distances', () => {
      ps.setRange(100, 10000);
      // In log mode: 100 → 1000 is the same % change as 1000 → 10000 (10x each)
      const y100 = ps.priceToY(100);
      const y1000 = ps.priceToY(1000);
      const y10000 = ps.priceToY(10000);
      const dist1 = y100 - y1000;   // top to mid
      const dist2 = y1000 - y10000; // mid to bottom
      expect(dist1).toBeCloseTo(dist2, 0);
    });

    it('priceToY is NOT linear in log mode', () => {
      ps.setRange(100, 10000);
      const yMid = ps.priceToY(5050); // arithmetic midpoint
      const yTop = ps.priceToY(10000);
      const yBot = ps.priceToY(100);
      const linearMid = (yTop + yBot) / 2;
      // In log mode, the arithmetic midpoint should NOT be at the pixel midpoint
      expect(Math.abs(yMid - linearMid)).toBeGreaterThan(5);
    });

    it('yToPrice is the inverse of priceToY in log mode', () => {
      ps.setRange(10, 10000);
      for (const price of [10, 100, 1000, 5000, 10000]) {
        expect(ps.yToPrice(ps.priceToY(price))).toBeCloseTo(price, 0);
      }
    });

    it('falls back to linear when min <= 0', () => {
      ps.setRange(0, 100);
      // Should not crash and should behave like linear
      const yMid = ps.priceToY(50);
      const yTop = ps.priceToY(100);
      const yBot = ps.priceToY(0);
      // Linear: midpoint at pixel center
      const linearMid = (yTop + yBot) / 2;
      expect(yMid).toBeCloseTo(linearMid, 0);
    });

    it('falls back to linear when price <= 0', () => {
      ps.setRange(1, 100);
      // Negative price in log mode: fall back to linear mapping
      const y = ps.priceToY(-10);
      expect(isFinite(y)).toBe(true);
    });
  });
});
