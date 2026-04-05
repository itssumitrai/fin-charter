import { describe, it, expect, vi } from 'vitest';
import { AlertLine, DEFAULT_ALERT_LINE_OPTIONS } from '@/core/alert-line';
import type { AlertLineOptions } from '@/core/alert-line';

function makeAlert(
  price: number,
  overrides?: Partial<AlertLineOptions>,
  repaint?: () => void,
): AlertLine {
  return new AlertLine('test_1', { ...overrides, price } as AlertLineOptions, repaint);
}

describe('AlertLine', () => {
  describe('construction', () => {
    it('uses default options merged with provided', () => {
      const alert = makeAlert(100);
      const opts = alert.options;
      expect(opts.price).toBe(100);
      expect(opts.color).toBe(DEFAULT_ALERT_LINE_OPTIONS.color);
      expect(opts.armed).toBe(true);
      expect(opts.triggerMode).toBe('crossing-either');
    });

    it('stores the provided id', () => {
      const alert = new AlertLine('my_alert', { price: 50 } as AlertLineOptions);
      expect(alert.id).toBe('my_alert');
    });
  });

  describe('options()', () => {
    it('returns a copy, not a reference', () => {
      const alert = makeAlert(100);
      const opts1 = alert.options;
      const opts2 = alert.options;
      expect(opts1).not.toBe(opts2);
      expect(opts1).toEqual(opts2);
    });
  });

  describe('applyOptions', () => {
    it('updates options and calls repaint', () => {
      const repaint = vi.fn();
      const alert = makeAlert(100, {}, repaint);
      alert.applyOptions({ color: '#FF0000', price: 200 });
      expect(alert.options.color).toBe('#FF0000');
      expect(alert.options.price).toBe(200);
      expect(repaint).toHaveBeenCalled();
    });
  });

  describe('armed state', () => {
    it('starts armed by default', () => {
      const alert = makeAlert(100);
      expect(alert.isArmed()).toBe(true);
    });

    it('can be disarmed', () => {
      const repaint = vi.fn();
      const alert = makeAlert(100, {}, repaint);
      alert.setArmed(false);
      expect(alert.isArmed()).toBe(false);
      expect(repaint).toHaveBeenCalled();
    });

    it('can be re-armed', () => {
      const alert = makeAlert(100);
      alert.setArmed(false);
      alert.setArmed(true);
      expect(alert.isArmed()).toBe(true);
    });
  });

  describe('checkCrossing', () => {
    it('fires callback when price crosses up (crossing-either)', () => {
      const alert = makeAlert(100, { triggerMode: 'crossing-either' });
      const cb = vi.fn();
      alert.onTriggered(cb);

      alert.checkCrossing(99);  // below, sets lastPrice
      alert.checkCrossing(101); // crosses up
      expect(cb).toHaveBeenCalledWith(alert, 'up');
    });

    it('fires callback when price crosses down (crossing-either)', () => {
      const alert = makeAlert(100, { triggerMode: 'crossing-either' });
      const cb = vi.fn();
      alert.onTriggered(cb);

      alert.checkCrossing(101); // above
      alert.checkCrossing(99);  // crosses down
      expect(cb).toHaveBeenCalledWith(alert, 'down');
    });

    it('only fires for crossing-up mode', () => {
      const alert = makeAlert(100, { triggerMode: 'crossing-up' });
      const cb = vi.fn();
      alert.onTriggered(cb);

      // Cross down — should NOT fire
      alert.checkCrossing(101);
      alert.checkCrossing(99);
      expect(cb).not.toHaveBeenCalled();

      // Cross up — should fire
      alert.checkCrossing(101);
      expect(cb).toHaveBeenCalledWith(alert, 'up');
    });

    it('only fires for crossing-down mode', () => {
      const alert = makeAlert(100, { triggerMode: 'crossing-down' });
      const cb = vi.fn();
      alert.onTriggered(cb);

      // Cross up — should NOT fire
      alert.checkCrossing(99);
      alert.checkCrossing(101);
      expect(cb).not.toHaveBeenCalled();

      // Cross down — should fire
      alert.checkCrossing(99);
      expect(cb).toHaveBeenCalledWith(alert, 'down');
    });

    it('does not fire when disarmed', () => {
      const alert = makeAlert(100, { triggerMode: 'crossing-either' });
      const cb = vi.fn();
      alert.onTriggered(cb);
      alert.setArmed(false);

      alert.checkCrossing(99);
      alert.checkCrossing(101);
      expect(cb).not.toHaveBeenCalled();
    });

    it('does not fire on the first call (no previous price)', () => {
      const alert = makeAlert(100, { triggerMode: 'crossing-either' });
      const cb = vi.fn();
      alert.onTriggered(cb);

      alert.checkCrossing(101); // first call, no previous
      expect(cb).not.toHaveBeenCalled();
    });

    it('does not fire when price stays on same side', () => {
      const alert = makeAlert(100, { triggerMode: 'crossing-either' });
      const cb = vi.fn();
      alert.onTriggered(cb);

      alert.checkCrossing(95);
      alert.checkCrossing(96);
      alert.checkCrossing(97);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('onTriggered / offTriggered', () => {
    it('supports multiple callbacks', () => {
      const alert = makeAlert(100);
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      alert.onTriggered(cb1);
      alert.onTriggered(cb2);

      alert.checkCrossing(99);
      alert.checkCrossing(101);
      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
    });

    it('removes callback with offTriggered', () => {
      const alert = makeAlert(100);
      const cb = vi.fn();
      alert.onTriggered(cb);
      alert.offTriggered(cb);

      alert.checkCrossing(99);
      alert.checkCrossing(101);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('serialize', () => {
    it('returns serializable object with id and options', () => {
      const alert = makeAlert(150, { color: '#00FF00', title: 'Buy' });
      const data = alert.serialize();
      expect(data.id).toBe('test_1');
      expect(data.options.price).toBe(150);
      expect(data.options.color).toBe('#00FF00');
      expect(data.options.title).toBe('Buy');
    });
  });
});
