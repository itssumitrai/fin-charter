import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataFeedManager } from '@/core/data-feed';
import type { IDataFeed } from '@/core/data-feed';
import type { Bar } from '@/core/types';

function makeBars(from: number, to: number, step = 86400): Bar[] {
  const bars: Bar[] = [];
  for (let t = from; t <= to; t += step) {
    bars.push({ time: t, open: 100, high: 110, low: 90, close: 105, volume: 1000 });
  }
  return bars;
}

function makeMockFeed(bars: Bar[] = []): IDataFeed {
  return {
    getBars: vi.fn().mockResolvedValue(bars),
  };
}

describe('DataFeedManager', () => {
  describe('getBars', () => {
    it('fetches from the underlying feed', async () => {
      const bars = makeBars(1000, 5000);
      const feed = makeMockFeed(bars);
      const mgr = new DataFeedManager(feed);

      const result = await mgr.getBars('AAPL', 'D', 1000, 5000);
      expect(result).toEqual(bars);
      expect(feed.getBars).toHaveBeenCalledWith('AAPL', 'D', 1000, 5000);
    });

    it('returns cached data on second request for same range', async () => {
      const bars = makeBars(1000, 5000);
      const feed = makeMockFeed(bars);
      const mgr = new DataFeedManager(feed);

      await mgr.getBars('AAPL', 'D', 1000, 5000);
      const result = await mgr.getBars('AAPL', 'D', 1000, 5000);

      expect(result).toEqual(bars);
      expect(feed.getBars).toHaveBeenCalledTimes(1); // Not called again
    });

    it('returns subset from cache for sub-range request', async () => {
      const bars = makeBars(1000, 10000);
      const feed = makeMockFeed(bars);
      const mgr = new DataFeedManager(feed);

      await mgr.getBars('AAPL', 'D', 1000, 10000);
      const result = await mgr.getBars('AAPL', 'D', 3000, 7000);

      expect(feed.getBars).toHaveBeenCalledTimes(1);
      expect(result.every((b) => b.time >= 3000 && b.time <= 7000)).toBe(true);
    });

    it('deduplicates in-flight requests', async () => {
      const bars = makeBars(1000, 5000);
      const feed: IDataFeed = {
        getBars: vi.fn().mockImplementation(() =>
          new Promise((resolve) => setTimeout(() => resolve(bars), 10)),
        ),
      };
      const mgr = new DataFeedManager(feed);

      // Fire two identical requests simultaneously
      const [r1, r2] = await Promise.all([
        mgr.getBars('AAPL', 'D', 1000, 5000),
        mgr.getBars('AAPL', 'D', 1000, 5000),
      ]);

      expect(feed.getBars).toHaveBeenCalledTimes(1);
      expect(r1).toEqual(r2);
    });

    it('separates cache by symbol and resolution', async () => {
      const aaplBars = makeBars(1000, 5000);
      const googBars = makeBars(1000, 5000);
      const feed: IDataFeed = {
        getBars: vi.fn()
          .mockResolvedValueOnce(aaplBars)
          .mockResolvedValueOnce(googBars),
      };
      const mgr = new DataFeedManager(feed);

      await mgr.getBars('AAPL', 'D', 1000, 5000);
      await mgr.getBars('GOOG', 'D', 1000, 5000);

      expect(feed.getBars).toHaveBeenCalledTimes(2);
    });
  });

  describe('loading', () => {
    it('tracks loading state', async () => {
      let resolvePromise!: (bars: Bar[]) => void;
      const feed: IDataFeed = {
        getBars: vi.fn().mockImplementation(() =>
          new Promise((resolve) => { resolvePromise = resolve; }),
        ),
      };
      const mgr = new DataFeedManager(feed);

      expect(mgr.loading).toBe(false);
      const promise = mgr.getBars('AAPL', 'D', 1000, 5000);
      expect(mgr.loading).toBe(true);
      resolvePromise([]);
      await promise;
      expect(mgr.loading).toBe(false);
    });
  });

  describe('findGaps', () => {
    it('returns full range when cache is empty', () => {
      const feed = makeMockFeed();
      const mgr = new DataFeedManager(feed);
      const gaps = mgr.findGaps('AAPL', 'D', 1000, 5000);
      expect(gaps).toEqual([{ from: 1000, to: 5000 }]);
    });

    it('finds gaps between cached ranges', async () => {
      const feed: IDataFeed = {
        getBars: vi.fn().mockResolvedValue([]),
      };
      const mgr = new DataFeedManager(feed);

      // Cache two ranges with a gap between them
      await mgr.getBars('AAPL', 'D', 1000, 3000);
      await mgr.getBars('AAPL', 'D', 5000, 7000);

      const gaps = mgr.findGaps('AAPL', 'D', 1000, 7000);
      expect(gaps).toEqual([{ from: 3000, to: 5000 }]);
    });

    it('returns no gaps when range is fully covered', async () => {
      const feed = makeMockFeed([]);
      const mgr = new DataFeedManager(feed);

      await mgr.getBars('AAPL', 'D', 1000, 10000);
      const gaps = mgr.findGaps('AAPL', 'D', 3000, 7000);
      expect(gaps).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('clears cache for specific symbol+resolution', async () => {
      const feed = makeMockFeed(makeBars(1000, 5000));
      const mgr = new DataFeedManager(feed);

      await mgr.getBars('AAPL', 'D', 1000, 5000);
      expect(mgr.cacheSize('AAPL', 'D')).toBe(1);

      mgr.clearCache('AAPL', 'D');
      expect(mgr.cacheSize('AAPL', 'D')).toBe(0);
    });

    it('clears all cache when no args provided', async () => {
      const feed = makeMockFeed(makeBars(1000, 5000));
      const mgr = new DataFeedManager(feed);

      await mgr.getBars('AAPL', 'D', 1000, 5000);
      await mgr.getBars('GOOG', 'D', 1000, 5000);

      mgr.clearCache();
      expect(mgr.cacheSize('AAPL', 'D')).toBe(0);
      expect(mgr.cacheSize('GOOG', 'D')).toBe(0);
    });
  });

  describe('cache limit', () => {
    it('enforces maxCacheEntries', async () => {
      const feed = makeMockFeed([]);
      const mgr = new DataFeedManager(feed, { maxCacheEntries: 3 });

      for (let i = 0; i < 5; i++) {
        await mgr.getBars('AAPL', 'D', i * 1000, (i + 1) * 1000);
      }

      expect(mgr.cacheSize('AAPL', 'D')).toBe(3);
    });
  });
});
