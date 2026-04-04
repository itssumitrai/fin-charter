import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventRouter } from '@/interactions/event-router';
import type { EventHandler } from '@/interactions/event-router';

describe('EventRouter', () => {
  let router: EventRouter;
  let element: HTMLDivElement;

  beforeEach(() => {
    router = new EventRouter();
    element = document.createElement('div');
    // Stub getBoundingClientRect for local coord calculation
    element.getBoundingClientRect = vi.fn(() => ({
      left: 10, top: 20, right: 110, bottom: 120,
      width: 100, height: 100, x: 10, y: 20, toJSON() {},
    }));
  });

  afterEach(() => {
    router.detach();
  });

  describe('attach', () => {
    it('sets touch-action to none on element', () => {
      router.attach(element);
      expect(element.style.touchAction).toBe('none');
    });

    it('sets tabindex if not present', () => {
      router.attach(element);
      expect(element.getAttribute('tabindex')).toBe('0');
    });

    it('preserves existing tabindex', () => {
      element.setAttribute('tabindex', '5');
      router.attach(element);
      expect(element.getAttribute('tabindex')).toBe('5');
    });
  });

  describe('handler chain - pointerdown', () => {
    it('delegates pointerdown to handler with local coordinates', () => {
      const handler: EventHandler = { onPointerDown: vi.fn() };
      router.addHandler(handler);
      router.attach(element);

      // clientX=50, clientY=60 => local x=40, y=40
      element.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: 50, clientY: 60, pointerId: 1,
      }));

      expect(handler.onPointerDown).toHaveBeenCalledWith(40, 40, 1);
    });

    it('stops propagation when handler returns true (consume)', () => {
      const first: EventHandler = { onPointerDown: vi.fn(() => true) };
      const second: EventHandler = { onPointerDown: vi.fn() };
      router.addHandler(first);
      router.addHandler(second);
      router.attach(element);

      element.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: 50, clientY: 60, pointerId: 1,
      }));

      expect(first.onPointerDown).toHaveBeenCalled();
      expect(second.onPointerDown).not.toHaveBeenCalled();
    });

    it('continues to next handler when handler returns false', () => {
      const first: EventHandler = { onPointerDown: vi.fn(() => false) };
      const second: EventHandler = { onPointerDown: vi.fn() };
      router.addHandler(first);
      router.addHandler(second);
      router.attach(element);

      element.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: 50, clientY: 60, pointerId: 1,
      }));

      expect(first.onPointerDown).toHaveBeenCalled();
      expect(second.onPointerDown).toHaveBeenCalled();
    });
  });

  describe('handler chain - pointermove', () => {
    it('delegates pointermove to handlers', () => {
      const handler: EventHandler = { onPointerMove: vi.fn() };
      router.addHandler(handler);
      router.attach(element);

      element.dispatchEvent(new PointerEvent('pointermove', {
        clientX: 30, clientY: 40, pointerId: 2,
      }));

      expect(handler.onPointerMove).toHaveBeenCalledWith(20, 20, 2);
    });
  });

  describe('handler chain - pointerup', () => {
    it('delegates pointerup to handlers', () => {
      const handler: EventHandler = { onPointerUp: vi.fn() };
      router.addHandler(handler);
      router.attach(element);

      element.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3 }));

      expect(handler.onPointerUp).toHaveBeenCalledWith(3);
    });
  });

  describe('handler chain - pointerleave', () => {
    it('triggers onPointerUp on pointerleave', () => {
      const handler: EventHandler = { onPointerUp: vi.fn() };
      router.addHandler(handler);
      router.attach(element);

      element.dispatchEvent(new PointerEvent('pointerleave', { pointerId: 4 }));

      expect(handler.onPointerUp).toHaveBeenCalledWith(4);
    });
  });

  describe('handler chain - wheel', () => {
    it('delegates wheel events to all handlers (no consume)', () => {
      const first: EventHandler = { onWheel: vi.fn() };
      const second: EventHandler = { onWheel: vi.fn() };
      router.addHandler(first);
      router.addHandler(second);
      router.attach(element);

      element.dispatchEvent(new WheelEvent('wheel', {
        clientX: 50, clientY: 60, deltaY: -100,
      }));

      // Both handlers receive the wheel event (no break on consume)
      expect(first.onWheel).toHaveBeenCalledWith(40, 40, -100);
      expect(second.onWheel).toHaveBeenCalledWith(40, 40, -100);
    });
  });

  describe('handler chain - keydown', () => {
    it('delegates keydown with key and shiftKey', () => {
      const handler: EventHandler = { onKeyDown: vi.fn() };
      router.addHandler(handler);
      router.attach(element);

      element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowLeft', shiftKey: true,
      }));

      expect(handler.onKeyDown).toHaveBeenCalledWith('ArrowLeft', true);
    });

    it('stops at first handler that consumes the event', () => {
      const first: EventHandler = { onKeyDown: vi.fn(() => true) };
      const second: EventHandler = { onKeyDown: vi.fn() };
      router.addHandler(first);
      router.addHandler(second);
      router.attach(element);

      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(first.onKeyDown).toHaveBeenCalled();
      expect(second.onKeyDown).not.toHaveBeenCalled();
    });
  });

  describe('handler chain - contextmenu', () => {
    it('delegates contextmenu with local coordinates', () => {
      const handler: EventHandler = { onContextMenu: vi.fn(() => true) };
      router.addHandler(handler);
      router.attach(element);

      element.dispatchEvent(new MouseEvent('contextmenu', {
        clientX: 60, clientY: 70,
      }));

      expect(handler.onContextMenu).toHaveBeenCalledWith(50, 50);
    });
  });

  describe('addHandler / removeHandler', () => {
    it('removed handler no longer receives events', () => {
      const handler: EventHandler = { onPointerDown: vi.fn() };
      router.addHandler(handler);
      router.attach(element);

      router.removeHandler(handler);

      element.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: 50, clientY: 60, pointerId: 1,
      }));

      expect(handler.onPointerDown).not.toHaveBeenCalled();
    });

    it('removing a handler that was never added does not throw', () => {
      const handler: EventHandler = { onPointerDown: vi.fn() };
      expect(() => router.removeHandler(handler)).not.toThrow();
    });
  });

  describe('detach', () => {
    it('stops delivering events after detach', () => {
      const handler: EventHandler = { onPointerDown: vi.fn() };
      router.addHandler(handler);
      router.attach(element);
      router.detach();

      element.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: 50, clientY: 60, pointerId: 1,
      }));

      expect(handler.onPointerDown).not.toHaveBeenCalled();
    });
  });
});
