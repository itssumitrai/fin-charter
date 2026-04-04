import { describe, it, expect } from 'vitest';
import { distToSegment, pointInRect } from '@/drawings/base';

describe('distToSegment', () => {
  it('returns ~0 for a point lying on the segment', () => {
    // midpoint of (0,0)-(10,0) is (5,0)
    expect(distToSegment(5, 0, 0, 0, 10, 0)).toBeCloseTo(0, 10);
  });

  it('returns correct distance for a point near the middle of a segment', () => {
    // Point (5, 3) is 3 units above (5, 0) on segment (0,0)-(10,0)
    expect(distToSegment(5, 3, 0, 0, 10, 0)).toBeCloseTo(3, 10);
  });

  it('returns endpoint distance when point is beyond the segment', () => {
    // Point (15, 0) is 5 units past the end of (0,0)-(10,0)
    expect(distToSegment(15, 0, 0, 0, 10, 0)).toBeCloseTo(5, 10);
  });

  it('returns endpoint distance when point is before the segment start', () => {
    expect(distToSegment(-3, 4, 0, 0, 10, 0)).toBeCloseTo(5, 10); // hypot(3, 4) = 5
  });

  it('handles zero-length segment (both endpoints identical)', () => {
    expect(distToSegment(3, 4, 5, 5, 5, 5)).toBeCloseTo(Math.hypot(3 - 5, 4 - 5), 10);
  });

  it('works with diagonal segments', () => {
    // Segment (0,0)-(10,10), point (0,10). Closest point on line is (5,5), dist = hypot(5,5) ≈ 7.07
    expect(distToSegment(0, 10, 0, 0, 10, 10)).toBeCloseTo(Math.SQRT2 * 5, 5);
  });
});

describe('pointInRect', () => {
  it('returns true for a point inside the rect', () => {
    expect(pointInRect(5, 5, 0, 0, 10, 10)).toBe(true);
  });

  it('returns false for a point outside the rect', () => {
    expect(pointInRect(15, 5, 0, 0, 10, 10)).toBe(false);
  });

  it('returns true for a point on the edge', () => {
    expect(pointInRect(10, 5, 0, 0, 10, 10)).toBe(true);
  });

  it('handles inverted coordinates (x2 < x1, y2 < y1)', () => {
    expect(pointInRect(5, 5, 10, 10, 0, 0)).toBe(true);
    expect(pointInRect(15, 5, 10, 10, 0, 0)).toBe(false);
  });

  it('returns false for a point just outside', () => {
    expect(pointInRect(-0.01, 5, 0, 0, 10, 10)).toBe(false);
  });
});
