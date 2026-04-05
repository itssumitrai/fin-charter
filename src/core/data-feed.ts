import type { Bar } from './types';

/**
 * IDataFeed — abstraction for fetching OHLCV bar data with pagination.
 *
 * Implementations provide a `getBars()` method that the chart calls when
 * the user scrolls to the edge and more historical data is needed.
 */
export interface IDataFeed {
  /**
   * Fetch bars for the given symbol and resolution within the time range.
   * @param symbol - Symbol identifier (e.g., 'AAPL', 'BTCUSD')
   * @param resolution - Bar interval (e.g., '1', '5', '15', '60', 'D', 'W')
   * @param from - Start of range (Unix timestamp, seconds)
   * @param to - End of range (Unix timestamp, seconds)
   * @returns Promise resolving to an array of bars, sorted by time ascending.
   *          Empty array means no more data available for the requested range.
   */
  getBars(symbol: string, resolution: string, from: number, to: number): Promise<Bar[]>;
}

/**
 * CacheEntry tracks fetched ranges to avoid duplicate requests.
 */
interface CacheEntry {
  from: number;
  to: number;
  bars: Bar[];
}

export interface DataFeedManagerOptions {
  /** Maximum number of cached range entries per symbol+resolution (default: 100). */
  maxCacheEntries?: number;
}

/**
 * DataFeedManager wraps an IDataFeed with:
 * - Request deduplication (won't re-fetch the same range)
 * - Local cache with configurable size limit
 * - Gap detection for missing ranges
 * - Loading state tracking
 */
export class DataFeedManager {
  private _feed: IDataFeed;
  private _cache: Map<string, CacheEntry[]> = new Map();
  private _pendingRequests: Map<string, Promise<Bar[]>> = new Map();
  private _loading = false;
  private _maxCacheEntries: number;

  constructor(feed: IDataFeed, options: DataFeedManagerOptions = {}) {
    this._feed = feed;
    this._maxCacheEntries = options.maxCacheEntries ?? 100;
  }

  /** Whether a fetch is currently in progress. */
  get loading(): boolean {
    return this._loading;
  }

  /**
   * Fetch bars with deduplication and caching.
   * If the requested range (or a superset) is already cached, returns cached data.
   * Otherwise fetches from the underlying data feed and caches the result.
   */
  async getBars(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
  ): Promise<Bar[]> {
    const key = `${symbol}:${resolution}`;

    // Check cache first
    const cached = this._findCachedBars(key, from, to);
    if (cached !== null) return cached;

    // Deduplicate: if an identical request is in-flight, reuse it
    const requestKey = `${key}:${from}:${to}`;
    const pending = this._pendingRequests.get(requestKey);
    if (pending) return pending;

    // Fetch from feed
    this._loading = true;
    const promise = this._feed.getBars(symbol, resolution, from, to)
      .then((bars) => {
        this._addToCache(key, from, to, bars);
        return bars;
      })
      .finally(() => {
        this._pendingRequests.delete(requestKey);
        this._loading = this._pendingRequests.size > 0;
      });

    this._pendingRequests.set(requestKey, promise);
    return promise;
  }

  /**
   * Detect gaps in cached data and return the missing ranges that need fetching.
   */
  findGaps(symbol: string, resolution: string, from: number, to: number): Array<{ from: number; to: number }> {
    const key = `${symbol}:${resolution}`;
    const entries = this._cache.get(key) ?? [];
    if (entries.length === 0) return [{ from, to }];

    // Sort entries by from time
    const sorted = [...entries].sort((a, b) => a.from - b.from);
    const gaps: Array<{ from: number; to: number }> = [];

    let cursor = from;
    for (const entry of sorted) {
      if (entry.from > cursor) {
        gaps.push({ from: cursor, to: Math.min(entry.from, to) });
      }
      cursor = Math.max(cursor, entry.to);
      if (cursor >= to) break;
    }
    if (cursor < to) {
      gaps.push({ from: cursor, to });
    }

    return gaps;
  }

  /** Clear the cache for a specific symbol+resolution, or all if not specified. */
  clearCache(symbol?: string, resolution?: string): void {
    if (symbol && resolution) {
      this._cache.delete(`${symbol}:${resolution}`);
    } else {
      this._cache.clear();
    }
  }

  /** Get the number of cached entries for a symbol+resolution. */
  cacheSize(symbol: string, resolution: string): number {
    return this._cache.get(`${symbol}:${resolution}`)?.length ?? 0;
  }

  private _findCachedBars(key: string, from: number, to: number): Bar[] | null {
    const entries = this._cache.get(key);
    if (!entries) return null;

    // Look for a single entry that covers the full range
    for (const entry of entries) {
      if (entry.from <= from && entry.to >= to) {
        return entry.bars.filter((b) => b.time >= from && b.time <= to);
      }
    }
    return null;
  }

  private _addToCache(key: string, from: number, to: number, bars: Bar[]): void {
    let entries = this._cache.get(key);
    if (!entries) {
      entries = [];
      this._cache.set(key, entries);
    }

    entries.push({ from, to, bars: [...bars] });

    // Enforce max cache size
    if (entries.length > this._maxCacheEntries) {
      entries.shift(); // Remove oldest
    }
  }
}
