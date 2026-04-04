/**
 * Tests for the 10 new drawing tools.
 * Covers: drawingType, requiredPoints, serialize(), and null-context hit-test.
 */
import { describe, it, expect } from 'vitest';

import { createRay } from '@/drawings/ray';
import { createArrow } from '@/drawings/arrow';
import { createChannel } from '@/drawings/channel';
import { createEllipse } from '@/drawings/ellipse';
import { createPitchfork } from '@/drawings/pitchfork';
import { createFibProjection } from '@/drawings/fib-projection';
import { createFibArc } from '@/drawings/fib-arc';
import { createFibFan } from '@/drawings/fib-fan';
import { createCrossline } from '@/drawings/crossline';
import { createMeasurement } from '@/drawings/measurement';

const pt = (time: number, price: number) => ({ time, price });

// ─── Ray ──────────────────────────────────────────────────────────────────────

describe('RayDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createRay('r1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('ray');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(1, 50), pt(5, 80)];
    const d = createRay('r2', pts, { color: '#ff0000', lineStyle: 'dashed' });
    const s = d.serialize();
    expect(s.type).toBe('ray');
    expect(s.id).toBe('r2');
    expect(s.points).toHaveLength(2);
    expect(s.options.color).toBe('#ff0000');
    expect(s.options.lineStyle).toBe('dashed');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createRay('r3', [pt(0, 100), pt(5, 150)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createRay('r4', [pt(0, 100)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Arrow ────────────────────────────────────────────────────────────────────

describe('ArrowDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createArrow('a1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('arrow');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(2, 60), pt(8, 90)];
    const d = createArrow('a2', pts, { color: '#00ff00', lineWidth: 2 });
    const s = d.serialize();
    expect(s.type).toBe('arrow');
    expect(s.id).toBe('a2');
    expect(s.points).toHaveLength(2);
    expect(s.options.lineWidth).toBe(2);
  });

  it('returns null hit-test when context is not set', () => {
    const d = createArrow('a3', [pt(0, 100), pt(5, 150)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Channel ──────────────────────────────────────────────────────────────────

describe('ChannelDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createChannel('ch1', [pt(0, 100), pt(10, 120), pt(0, 90)], {});
    expect(d.drawingType).toBe('channel');
    expect(d.requiredPoints).toBe(3);
  });

  it('serializes correctly', () => {
    const pts = [pt(0, 100), pt(10, 120), pt(0, 85)];
    const d = createChannel('ch2', pts, { color: '#1234ab' });
    const s = d.serialize();
    expect(s.type).toBe('channel');
    expect(s.points).toHaveLength(3);
    expect(s.options.color).toBe('#1234ab');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createChannel('ch3', [pt(0, 100), pt(5, 110), pt(0, 90)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createChannel('ch4', [pt(0, 100), pt(5, 110)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Ellipse ──────────────────────────────────────────────────────────────────

describe('EllipseDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createEllipse('el1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('ellipse');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(1, 50), pt(9, 150)];
    const d = createEllipse('el2', pts, { fillColor: '#aabbcc' });
    const s = d.serialize();
    expect(s.type).toBe('ellipse');
    expect(s.points).toHaveLength(2);
    expect(s.options.fillColor).toBe('#aabbcc');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createEllipse('el3', [pt(0, 100), pt(5, 150)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Pitchfork ────────────────────────────────────────────────────────────────

describe('PitchforkDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createPitchfork('pf1', [pt(0, 100), pt(5, 130), pt(5, 70)], {});
    expect(d.drawingType).toBe('pitchfork');
    expect(d.requiredPoints).toBe(3);
  });

  it('serializes correctly', () => {
    const pts = [pt(0, 100), pt(5, 130), pt(5, 70)];
    const d = createPitchfork('pf2', pts, { color: '#ff8800' });
    const s = d.serialize();
    expect(s.type).toBe('pitchfork');
    expect(s.points).toHaveLength(3);
    expect(s.options.color).toBe('#ff8800');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createPitchfork('pf3', [pt(0, 100), pt(5, 130), pt(5, 70)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createPitchfork('pf4', [pt(0, 100), pt(5, 130)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Fib Projection ───────────────────────────────────────────────────────────

describe('FibProjectionDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createFibProjection('fp1', [pt(0, 100), pt(5, 150), pt(8, 120)], {});
    expect(d.drawingType).toBe('fib-projection');
    expect(d.requiredPoints).toBe(3);
  });

  it('serializes correctly', () => {
    const pts = [pt(0, 100), pt(5, 150), pt(8, 120)];
    const d = createFibProjection('fp2', pts, { color: '#9C27B0' });
    const s = d.serialize();
    expect(s.type).toBe('fib-projection');
    expect(s.points).toHaveLength(3);
  });

  it('returns null hit-test when context is not set', () => {
    const d = createFibProjection('fp3', [pt(0, 100), pt(5, 150), pt(8, 120)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createFibProjection('fp4', [pt(0, 100), pt(5, 150)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Fib Arc ──────────────────────────────────────────────────────────────────

describe('FibArcDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createFibArc('fa1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('fib-arc');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(0, 100), pt(10, 200)];
    const d = createFibArc('fa2', pts, { color: '#FF9800' });
    const s = d.serialize();
    expect(s.type).toBe('fib-arc');
    expect(s.points).toHaveLength(2);
    expect(s.options.color).toBe('#FF9800');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createFibArc('fa3', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Fib Fan ──────────────────────────────────────────────────────────────────

describe('FibFanDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createFibFan('ff1', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingType).toBe('fib-fan');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(0, 100), pt(10, 200)];
    const d = createFibFan('ff2', pts, { lineStyle: 'dotted' });
    const s = d.serialize();
    expect(s.type).toBe('fib-fan');
    expect(s.points).toHaveLength(2);
    expect(s.options.lineStyle).toBe('dotted');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createFibFan('ff3', [pt(0, 100), pt(10, 200)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Crossline ────────────────────────────────────────────────────────────────

describe('CrosslineDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createCrossline('cl1', [pt(5, 75)], {});
    expect(d.drawingType).toBe('crossline');
    expect(d.requiredPoints).toBe(1);
  });

  it('serializes correctly', () => {
    const d = createCrossline('cl2', [pt(10, 100)], { color: '#e91e63' });
    const s = d.serialize();
    expect(s.type).toBe('crossline');
    expect(s.points).toHaveLength(1);
    expect(s.options.color).toBe('#e91e63');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createCrossline('cl3', [pt(5, 75)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createCrossline('cl4', [], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });
});

// ─── Measurement ──────────────────────────────────────────────────────────────

describe('MeasurementDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = createMeasurement('m1', [pt(1, 100), pt(10, 120)], {});
    expect(d.drawingType).toBe('measurement');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [pt(1, 100), pt(10, 120)];
    const d = createMeasurement('m2', pts, { color: '#4caf50' });
    const s = d.serialize();
    expect(s.type).toBe('measurement');
    expect(s.points).toHaveLength(2);
    expect(s.options.color).toBe('#4caf50');
  });

  it('returns null hit-test when context is not set', () => {
    const d = createMeasurement('m3', [pt(1, 100), pt(10, 120)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('returns null hit-test with insufficient points', () => {
    const d = createMeasurement('m4', [pt(1, 100)], {});
    expect(d.drawingHitTest(50, 50)).toBeNull();
  });

  it('serialize round-trips correctly', () => {
    const pts = [pt(5, 200), pt(15, 230)];
    const d = createMeasurement('m5', pts, { color: '#333', lineWidth: 2 });
    const s = d.serialize();
    expect(s.points[0]).toEqual({ time: 5, price: 200 });
    expect(s.points[1]).toEqual({ time: 15, price: 230 });
    // Mutating serialized does not affect original
    s.points[0].price = 999;
    expect(d.points[0].price).toBe(200);
  });
});
