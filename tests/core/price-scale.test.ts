import { describe, it, expect, beforeEach } from 'vitest';
import { PriceScale } from '@/core/price-scale';

describe('PriceScale', () => {
  let ps: PriceScale;

  beforeEach(() => {
    ps = new PriceScale('right');
    ps.setHeight(400);
  });

  // ── autoScale ─────────────────────────────────────────────────────────────

  it('autoScale adds 5% margin on each side', () => {
    ps.autoScale(100, 200);
    const { min, max } = ps.priceRange;
    const span = 200 - 100; // 100
    expect(min).toBeCloseTo(100 - span * 0.05);
    expect(max).toBeCloseTo(200 + span * 0.05);
  });

  it('autoScale handles flat price range with a symmetric window', () => {
    ps.autoScale(50, 50);
    const { min, max } = ps.priceRange;
    expect(min).toBeLessThan(50);
    expect(max).toBeGreaterThan(50);
    // The window should be symmetric around 50
    expect((min + max) / 2).toBeCloseTo(50);
  });

  // ── priceToY ──────────────────────────────────────────────────────────────

  it('priceToY maps maxPrice to y=0 (top)', () => {
    ps.setRange(0, 100);
    expect(ps.priceToY(100)).toBeCloseTo(0);
  });

  it('priceToY maps minPrice to y=height (bottom)', () => {
    ps.setRange(0, 100);
    expect(ps.priceToY(0)).toBeCloseTo(400);
  });

  it('priceToY maps midpoint to y=height/2', () => {
    ps.setRange(0, 100);
    expect(ps.priceToY(50)).toBeCloseTo(200);
  });

  it('priceToY is linear', () => {
    ps.setRange(0, 200);
    // Equal price steps should produce equal pixel steps (with Y-inverted sign)
    const step1 = ps.priceToY(50) - ps.priceToY(0);   // going up 50 price units
    const step2 = ps.priceToY(100) - ps.priceToY(50); // going up another 50 price units
    expect(step1).toBeCloseTo(step2);
  });

  // ── yToPrice ──────────────────────────────────────────────────────────────

  it('yToPrice is the inverse of priceToY', () => {
    ps.setRange(10, 200);
    for (const price of [10, 50, 100, 150, 200]) {
      expect(ps.yToPrice(ps.priceToY(price))).toBeCloseTo(price);
    }
  });

  it('yToPrice(0) returns max price', () => {
    ps.setRange(0, 100);
    expect(ps.yToPrice(0)).toBeCloseTo(100);
  });

  it('yToPrice(height) returns min price', () => {
    ps.setRange(0, 100);
    expect(ps.yToPrice(400)).toBeCloseTo(0);
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
    expect(min).toBeLessThan(0);
    expect(max).toBeGreaterThan(100);
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
});
