import { describe, it, expect, beforeEach } from 'vitest';
import { PriceScale } from '@/core/price-scale';

// height=400, TOP_MARGIN=0.2, BOTTOM_MARGIN=0.1
// topPx=80, bottomPx=40, innerHeight=280

describe('PriceScale — comparison mode flag', () => {
  let ps: PriceScale;

  beforeEach(() => {
    ps = new PriceScale('right');
    ps.setHeight(400);
  });

  it('isComparisonMode() returns false by default', () => {
    expect(ps.isComparisonMode()).toBe(false);
  });

  it('setComparisonMode(true) enables comparison mode', () => {
    ps.setComparisonMode(true);
    expect(ps.isComparisonMode()).toBe(true);
  });

  it('setComparisonMode(false) disables comparison mode', () => {
    ps.setComparisonMode(true);
    ps.setComparisonMode(false);
    expect(ps.isComparisonMode()).toBe(false);
  });

  it('toggling comparison mode multiple times is stable', () => {
    for (let i = 0; i < 5; i++) {
      ps.setComparisonMode(true);
      expect(ps.isComparisonMode()).toBe(true);
      ps.setComparisonMode(false);
      expect(ps.isComparisonMode()).toBe(false);
    }
  });
});

describe('PriceScale — coordinate conversion in percent space', () => {
  let ps: PriceScale;

  beforeEach(() => {
    ps = new PriceScale('right');
    ps.setHeight(400);
    // Scale set to percent range: -10% to +20%
    ps.setRange(-10, 20);
    ps.setComparisonMode(true);
  });

  it('priceToY and yToPrice are still consistent in percent space', () => {
    const testPcts = [-10, -5, 0, 5, 10, 15, 20];
    for (const pct of testPcts) {
      expect(ps.yToPrice(ps.priceToY(pct))).toBeCloseTo(pct);
    }
  });

  it('0% maps to a Y coordinate that is between the bottom and top margins', () => {
    // With range -10 to 20, 0 is not the midpoint.
    // priceToY(0) must be within [topPx, height - bottomPx] = [80, 360]
    const y = ps.priceToY(0);
    expect(y).toBeGreaterThanOrEqual(80);
    expect(y).toBeLessThanOrEqual(360);
  });

  it('positive percent maps to a smaller Y (higher on screen) than 0%', () => {
    const y0 = ps.priceToY(0);
    const yPos = ps.priceToY(10);
    expect(yPos).toBeLessThan(y0);
  });

  it('negative percent maps to a larger Y (lower on screen) than 0%', () => {
    const y0 = ps.priceToY(0);
    const yNeg = ps.priceToY(-5);
    expect(yNeg).toBeGreaterThan(y0);
  });

  it('max range value maps near the top margin boundary', () => {
    // priceToY(20) should be close to topPx = 80
    expect(ps.priceToY(20)).toBeCloseTo(80);
  });

  it('min range value maps near the bottom margin boundary', () => {
    // priceToY(-10) should be close to height - 1 - bottomPx = 359
    expect(ps.priceToY(-10)).toBeCloseTo(359);
  });

  it('yToPrice is the inverse of priceToY (round-trip)', () => {
    const pcts = [-10, 0, 10, 20];
    for (const pct of pcts) {
      const y = ps.priceToY(pct);
      expect(ps.yToPrice(y)).toBeCloseTo(pct);
    }
  });

  it('comparison mode flag does not affect coordinate math (same formula)', () => {
    // The comparison mode flag is purely semantic — priceToY formula is identical.
    // A PriceScale without comparison mode set to the same range should produce identical results.
    const plainPs = new PriceScale('right');
    plainPs.setHeight(400);
    plainPs.setRange(-10, 20);
    // No setComparisonMode call — default false

    const testPcts = [-10, -5, 0, 5, 10, 20];
    for (const pct of testPcts) {
      expect(ps.priceToY(pct)).toBeCloseTo(plainPs.priceToY(pct));
      expect(ps.yToPrice(ps.priceToY(pct))).toBeCloseTo(pct);
    }
  });
});

describe('PriceScale — percent-space auto-scale scenario', () => {
  it('autoScale in percent space: -5% to +15% is stored as-is', () => {
    const ps = new PriceScale('right');
    ps.setHeight(400);
    ps.setComparisonMode(true);
    ps.autoScale(-5, 15);
    expect(ps.priceRange.min).toBe(-5);
    expect(ps.priceRange.max).toBe(15);
  });

  it('flat 0% range creates a symmetric window around 0', () => {
    const ps = new PriceScale('right');
    ps.setHeight(400);
    ps.setComparisonMode(true);
    ps.autoScale(0, 0);
    const { min, max } = ps.priceRange;
    expect(min).toBeLessThan(0);
    expect(max).toBeGreaterThan(0);
    expect((min + max) / 2).toBeCloseTo(0);
  });

  it('comparison mode does not break resetAutoScale', () => {
    const ps = new PriceScale('right');
    ps.setHeight(400);
    ps.setComparisonMode(true);
    ps.setRange(-20, 30);
    ps.resetAutoScale();
    ps.autoScale(-5, 10);
    expect(ps.priceRange.min).toBe(-5);
    expect(ps.priceRange.max).toBe(10);
  });
});
