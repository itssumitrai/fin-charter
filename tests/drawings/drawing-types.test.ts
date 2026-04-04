/**
 * Comprehensive tests for all drawing types.
 *
 * Covers: creation, requiredPoints, points storage, options, hit testing
 * (with mock DrawingContext), paneViews, base utilities, and Fibonacci levels.
 */
import { describe, it, expect, vi } from 'vitest';

import { distToSegment, pointInRect, HIT_THRESHOLD } from '@/drawings/base';
import type { DrawingContext, AnchorPoint, DrawingOptions } from '@/drawings/base';
import { createBuiltinDrawing } from '@/drawings/index';

import { createHorizontalLine } from '@/drawings/horizontal-line';
import { createVerticalLine } from '@/drawings/vertical-line';
import { createTrendline } from '@/drawings/trendline';
import { createRectangle } from '@/drawings/rectangle';
import { createFibonacci } from '@/drawings/fibonacci';
import { createArrow } from '@/drawings/arrow';
import { createChannel } from '@/drawings/channel';
import { createEllipse } from '@/drawings/ellipse';
import { createPitchfork } from '@/drawings/pitchfork';
import { createCrossline } from '@/drawings/crossline';
import { createMeasurement } from '@/drawings/measurement';
import { createFibArc } from '@/drawings/fib-arc';
import { createFibFan } from '@/drawings/fib-fan';
import { createFibProjection } from '@/drawings/fib-projection';
import { createRay } from '@/drawings/ray';
import { createTextAnnotation } from '@/drawings/text-annotation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pt = (time: number, price: number): AnchorPoint => ({ time, price });

/**
 * Creates a mock DrawingContext where indexToX returns time directly
 * and priceToY returns price directly (identity mapping).
 */
function mockContext(width = 800, height = 600): DrawingContext {
  return {
    timeScale: { indexToX: (t: number) => t } as any,
    priceScale: { priceToY: (p: number) => p } as any,
    chartWidth: width,
    chartHeight: height,
    requestUpdate: vi.fn(),
  };
}

// ─── Base utilities ──────────────────────────────────────────────────────────

describe('distToSegment (extended)', () => {
  it('returns 0 for segment start point', () => {
    expect(distToSegment(0, 0, 0, 0, 10, 0)).toBeCloseTo(0);
  });

  it('returns 0 for segment end point', () => {
    expect(distToSegment(10, 0, 0, 0, 10, 0)).toBeCloseTo(0);
  });

  it('returns perpendicular distance for point beside a vertical segment', () => {
    // Vertical segment (5,0)-(5,10), point at (8,5) is 3 units away
    expect(distToSegment(8, 5, 5, 0, 5, 10)).toBeCloseTo(3);
  });

  it('returns distance to nearest endpoint for collinear point beyond segment', () => {
    // Point (20, 0) beyond end of (0,0)-(10,0)
    expect(distToSegment(20, 0, 0, 0, 10, 0)).toBeCloseTo(10);
  });

  it('handles negative coordinates', () => {
    expect(distToSegment(-5, 0, 0, 0, 10, 0)).toBeCloseTo(5);
  });
});

describe('pointInRect (extended)', () => {
  it('returns true at corner', () => {
    expect(pointInRect(0, 0, 0, 0, 10, 10)).toBe(true);
  });

  it('returns true at opposite corner', () => {
    expect(pointInRect(10, 10, 0, 0, 10, 10)).toBe(true);
  });

  it('returns false for point above rect', () => {
    expect(pointInRect(5, -1, 0, 0, 10, 10)).toBe(false);
  });

  it('returns false for point below rect', () => {
    expect(pointInRect(5, 11, 0, 0, 10, 10)).toBe(false);
  });

  it('handles zero-area rect (degenerate)', () => {
    expect(pointInRect(5, 5, 5, 5, 5, 5)).toBe(true);
    expect(pointInRect(6, 5, 5, 5, 5, 5)).toBe(false);
  });
});

// ─── HorizontalLineDrawing ──────────────────────────────────────────────────

describe('HorizontalLineDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createHorizontalLine('h1', [pt(10, 50)], {});
    expect(d.drawingType).toBe('horizontal-line');
    expect(d.requiredPoints).toBe(1);
  });

  it('stores points correctly', () => {
    const d = createHorizontalLine('h2', [pt(10, 50)], {});
    expect(d.points).toEqual([{ time: 10, price: 50 }]);
  });

  it('applies default options', () => {
    const d = createHorizontalLine('h3', [pt(10, 50)], {});
    expect(d.options.color).toBe('#2196F3');
    expect(d.options.lineWidth).toBe(1);
    expect(d.options.lineStyle).toBe('solid');
  });

  it('applies custom options', () => {
    const d = createHorizontalLine('h4', [pt(10, 50)], { color: '#ff0000', lineWidth: 3 });
    expect(d.options.color).toBe('#ff0000');
    expect(d.options.lineWidth).toBe(3);
  });

  it('hit tests near the line', () => {
    const d = createHorizontalLine('h5', [pt(10, 50)], {});
    d.setContext(mockContext());
    // y=50 is the line, test at y=52 (within HIT_THRESHOLD=6)
    const result = d.drawingHitTest(100, 52);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('ns-resize');
  });

  it('hit test misses far from the line', () => {
    const d = createHorizontalLine('h6', [pt(10, 50)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(100, 100);
    expect(result).toBeNull();
  });

  it('returns null hit-test without context', () => {
    const d = createHorizontalLine('h7', [pt(10, 50)], {});
    expect(d.drawingHitTest(100, 50)).toBeNull();
  });

  it('paneViews returns a view when context is set', () => {
    const d = createHorizontalLine('h8', [pt(10, 50)], {});
    d.setContext(mockContext());
    const views = d.paneViews();
    expect(views).toHaveLength(1);
    expect(views[0].renderer()).not.toBeNull();
  });

  it('paneViews returns empty without context', () => {
    const d = createHorizontalLine('h9', [pt(10, 50)], {});
    expect(d.paneViews()).toHaveLength(0);
  });
});

// ─── VerticalLineDrawing ─────────────────────────────────────────────────────

describe('VerticalLineDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createVerticalLine('v1', [pt(50, 0)], {});
    expect(d.drawingType).toBe('vertical-line');
    expect(d.requiredPoints).toBe(1);
  });

  it('stores points correctly', () => {
    const d = createVerticalLine('v2', [pt(50, 0)], {});
    expect(d.points).toEqual([{ time: 50, price: 0 }]);
  });

  it('applies custom options', () => {
    const d = createVerticalLine('v3', [pt(50, 0)], { color: '#00ff00', lineStyle: 'dashed' });
    expect(d.options.color).toBe('#00ff00');
    expect(d.options.lineStyle).toBe('dashed');
  });

  it('hit tests near the line', () => {
    const d = createVerticalLine('v4', [pt(50, 0)], {});
    d.setContext(mockContext());
    // x=50 is the line, test at x=53 (within threshold)
    const result = d.drawingHitTest(53, 100);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('ew-resize');
  });

  it('hit test misses far from the line', () => {
    const d = createVerticalLine('v5', [pt(50, 0)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(100, 100)).toBeNull();
  });

  it('paneViews returns a view when context is set', () => {
    const d = createVerticalLine('v6', [pt(50, 0)], {});
    d.setContext(mockContext());
    const views = d.paneViews();
    expect(views).toHaveLength(1);
    expect(views[0].renderer()).not.toBeNull();
  });
});

// ─── TrendlineDrawing ────────────────────────────────────────────────────────

describe('TrendlineDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createTrendline('t1', [pt(0, 0), pt(100, 100)], {});
    expect(d.drawingType).toBe('trendline');
    expect(d.requiredPoints).toBe(2);
  });

  it('stores both points', () => {
    const d = createTrendline('t2', [pt(10, 20), pt(30, 40)], {});
    expect(d.points).toHaveLength(2);
    expect(d.points[0]).toEqual({ time: 10, price: 20 });
    expect(d.points[1]).toEqual({ time: 30, price: 40 });
  });

  it('hit tests handle1 (near first endpoint)', () => {
    const d = createTrendline('t3', [pt(10, 10), pt(100, 100)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(12, 12);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
    expect(result!.cursorStyle).toBe('grab');
  });

  it('hit tests handle2 (near second endpoint)', () => {
    const d = createTrendline('t4', [pt(10, 10), pt(100, 100)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 102);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
    expect(result!.cursorStyle).toBe('grab');
  });

  it('hit tests body (near the segment midpoint)', () => {
    const d = createTrendline('t5', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    // Point (50, 3) is 3 units from the horizontal segment, within threshold
    const result = d.drawingHitTest(50, 3);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('move');
  });

  it('hit test misses far from the segment', () => {
    const d = createTrendline('t6', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null with insufficient points', () => {
    const d = createTrendline('t7', [pt(0, 0)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(0, 0)).toBeNull();
  });

  it('paneViews returns a view with context and 2 points', () => {
    const d = createTrendline('t8', [pt(0, 0), pt(100, 100)], {});
    d.setContext(mockContext());
    const views = d.paneViews();
    expect(views).toHaveLength(1);
    expect(views[0].renderer()).not.toBeNull();
  });
});

// ─── RectangleDrawing ────────────────────────────────────────────────────────

describe('RectangleDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createRectangle('r1', [pt(10, 10), pt(50, 50)], {});
    expect(d.drawingType).toBe('rectangle');
    expect(d.requiredPoints).toBe(2);
  });

  it('hit tests inside the rectangle', () => {
    const d = createRectangle('r2', [pt(10, 10), pt(50, 50)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(30, 30);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('move');
  });

  it('hit tests on the edge', () => {
    const d = createRectangle('r3', [pt(10, 10), pt(50, 50)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(10, 30)).not.toBeNull();
  });

  it('hit test misses outside the rectangle', () => {
    const d = createRectangle('r4', [pt(10, 10), pt(50, 50)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(5, 30)).toBeNull();
  });

  it('handles inverted points (p2 before p1)', () => {
    const d = createRectangle('r5', [pt(50, 50), pt(10, 10)], {});
    d.setContext(mockContext());
    // pointInRect normalizes min/max
    expect(d.drawingHitTest(30, 30)).not.toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createRectangle('r6', [pt(10, 10), pt(50, 50)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── FibonacciDrawing ────────────────────────────────────────────────────────

describe('FibonacciDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createFibonacci('f1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('fibonacci');
    expect(d.requiredPoints).toBe(2);
  });

  it('has the expected 7 fibonacci levels', () => {
    const expectedLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
    // With identity mapping: p1=100, p2=200, levels at 100 + (200-100)*ratio
    const d = createFibonacci('f2', [pt(0, 100), pt(10, 200)], {});
    d.setContext(mockContext());

    // Each level Y = 100 + 100*ratio
    for (const ratio of expectedLevels) {
      const levelY = 100 + 100 * ratio;
      const result = d.drawingHitTest(50, levelY);
      expect(result).not.toBeNull();
      expect(result!.part).toBe('body');
    }
  });

  it('hit test misses between levels', () => {
    // Levels at 100, 123.6, 138.2, 150, 161.8, 178.6, 200
    // 110 is well between 100 and 123.6 (more than 6px from both)
    const d = createFibonacci('f3', [pt(0, 100), pt(10, 200)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 110)).toBeNull();
  });

  it('returns null without context', () => {
    const d = createFibonacci('f4', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingHitTest(50, 100)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createFibonacci('f5', [pt(0, 100), pt(10, 200)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
    expect(d.paneViews()[0].renderer()).not.toBeNull();
  });
});

// ─── ArrowDrawing ────────────────────────────────────────────────────────────

describe('ArrowDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createArrow('a1', [pt(0, 0), pt(100, 0)], {});
    expect(d.drawingType).toBe('arrow');
    expect(d.requiredPoints).toBe(2);
  });

  it('stores points correctly', () => {
    const d = createArrow('a2', [pt(5, 10), pt(50, 80)], {});
    expect(d.points).toEqual([{ time: 5, price: 10 }, { time: 50, price: 80 }]);
  });

  it('hit tests handle1', () => {
    const d = createArrow('a3', [pt(10, 10), pt(100, 100)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(12, 12);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createArrow('a4', [pt(10, 10), pt(100, 100)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 102);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hit tests body along the segment', () => {
    const d = createArrow('a5', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(50, 3);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses far from the arrow', () => {
    const d = createArrow('a6', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createArrow('a7', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── ChannelDrawing ──────────────────────────────────────────────────────────

describe('ChannelDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createChannel('ch1', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    expect(d.drawingType).toBe('channel');
    expect(d.requiredPoints).toBe(3);
  });

  it('stores all 3 points', () => {
    const d = createChannel('ch2', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    expect(d.points).toHaveLength(3);
  });

  it('hit tests handle1', () => {
    const d = createChannel('ch3', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(2, 102);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createChannel('ch4', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 122);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hit tests handle3', () => {
    const d = createChannel('ch5', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(2, 82);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle3');
  });

  it('hit tests body on first line segment', () => {
    // First line: (0,100)-(100,120), midpoint is roughly (50, 110)
    const d = createChannel('ch6', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(50, 110);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('hit tests body on second (offset) line segment', () => {
    // Offset vector = p3 - p1 = (0,80)-(0,100) = (0,-20)
    // Second line: (0+0,100-20)-(100+0,120-20) = (0,80)-(100,100)
    // Midpoint ~ (50, 90)
    const d = createChannel('ch7', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(50, 90);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses far from both lines', () => {
    const d = createChannel('ch8', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 200)).toBeNull();
  });

  it('returns null with insufficient points', () => {
    const d = createChannel('ch9', [pt(0, 100), pt(100, 120)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 110)).toBeNull();
  });

  it('paneViews returns a view with context and 3 points', () => {
    const d = createChannel('ch10', [pt(0, 100), pt(100, 120), pt(0, 80)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── EllipseDrawing ──────────────────────────────────────────────────────────

describe('EllipseDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createEllipse('e1', [pt(0, 0), pt(100, 50)], {});
    expect(d.drawingType).toBe('ellipse');
    expect(d.requiredPoints).toBe(2);
  });

  it('hit tests inside the ellipse (center)', () => {
    // Ellipse defined by (0,0)-(100,50): center (50,25), rx=50, ry=25
    const d = createEllipse('e2', [pt(0, 0), pt(100, 50)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(50, 25);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('hit tests handle1', () => {
    const d = createEllipse('e3', [pt(0, 0), pt(100, 50)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(2, 2);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createEllipse('e4', [pt(0, 0), pt(100, 50)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 52);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('misses far outside the ellipse', () => {
    const d = createEllipse('e5', [pt(0, 0), pt(100, 50)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(200, 200)).toBeNull();
  });

  it('returns null when radii are too small', () => {
    // Same point for both corners -> rx=0, ry=0 -> returns null (rx < 1)
    const d = createEllipse('e6', [pt(50, 50), pt(50, 50)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createEllipse('e7', [pt(0, 0), pt(100, 50)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── PitchforkDrawing ────────────────────────────────────────────────────────

describe('PitchforkDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createPitchfork('pf1', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    expect(d.drawingType).toBe('pitchfork');
    expect(d.requiredPoints).toBe(3);
  });

  it('stores 3 points', () => {
    const d = createPitchfork('pf2', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    expect(d.points).toHaveLength(3);
  });

  it('hit tests handle1 (pivot)', () => {
    const d = createPitchfork('pf3', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(2, 102);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createPitchfork('pf4', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(12, 132);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hit tests handle3', () => {
    const d = createPitchfork('pf5', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(12, 72);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle3');
  });

  it('hit tests median line body', () => {
    // Pivot (0,100), midpoint of p2/p3 = (10,100), median goes (0,100)-(20,100)
    const d = createPitchfork('pf6', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    d.setContext(mockContext());
    // Point (15, 100) should be on the median line
    const result = d.drawingHitTest(15, 100);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses far from all tines', () => {
    const d = createPitchfork('pf7', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(200, 300)).toBeNull();
  });

  it('returns null with insufficient points', () => {
    const d = createPitchfork('pf8', [pt(0, 100), pt(10, 130)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(5, 100)).toBeNull();
  });

  it('paneViews returns a view with context and 3 points', () => {
    const d = createPitchfork('pf9', [pt(0, 100), pt(10, 130), pt(10, 70)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── CrosslineDrawing ────────────────────────────────────────────────────────

describe('CrosslineDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createCrossline('cl1', [pt(50, 50)], {});
    expect(d.drawingType).toBe('crossline');
    expect(d.requiredPoints).toBe(1);
  });

  it('hit tests handle at center', () => {
    const d = createCrossline('cl2', [pt(50, 50)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(52, 52);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
    expect(result!.cursorStyle).toBe('grab');
  });

  it('hit tests horizontal line', () => {
    const d = createCrossline('cl3', [pt(50, 50)], {});
    d.setContext(mockContext());
    // Far from center on x-axis but near y=50
    const result = d.drawingHitTest(300, 53);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('ns-resize');
  });

  it('hit tests vertical line', () => {
    const d = createCrossline('cl4', [pt(50, 50)], {});
    d.setContext(mockContext());
    // Far from center on y-axis but near x=50
    const result = d.drawingHitTest(53, 300);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('ew-resize');
  });

  it('misses far from both lines', () => {
    const d = createCrossline('cl5', [pt(50, 50)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(200, 200)).toBeNull();
  });

  it('returns null with empty points', () => {
    const d = createCrossline('cl6', [], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createCrossline('cl7', [pt(50, 50)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── MeasurementDrawing ──────────────────────────────────────────────────────

describe('MeasurementDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createMeasurement('m1', [pt(0, 100), pt(10, 120)], {});
    expect(d.drawingType).toBe('measurement');
    expect(d.requiredPoints).toBe(2);
  });

  it('hit tests handle1', () => {
    const d = createMeasurement('m2', [pt(10, 100), pt(100, 200)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(12, 102);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createMeasurement('m3', [pt(10, 100), pt(100, 200)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 202);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hit tests body along the connector line', () => {
    const d = createMeasurement('m4', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(50, 3);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('hit tests label area at midpoint', () => {
    const d = createMeasurement('m5', [pt(0, 100), pt(200, 100)], {});
    d.setContext(mockContext());
    // Midpoint is (100, 100), label area is (100-60, 100-28) to (100+60, 100)
    const result = d.drawingHitTest(100, 80);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses far from everything', () => {
    const d = createMeasurement('m6', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 100)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createMeasurement('m7', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── FibArcDrawing ───────────────────────────────────────────────────────────

describe('FibArcDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createFibArc('fa1', [pt(0, 0), pt(100, 0)], {});
    expect(d.drawingType).toBe('fib-arc');
    expect(d.requiredPoints).toBe(2);
  });

  it('applies custom color', () => {
    const d = createFibArc('fa2', [pt(0, 0), pt(100, 0)], { color: '#FF9800' });
    expect(d.options.color).toBe('#FF9800');
  });

  it('hit tests handle1', () => {
    const d = createFibArc('fa3', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(2, 2);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createFibArc('fa4', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 2);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hit tests arc body at the correct radius', () => {
    // Total distance = 100. Arc at 0.5 ratio has radius = 50
    // Center is at p2 = (100, 0). A point at distance ~50 from center should hit.
    const d = createFibArc('fa5', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    // Point (50, 0) is 50 units from (100,0), matches 0.5 ratio
    const result = d.drawingHitTest(50, 0);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses between arc radii', () => {
    // Arcs at 0.236*100=23.6, 0.382*100=38.2, 0.5*100=50, 0.618*100=61.8
    // Point at distance 30 from (100,0): (70, 0) -> dist=30, between 23.6 and 38.2
    const d = createFibArc('fa6', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(70, 0)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createFibArc('fa7', [pt(0, 0), pt(100, 0)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── FibFanDrawing ───────────────────────────────────────────────────────────

describe('FibFanDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createFibFan('ff1', [pt(0, 0), pt(100, 100)], {});
    expect(d.drawingType).toBe('fib-fan');
    expect(d.requiredPoints).toBe(2);
  });

  it('hit tests handle1', () => {
    const d = createFibFan('ff2', [pt(0, 0), pt(100, 100)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(2, 2);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createFibFan('ff3', [pt(0, 0), pt(100, 100)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 102);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hit tests body on a fan line', () => {
    // Fan from (0,0) to (100,100). 0.5 ratio line goes to y = 0 + (100-0)*0.5 = 50 at x=100
    // So the line goes from (0,0) toward (100, 50), extending to chart edge
    // At x=50, y should be 25
    const d = createFibFan('ff4', [pt(0, 0), pt(100, 100)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(50, 25);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses far from fan lines', () => {
    const d = createFibFan('ff5', [pt(0, 0), pt(100, 100)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(400, 400)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createFibFan('ff6', [pt(0, 0), pt(100, 100)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── FibProjectionDrawing ────────────────────────────────────────────────────

describe('FibProjectionDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createFibProjection('fp1', [pt(0, 100), pt(5, 200), pt(8, 150)], {});
    expect(d.drawingType).toBe('fib-projection');
    expect(d.requiredPoints).toBe(3);
  });

  it('has 5 projection levels (0, 0.618, 1, 1.618, 2.618)', () => {
    // move = p2.price - p1.price = 200 - 100 = 100
    // levelY = priceToY(p3.price + move * ratio) = 150 + 100 * ratio (identity)
    // Levels: 150, 211.8, 250, 311.8, 411.8
    const d = createFibProjection('fp2', [pt(0, 100), pt(5, 200), pt(8, 150)], {});
    d.setContext(mockContext());

    const expectedLevelYs = [150, 211.8, 250, 311.8, 411.8];
    for (const ly of expectedLevelYs) {
      const result = d.drawingHitTest(50, ly);
      expect(result).not.toBeNull();
      expect(result!.part).toBe('body');
    }
  });

  it('misses between projection levels', () => {
    const d = createFibProjection('fp3', [pt(0, 100), pt(5, 200), pt(8, 150)], {});
    d.setContext(mockContext());
    // 180 is between 150 and 211.8
    expect(d.drawingHitTest(50, 180)).toBeNull();
  });

  it('returns null with insufficient points', () => {
    const d = createFibProjection('fp4', [pt(0, 100), pt(5, 200)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 150)).toBeNull();
  });

  it('paneViews returns a view with context and 3 points', () => {
    const d = createFibProjection('fp5', [pt(0, 100), pt(5, 200), pt(8, 150)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── RayDrawing ──────────────────────────────────────────────────────────────

describe('RayDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createRay('r1', [pt(0, 0), pt(50, 0)], {});
    expect(d.drawingType).toBe('ray');
    expect(d.requiredPoints).toBe(2);
  });

  it('hit tests handle1', () => {
    const d = createRay('r2', [pt(10, 10), pt(100, 10)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(12, 12);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit tests handle2', () => {
    const d = createRay('r3', [pt(10, 10), pt(100, 10)], {});
    d.setContext(mockContext());
    const result = d.drawingHitTest(102, 12);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hit tests body beyond the second point (ray extends)', () => {
    // Ray from (10,10) through (100,10) extends to chart edge at (800,10)
    const d = createRay('r4', [pt(10, 10), pt(100, 10)], {});
    d.setContext(mockContext());
    // Test at x=400, which is beyond p2 but on the ray extension
    const result = d.drawingHitTest(400, 13);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses far from the ray', () => {
    const d = createRay('r5', [pt(10, 10), pt(100, 10)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(50, 100)).toBeNull();
  });

  it('returns null with insufficient points', () => {
    const d = createRay('r6', [pt(10, 10)], {});
    d.setContext(mockContext());
    expect(d.drawingHitTest(10, 10)).toBeNull();
  });

  it('paneViews returns a view with context', () => {
    const d = createRay('r7', [pt(10, 10), pt(100, 10)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── TextAnnotationDrawing ───────────────────────────────────────────────────

describe('TextAnnotationDrawing', () => {
  it('creates with correct type and requiredPoints', () => {
    const d = createTextAnnotation('ta1', [pt(50, 50)], { text: 'Test' });
    expect(d.drawingType).toBe('text-annotation');
    expect(d.requiredPoints).toBe(1);
  });

  it('stores text in options', () => {
    const d = createTextAnnotation('ta2', [pt(50, 50)], { text: 'Support' });
    expect(d.options.text).toBe('Support');
  });

  it('applies default fontSize', () => {
    const d = createTextAnnotation('ta3', [pt(50, 50)], { text: 'X' });
    expect(d.options.fontSize).toBe(14);
  });

  it('applies custom fontSize', () => {
    const d = createTextAnnotation('ta4', [pt(50, 50)], { text: 'X', fontSize: 20 });
    expect(d.options.fontSize).toBe(20);
  });

  it('returns null hit-test without context (no bbox cached)', () => {
    const d = createTextAnnotation('ta5', [pt(50, 50)], { text: 'Test' });
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('paneViews returns empty without context', () => {
    const d = createTextAnnotation('ta6', [pt(50, 50)], { text: 'Test' });
    expect(d.paneViews()).toHaveLength(0);
  });

  it('paneViews returns a view with context', () => {
    const d = createTextAnnotation('ta7', [pt(50, 50)], { text: 'Test' });
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
  });
});

// ─── BaseDrawing shared behavior ─────────────────────────────────────────────

describe('BaseDrawing shared behavior', () => {
  it('selected defaults to false', () => {
    const d = createTrendline('sel1', [pt(0, 0), pt(100, 100)], {});
    expect(d.selected).toBe(false);
  });

  it('selected can be set to true', () => {
    const d = createTrendline('sel2', [pt(0, 0), pt(100, 100)], {});
    d.selected = true;
    expect(d.selected).toBe(true);
  });

  it('serialize returns a deep copy of points', () => {
    const d = createTrendline('ser1', [pt(10, 20), pt(30, 40)], {});
    const s = d.serialize();
    s.points[0].price = 999;
    expect(d.points[0].price).toBe(20);
  });

  it('serialize includes type and id', () => {
    const d = createRectangle('ser2', [pt(0, 0), pt(10, 10)], { color: '#abc' });
    const s = d.serialize();
    expect(s.type).toBe('rectangle');
    expect(s.id).toBe('ser2');
    expect(s.options.color).toBe('#abc');
  });

  it('detached clears context', () => {
    const d = createHorizontalLine('det1', [pt(0, 50)], {});
    d.setContext(mockContext());
    expect(d.paneViews()).toHaveLength(1);
    d.detached();
    expect(d.paneViews()).toHaveLength(0);
  });

  it('hitTest delegates to _hitTestDrawing and returns PrimitiveHitTestResult', () => {
    const d = createHorizontalLine('ht1', [pt(0, 50)], {});
    d.setContext(mockContext());
    const result = d.hitTest(100, 50);
    expect(result).not.toBeNull();
    expect(result!.cursorStyle).toBe('ns-resize');
    expect(result!.externalId).toBe('ht1');
  });

  it('hitTest returns null when _hitTestDrawing returns null', () => {
    const d = createHorizontalLine('ht2', [pt(0, 50)], {});
    d.setContext(mockContext());
    expect(d.hitTest(100, 200)).toBeNull();
  });
});

// ─── Factory via createBuiltinDrawing ────────────────────────────────────────

describe('createBuiltinDrawing factory', () => {
  const cases: Array<{ type: string; points: AnchorPoint[]; expectedReq: number }> = [
    { type: 'horizontal-line', points: [pt(0, 50)], expectedReq: 1 },
    { type: 'vertical-line', points: [pt(50, 0)], expectedReq: 1 },
    { type: 'trendline', points: [pt(0, 0), pt(10, 10)], expectedReq: 2 },
    { type: 'rectangle', points: [pt(0, 0), pt(10, 10)], expectedReq: 2 },
    { type: 'fibonacci', points: [pt(0, 100), pt(10, 200)], expectedReq: 2 },
    { type: 'arrow', points: [pt(0, 0), pt(10, 10)], expectedReq: 2 },
    { type: 'channel', points: [pt(0, 0), pt(10, 10), pt(0, -10)], expectedReq: 3 },
    { type: 'ellipse', points: [pt(0, 0), pt(10, 10)], expectedReq: 2 },
    { type: 'pitchfork', points: [pt(0, 0), pt(10, 10), pt(10, -10)], expectedReq: 3 },
    { type: 'crossline', points: [pt(50, 50)], expectedReq: 1 },
    { type: 'measurement', points: [pt(0, 100), pt(10, 120)], expectedReq: 2 },
    { type: 'fib-arc', points: [pt(0, 0), pt(100, 0)], expectedReq: 2 },
    { type: 'fib-fan', points: [pt(0, 0), pt(100, 100)], expectedReq: 2 },
    { type: 'fib-projection', points: [pt(0, 100), pt(5, 200), pt(8, 150)], expectedReq: 3 },
    { type: 'ray', points: [pt(0, 0), pt(10, 10)], expectedReq: 2 },
    { type: 'text-annotation', points: [pt(50, 50)], expectedReq: 1 },
  ];

  for (const { type, points, expectedReq } of cases) {
    it(`creates ${type} with correct drawingType and requiredPoints`, () => {
      const d = createBuiltinDrawing(type, `test_${type}`, points, {});
      expect(d).not.toBeNull();
      expect(d!.drawingType).toBe(type);
      expect(d!.requiredPoints).toBe(expectedReq);
    });

    it(`${type} stores points correctly`, () => {
      const d = createBuiltinDrawing(type, `pts_${type}`, points, {})!;
      expect(d.points).toHaveLength(points.length);
      for (let i = 0; i < points.length; i++) {
        expect(d.points[i]).toEqual(points[i]);
      }
    });

    it(`${type} applies custom color and lineWidth`, () => {
      const opts: DrawingOptions = { color: '#abcdef', lineWidth: 3 };
      const d = createBuiltinDrawing(type, `opt_${type}`, points, opts)!;
      expect(d.options.color).toBe('#abcdef');
      expect(d.options.lineWidth).toBe(3);
    });
  }

  it('returns null for unknown types', () => {
    expect(createBuiltinDrawing('nonexistent', 'x', [], {})).toBeNull();
  });
});
