/**
 * Tests for the 5 new drawing tools (batch 2).
 * Covers: drawingType, requiredPoints, serialize(), and null-context hit-test.
 */
import { describe, it, expect } from 'vitest';

import { createExtendedLine } from '@/drawings/extended-line';
import { createTriangle } from '@/drawings/triangle';
import { createRegressionChannel } from '@/drawings/regression-channel';
import { createBrush } from '@/drawings/brush';
import { createCycleLines } from '@/drawings/cycle-lines';

const pt = (time: number, price: number) => ({ time, price });

// ─── ExtendedLine ────────────────────────────────────────────────────────────

describe('ExtendedLineDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createExtendedLine('el1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('extended-line');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(1, 50), pt(5, 80)];
    const d = createExtendedLine('el2', pts, { color: '#ff0000', lineStyle: 'dashed' });
    const s = d.serialize();
    expect(s.type).toBe('extended-line');
    expect(s.id).toBe('el2');
    expect(s.points).toHaveLength(2);
    expect(s.options.color).toBe('#ff0000');
    expect(s.options.lineStyle).toBe('dashed');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createExtendedLine('el3', [pt(0, 100), pt(5, 150)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createExtendedLine('el4', [pt(0, 100)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('is not selected by default', () => {
    const d = createExtendedLine('el5', [pt(0, 100), pt(10, 200)], {});
    expect(d.selected).toBe(false);
  });
});

// ─── Triangle ─────────────────────────────────────────────────────────────────

describe('TriangleDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createTriangle('t1', [pt(0, 100), pt(10, 200), pt(5, 150)], {});
    expect(d.drawingType).toBe('triangle');
    expect(d.requiredPoints).toBe(3);
  });

  it('serializes correctly', () => {
    const pts = [pt(0, 100), pt(10, 200), pt(5, 50)];
    const d = createTriangle('t2', pts, { color: '#00ff00', fillColor: 'rgba(0,255,0,0.2)' });
    const s = d.serialize();
    expect(s.type).toBe('triangle');
    expect(s.id).toBe('t2');
    expect(s.points).toHaveLength(3);
    expect(s.options.color).toBe('#00ff00');
    expect(s.options.fillColor).toBe('rgba(0,255,0,0.2)');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createTriangle('t3', [pt(0, 100), pt(10, 200), pt(5, 150)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createTriangle('t4', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('stores options correctly', () => {
    const d = createTriangle('t5', [pt(0, 100), pt(5, 150), pt(10, 50)], { lineWidth: 3 });
    expect(d.options.lineWidth).toBe(3);
  });
});

// ─── RegressionChannel ───────────────────────────────────────────────────────

describe('RegressionChannelDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createRegressionChannel('rc1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('regression-channel');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(2, 60), pt(8, 90)];
    const d = createRegressionChannel('rc2', pts, { color: '#0000ff', lineWidth: 2 });
    const s = d.serialize();
    expect(s.type).toBe('regression-channel');
    expect(s.id).toBe('rc2');
    expect(s.points).toHaveLength(2);
    expect(s.options.lineWidth).toBe(2);
  });

  it('returns null hit-test when context is not set', () => {
    const d = createRegressionChannel('rc3', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createRegressionChannel('rc4', [pt(0, 100)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('is not selected by default', () => {
    const d = createRegressionChannel('rc5', [pt(0, 100), pt(10, 200)], {});
    expect(d.selected).toBe(false);
  });
});

// ─── Brush ───────────────────────────────────────────────────────────────────

describe('BrushDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createBrush('br1', [pt(0, 100), pt(5, 120), pt(10, 110)], {});
    expect(d.drawingType).toBe('brush');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(0, 100), pt(3, 130), pt(6, 115), pt(9, 120)];
    const d = createBrush('br2', pts, { color: '#ff00ff', lineWidth: 3 });
    const s = d.serialize();
    expect(s.type).toBe('brush');
    expect(s.id).toBe('br2');
    expect(s.points).toHaveLength(4);
    expect(s.options.color).toBe('#ff00ff');
    expect(s.options.lineWidth).toBe(3);
  });

  it('returns null hit-test when context is not set', () => {
    const d = createBrush('br3', [pt(0, 100), pt(5, 150)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createBrush('br4', [pt(0, 100)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('accepts many points', () => {
    const pts = Array.from({ length: 20 }, (_, i) => pt(i, 100 + i));
    const d = createBrush('br5', pts, {});
    expect(d.points).toHaveLength(20);
    const s = d.serialize();
    expect(s.points).toHaveLength(20);
  });
});

// ─── CycleLines ───────────────────────────────────────────────────────────────

describe('CycleLinesDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createCycleLines('cl1', [pt(0, 100), pt(10, 100)], {});
    expect(d.drawingType).toBe('cycle-lines');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(5, 120), pt(15, 120)];
    const d = createCycleLines('cl2', pts, { color: '#aabbcc', lineStyle: 'dotted' });
    const s = d.serialize();
    expect(s.type).toBe('cycle-lines');
    expect(s.id).toBe('cl2');
    expect(s.points).toHaveLength(2);
    expect(s.options.color).toBe('#aabbcc');
    expect(s.options.lineStyle).toBe('dotted');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createCycleLines('cl3', [pt(0, 100), pt(10, 100)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createCycleLines('cl4', [pt(0, 100)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('is not selected by default', () => {
    const d = createCycleLines('cl5', [pt(0, 100), pt(20, 100)], {});
    expect(d.selected).toBe(false);
  });
});
