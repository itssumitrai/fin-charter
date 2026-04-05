import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChartAccessibility } from '@/core/accessibility';
import type { BarData } from '@/core/accessibility';

describe('ChartAccessibility', () => {
  let container: HTMLElement;
  let a11y: ChartAccessibility;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    a11y = new ChartAccessibility();
  });

  afterEach(() => {
    a11y.dispose();
    container.remove();
  });

  describe('createAriaLiveRegion', () => {
    it('creates a live region element inside the container', () => {
      const region = a11y.createAriaLiveRegion(container);
      expect(region).toBeTruthy();
      expect(region.getAttribute('role')).toBe('status');
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('aria-atomic')).toBe('true');
      expect(container.contains(region)).toBe(true);
    });

    it('sets role=img on container if no role set', () => {
      a11y.createAriaLiveRegion(container);
      expect(container.getAttribute('role')).toBe('img');
    });

    it('does not override existing role on container', () => {
      container.setAttribute('role', 'application');
      a11y.createAriaLiveRegion(container);
      expect(container.getAttribute('role')).toBe('application');
    });

    it('visually hides the live region', () => {
      const region = a11y.createAriaLiveRegion(container);
      expect(region.style.position).toBe('absolute');
      expect(region.style.overflow).toBe('hidden');
      expect(region.style.width).toBe('1px');
      expect(region.style.height).toBe('1px');
    });

    it('throws after dispose', () => {
      a11y.dispose();
      expect(() => a11y.createAriaLiveRegion(container)).toThrow('disposed');
    });
  });

  describe('announcePrice', () => {
    it('announces price going up', () => {
      a11y.createAriaLiveRegion(container);
      a11y.announcePrice(155.50, 2.30);
      expect(a11y.liveRegion!.textContent).toBe('Price 155.50, up 2.30');
    });

    it('announces price going down', () => {
      a11y.createAriaLiveRegion(container);
      a11y.announcePrice(148.20, -3.10);
      expect(a11y.liveRegion!.textContent).toBe('Price 148.20, down 3.10');
    });

    it('announces unchanged price', () => {
      a11y.createAriaLiveRegion(container);
      a11y.announcePrice(150.00, 0);
      expect(a11y.liveRegion!.textContent).toBe('Price 150.00, unchanged 0.00');
    });

    it('does nothing without live region', () => {
      // No createAriaLiveRegion call
      expect(() => a11y.announcePrice(100, 1)).not.toThrow();
    });
  });

  describe('announceBar', () => {
    it('announces OHLCV data', () => {
      a11y.createAriaLiveRegion(container);
      const bar: BarData = { time: 1000, open: 100, high: 110, low: 95, close: 105, volume: 50000 };
      a11y.announceBar(bar);
      expect(a11y.liveRegion!.textContent).toBe(
        'Open 100.00, High 110.00, Low 95.00, Close 105.00, Volume 50,000',
      );
    });

    it('omits volume when not provided', () => {
      a11y.createAriaLiveRegion(container);
      const bar: BarData = { time: 1000, open: 100, high: 110, low: 95, close: 105 };
      a11y.announceBar(bar);
      expect(a11y.liveRegion!.textContent).toBe(
        'Open 100.00, High 110.00, Low 95.00, Close 105.00',
      );
    });
  });

  describe('setChartDescription', () => {
    it('sets aria-label on the container', () => {
      a11y.createAriaLiveRegion(container);
      a11y.setChartDescription('AAPL daily candlestick chart');
      expect(container.getAttribute('aria-label')).toBe('AAPL daily candlestick chart');
      expect(a11y.getChartDescription()).toBe('AAPL daily candlestick chart');
    });

    it('persists description even without container', () => {
      a11y.setChartDescription('Test');
      expect(a11y.getChartDescription()).toBe('Test');
    });
  });

  describe('focusChart', () => {
    it('makes container focusable and focuses it', () => {
      a11y.createAriaLiveRegion(container);
      a11y.focusChart();
      expect(container.getAttribute('tabindex')).toBe('0');
    });

    it('does not override existing tabindex', () => {
      container.setAttribute('tabindex', '-1');
      a11y.createAriaLiveRegion(container);
      a11y.focusChart();
      expect(container.getAttribute('tabindex')).toBe('-1');
    });

    it('does nothing without container', () => {
      expect(() => a11y.focusChart()).not.toThrow();
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      a11y.setTotalBars(10);
    });

    it('starts with no focused bar', () => {
      expect(a11y.focusedBarIndex).toBe(-1);
    });

    it('focusNextBar moves from -1 to 0 implicitly via focusPreviousBar then focusNextBar', () => {
      a11y.focusPreviousBar(); // should go to 0 from -1
      expect(a11y.focusedBarIndex).toBe(0);
      expect(a11y.focusNextBar()).toBe(1);
    });

    it('focusNextBar increments', () => {
      a11y.focusFirstBar();
      expect(a11y.focusNextBar()).toBe(1);
      expect(a11y.focusNextBar()).toBe(2);
    });

    it('focusNextBar stops at last bar', () => {
      a11y.focusLastBar();
      expect(a11y.focusedBarIndex).toBe(9);
      expect(a11y.focusNextBar()).toBe(9);
    });

    it('focusPreviousBar decrements', () => {
      a11y.focusLastBar();
      expect(a11y.focusPreviousBar()).toBe(8);
    });

    it('focusPreviousBar stops at first bar', () => {
      a11y.focusFirstBar();
      expect(a11y.focusPreviousBar()).toBe(0);
    });

    it('focusFirstBar goes to 0', () => {
      expect(a11y.focusFirstBar()).toBe(0);
    });

    it('focusLastBar goes to last index', () => {
      expect(a11y.focusLastBar()).toBe(9);
    });

    it('returns -1 when no bars', () => {
      a11y.setTotalBars(0);
      expect(a11y.focusNextBar()).toBe(-1);
      expect(a11y.focusPreviousBar()).toBe(-1);
      expect(a11y.focusFirstBar()).toBe(-1);
      expect(a11y.focusLastBar()).toBe(-1);
    });

    it('resetFocus clears focused bar', () => {
      a11y.focusFirstBar();
      a11y.resetFocus();
      expect(a11y.focusedBarIndex).toBe(-1);
    });

    it('totalBars getter works', () => {
      expect(a11y.totalBars).toBe(10);
    });
  });

  describe('dispose', () => {
    it('removes live region from DOM', () => {
      a11y.createAriaLiveRegion(container);
      expect(container.childNodes.length).toBe(1);
      a11y.dispose();
      expect(container.childNodes.length).toBe(0);
    });

    it('nulls out liveRegion', () => {
      a11y.createAriaLiveRegion(container);
      a11y.dispose();
      expect(a11y.liveRegion).toBeNull();
    });

    it('is idempotent', () => {
      a11y.createAriaLiveRegion(container);
      a11y.dispose();
      expect(() => a11y.dispose()).not.toThrow();
    });

    it('announcePrice is no-op after dispose', () => {
      a11y.createAriaLiveRegion(container);
      a11y.dispose();
      expect(() => a11y.announcePrice(100, 1)).not.toThrow();
    });
  });
});
