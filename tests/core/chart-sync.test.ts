import { describe, it, expect, vi } from 'vitest';
import { ChartSyncGroup } from '@/core/chart-sync';
import type { ISyncableChart, SyncCrosshairState } from '@/core/chart-sync';

function createMockChart(): ISyncableChart & {
  fireCrosshair: (state: SyncCrosshairState | null) => void;
  fireRange: (range: { from: number; to: number } | null) => void;
  setVisibleRange: ReturnType<typeof vi.fn>;
} {
  const crosshairCbs: Array<(state: SyncCrosshairState | null) => void> = [];
  const rangeCbs: Array<(range: { from: number; to: number } | null) => void> = [];

  return {
    subscribeCrosshairMove(cb) { crosshairCbs.push(cb); },
    unsubscribeCrosshairMove(cb) {
      const idx = crosshairCbs.indexOf(cb);
      if (idx >= 0) crosshairCbs.splice(idx, 1);
    },
    subscribeVisibleRangeChange(cb) { rangeCbs.push(cb); },
    unsubscribeVisibleRangeChange(cb) {
      const idx = rangeCbs.indexOf(cb);
      if (idx >= 0) rangeCbs.splice(idx, 1);
    },
    setVisibleRange: vi.fn(),
    fireCrosshair(state) { for (const cb of [...crosshairCbs]) cb(state); },
    fireRange(range) { for (const cb of [...rangeCbs]) cb(range); },
  };
}

function makeCrosshairState(time = 1000): SyncCrosshairState {
  return { time, price: 150, x: 100, y: 200, barIndex: 5 };
}

describe('ChartSyncGroup', () => {
  describe('addChart / removeChart', () => {
    it('tracks chart count', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      const c2 = createMockChart();
      group.addChart(c1);
      group.addChart(c2);
      expect(group.chartCount).toBe(2);
      group.removeChart(c1);
      expect(group.chartCount).toBe(1);
      group.dispose();
    });

    it('ignores duplicate adds', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      group.addChart(c1);
      group.addChart(c1);
      expect(group.chartCount).toBe(1);
      group.dispose();
    });

    it('ignores adds after dispose', () => {
      const group = new ChartSyncGroup();
      group.dispose();
      const c1 = createMockChart();
      group.addChart(c1);
      expect(group.chartCount).toBe(0);
    });
  });

  describe('syncCrosshair', () => {
    it('fires crosshair sync callback when crosshair moves', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      const c2 = createMockChart();
      group.addChart(c1);
      group.addChart(c2);
      group.syncCrosshair();

      const cb = vi.fn();
      group.onCrosshairSync(cb);

      const state = makeCrosshairState();
      c1.fireCrosshair(state);

      expect(cb).toHaveBeenCalledWith(c1, state);
      group.dispose();
    });

    it('fires callback with null when crosshair leaves', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      group.addChart(c1);
      group.syncCrosshair();

      const cb = vi.fn();
      group.onCrosshairSync(cb);

      c1.fireCrosshair(null);
      expect(cb).toHaveBeenCalledWith(c1, null);
      group.dispose();
    });

    it('reports isCrosshairSyncing state', () => {
      const group = new ChartSyncGroup();
      expect(group.isCrosshairSyncing).toBe(false);
      group.syncCrosshair();
      expect(group.isCrosshairSyncing).toBe(true);
      group.dispose();
    });

    it('is idempotent', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      group.addChart(c1);
      group.syncCrosshair();
      group.syncCrosshair(); // second call should be no-op

      const cb = vi.fn();
      group.onCrosshairSync(cb);
      c1.fireCrosshair(makeCrosshairState());
      // should only fire once (not twice from double-subscribe)
      expect(cb).toHaveBeenCalledTimes(1);
      group.dispose();
    });

    it('subscribes charts added after syncCrosshair is enabled', () => {
      const group = new ChartSyncGroup();
      group.syncCrosshair();

      const c1 = createMockChart();
      group.addChart(c1);

      const cb = vi.fn();
      group.onCrosshairSync(cb);
      c1.fireCrosshair(makeCrosshairState());
      expect(cb).toHaveBeenCalledTimes(1);
      group.dispose();
    });
  });

  describe('syncTimeScale', () => {
    it('propagates visible range to other charts', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      const c2 = createMockChart();
      const c3 = createMockChart();
      group.addChart(c1);
      group.addChart(c2);
      group.addChart(c3);
      group.syncTimeScale();

      c1.fireRange({ from: 100, to: 200 });

      expect(c2.setVisibleRange).toHaveBeenCalledWith(100, 200);
      expect(c3.setVisibleRange).toHaveBeenCalledWith(100, 200);
      // source chart should NOT receive its own range back
      expect(c1.setVisibleRange).not.toHaveBeenCalled();
      group.dispose();
    });

    it('ignores null range', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      const c2 = createMockChart();
      group.addChart(c1);
      group.addChart(c2);
      group.syncTimeScale();

      c1.fireRange(null);
      expect(c2.setVisibleRange).not.toHaveBeenCalled();
      group.dispose();
    });

    it('fires time-scale sync callback', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      group.addChart(c1);
      group.syncTimeScale();

      const cb = vi.fn();
      group.onTimeScaleSync(cb);

      c1.fireRange({ from: 50, to: 150 });
      expect(cb).toHaveBeenCalledWith(c1, { from: 50, to: 150 });
      group.dispose();
    });

    it('reports isTimeScaleSyncing state', () => {
      const group = new ChartSyncGroup();
      expect(group.isTimeScaleSyncing).toBe(false);
      group.syncTimeScale();
      expect(group.isTimeScaleSyncing).toBe(true);
      group.dispose();
    });

    it('subscribes charts added after syncTimeScale is enabled', () => {
      const group = new ChartSyncGroup();
      group.syncTimeScale();

      const c1 = createMockChart();
      const c2 = createMockChart();
      group.addChart(c1);
      group.addChart(c2);

      c1.fireRange({ from: 10, to: 20 });
      expect(c2.setVisibleRange).toHaveBeenCalledWith(10, 20);
      group.dispose();
    });
  });

  describe('dispose', () => {
    it('unsubscribes all handlers', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      group.addChart(c1);
      group.syncCrosshair();
      group.syncTimeScale();
      group.dispose();

      const crosshairCb = vi.fn();
      const rangeCb = vi.fn();
      group.onCrosshairSync(crosshairCb);
      group.onTimeScaleSync(rangeCb);

      // firing events after dispose should not trigger callbacks
      c1.fireCrosshair(makeCrosshairState());
      c1.fireRange({ from: 0, to: 100 });
      expect(crosshairCb).not.toHaveBeenCalled();
      expect(rangeCb).not.toHaveBeenCalled();
    });

    it('clears chart count', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      group.addChart(c1);
      group.dispose();
      expect(group.chartCount).toBe(0);
    });

    it('resets syncing flags', () => {
      const group = new ChartSyncGroup();
      group.syncCrosshair();
      group.syncTimeScale();
      group.dispose();
      expect(group.isCrosshairSyncing).toBe(false);
      expect(group.isTimeScaleSyncing).toBe(false);
    });
  });

  describe('re-entrancy guard', () => {
    it('prevents infinite loops from setVisibleRange triggering range change', () => {
      const group = new ChartSyncGroup();
      const c1 = createMockChart();
      const c2 = createMockChart();

      // Make c2.setVisibleRange fire a range change on c2 (simulating re-entry)
      c2.setVisibleRange.mockImplementation(() => {
        c2.fireRange({ from: 100, to: 200 });
      });

      group.addChart(c1);
      group.addChart(c2);
      group.syncTimeScale();

      // This should not cause infinite recursion
      expect(() => c1.fireRange({ from: 100, to: 200 })).not.toThrow();
      group.dispose();
    });
  });
});
