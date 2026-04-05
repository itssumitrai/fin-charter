import { describe, it, expect, vi } from 'vitest';
import { CustomIndicatorRegistry } from '@/core/custom-indicator';
import type { CustomIndicatorDescriptor, ColumnStore } from '@/core/types';

function makeStore(length: number): ColumnStore {
  const time = new Float64Array(length);
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    time[i] = 1000 + i * 60;
    close[i] = 100 + i;
    open[i] = close[i];
    high[i] = close[i] + 5;
    low[i] = close[i] - 5;
    volume[i] = 1000;
  }
  return { time, open, high, low, close, volume, length };
}

function makeVWAPDescriptor(): CustomIndicatorDescriptor {
  return {
    name: 'custom-vwap-bands',
    label: 'VWAP Bands',
    overlay: true,
    params: [
      { name: 'multiplier', defaultValue: 2, min: 0.5, max: 5, step: 0.5 },
    ],
    outputs: [
      { name: 'upper', color: '#4CAF50', style: 'line' },
      { name: 'vwap', color: '#2196F3', style: 'line' },
      { name: 'lower', color: '#F44336', style: 'line' },
    ],
    compute: (store, params) => {
      const len = store.length;
      const upper = new Float64Array(len);
      const vwap = new Float64Array(len);
      const lower = new Float64Array(len);
      const mult = params.multiplier;

      for (let i = 0; i < len; i++) {
        const mid = (store.high[i] + store.low[i] + store.close[i]) / 3;
        const band = mid * 0.01 * mult;
        vwap[i] = mid;
        upper[i] = mid + band;
        lower[i] = mid - band;
      }

      return new Map([['upper', upper], ['vwap', vwap], ['lower', lower]]);
    },
  };
}

describe('CustomIndicatorRegistry', () => {
  describe('register', () => {
    it('registers a custom indicator', () => {
      const registry = new CustomIndicatorRegistry();
      registry.register(makeVWAPDescriptor());
      expect(registry.has('custom-vwap-bands')).toBe(true);
    });

    it('throws on duplicate registration', () => {
      const registry = new CustomIndicatorRegistry();
      registry.register(makeVWAPDescriptor());
      expect(() => registry.register(makeVWAPDescriptor())).toThrow('already registered');
    });

    it('throws when compute is missing', () => {
      const registry = new CustomIndicatorRegistry();
      const desc = { ...makeVWAPDescriptor(), compute: undefined } as unknown as CustomIndicatorDescriptor;
      expect(() => registry.register(desc)).toThrow('must have a compute function');
    });

    it('throws when outputs is empty', () => {
      const registry = new CustomIndicatorRegistry();
      const desc = { ...makeVWAPDescriptor(), outputs: [] };
      expect(() => registry.register(desc)).toThrow('must have at least one output');
    });
  });

  describe('unregister', () => {
    it('removes a registered indicator', () => {
      const registry = new CustomIndicatorRegistry();
      registry.register(makeVWAPDescriptor());
      expect(registry.unregister('custom-vwap-bands')).toBe(true);
      expect(registry.has('custom-vwap-bands')).toBe(false);
    });

    it('returns false for non-existent indicator', () => {
      const registry = new CustomIndicatorRegistry();
      expect(registry.unregister('nonexistent')).toBe(false);
    });
  });

  describe('list / get / getAll', () => {
    it('lists registered indicator names', () => {
      const registry = new CustomIndicatorRegistry();
      registry.register(makeVWAPDescriptor());
      expect(registry.list()).toEqual(['custom-vwap-bands']);
    });

    it('gets descriptor by name', () => {
      const registry = new CustomIndicatorRegistry();
      const desc = makeVWAPDescriptor();
      registry.register(desc);
      expect(registry.get('custom-vwap-bands')).toBe(desc);
    });

    it('returns undefined for unregistered name', () => {
      const registry = new CustomIndicatorRegistry();
      expect(registry.get('nope')).toBeUndefined();
    });
  });

  describe('compute', () => {
    it('computes outputs using the registered compute function', () => {
      const registry = new CustomIndicatorRegistry();
      registry.register(makeVWAPDescriptor());
      const store = makeStore(10);

      const outputs = registry.compute('custom-vwap-bands', store, { multiplier: 2 });
      expect(outputs.has('upper')).toBe(true);
      expect(outputs.has('vwap')).toBe(true);
      expect(outputs.has('lower')).toBe(true);
      expect(outputs.get('vwap')!.length).toBe(10);
    });

    it('uses default params when not provided', () => {
      const registry = new CustomIndicatorRegistry();
      registry.register(makeVWAPDescriptor());
      const store = makeStore(5);

      const outputs = registry.compute('custom-vwap-bands', store, {});
      // Should use defaultValue of 2 for multiplier
      expect(outputs.get('upper')![0]).toBeGreaterThan(outputs.get('vwap')![0]);
    });

    it('throws for unregistered indicator', () => {
      const registry = new CustomIndicatorRegistry();
      expect(() => registry.compute('nope', makeStore(1), {})).toThrow('not registered');
    });
  });
});
