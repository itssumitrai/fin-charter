import { describe, it, expect } from 'vitest';
import { MinMaxSegmentTree } from '@/core/segment-tree';

describe('MinMaxSegmentTree', () => {
  describe('build', () => {
    it('builds from high/low arrays', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120, 115, 130, 125]);
      const low = new Float64Array([90, 100, 95, 110, 105]);
      tree.build(high, low, 5);
      expect(tree.length).toBe(5);
    });

    it('handles empty data', () => {
      const tree = new MinMaxSegmentTree(8);
      tree.build(new Float64Array(0), new Float64Array(0), 0);
      expect(tree.length).toBe(0);
    });
  });

  describe('query', () => {
    it('returns correct min/max for full range', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120, 115, 130, 125]);
      const low = new Float64Array([90, 100, 95, 110, 105]);
      tree.build(high, low, 5);

      const result = tree.query(0, 4);
      expect(result.min).toBe(90);
      expect(result.max).toBe(130);
    });

    it('returns correct min/max for partial range', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120, 115, 130, 125]);
      const low = new Float64Array([90, 100, 95, 110, 105]);
      tree.build(high, low, 5);

      const result = tree.query(1, 3);
      expect(result.min).toBe(95); // min of low[1..3] = min(100, 95, 110)
      expect(result.max).toBe(130); // max of high[1..3] = max(120, 115, 130)
    });

    it('returns correct min/max for single element', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120, 115]);
      const low = new Float64Array([90, 100, 95]);
      tree.build(high, low, 3);

      const result = tree.query(1, 1);
      expect(result.min).toBe(100);
      expect(result.max).toBe(120);
    });

    it('handles out-of-bounds range', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120]);
      const low = new Float64Array([90, 100]);
      tree.build(high, low, 2);

      const result = tree.query(5, 10);
      expect(result.min).toBe(Infinity);
      expect(result.max).toBe(-Infinity);
    });

    it('clamps to valid range', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120, 115]);
      const low = new Float64Array([90, 100, 95]);
      tree.build(high, low, 3);

      const result = tree.query(-1, 10);
      expect(result.min).toBe(90);
      expect(result.max).toBe(120);
    });
  });

  describe('update', () => {
    it('updates a single element', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120, 115]);
      const low = new Float64Array([90, 100, 95]);
      tree.build(high, low, 3);

      // Update index 1: new high=200, new low=50
      tree.update(1, 200, 50);

      const result = tree.query(0, 2);
      expect(result.min).toBe(50);
      expect(result.max).toBe(200);
    });

    it('update only affects the queried range', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120, 115, 130]);
      const low = new Float64Array([90, 100, 95, 110]);
      tree.build(high, low, 4);

      tree.update(3, 200, 50); // Update last element

      // Range [0, 2] should NOT be affected
      const partial = tree.query(0, 2);
      expect(partial.min).toBe(90);
      expect(partial.max).toBe(120);

      // Full range should reflect the update
      const full = tree.query(0, 3);
      expect(full.min).toBe(50);
      expect(full.max).toBe(200);
    });
  });

  describe('append', () => {
    it('appends new values', () => {
      const tree = new MinMaxSegmentTree(8);
      const high = new Float64Array([110, 120]);
      const low = new Float64Array([90, 100]);
      tree.build(high, low, 2);

      tree.append(200, 50);
      expect(tree.length).toBe(3);

      const result = tree.query(0, 2);
      expect(result.min).toBe(50);
      expect(result.max).toBe(200);
    });

    it('grows capacity when needed', () => {
      const tree = new MinMaxSegmentTree(2);
      tree.build(new Float64Array([100, 200]), new Float64Array([50, 80]), 2);

      // Append beyond initial capacity
      tree.append(300, 30);
      tree.append(150, 70);

      expect(tree.length).toBe(4);
      const result = tree.query(0, 3);
      expect(result.min).toBe(30);
      expect(result.max).toBe(300);
    });
  });

  describe('large dataset performance', () => {
    it('handles 100k elements correctly', () => {
      const n = 100_000;
      const high = new Float64Array(n);
      const low = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        high[i] = 100 + Math.sin(i * 0.01) * 50;
        low[i] = 100 + Math.sin(i * 0.01) * 50 - 10;
      }

      const tree = new MinMaxSegmentTree(n);
      tree.build(high, low, n);

      // Query a middle range
      const result = tree.query(40000, 60000);
      expect(result.min).toBeLessThan(result.max);
      expect(result.min).toBeGreaterThan(0);

      // Verify correctness against linear scan
      let expectedMin = Infinity;
      let expectedMax = -Infinity;
      for (let i = 40000; i <= 60000; i++) {
        if (low[i] < expectedMin) expectedMin = low[i];
        if (high[i] > expectedMax) expectedMax = high[i];
      }
      expect(result.min).toBeCloseTo(expectedMin, 10);
      expect(result.max).toBeCloseTo(expectedMax, 10);
    });
  });
});
