import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrosshairHandler } from '@/interactions/crosshair';
import { Crosshair } from '@/core/crosshair';
import { DataLayer } from '@/core/data-layer';
import { TimeScale } from '@/core/time-scale';
import { PriceScale } from '@/core/price-scale';

function makeBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    time: 1700000000 + i * 60,
    open: 100 + i,
    high: 110 + i,
    low: 90 + i,
    close: 105 + i,
    volume: 1000,
  }));
}

describe('CrosshairHandler', () => {
  let crosshair: Crosshair;
  let dataLayer: DataLayer;
  let timeScale: TimeScale;
  let priceScale: PriceScale;
  let requestInvalidation: ReturnType<typeof vi.fn>;
  let handler: CrosshairHandler;

  beforeEach(() => {
    crosshair = new Crosshair();
    dataLayer = new DataLayer();
    timeScale = new TimeScale({ barSpacing: 10, rightOffset: 0, minBarSpacing: 1, maxBarSpacing: 100 });
    priceScale = new PriceScale('right');

    timeScale.setWidth(500);
    timeScale.setDataLength(50);
    priceScale.setHeight(400);
    priceScale.autoScale(90, 150);

    dataLayer.setData(makeBars(50));

    requestInvalidation = vi.fn();
    handler = new CrosshairHandler(crosshair, dataLayer, timeScale, priceScale, requestInvalidation);
  });

  it('starts with crosshair invisible', () => {
    expect(crosshair.visible).toBe(false);
  });

  it('onPointerMove makes crosshair visible', () => {
    handler.onPointerMove(250, 200, 1);
    expect(crosshair.visible).toBe(true);
  });

  it('onPointerMove sets barIndex within valid range', () => {
    handler.onPointerMove(250, 200, 1);
    expect(crosshair.barIndex).toBeGreaterThanOrEqual(0);
    expect(crosshair.barIndex).toBeLessThan(50);
  });

  it('onPointerMove sets price from y coordinate', () => {
    // y=0 should be near max price; y=400 near min price
    handler.onPointerMove(250, 0, 1);
    const priceAtTop = crosshair.price;

    handler.onPointerMove(250, 400, 1);
    const priceAtBottom = crosshair.price;

    expect(priceAtTop).toBeGreaterThan(priceAtBottom);
  });

  it('onPointerMove sets time from bar data', () => {
    handler.onPointerMove(250, 200, 1);
    // Time should be one of the bar times
    const times = makeBars(50).map(b => b.time);
    expect(times).toContain(crosshair.time);
  });

  it('onPointerMove snaps x to bar center', () => {
    handler.onPointerMove(253, 200, 1);
    // snappedX should be exactly at a bar center (multiple of barSpacing from right edge)
    const barIndex = crosshair.barIndex;
    const expectedSnappedX = timeScale.indexToX(barIndex);
    expect(crosshair.snappedX).toBeCloseTo(expectedSnappedX, 0);
  });

  it('onPointerMove clamps barIndex to [0, length-1]', () => {
    // Pointer far left — should clamp to 0
    handler.onPointerMove(-9999, 200, 1);
    expect(crosshair.barIndex).toBe(0);

    // Pointer far right — should clamp to last bar
    handler.onPointerMove(99999, 200, 1);
    expect(crosshair.barIndex).toBe(49);
  });

  it('onPointerMove requests invalidation', () => {
    handler.onPointerMove(250, 200, 1);
    expect(requestInvalidation).toHaveBeenCalled();
  });

  it('onPointerUp hides crosshair', () => {
    handler.onPointerMove(250, 200, 1);
    expect(crosshair.visible).toBe(true);
    handler.onPointerUp(1);
    expect(crosshair.visible).toBe(false);
  });

  it('onPointerUp requests invalidation', () => {
    handler.onPointerMove(250, 200, 1);
    requestInvalidation.mockClear();
    handler.onPointerUp(1);
    expect(requestInvalidation).toHaveBeenCalled();
  });

  it('handles empty dataLayer gracefully', () => {
    const emptyDataLayer = new DataLayer(); // no data
    const h = new CrosshairHandler(crosshair, emptyDataLayer, timeScale, priceScale, requestInvalidation);
    expect(() => h.onPointerMove(250, 200, 1)).not.toThrow();
    expect(crosshair.visible).toBe(false);
  });

  it('crosshair y matches the pointer y', () => {
    handler.onPointerMove(250, 175, 1);
    expect(crosshair.y).toBe(175);
  });
});
