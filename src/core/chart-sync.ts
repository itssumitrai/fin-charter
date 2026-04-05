// ─── Multi-chart Synchronization ────────────────────────────────────────────

/**
 * Minimal chart interface required for synchronization.
 * Compatible with IChartApi but allows lightweight mocking in tests.
 */
export interface ISyncableChart {
  subscribeCrosshairMove(callback: (state: SyncCrosshairState | null) => void): void;
  unsubscribeCrosshairMove(callback: (state: SyncCrosshairState | null) => void): void;
  subscribeVisibleRangeChange(callback: (range: { from: number; to: number } | null) => void): void;
  unsubscribeVisibleRangeChange(callback: (range: { from: number; to: number } | null) => void): void;
  setVisibleRange(from: number, to: number): void;
}

export interface SyncCrosshairState {
  time: number;
  price: number;
  x: number;
  y: number;
  barIndex: number;
}

export type CrosshairSyncCallback = (
  sourceChart: ISyncableChart,
  state: SyncCrosshairState | null,
) => void;

export type TimeScaleSyncCallback = (
  sourceChart: ISyncableChart,
  range: { from: number; to: number },
) => void;

interface ChartEntry {
  chart: ISyncableChart;
  crosshairHandler: (state: SyncCrosshairState | null) => void;
  rangeHandler: (range: { from: number; to: number } | null) => void;
}

/**
 * ChartSyncGroup synchronizes multiple chart instances so that crosshair
 * movement and time-scale panning/zooming on one chart is mirrored to all
 * others in the group.
 *
 * Usage:
 * ```ts
 * const group = new ChartSyncGroup();
 * group.addChart(chart1);
 * group.addChart(chart2);
 * group.syncCrosshair();   // enable crosshair sync
 * group.syncTimeScale();   // enable time-scale sync
 * // later:
 * group.dispose();
 * ```
 */
export class ChartSyncGroup {
  private _entries: ChartEntry[] = [];
  private _crosshairSyncing = false;
  private _timeScaleSyncing = false;
  private _disposed = false;

  /** Guard flag to prevent re-entrant sync loops. */
  private _broadcasting = false;

  private _crosshairCallbacks: CrosshairSyncCallback[] = [];
  private _timeScaleCallbacks: TimeScaleSyncCallback[] = [];

  /** Add a chart to the sync group. */
  addChart(chart: ISyncableChart): void {
    if (this._disposed) return;
    if (this._entries.some((e) => e.chart === chart)) return;

    const crosshairHandler = (state: SyncCrosshairState | null) => {
      this._onCrosshairMove(chart, state);
    };
    const rangeHandler = (range: { from: number; to: number } | null) => {
      this._onVisibleRangeChange(chart, range);
    };

    const entry: ChartEntry = { chart, crosshairHandler, rangeHandler };
    this._entries.push(entry);

    if (this._crosshairSyncing) {
      chart.subscribeCrosshairMove(crosshairHandler);
    }
    if (this._timeScaleSyncing) {
      chart.subscribeVisibleRangeChange(rangeHandler);
    }
  }

  /** Remove a chart from the sync group. */
  removeChart(chart: ISyncableChart): void {
    const idx = this._entries.findIndex((e) => e.chart === chart);
    if (idx < 0) return;

    const entry = this._entries[idx];
    chart.unsubscribeCrosshairMove(entry.crosshairHandler);
    chart.unsubscribeVisibleRangeChange(entry.rangeHandler);
    this._entries.splice(idx, 1);
  }

  /** Enable crosshair synchronization across all charts in the group. */
  syncCrosshair(): void {
    if (this._crosshairSyncing || this._disposed) return;
    this._crosshairSyncing = true;
    for (const entry of this._entries) {
      entry.chart.subscribeCrosshairMove(entry.crosshairHandler);
    }
  }

  /** Enable time-scale synchronization across all charts in the group. */
  syncTimeScale(): void {
    if (this._timeScaleSyncing || this._disposed) return;
    this._timeScaleSyncing = true;
    for (const entry of this._entries) {
      entry.chart.subscribeVisibleRangeChange(entry.rangeHandler);
    }
  }

  /** Subscribe to crosshair sync events for custom handling. */
  onCrosshairSync(callback: CrosshairSyncCallback): void {
    this._crosshairCallbacks.push(callback);
  }

  /** Subscribe to time-scale sync events for custom handling. */
  onTimeScaleSync(callback: TimeScaleSyncCallback): void {
    this._timeScaleCallbacks.push(callback);
  }

  /** Get the number of charts in the group. */
  get chartCount(): number {
    return this._entries.length;
  }

  /** Whether crosshair sync is active. */
  get isCrosshairSyncing(): boolean {
    return this._crosshairSyncing;
  }

  /** Whether time-scale sync is active. */
  get isTimeScaleSyncing(): boolean {
    return this._timeScaleSyncing;
  }

  /** Tear down all subscriptions and clear charts. */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;

    for (const entry of this._entries) {
      entry.chart.unsubscribeCrosshairMove(entry.crosshairHandler);
      entry.chart.unsubscribeVisibleRangeChange(entry.rangeHandler);
    }
    this._entries = [];
    this._crosshairCallbacks = [];
    this._timeScaleCallbacks = [];
    this._crosshairSyncing = false;
    this._timeScaleSyncing = false;
  }

  // ── Internal handlers ──────────────────────────────────────────────────

  private _onCrosshairMove(source: ISyncableChart, state: SyncCrosshairState | null): void {
    if (this._broadcasting || !this._crosshairSyncing) return;
    this._broadcasting = true;
    try {
      for (const cb of this._crosshairCallbacks) {
        cb(source, state);
      }
    } finally {
      this._broadcasting = false;
    }
  }

  private _onVisibleRangeChange(source: ISyncableChart, range: { from: number; to: number } | null): void {
    if (this._broadcasting || !this._timeScaleSyncing || !range) return;
    this._broadcasting = true;
    try {
      for (const entry of this._entries) {
        if (entry.chart !== source) {
          entry.chart.setVisibleRange(range.from, range.to);
        }
      }
      for (const cb of this._timeScaleCallbacks) {
        cb(source, range);
      }
    } finally {
      this._broadcasting = false;
    }
  }
}
