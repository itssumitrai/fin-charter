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
    // barSpacing=10, width=100 → barsInView=10
    // rightBorder = 19 + 0 = 19, leftBorder = 19 - 10 + 1 = 10
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
    // scrollByPixels(20) → rightOffset += 20/10 = 2
    // rightBorder = 19 + 2 = 21, clamped to 19; leftBorder = 21 - 10 + 1 = 12
    ts.scrollByPixels(20);
    const { fromIdx, toIdx } = ts.visibleRange();
    expect(toIdx).toBe(19);
    expect(fromIdx).toBe(12);
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

  it('last bar center is at width - 0.5 * barSpacing with no offset', () => {
    ts.setWidth(200);
    ts.setDataLength(10);
    // deltaFromRight = 9 + 0 - 9 = 0; x = 200 - (0 + 0.5) * 10 = 195
    expect(ts.indexToX(9)).toBe(195);
  });

  // ── Scrolling ─────────────────────────────────────────────────────────────

  it('scrollByPixels changes the visible range', () => {
    ts.setWidth(100);
    ts.setDataLength(20);
    const before = ts.visibleRange();
    // scrollByPixels(10) → rightOffset += 1 → shifts view to show older data
    ts.scrollByPixels(10);
    const after = ts.visibleRange();
    expect(after.fromIdx).toBeGreaterThan(before.fromIdx);
  });

  it('scrollToEnd resets right offset', () => {
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
    expect(ts.rightOffset).toBe(3);
  });

  it('scrollTo computes shift from start position', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    const savedOffset = ts.rightOffset;
    // Dragging right by 30px → shift = (100 - 130) / 10 = -3
    ts.scrollTo(100, 130, savedOffset);
    expect(ts.rightOffset).toBeCloseTo(savedOffset - 3);
  });

  // ── Zoom ──────────────────────────────────────────────────────────────────

  it('zoomAt increases barSpacing when scale > 0', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, 1);
    expect(ts.barSpacing).toBeGreaterThan(10);
  });

  it('zoomAt decreases barSpacing when scale < 0', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, -1);
    expect(ts.barSpacing).toBeLessThan(10);
  });

  it('zoomAt clamps barSpacing to maxBarSpacing', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, 1000); // extreme zoom in
    expect(ts.barSpacing).toBe(50);
  });

  it('zoomAt clamps barSpacing to minBarSpacing', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    ts.zoomAt(100, -1000); // extreme zoom out
    expect(ts.barSpacing).toBe(1);
  });

  it('zoomAt keeps the index under cursor stable', () => {
    ts.setWidth(200);
    ts.setDataLength(20);
    const x = 100;
    const idxBefore = ts.xToIndex(x);
    ts.zoomAt(x, 1);
    const idxAfter = ts.xToIndex(x);
    expect(idxAfter).toBe(idxBefore);
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

  it('fitContent resets scroll offset', () => {
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

  // ── rightOffset getter ────────────────────────────────────────────────────

  it('rightOffset defaults to the options value', () => {
    const ts2 = new TimeScale({ barSpacing: 10, rightOffset: 5, minBarSpacing: 1, maxBarSpacing: 50 });
    expect(ts2.rightOffset).toBe(5);
  });

  it('setRightOffset sets the offset directly', () => {
    ts.setRightOffset(7);
    expect(ts.rightOffset).toBe(7);
  });
});
