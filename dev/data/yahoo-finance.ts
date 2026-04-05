import type { Bar } from '@itssumitrai/fin-charter';
import type { Periodicity } from '@itssumitrai/fin-charter';

interface YahooQuote {
  timestamp: number[];
  indicators: {
    quote: [{
      open: (number | null)[];
      high: (number | null)[];
      low: (number | null)[];
      close: (number | null)[];
      volume: (number | null)[];
    }];
  };
}

interface YahooMeta {
  regularMarketPrice?: number;
  previousClose?: number;
  currency?: string;
  exchangeName?: string;
  exchangeTimezoneName?: string;
}

export interface QuoteMeta {
  price: number;
  previousClose: number;
  currency: string;
  exchange: string;
  timezone: string;
}

const INTERVAL_MAP: Record<string, { interval: string; range: string }> = {
  '1m':  { interval: '1m',  range: '1d' },
  '5m':  { interval: '5m',  range: '5d' },
  '15m': { interval: '15m', range: '5d' },
  '1h':  { interval: '1h',  range: '1mo' },
  '4h':  { interval: '1h',  range: '3mo' },  // Yahoo doesn't support 4h natively
  '1D':  { interval: '1d',  range: '1y' },
  '1W':  { interval: '1wk', range: '5y' },
  '1M':  { interval: '1mo', range: 'max' },
};

/**
 * Yahoo Finance API absolute limits: max seconds from NOW for each interval.
 * Requests with period1 older than now - limit will fail.
 */
const YAHOO_MAX_AGE: Record<string, number> = {
  '1m':  7 * 86400,         // ~7 days
  '5m':  60 * 86400,        // 60 days
  '15m': 60 * 86400,        // 60 days
  '1h':  730 * 86400,       // ~2 years
  '4h':  730 * 86400,       // same as 1h (fetches 1h then aggregates)
  '1D':  0,                 // unlimited (0 = no limit)
  '1W':  0,                 // unlimited
  '1M':  0,                 // unlimited
};

/** Per-request chunk size (seconds) to stay within Yahoo's per-request limits. */
const REQUEST_CHUNK: Record<string, number> = {
  '1m':  0,                // no extra history for 1m
  '5m':  30 * 86400,       // 30 days per chunk
  '15m': 30 * 86400,       // 30 days per chunk
  '1h':  90 * 86400,       // 90 days per chunk
  '4h':  180 * 86400,      // 180 days per chunk
  '1D':  365 * 86400,      // 1 year per chunk
  '1W':  5 * 365 * 86400,  // 5 years per chunk
  '1M':  10 * 365 * 86400, // 10 years per chunk
};

function periodicityToKey(p: Periodicity): string {
  const map: Record<string, string> = {
    minute: 'm', hour: 'h', day: 'D', week: 'W', month: 'M',
  };
  return `${p.interval}${map[p.unit] ?? p.unit}`;
}

export async function fetchBars(
  symbol: string,
  periodicity: Periodicity,
): Promise<{ bars: Bar[]; meta: QuoteMeta }> {
  const key = periodicityToKey(periodicity);
  const config = INTERVAL_MAP[key] ?? INTERVAL_MAP['1D'];

  const url = `/api/yahoo/${encodeURIComponent(symbol)}?interval=${config.interval}&range=${config.range}`;
  let resp: Response;
  try {
    resp = await fetch(url);
  } catch {
    // Proxy unavailable (e.g. static Storybook build) — return generated fallback data
    return generateFallbackData(symbol);
  }
  if (!resp.ok) {
    // Proxy endpoint unavailable (e.g. static Storybook build) — fallback
    return generateFallbackData(symbol);
  }

  let result: (YahooQuote & { meta?: YahooMeta }) | undefined;
  try {
    const json = await resp.json();
    result = json.chart?.result?.[0];
  } catch {
    return generateFallbackData(symbol);
  }
  if (!result) return generateFallbackData(symbol);

  const quote: YahooQuote = result;
  const yahooMeta: YahooMeta = result.meta ?? {};
  const timestamps = quote.timestamp ?? [];
  const ohlcv = quote.indicators?.quote?.[0];

  if (!ohlcv || timestamps.length === 0) {
    return generateFallbackData(symbol);
  }

  const bars: Bar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = ohlcv.open[i];
    const h = ohlcv.high[i];
    const l = ohlcv.low[i];
    const c = ohlcv.close[i];
    const v = ohlcv.volume[i];
    if (o == null || h == null || l == null || c == null) continue;
    bars.push({
      time: timestamps[i],
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v ?? 0,
    });
  }

  if (bars.length === 0) return generateFallbackData(symbol);

  // For 4h: aggregate 1h bars into 4h
  const finalBars = key === '4h' ? aggregate4h(bars) : bars;

  const meta: QuoteMeta = {
    price: yahooMeta.regularMarketPrice ?? bars[bars.length - 1]?.close ?? 0,
    previousClose: yahooMeta.previousClose ?? 0,
    currency: yahooMeta.currency ?? 'USD',
    exchange: yahooMeta.exchangeName ?? '',
    timezone: yahooMeta.exchangeTimezoneName ?? 'UTC',
  };

  return { bars: finalBars, meta };
}

/** Fetch a single chunk of bars for a given period1/period2 range. */
async function fetchChunk(
  symbol: string,
  yahooInterval: string,
  period1: number,
  period2: number,
  beforeTimestamp: number,
): Promise<Bar[]> {
  const url =
    `/api/yahoo/${encodeURIComponent(symbol)}?interval=${yahooInterval}` +
    `&period1=${Math.floor(period1)}&period2=${Math.floor(period2)}`;

  let resp: Response;
  try {
    resp = await fetch(url);
  } catch {
    return [];
  }
  if (!resp.ok) return [];

  let result: (YahooQuote & { meta?: YahooMeta }) | undefined;
  try {
    const json = await resp.json();
    result = json.chart?.result?.[0];
  } catch {
    return [];
  }
  if (!result) return [];

  const timestamps = result.timestamp ?? [];
  const ohlcv = result.indicators?.quote?.[0];
  if (!ohlcv || timestamps.length === 0) return [];

  const bars: Bar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = ohlcv.open[i];
    const h = ohlcv.high[i];
    const l = ohlcv.low[i];
    const c = ohlcv.close[i];
    const v = ohlcv.volume[i];
    if (o == null || h == null || l == null || c == null) continue;
    if (timestamps[i] >= beforeTimestamp) continue;
    bars.push({ time: timestamps[i], open: o, high: h, low: l, close: c, volume: v ?? 0 });
  }
  return bars;
}

/**
 * Fetch older bars that precede `beforeTimestamp`.
 *
 * Respects Yahoo Finance API limits per interval and makes multiple chunked
 * requests when the desired range exceeds a single request's capacity.
 * Returns an empty array if the periodicity doesn't support further history.
 */
export async function fetchMoreBars(
  symbol: string,
  periodicity: Periodicity,
  beforeTimestamp: number,
): Promise<Bar[]> {
  const key = periodicityToKey(periodicity);
  const chunkSize = REQUEST_CHUNK[key] ?? 0;
  if (chunkSize === 0) return [];

  const yahooInterval = (INTERVAL_MAP[key] ?? INTERVAL_MAP['1D']).interval;

  // Clamp the target period1 to Yahoo's absolute limit from now
  const maxAge = YAHOO_MAX_AGE[key] ?? 0;
  const now = Math.floor(Date.now() / 1000);
  const absoluteFloor = maxAge > 0 ? now - maxAge : 0;

  // The farthest back we want to go in this load
  let targetPeriod1 = beforeTimestamp - chunkSize;
  if (absoluteFloor > 0 && targetPeriod1 < absoluteFloor) {
    targetPeriod1 = absoluteFloor;
  }

  // Nothing to fetch if we've already reached the API limit
  if (targetPeriod1 >= beforeTimestamp) return [];

  // Break the total range into sub-chunks.
  // Each sub-chunk stays within Yahoo's per-request granularity limits.
  const subChunkSize = maxAge > 0 ? Math.min(chunkSize, maxAge) : chunkSize;
  const allBars: Bar[] = [];
  let currentEnd = beforeTimestamp;

  while (currentEnd > targetPeriod1) {
    const currentStart = Math.max(currentEnd - subChunkSize, targetPeriod1);
    const chunk = await fetchChunk(symbol, yahooInterval, currentStart, currentEnd, beforeTimestamp);

    if (chunk.length > 0) {
      // Prepend this chunk (older data comes first)
      allBars.unshift(...chunk);
    } else {
      // API returned nothing — no more history available
      break;
    }

    currentEnd = currentStart;
    // Avoid infinite loop if the chunk didn't move the window
    if (currentEnd >= beforeTimestamp) break;
  }

  // Deduplicate by timestamp (in case chunks overlap)
  const seen = new Set<number>();
  const deduped = allBars.filter(b => {
    if (seen.has(b.time)) return false;
    seen.add(b.time);
    return true;
  });

  return key === '4h' ? aggregate4h(deduped) : deduped;
}

// Fallback data for static builds (no proxy available)
const FALLBACK_PRICES: Record<string, number> = {
  'AAPL': 190, 'MSFT': 420, 'GOOGL': 178, 'AMZN': 185, 'TSLA': 245,
  'META': 510, 'NVDA': 880, 'JPM': 195, 'V': 280, 'JNJ': 155,
};

function generateFallbackData(symbol: string): { bars: Bar[]; meta: QuoteMeta } {
  const startPrice = FALLBACK_PRICES[symbol] ?? 100;
  const bars: Bar[] = [];
  let price = startPrice;
  const now = Math.floor(Date.now() / 1000);
  const start = now - 365 * 86400;
  for (let i = 0; i < 365; i++) {
    const time = start + i * 86400;
    const change = price * (Math.random() * 0.04 - 0.02);
    const open = price;
    const close = Math.max(0.01, price + change);
    const high = Math.max(open, close) + Math.random() * price * 0.015;
    const low = Math.max(0.01, Math.min(open, close) - Math.random() * price * 0.015);
    const volume = Math.round(1e6 + Math.random() * 9e6);
    bars.push({ time, open, high, low, close, volume });
    price = close;
  }
  return {
    bars,
    meta: { price, previousClose: startPrice, currency: 'USD', exchange: 'NAS', timezone: 'America/New_York' },
  };
}

function aggregate4h(bars: Bar[]): Bar[] {
  const result: Bar[] = [];
  for (let i = 0; i < bars.length; i += 4) {
    const chunk = bars.slice(i, i + 4);
    if (chunk.length === 0) continue;
    result.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map(b => b.high)),
      low: Math.min(...chunk.map(b => b.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, b) => s + (b.volume ?? 0), 0),
    });
  }
  return result;
}
