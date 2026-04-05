import type { Bar, ColumnStore } from './types';

export type ReplaySpeed = 1 | 2 | 5 | 10;

export type ReplayBarEvent = { type: 'bar'; barIndex: number; bar: Bar };
export type ReplayControlEvent = { type: 'pause' | 'resume' | 'end'; barIndex: number };
export type ReplayEvent = ReplayBarEvent | ReplayControlEvent;

export type ReplayEventCallback = (event: ReplayEvent) => void;

export interface ReplayOptions {
  /** Playback speed multiplier (default: 1). */
  speed?: ReplaySpeed;
}

/**
 * ReplayManager — steps through historical data bar-by-bar to simulate
 * live data streaming. Bars appear progressively as if in real-time.
 *
 * Usage:
 *   replay.start(store, fromIndex, { speed: 2 });
 *   replay.onEvent(callback); // fired for each revealed bar or control event
 *   replay.pause();
 *   replay.stepForward();
 *   replay.resume();
 *   replay.stop();
 */
export class ReplayManager {
  private _store: ColumnStore | null = null;
  private _currentIndex = 0;
  private _endIndex = 0;
  private _speed: ReplaySpeed = 1;
  private _playing = false;
  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _callbacks: ReplayEventCallback[] = [];
  private _baseIntervalMs = 500; // 500ms per bar at 1x speed

  /** Whether replay is currently active (playing or paused). */
  get active(): boolean {
    return this._store !== null;
  }

  /** Whether replay is currently playing (not paused). */
  get playing(): boolean {
    return this._playing;
  }

  /** Current bar index in the replay. */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /** Current playback speed. */
  get speed(): ReplaySpeed {
    return this._speed;
  }

  /** Subscribe to replay events. */
  onEvent(callback: ReplayEventCallback): void {
    this._callbacks.push(callback);
  }

  /** Unsubscribe from replay events. */
  offEvent(callback: ReplayEventCallback): void {
    const idx = this._callbacks.indexOf(callback);
    if (idx >= 0) this._callbacks.splice(idx, 1);
  }

  /**
   * Start replay from the given bar index.
   * Bars from 0 to fromIndex are initially visible; subsequent bars
   * are revealed progressively.
   */
  start(store: ColumnStore, fromIndex: number, options?: ReplayOptions): void {
    this.stop();
    if (store.length === 0) return;

    this._store = store;
    this._endIndex = store.length - 1;
    this._currentIndex = Math.max(0, Math.min(fromIndex, this._endIndex));
    this._speed = options?.speed ?? 1;

    // Don't start playing if already at the end
    if (this._currentIndex >= this._endIndex) {
      this._playing = false;
      this._emit({ type: 'end', barIndex: this._currentIndex });
      return;
    }

    this._playing = true;
    this._startTimer();
  }

  /** Pause playback. */
  pause(): void {
    if (!this._playing) return;
    this._playing = false;
    this._stopTimer();
    this._emit({ type: 'pause', barIndex: this._currentIndex });
  }

  /** Resume playback after pause. */
  resume(): void {
    if (this._playing || !this._store) return;
    // Don't resume if already at end
    if (this._currentIndex >= this._endIndex) return;
    this._playing = true;
    this._startTimer();
    this._emit({ type: 'resume', barIndex: this._currentIndex });
  }

  /** Step forward one bar (works while paused or playing). */
  stepForward(): boolean {
    if (!this._store || this._currentIndex >= this._endIndex) return false;
    this._currentIndex++;
    this._emitBar();
    if (this._currentIndex >= this._endIndex) {
      this._playing = false;
      this._stopTimer();
      this._emit({ type: 'end', barIndex: this._currentIndex });
    }
    return true;
  }

  /** Step backward one bar (works while paused or playing). */
  stepBackward(): boolean {
    if (!this._store || this._currentIndex <= 0) return false;
    this._currentIndex--;
    this._emitBar();
    return true;
  }

  /** Set playback speed. */
  setSpeed(speed: ReplaySpeed): void {
    this._speed = speed;
    if (this._playing) {
      this._stopTimer();
      this._startTimer();
    }
  }

  /** Stop replay and reset state. */
  stop(): void {
    this._stopTimer();
    this._store = null;
    this._currentIndex = 0;
    this._playing = false;
  }

  private _startTimer(): void {
    this._stopTimer();
    const interval = this._baseIntervalMs / this._speed;
    this._timerId = setInterval(() => {
      if (!this.stepForward()) {
        this._playing = false;
        this._stopTimer();
      }
    }, interval);
  }

  private _stopTimer(): void {
    if (this._timerId !== null) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  private _emitBar(): void {
    if (!this._store) return;
    const i = this._currentIndex;
    const bar: Bar = {
      time: this._store.time[i],
      open: this._store.open[i],
      high: this._store.high[i],
      low: this._store.low[i],
      close: this._store.close[i],
      volume: this._store.volume[i],
    };
    this._emit({ type: 'bar', barIndex: i, bar });
  }

  private _emit(event: ReplayEvent): void {
    for (const cb of this._callbacks) cb(event);
  }
}
