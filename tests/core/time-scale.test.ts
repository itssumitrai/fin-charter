import { describe, it, expect, beforeEach } from 'vitest';
import { TimeScale } from '@/core/time-scale';

describe('TimeScale', () => {
  let ts: TimeScale;

  beforeEach(() => {
    ts = new TimeScale({ barSpacing: 10, rightOffset: 0, minBarSpacing: 1, maxBarSpacing: 50 });
  });

  // ── Visible range ──────────────────────────────────────────────────────────

  it('returns {0,0} when no data or width', () => {
    expect(ts.visibleRange()).toEqual({ fromIdx: 0, toIdx: 0 });
    ts.setWidth(500);
    expect(ts.visibleRange()).toEqual({ fromIdx: 0, toIdx: 0 });
  });

  it('computes correct visible range for small dataset', () => {
    ts.setWidth(100);
    ts.setDataLength(20);
    // barSpacing=10 → 10 bars visible; rightmost = 19, leftmost = 10
    const { fromIdx, toIdx } = ts.visibleRange();
    expect(toIdx).toBe(19);
    expect(fromIdx).toBe(10);
  });

  it('clamps fromIdx to 0 when data is short', () => {
    ts.setWidth(1000);
    ts.setDataLength(5);
    const { fromIdx, toIdx } = ts.visibleRange();
    expect(fromIdx).toBe(0);
    expect(toIdx).toBe(4);
  });

  it('clamps toIdx to dataLength-1', () => {
    ts.setWidth(100);
    ts.setDataLength(5);
    // 10 bars would be visible but only 5 exist
    const { toIdx } = ts.visibleRange();
    expect(toIdx).toBe(4);
  });

  it('visible range shifts after scroll', () => {
    ts.setWidth(100);
    ts.setDataLength(20);
    ts.scrollByPixels(20); // scroll left by 2 bars
    const { fromIdx, toIdx } = ts.visibleRange();
    // rightmost moves from 19 to 17
    expect(toIdx).toBe(17);
    expect(fromIdx).toBe(8);
  });

  // ── Coordinate conversion ─────────────────────────────────────────────────

  it('indexToX and xToIndex are inverse operations', () => {
    ts.setWidth(200);
    ts.setDataLength(10);
    for (const idx of [0, 4, 9]) {
      const x = ts.indexToX(idx);
      expect(ts.xToIndex(x)).toBe(idx);
    }
  });

  it('last bar is at the right edge with no offset', () => {
    ts.setWidth(200);
    ts.setDataLength(10);
    // rightmost bar (index 9) → x = 200 - 0*10 - (9-9)*10 = 200
    expect(ts.indexToX(9)).toBe(200);
  });

  // ── Scrolling ─────────────────────────────────────────────────────────────

  it('scrollByPixels changes the visible range', () => {
    ts.setWidth(100);
    ts.setDataLength(20);
    const before = ts.visibleRange();
    ts.scrollByPixels(10); // 1 bar
    const after = ts.visibleRange();
    expect(after.toIdx).toBe(before.toIdx - 1);
  });

  it('scrollToEnd resets scroll offset', () => {
    ts.setWidth(100);
    ts.setDataLength(20);
    ts.scrollByPixels(50);
    ts.scrollToEnd();
    expect(ts.visibleRange().toIdx).toBe(19);
  });

  it('scrollToPosition sets offset directly', () => {
    ts.setWidth(100);
    ts.setDataLength(20);
    ts.scrollToPosition(3); // 3 bars from right
    expect(ts.visibleRange().toIdx).toBe(16);
  });

  // ── Zoom ──────────────────────────────────────────────────────────────────

  it('zoomAt increases barSpacing when factor > 1', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, 2);
    expect(ts.barSpacing).toBeGreaterThan(10);
  });

  it('zoomAt decreases barSpacing when factor < 1', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, 0.5);
    expect(ts.barSpacing).toBeLessThan(10);
  });

  it('zoomAt clamps barSpacing to maxBarSpacing', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, 100); // extreme zoom in
    expect(ts.barSpacing).toBe(50);
  });

  it('zoomAt clamps barSpacing to minBarSpacing', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, 0.001); // extreme zoom out
    expect(ts.barSpacing).toBe(1);
  });

  // ── fitContent ─────────────────────────────────────────────────────────────

  it('fitContent adjusts barSpacing so all bars fill the width', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.fitContent();
    expect(ts.barSpacing).toBe(10); // 200/20 = 10
  });

  it('fitContent clamps to minBarSpacing', () => {
    ts.setWidth(100);
    ts.setDataLength(10_000); // too many bars
    ts.fitContent();
    expect(ts.barSpacing).toBe(1);
  });

  it('fitContent resets scroll offset to 0', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.scrollByPixels(100);
    ts.fitContent();
    expect(ts.visibleRange().toIdx).toBe(19);
  });

  // ── setOptions ─────────────────────────────────────────────────────────────

  it('setOptions updates barSpacing and clamps it', () => {
    ts.setOptions({ barSpacing: 100 }); // above maxBarSpacing=50
    expect(ts.barSpacing).toBe(50);
  });
});
