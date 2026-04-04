import { http, HttpResponse } from 'msw';

/**
 * Generate realistic OHLCV data for a given symbol.
 * Returns data in Yahoo Finance v8 chart API response format.
 */
function generateYahooResponse(symbol: string, interval: string, count: number) {
  const SEED_PRICES: Record<string, number> = {
    AAPL: 190,
    MSFT: 420,
    GOOGL: 178,
    AMZN: 185,
    TSLA: 245,
    META: 510,
    NVDA: 880,
    JPM: 195,
    V: 280,
    JNJ: 155,
  };

  const EXCHANGE_INFO: Record<string, { currency: string; exchange: string; timezone: string }> = {
    AAPL: { currency: 'USD', exchange: 'NMS', timezone: 'America/New_York' },
    MSFT: { currency: 'USD', exchange: 'NMS', timezone: 'America/New_York' },
    GOOGL: { currency: 'USD', exchange: 'NMS', timezone: 'America/New_York' },
    AMZN: { currency: 'USD', exchange: 'NMS', timezone: 'America/New_York' },
    TSLA: { currency: 'USD', exchange: 'NMS', timezone: 'America/New_York' },
    META: { currency: 'USD', exchange: 'NMS', timezone: 'America/New_York' },
    NVDA: { currency: 'USD', exchange: 'NMS', timezone: 'America/New_York' },
    JPM: { currency: 'USD', exchange: 'NYQ', timezone: 'America/New_York' },
    V: { currency: 'USD', exchange: 'NYQ', timezone: 'America/New_York' },
    JNJ: { currency: 'USD', exchange: 'NYQ', timezone: 'America/New_York' },
  };

  // Determine time step based on interval
  const intervalSeconds: Record<string, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '1d': 86400,
    '1wk': 604800,
    '1mo': 2592000,
  };

  const step = intervalSeconds[interval] ?? 86400;
  const startPrice = SEED_PRICES[symbol] ?? 100;
  const exchangeInfo = EXCHANGE_INFO[symbol] ?? {
    currency: 'USD',
    exchange: 'NMS',
    timezone: 'America/New_York',
  };

  // Use a simple seeded random for deterministic output
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) | 0;
  }
  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // Use a fixed reference timestamp so mock data is deterministic across runs.
  // 2024-01-02T14:30:00Z — a typical US market session.
  const referenceTime = 1704205800;
  const startTime = referenceTime - count * step;

  const timestamps: number[] = [];
  const open: number[] = [];
  const high: number[] = [];
  const low: number[] = [];
  const close: number[] = [];
  const volume: number[] = [];

  let price = startPrice;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * step;
    const change = price * (seededRandom() * 0.04 - 0.02);
    const o = +price.toFixed(2);
    const c = +Math.max(0.01, price + change).toFixed(2);
    const h = +Math.max(o, c, o + seededRandom() * price * 0.015).toFixed(2);
    const l = +Math.max(0.01, Math.min(o, c) - seededRandom() * price * 0.015).toFixed(2);
    const v = Math.round(1e6 + seededRandom() * 9e6);

    timestamps.push(time);
    open.push(o);
    high.push(h);
    low.push(l);
    close.push(c);
    volume.push(v);

    price = c;
  }

  const lastClose = close[close.length - 1] ?? startPrice;

  return {
    chart: {
      result: [
        {
          meta: {
            currency: exchangeInfo.currency,
            symbol,
            exchangeName: exchangeInfo.exchange,
            exchangeTimezoneName: exchangeInfo.timezone,
            regularMarketPrice: lastClose,
            previousClose: open[0] ?? startPrice,
            instrumentType: 'EQUITY',
            regularMarketTime: timestamps[timestamps.length - 1],
            gmtoffset: -14400,
            timezone: 'EDT',
            dataGranularity: interval,
            range: '',
          },
          timestamp: timestamps,
          indicators: {
            quote: [{ open, high, low, close, volume }],
          },
        },
      ],
      error: null,
    },
  };
}

/** Determine how many bars to generate based on interval */
function barCount(interval: string): number {
  const counts: Record<string, number> = {
    '1m': 390,
    '5m': 390,
    '15m': 200,
    '1h': 500,
    '1d': 365,
    '1wk': 260,
    '1mo': 120,
  };
  return counts[interval] ?? 365;
}

export const handlers = [
  // Match the proxy path pattern: /api/yahoo/{symbol}?interval=...&range=...
  http.get('/api/yahoo/:symbol', ({ params, request }) => {
    const symbol = params.symbol as string;
    const url = new URL(request.url);
    const interval = url.searchParams.get('interval') ?? '1d';
    const range = url.searchParams.get('range') ?? '1y';
    const count = barCount(interval);

    return HttpResponse.json(generateYahooResponse(symbol, interval, count));
  }),

  // Also intercept direct Yahoo Finance API calls (in case any slip through)
  http.get('https://query1.finance.yahoo.com/v8/finance/chart/:symbol', ({ params, request }) => {
    const symbol = params.symbol as string;
    const url = new URL(request.url);
    const interval = url.searchParams.get('interval') ?? '1d';
    const range = url.searchParams.get('range') ?? '1y';
    const count = barCount(interval);

    return HttpResponse.json(generateYahooResponse(symbol, interval, count));
  }),
];
