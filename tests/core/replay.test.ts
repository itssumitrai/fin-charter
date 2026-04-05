import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReplayManager } from '@/core/replay';
import type { ColumnStore } from '@/core/types';

function makeStore(length: number): ColumnStore {
  const time = new Float64Array(length);
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    time[i] = 1000 + i * 60;
    open[i] = 100 + i;
    high[i] = 110 + i;
    low[i] = 90 + i;
    close[i] = 105 + i;
    volume[i] = 1000;
  }
  return { time, open, high, low, close, volume, length };
}

describe('ReplayManager', () => {
  let replay: ReplayManager;

  beforeEach(() => {
    vi.useFakeTimers();
    replay = new ReplayManager();
  });

  afterEach(() => {
    replay.stop();
    vi.useRealTimers();
  });

  it('starts inactive', () => {
    expect(replay.active).toBe(false);
    expect(replay.playing).toBe(false);
  });

  it('activates on start', () => {
    const store = makeStore(10);
    replay.start(store, 2);
    expect(replay.active).toBe(true);
    expect(replay.playing).toBe(true);
    expect(replay.currentIndex).toBe(2);
  });

  it('steps forward and fires bar callback', () => {
    const store = makeStore(10);
    const cb = vi.fn();
    replay.onBar(cb);
    replay.start(store, 3);

    const stepped = replay.stepForward();
    expect(stepped).toBe(true);
    expect(replay.currentIndex).toBe(4);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({
      type: 'bar',
      barIndex: 4,
    }));
    expect(cb.mock.calls[0][0].bar.time).toBe(store.time[4]);
  });

  it('steps backward', () => {
    const store = makeStore(10);
    replay.start(store, 5);
    expect(replay.stepBackward()).toBe(true);
    expect(replay.currentIndex).toBe(4);
  });

  it('cannot step before index 0', () => {
    const store = makeStore(10);
    replay.start(store, 0);
    expect(replay.stepBackward()).toBe(false);
  });

  it('fires end event when reaching last bar', () => {
    const store = makeStore(5);
    const cb = vi.fn();
    replay.onBar(cb);
    replay.start(store, 3);

    replay.stepForward(); // index 4 = last bar
    const endCall = cb.mock.calls.find((c: unknown[]) => (c[0] as { type: string }).type === 'end');
    expect(endCall).toBeDefined();
    expect(replay.playing).toBe(false);
  });

  it('pauses and resumes', () => {
    const store = makeStore(10);
    const cb = vi.fn();
    replay.onBar(cb);
    replay.start(store, 0);

    replay.pause();
    expect(replay.playing).toBe(false);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ type: 'pause' }));

    replay.resume();
    expect(replay.playing).toBe(true);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ type: 'resume' }));
  });

  it('auto-advances via timer at 1x speed', () => {
    const store = makeStore(10);
    const cb = vi.fn();
    replay.onBar(cb);
    replay.start(store, 0);

    // At 1x speed, base interval is 500ms
    vi.advanceTimersByTime(500);
    expect(replay.currentIndex).toBe(1);

    vi.advanceTimersByTime(500);
    expect(replay.currentIndex).toBe(2);
  });

  it('respects speed multiplier', () => {
    const store = makeStore(20);
    replay.start(store, 0, { speed: 5 });
    expect(replay.speed).toBe(5);

    // At 5x speed, interval is 500/5 = 100ms
    vi.advanceTimersByTime(100);
    expect(replay.currentIndex).toBe(1);
  });

  it('setSpeed changes interval during playback', () => {
    const store = makeStore(20);
    replay.start(store, 0, { speed: 1 });

    replay.setSpeed(10);
    expect(replay.speed).toBe(10);

    // At 10x, interval is 50ms
    vi.advanceTimersByTime(50);
    expect(replay.currentIndex).toBe(1);
  });

  it('stop resets state', () => {
    const store = makeStore(10);
    replay.start(store, 5);
    replay.stop();
    expect(replay.active).toBe(false);
    expect(replay.playing).toBe(false);
    expect(replay.currentIndex).toBe(0);
  });

  it('offBar removes callback', () => {
    const store = makeStore(10);
    const cb = vi.fn();
    replay.onBar(cb);
    replay.offBar(cb);
    replay.start(store, 0);
    replay.stepForward();
    expect(cb).not.toHaveBeenCalled();
  });
});
