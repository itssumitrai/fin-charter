import { describe, it, expect } from 'vitest';
import {
  DRAWING_REGISTRY,
  createBuiltinDrawing,
} from '@/drawings/index';
import type { AnchorPoint, DrawingOptions, SerializedDrawing } from '@/drawings/base';

describe('DRAWING_REGISTRY', () => {
  it('has all 6 built-in drawing types', () => {
    expect(DRAWING_REGISTRY.size).toBe(6);
    expect(DRAWING_REGISTRY.has('horizontal-line')).toBe(true);
    expect(DRAWING_REGISTRY.has('vertical-line')).toBe(true);
    expect(DRAWING_REGISTRY.has('trendline')).toBe(true);
    expect(DRAWING_REGISTRY.has('fibonacci')).toBe(true);
    expect(DRAWING_REGISTRY.has('rectangle')).toBe(true);
    expect(DRAWING_REGISTRY.has('text-annotation')).toBe(true);
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
  };

  for (const [type, expected] of Object.entries(expectedPoints)) {
    it(`${type} requires ${expected} point(s)`, () => {
      const pts = Array.from({ length: expected }, (_, i) => ({ time: i, price: i * 10 }));
      const d = createBuiltinDrawing(type, `test_${type}`, pts, {})!;
      expect(d.requiredPoints).toBe(expected);
    });
  }
});
