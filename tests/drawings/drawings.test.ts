import { describe, it, expect } from 'vitest';
import {
  DRAWING_REGISTRY,
  createBuiltinDrawing,
  distToSegment,
  pointInRect,
  HIT_THRESHOLD,
} from '@/drawings/index';
import type { AnchorPoint, DrawingOptions, SerializedDrawing, DrawingContext } from '@/drawings/base';

// ─── Shared mock DrawingContext ───────────────────────────────────────────────

function makeMockContext(overrides?: Partial<DrawingContext>): DrawingContext {
  return {
    timeScale: { indexToX: (t: number) => t * 10 },
    priceScale: { priceToY: (p: number) => 500 - p },
    chartWidth: 800,
    chartHeight: 600,
    requestUpdate: () => {},
    ...overrides,
  } as unknown as DrawingContext;
}

function makeMockTarget() {
  const calls: string[] = [];
  const ctx2d = {
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => calls.push('stroke'),
    fill: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    setLineDash: () => {},
    arc: () => {},
    ellipse: () => {},
    closePath: () => {},
    measureText: () => ({ width: 50 }),
    fillText: () => {},
    textBaseline: 'alphabetic',
    font: '',
    arcTo: () => {},
  };
  return {
    target: { context: ctx2d, pixelRatio: 1, width: 800, height: 600 },
    calls,
    ctx2d,
  };
}

describe('DRAWING_REGISTRY', () => {
  it('has all 16 built-in drawing types', () => {
    expect(DRAWING_REGISTRY.size).toBe(16);
    expect(DRAWING_REGISTRY.has('horizontal-line')).toBe(true);
    expect(DRAWING_REGISTRY.has('vertical-line')).toBe(true);
    expect(DRAWING_REGISTRY.has('trendline')).toBe(true);
    expect(DRAWING_REGISTRY.has('fibonacci')).toBe(true);
    expect(DRAWING_REGISTRY.has('rectangle')).toBe(true);
    expect(DRAWING_REGISTRY.has('text-annotation')).toBe(true);
    expect(DRAWING_REGISTRY.has('ray')).toBe(true);
    expect(DRAWING_REGISTRY.has('arrow')).toBe(true);
    expect(DRAWING_REGISTRY.has('channel')).toBe(true);
    expect(DRAWING_REGISTRY.has('ellipse')).toBe(true);
    expect(DRAWING_REGISTRY.has('pitchfork')).toBe(true);
    expect(DRAWING_REGISTRY.has('fib-projection')).toBe(true);
    expect(DRAWING_REGISTRY.has('fib-arc')).toBe(true);
    expect(DRAWING_REGISTRY.has('fib-fan')).toBe(true);
    expect(DRAWING_REGISTRY.has('crossline')).toBe(true);
    expect(DRAWING_REGISTRY.has('measurement')).toBe(true);
  });
});

describe('createBuiltinDrawing', () => {
  it('creates a horizontal-line drawing', () => {
    const d = createBuiltinDrawing('horizontal-line', 'h1', [{ time: 100, price: 50 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('horizontal-line');
    expect(d!.requiredPoints).toBe(1);
  });

  it('creates a vertical-line drawing', () => {
    const d = createBuiltinDrawing('vertical-line', 'v1', [{ time: 100, price: 0 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('vertical-line');
    expect(d!.requiredPoints).toBe(1);
  });

  it('creates a trendline drawing', () => {
    const d = createBuiltinDrawing('trendline', 't1', [{ time: 1, price: 10 }, { time: 5, price: 20 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('trendline');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates a fibonacci drawing', () => {
    const d = createBuiltinDrawing('fibonacci', 'f1', [{ time: 1, price: 100 }, { time: 10, price: 200 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('fibonacci');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates a rectangle drawing', () => {
    const d = createBuiltinDrawing('rectangle', 'r1', [{ time: 1, price: 50 }, { time: 5, price: 100 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('rectangle');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates a text-annotation drawing', () => {
    const d = createBuiltinDrawing('text-annotation', 'ta1', [{ time: 5, price: 75 }], { text: 'Hello' });
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('text-annotation');
    expect(d!.requiredPoints).toBe(1);
  });

  it('creates a ray drawing', () => {
    const d = createBuiltinDrawing('ray', 'ray1', [{ time: 1, price: 10 }, { time: 5, price: 20 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('ray');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates an arrow drawing', () => {
    const d = createBuiltinDrawing('arrow', 'arr1', [{ time: 1, price: 10 }, { time: 5, price: 20 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('arrow');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates a channel drawing', () => {
    const d = createBuiltinDrawing('channel', 'ch1', [
      { time: 0, price: 100 }, { time: 10, price: 120 }, { time: 0, price: 90 },
    ], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('channel');
    expect(d!.requiredPoints).toBe(3);
  });

  it('creates an ellipse drawing', () => {
    const d = createBuiltinDrawing('ellipse', 'el1', [{ time: 1, price: 50 }, { time: 5, price: 100 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('ellipse');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates a pitchfork drawing', () => {
    const d = createBuiltinDrawing('pitchfork', 'pf1', [
      { time: 0, price: 100 }, { time: 5, price: 130 }, { time: 5, price: 70 },
    ], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('pitchfork');
    expect(d!.requiredPoints).toBe(3);
  });

  it('creates a fib-projection drawing', () => {
    const d = createBuiltinDrawing('fib-projection', 'fp1', [
      { time: 0, price: 100 }, { time: 5, price: 150 }, { time: 8, price: 120 },
    ], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('fib-projection');
    expect(d!.requiredPoints).toBe(3);
  });

  it('creates a fib-arc drawing', () => {
    const d = createBuiltinDrawing('fib-arc', 'fa1', [{ time: 1, price: 100 }, { time: 10, price: 200 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('fib-arc');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates a fib-fan drawing', () => {
    const d = createBuiltinDrawing('fib-fan', 'ff1', [{ time: 1, price: 100 }, { time: 10, price: 200 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('fib-fan');
    expect(d!.requiredPoints).toBe(2);
  });

  it('creates a crossline drawing', () => {
    const d = createBuiltinDrawing('crossline', 'cl1', [{ time: 5, price: 75 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('crossline');
    expect(d!.requiredPoints).toBe(1);
  });

  it('creates a measurement drawing', () => {
    const d = createBuiltinDrawing('measurement', 'm1', [{ time: 1, price: 100 }, { time: 10, price: 120 }], {});
    expect(d).not.toBeNull();
    expect(d!.drawingType).toBe('measurement');
    expect(d!.requiredPoints).toBe(2);
  });

  it('returns null for unknown types', () => {
    const d = createBuiltinDrawing('unknown-type', 'x1', [], {});
    expect(d).toBeNull();
  });
});

describe('serialize / deserialize round-trip', () => {
  it('round-trips a trendline', () => {
    const points: AnchorPoint[] = [{ time: 10, price: 100 }, { time: 20, price: 200 }];
    const options: DrawingOptions = { color: '#ff0000', lineWidth: 2, lineStyle: 'dashed' };
    const d = createBuiltinDrawing('trendline', 'tl1', points, options)!;
    const serialized = d.serialize();

    expect(serialized.type).toBe('trendline');
    expect(serialized.id).toBe('tl1');
    expect(serialized.points).toHaveLength(2);
    expect(serialized.points[0]).toEqual({ time: 10, price: 100 });
    expect(serialized.points[1]).toEqual({ time: 20, price: 200 });
    expect(serialized.options.color).toBe('#ff0000');
    expect(serialized.options.lineWidth).toBe(2);
    expect(serialized.options.lineStyle).toBe('dashed');

    // Re-create from serialized data
    const d2 = createBuiltinDrawing(serialized.type, serialized.id, serialized.points, serialized.options)!;
    expect(d2.drawingType).toBe('trendline');
    expect(d2.points).toEqual(points);

    // Verify original wasn't mutated via serialized reference
    serialized.points[0].price = 999;
    expect(d.points[0].price).toBe(100);
  });

  it('round-trips a text annotation with text and fontSize', () => {
    const d = createBuiltinDrawing('text-annotation', 'txt1', [{ time: 5, price: 50 }], {
      text: 'Support',
      fontSize: 16,
      color: '#00ff00',
    })!;
    const s = d.serialize();
    expect(s.options.text).toBe('Support');
    expect(s.options.fontSize).toBe(16);

    const d2 = createBuiltinDrawing(s.type, s.id, s.points, s.options)!;
    expect(d2.options.text).toBe('Support');
    expect(d2.options.fontSize).toBe(16);
  });

  it('round-trips a fibonacci', () => {
    const d = createBuiltinDrawing('fibonacci', 'fib1', [{ time: 0, price: 100 }, { time: 10, price: 200 }], { color: '#FF9800' })!;
    const s = d.serialize();
    const d2 = createBuiltinDrawing(s.type, s.id, s.points, s.options)!;
    expect(d2.drawingType).toBe('fibonacci');
    expect(d2.points).toEqual(d.points);
  });
});

describe('requiredPoints', () => {
  const expectedPoints: Record<string, number> = {
    'horizontal-line': 1,
    'vertical-line': 1,
    'trendline': 2,
    'fibonacci': 2,
    'rectangle': 2,
    'text-annotation': 1,
    'ray': 2,
    'arrow': 2,
    'channel': 3,
    'ellipse': 2,
    'pitchfork': 3,
    'fib-projection': 3,
    'fib-arc': 2,
    'fib-fan': 2,
    'crossline': 1,
    'measurement': 2,
  };

  for (const [type, expected] of Object.entries(expectedPoints)) {
    it(`${type} requires ${expected} point(s)`, () => {
      const pts = Array.from({ length: expected }, (_, i) => ({ time: i, price: i * 10 }));
      const d = createBuiltinDrawing(type, `test_${type}`, pts, {})!;
      expect(d.requiredPoints).toBe(expected);
    });
  }
});

// ─── distToSegment utility ────────────────────────────────────────────────────

describe('distToSegment (via index re-export)', () => {
  it('returns 0 for a point on the segment', () => {
    expect(distToSegment(5, 0, 0, 0, 10, 0)).toBeCloseTo(0);
  });

  it('returns perpendicular distance for interior projection', () => {
    expect(distToSegment(5, 3, 0, 0, 10, 0)).toBeCloseTo(3);
  });

  it('clamps to endpoint when beyond segment end', () => {
    expect(distToSegment(15, 0, 0, 0, 10, 0)).toBeCloseTo(5);
  });

  it('clamps to endpoint when before segment start', () => {
    expect(distToSegment(-3, 4, 0, 0, 10, 0)).toBeCloseTo(5); // hypot(3,4)=5
  });

  it('handles zero-length segment', () => {
    expect(distToSegment(3, 4, 5, 5, 5, 5)).toBeCloseTo(Math.hypot(3 - 5, 4 - 5));
  });
});

// ─── pointInRect utility ──────────────────────────────────────────────────────

describe('pointInRect (via index re-export)', () => {
  it('returns true for interior point', () => {
    expect(pointInRect(5, 5, 0, 0, 10, 10)).toBe(true);
  });

  it('returns false for exterior point', () => {
    expect(pointInRect(15, 5, 0, 0, 10, 10)).toBe(false);
  });

  it('returns true on edge', () => {
    expect(pointInRect(10, 5, 0, 0, 10, 10)).toBe(true);
  });

  it('handles inverted corner order', () => {
    expect(pointInRect(5, 5, 10, 10, 0, 0)).toBe(true);
    expect(pointInRect(15, 5, 10, 10, 0, 0)).toBe(false);
  });
});

// ─── HIT_THRESHOLD export ─────────────────────────────────────────────────────

describe('HIT_THRESHOLD export', () => {
  it('is a positive number', () => {
    expect(HIT_THRESHOLD).toBeGreaterThan(0);
  });
});

// ─── Context-based hit tests ──────────────────────────────────────────────────
// These cover the rendering / hit-test code paths that require a DrawingContext.

describe('horizontal-line hit-test with context', () => {
  // priceToY(100) = 500 - 100 = 400
  const mockCtx = makeMockContext();

  it('hits on the line y coordinate', () => {
    const d = createBuiltinDrawing('horizontal-line', 'hl-ctx', [{ time: 0, price: 100 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(50, 400);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('ns-resize');
  });

  it('misses when y is far from the line', () => {
    const d = createBuiltinDrawing('horizontal-line', 'hl-ctx2', [{ time: 0, price: 100 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(50, 300);
    expect(result).toBeNull();
  });

  it('paneViews returns a view when context is set', () => {
    const d = createBuiltinDrawing('horizontal-line', 'hl-pv', [{ time: 0, price: 100 }], {})!;
    (d as any).setContext(mockCtx);
    const views = d.paneViews();
    expect(views).toHaveLength(1);
  });

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('horizontal-line', 'hl-draw', [{ time: 0, price: 100 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws with selected=true without error', () => {
    const d = createBuiltinDrawing('horizontal-line', 'hl-sel', [{ time: 0, price: 100 }], {})!;
    (d as any).setContext(mockCtx);
    d.selected = true;
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('trendline hit-test with context', () => {
  // Point 0: time=0,price=100 -> x=0, y=400
  // Point 1: time=10,price=200 -> x=100, y=300
  const mockCtx = makeMockContext();

  it('hits on handle1 at point 0', () => {
    const d = createBuiltinDrawing('trendline', 'tl-ctx', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(0, 400);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hits on handle2 at point 1', () => {
    const d = createBuiltinDrawing('trendline', 'tl-ctx2', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(100, 300);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle2');
  });

  it('hits the body near midpoint', () => {
    const d = createBuiltinDrawing('trendline', 'tl-ctx3', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    // midpoint is (50, 350), hit exactly on the line
    const result = d.drawingHitTest(50, 350);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
  });

  it('misses when point is far from trendline', () => {
    const d = createBuiltinDrawing('trendline', 'tl-miss', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(50, 100);
    expect(result).toBeNull();
  });

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('trendline', 'tl-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws selected state without error', () => {
    const d = createBuiltinDrawing('trendline', 'tl-sel', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    d.selected = true;
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('rectangle hit-test and render with context', () => {
  const mockCtx = makeMockContext();

  it('hits inside the rectangle', () => {
    // x range: 0..100, y range: 400..300 (prices 100..200)
    const d = createBuiltinDrawing('rectangle', 'rect-ctx', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(50, 350);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('body');
    expect(result!.cursorStyle).toBe('move');
  });

  it('misses outside the rectangle', () => {
    const d = createBuiltinDrawing('rectangle', 'rect-miss', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(200, 350);
    expect(result).toBeNull();
  });

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('rectangle', 'rect-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws selected state without error', () => {
    const d = createBuiltinDrawing('rectangle', 'rect-sel', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    d.selected = true;
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('vertical-line hit-test and render with context', () => {
  const mockCtx = makeMockContext();

  it('hits at time x coordinate', () => {
    // time=5, x = 5*10 = 50
    const d = createBuiltinDrawing('vertical-line', 'vl-ctx', [{ time: 5, price: 0 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(50, 200);
    expect(result).not.toBeNull();
  });

  it('misses far from x coordinate', () => {
    const d = createBuiltinDrawing('vertical-line', 'vl-miss', [{ time: 5, price: 0 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(200, 200);
    expect(result).toBeNull();
  });

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('vertical-line', 'vl-draw', [{ time: 5, price: 0 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('fibonacci render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('fibonacci', 'fib-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws with showLabels=false without error', () => {
    const d = createBuiltinDrawing('fibonacci', 'fib-nolabels', [{ time: 0, price: 100 }, { time: 10, price: 200 }], { showLabels: false })!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('hit-test returns handle1 near first point', () => {
    const d = createBuiltinDrawing('fibonacci', 'fib-hit', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    // point0: x=0, y=400
    const result = d.drawingHitTest(0, 400);
    expect(result).not.toBeNull();
  });
});

describe('text-annotation hit-test and render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error when text is set', () => {
    const d = createBuiltinDrawing('text-annotation', 'ta-draw', [{ time: 5, price: 100 }], { text: 'Hello' })!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer skips drawing when text is empty', () => {
    const d = createBuiltinDrawing('text-annotation', 'ta-empty', [{ time: 5, price: 100 }], { text: '' })!;
    (d as any).setContext(mockCtx);
    const { target, calls } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    renderer!.draw(target as any);
    expect(calls).not.toContain('stroke');
  });

  it('renderer draws with fillColor without error', () => {
    const d = createBuiltinDrawing('text-annotation', 'ta-fill', [{ time: 5, price: 100 }], { text: 'Hi', fillColor: '#ff0000' })!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws selected state without error', () => {
    const d = createBuiltinDrawing('text-annotation', 'ta-sel', [{ time: 5, price: 100 }], { text: 'Test' })!;
    (d as any).setContext(mockCtx);
    d.selected = true;
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('ray render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('ray', 'ray-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('hit-test hits handle1', () => {
    const d = createBuiltinDrawing('ray', 'ray-hit', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(0, 400);
    expect(result).not.toBeNull();
  });
});

describe('arrow render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('arrow', 'arr-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws selected state without error', () => {
    const d = createBuiltinDrawing('arrow', 'arr-sel', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    d.selected = true;
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('channel render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('channel', 'ch-draw',
      [{ time: 0, price: 100 }, { time: 10, price: 120 }, { time: 0, price: 90 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('hit-test hits body near first segment', () => {
    const d = createBuiltinDrawing('channel', 'ch-hit',
      [{ time: 0, price: 100 }, { time: 10, price: 100 }, { time: 0, price: 90 }], {})!;
    (d as any).setContext(mockCtx);
    // Both points of top segment at y=400, x from 0 to 100
    const result = d.drawingHitTest(50, 400);
    expect(result).not.toBeNull();
  });
});

describe('ellipse render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('ellipse', 'el-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('pitchfork render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('pitchfork', 'pf-draw',
      [{ time: 0, price: 100 }, { time: 5, price: 130 }, { time: 5, price: 70 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('fib-projection render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('fib-projection', 'fp-draw',
      [{ time: 0, price: 100 }, { time: 5, price: 150 }, { time: 8, price: 120 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('fib-arc render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('fib-arc', 'fa-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });
});

describe('fib-fan render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('fib-fan', 'ff-draw', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws selected state without error', () => {
    const d = createBuiltinDrawing('fib-fan', 'ff-sel', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    d.selected = true;
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('hit-test returns handle1 near start point', () => {
    const d = createBuiltinDrawing('fib-fan', 'ff-hit', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(0, 400);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });
});

describe('crossline render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('crossline', 'cl-draw', [{ time: 5, price: 75 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('hit-test hits near crosshair', () => {
    // time=5, x=50; price=75, y=425
    const d = createBuiltinDrawing('crossline', 'cl-hit', [{ time: 5, price: 75 }], {})!;
    (d as any).setContext(mockCtx);
    const result = d.drawingHitTest(50, 300);
    // hits on vertical line at x=50
    expect(result).not.toBeNull();
  });
});

describe('measurement render with context', () => {
  const mockCtx = makeMockContext();

  it('renderer draws without error', () => {
    const d = createBuiltinDrawing('measurement', 'm-draw', [{ time: 1, price: 100 }, { time: 10, price: 120 }], {})!;
    (d as any).setContext(mockCtx);
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('renderer draws selected state without error', () => {
    const d = createBuiltinDrawing('measurement', 'm-sel', [{ time: 1, price: 100 }, { time: 10, price: 120 }], {})!;
    (d as any).setContext(mockCtx);
    d.selected = true;
    const { target } = makeMockTarget();
    const renderer = d.paneViews()[0].renderer();
    expect(() => renderer!.draw(target as any)).not.toThrow();
  });

  it('hit-test returns handle1 near first point', () => {
    const d = createBuiltinDrawing('measurement', 'm-hit', [{ time: 1, price: 100 }, { time: 10, price: 120 }], {})!;
    (d as any).setContext(mockCtx);
    // point0: x=10, y=400
    const result = d.drawingHitTest(10, 400);
    expect(result).not.toBeNull();
    expect(result!.part).toBe('handle1');
  });

  it('hit-test returns body on connector line', () => {
    const d = createBuiltinDrawing('measurement', 'm-body', [{ time: 0, price: 100 }, { time: 10, price: 100 }], {})!;
    (d as any).setContext(mockCtx);
    // Horizontal line at y=400 from x=0 to x=100; midpoint at (50, 400)
    const result = d.drawingHitTest(50, 400);
    expect(result).not.toBeNull();
  });
});

describe('BaseDrawing lifecycle methods', () => {
  it('paneViews returns empty when context is null', () => {
    const d = createBuiltinDrawing('trendline', 'pv-null', [{ time: 0, price: 100 }, { time: 10, price: 200 }], {})!;
    expect(d.paneViews()).toHaveLength(0);
  });

  it('attached() does not throw', () => {
    const d = createBuiltinDrawing('horizontal-line', 'attach', [{ time: 0, price: 100 }], {})!;
    expect(() => d.attached({ requestUpdate: () => {} })).not.toThrow();
  });

  it('detached() clears context', () => {
    const d = createBuiltinDrawing('horizontal-line', 'detach', [{ time: 0, price: 100 }], {})!;
    (d as any).setContext(makeMockContext());
    expect(d.paneViews()).toHaveLength(1);
    d.detached();
    expect(d.paneViews()).toHaveLength(0);
  });

  it('updateAllViews() does not throw', () => {
    const d = createBuiltinDrawing('horizontal-line', 'uav', [{ time: 0, price: 100 }], {})!;
    expect(() => d.updateAllViews()).not.toThrow();
  });

  it('hitTest() returns null without context', () => {
    const d = createBuiltinDrawing('horizontal-line', 'ht-null', [{ time: 0, price: 100 }], {})!;
    expect(d.hitTest(50, 400)).toBeNull();
  });

  it('hitTest() returns result with context on the line', () => {
    const d = createBuiltinDrawing('horizontal-line', 'ht-hit', [{ time: 0, price: 100 }], {})!;
    (d as any).setContext(makeMockContext());
    const result = d.hitTest(50, 400);
    expect(result).not.toBeNull();
    expect(result!.cursorStyle).toBe('ns-resize');
  });
});
