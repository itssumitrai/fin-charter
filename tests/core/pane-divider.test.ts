import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaneDivider, DIVIDER_HEIGHT } from '@/core/pane-divider';

describe('PaneDivider', () => {
  let aboveHeight: number;
  let belowHeight: number;
  let onResize: ReturnType<typeof vi.fn>;
  let divider: PaneDivider;

  beforeEach(() => {
    aboveHeight = 200;
    belowHeight = 200;
    onResize = vi.fn();

    divider = new PaneDivider(
      () => aboveHeight,
      (h) => { aboveHeight = h; },
      () => belowHeight,
      (h) => { belowHeight = h; },
      onResize,
    );
  });

  afterEach(() => {
    divider.destroy();
  });

  // ── Construction ──────────────────────────────────────────────────────────

  it('creates a div element', () => {
    expect(divider.el.tagName).toBe('DIV');
  });

  it('sets height to DIVIDER_HEIGHT', () => {
    expect(divider.el.style.height).toBe(`${DIVIDER_HEIGHT}px`);
  });

  it('sets cursor to row-resize', () => {
    expect(divider.el.style.cursor).toBe('row-resize');
  });

  it('DIVIDER_HEIGHT is 4', () => {
    expect(DIVIDER_HEIGHT).toBe(4);
  });

  // ── Drag behavior ─────────────────────────────────────────────────────────

  it('drag down increases above height and decreases below height', () => {
    // Simulate pointerdown at y=100
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));

    // Simulate pointermove to y=150 (delta = +50)
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 150,
      bubbles: true,
    }));

    expect(aboveHeight).toBe(250); // 200 + 50
    expect(belowHeight).toBe(150); // 200 - 50
    expect(onResize).toHaveBeenCalled();
  });

  it('drag up decreases above height and increases below height', () => {
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 200,
      bubbles: true,
    }));

    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 130,
      bubbles: true,
    }));

    expect(aboveHeight).toBe(130); // 200 - 70
    expect(belowHeight).toBe(270); // 200 + 70
  });

  it('pointerup stops dragging', () => {
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));

    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

    onResize.mockClear();

    // Move after pointerup should have no effect
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 200,
      bubbles: true,
    }));

    expect(aboveHeight).toBe(200); // unchanged
    expect(belowHeight).toBe(200); // unchanged
    expect(onResize).not.toHaveBeenCalled();
  });

  // ── Minimum height enforcement ────────────────────────────────────────────

  it('enforces minimum 50px for above pane', () => {
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));

    // Drag up by 300 which would make above = 200 - 300 = -100
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: -200,
      bubbles: true,
    }));

    expect(aboveHeight).toBe(50); // clamped to MIN_PANE_HEIGHT
    expect(belowHeight).toBe(350); // total - 50
  });

  it('enforces minimum 50px for below pane', () => {
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));

    // Drag down by 300 which would make below = 200 - 300 = -100
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 400,
      bubbles: true,
    }));

    expect(belowHeight).toBe(50); // clamped to MIN_PANE_HEIGHT
    expect(aboveHeight).toBe(350); // total - 50
  });

  it('preserves total height during constrained drag', () => {
    const totalBefore = aboveHeight + belowHeight;

    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));

    // Large drag that triggers clamping
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 500,
      bubbles: true,
    }));

    expect(aboveHeight + belowHeight).toBe(totalBefore);
  });

  // ── destroy cleanup ───────────────────────────────────────────────────────

  it('destroy removes pointerdown listener from element', () => {
    divider.destroy();

    // After destroy, pointerdown should not trigger drag
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));

    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 200,
      bubbles: true,
    }));

    expect(aboveHeight).toBe(200); // unchanged
    expect(onResize).not.toHaveBeenCalled();
  });

  it('destroy cleans up document listeners from active drag', () => {
    // Start a drag
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));

    // Destroy while dragging
    divider.destroy();

    // Move should have no effect since listeners are removed
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 200,
      bubbles: true,
    }));

    expect(aboveHeight).toBe(200); // unchanged
  });

  // ── Multiple drags ────────────────────────────────────────────────────────

  it('supports multiple sequential drag operations', () => {
    // First drag: move down 30px
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 100,
      bubbles: true,
    }));
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 130,
      bubbles: true,
    }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

    expect(aboveHeight).toBe(230);
    expect(belowHeight).toBe(170);

    // Second drag: move up 20px
    divider.el.dispatchEvent(new PointerEvent('pointerdown', {
      clientY: 200,
      bubbles: true,
    }));
    document.dispatchEvent(new PointerEvent('pointermove', {
      clientY: 180,
      bubbles: true,
    }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

    expect(aboveHeight).toBe(210); // 230 - 20
    expect(belowHeight).toBe(190); // 170 + 20
  });
});
