import type { Bar } from 'fin-charter';
import type { Periodicity } from 'fin-charter';

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
