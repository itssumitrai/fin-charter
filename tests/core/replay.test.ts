import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReplayManager } from '@/core/replay';
import type { ColumnStore } from '@/core/types';
import type { ReplayEvent } from '@/core/replay';

function makeStore(length: number): ColumnStore {
  const capacity = Math.max(length, 1);
  const time = new Float64Array(capacity);
  const open = new Float64Array(capacity);
  const high = new Float64Array(capacity);
  const low = new Float64Array(capacity);
  const close = new Float64Array(capacity);
  const volume = new Float64Array(capacity);
  for (let i = 0; i < length; i++) {
    time[i] = 1000 + i * 60;
    open[i] = 100 + i;
    high[i] = 110 + i;
    low[i] = 90 + i;
    close[i] = 105 + i;
    volume[i] = 1000;
  }
  return { time, open, high, low, close, volume, length, capacity };
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

  it('steps forward and fires bar event with discriminated type', () => {
    const store = makeStore(10);
    const cb = vi.fn();
    replay.onEvent(cb);
    replay.start(store, 3);

    const stepped = replay.stepForward();
    expect(stepped).toBe(true);
    expect(replay.currentIndex).toBe(4);

    const event = cb.mock.calls[0][0] as ReplayEvent;
    expect(event.type).toBe('bar');
    if (event.type === 'bar') {
      expect(event.bar.time).toBe(store.time[4]);
      expect(event.barIndex).toBe(4);
    }
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
    replay.onEvent(cb);
    replay.start(store, 3);

    replay.stepForward(); // index 4 = last bar
    const endCall = cb.mock.calls.find((c: unknown[]) => (c[0] as ReplayEvent).type === 'end');
    expect(endCall).toBeDefined();
    expect(replay.playing).toBe(false);
  });

  it('pauses and resumes', () => {
    const store = makeStore(10);
    const cb = vi.fn();
    replay.onEvent(cb);
    replay.start(store, 0);

    replay.pause();
    expect(replay.playing).toBe(false);
    const pauseCall = cb.mock.calls.find((c: unknown[]) => (c[0] as ReplayEvent).type === 'pause');
    expect(pauseCall).toBeDefined();

    replay.resume();
    expect(replay.playing).toBe(true);
    const resumeCall = cb.mock.calls.find((c: unknown[]) => (c[0] as ReplayEvent).type === 'resume');
    expect(resumeCall).toBeDefined();
  });

  it('auto-advances via timer at 1x speed', () => {
    const store = makeStore(10);
    replay.start(store, 0);

    vi.advanceTimersByTime(500);
    expect(replay.currentIndex).toBe(1);

    vi.advanceTimersByTime(500);
    expect(replay.currentIndex).toBe(2);
  });

  it('respects speed multiplier', () => {
    const store = makeStore(20);
    replay.start(store, 0, { speed: 5 });
    expect(replay.speed).toBe(5);

    vi.advanceTimersByTime(100);
    expect(replay.currentIndex).toBe(1);
  });

  it('setSpeed changes interval during playback', () => {
    const store = makeStore(20);
    replay.start(store, 0, { speed: 1 });

    replay.setSpeed(10);
    expect(replay.speed).toBe(10);

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

  it('offEvent removes callback', () => {
    const store = makeStore(10);
    const cb = vi.fn();
    replay.onEvent(cb);
    replay.offEvent(cb);
    replay.start(store, 0);
    replay.stepForward();
    expect(cb).not.toHaveBeenCalled();
  });

  // Edge cases from review
  it('does not start playing when fromIndex is at last bar', () => {
    const store = makeStore(5);
    const cb = vi.fn();
    replay.onEvent(cb);
    replay.start(store, 4); // last bar
    expect(replay.playing).toBe(false);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ type: 'end' }));
  });

  it('handles empty store gracefully', () => {
    const store = makeStore(0);
    replay.start(store, 0);
    expect(replay.active).toBe(false);
    expect(replay.playing).toBe(false);
  });

  it('resume does nothing when already at end', () => {
    const store = makeStore(5);
    replay.start(store, 3);
    replay.stepForward(); // reaches end
    expect(replay.playing).toBe(false);
    replay.resume();
    expect(replay.playing).toBe(false); // should not resume
  });

  it('timer sets playing=false when stepForward fails', () => {
    const store = makeStore(3);
    replay.start(store, 1);

    // Advance timer: index 1→2 (last bar, end fires, playing=false)
    vi.advanceTimersByTime(500);
    expect(replay.currentIndex).toBe(2);
    expect(replay.playing).toBe(false);
  });
});
