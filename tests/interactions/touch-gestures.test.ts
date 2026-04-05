import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TouchGestureHandler } from '@/interactions/touch-gestures';

function makeMockTimeScale() {
  return {
    barSpacing: 10,
    minBarSpacing: 2,
    maxBarSpacing: 50,
    setBarSpacing: vi.fn(),
    scrollBy: vi.fn(),
    scrollByPixels: vi.fn(),
  };
}

describe('TouchGestureHandler', () => {
  let ts: ReturnType<typeof makeMockTimeScale>;
  let repaint: ReturnType<typeof vi.fn>;
  let handler: TouchGestureHandler;

  beforeEach(() => {
    ts = makeMockTimeScale();
    repaint = vi.fn();
    handler = new TouchGestureHandler(ts as never, repaint);
  });

  it('starts with no active touches', () => {
    expect(handler.activeTouchCount).toBe(0);
  });

  it('tracks pointer down/up', () => {
    handler.onPointerDown(100, 200, 1);
    expect(handler.activeTouchCount).toBe(1);
    handler.onPointerUp(1);
    expect(handler.activeTouchCount).toBe(0);
  });

  it('consumes event on second pointer down (start of gesture)', () => {
    handler.onPointerDown(100, 200, 1);
    const consumed = handler.onPointerDown(200, 200, 2);
    expect(consumed).toBe(true);
    expect(handler.activeTouchCount).toBe(2);
  });

  it('applies pinch-to-zoom on two-finger move', () => {
    // Start gesture: two fingers 100px apart
    handler.onPointerDown(100, 200, 1);
    handler.onPointerDown(200, 200, 2);

    // Move fingers apart to 200px
    handler.onPointerMove(50, 200, 1);
    handler.onPointerMove(250, 200, 2);

    expect(ts.setBarSpacing).toHaveBeenCalled();
    expect(repaint).toHaveBeenCalled();
  });

  it('applies two-finger pan on move', () => {
    handler.onPointerDown(100, 200, 1);
    handler.onPointerDown(200, 200, 2);

    // Move both fingers right by 50px
    handler.onPointerMove(150, 200, 1);
    handler.onPointerMove(250, 200, 2);

    expect(ts.scrollBy).toHaveBeenCalled();
  });

  it('resets gesture state on pointer up', () => {
    handler.onPointerDown(100, 200, 1);
    handler.onPointerDown(200, 200, 2);
    handler.onPointerUp(2);
    expect(handler.activeTouchCount).toBe(1);
  });

  it('does nothing for single-finger move', () => {
    handler.onPointerDown(100, 200, 1);
    handler.onPointerMove(150, 200, 1);
    expect(ts.setBarSpacing).not.toHaveBeenCalled();
    expect(ts.scrollBy).not.toHaveBeenCalled();
  });

  it('dispose clears state', () => {
    handler.onPointerDown(100, 200, 1);
    handler.dispose();
    expect(handler.activeTouchCount).toBe(0);
  });
});
