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
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Yahoo Finance error: ${resp.status}`);

  const json = await resp.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('No data returned');

  const quote: YahooQuote = result;
  const yahooMeta: YahooMeta = result.meta ?? {};
  const timestamps = quote.timestamp ?? [];
  const ohlcv = quote.indicators?.quote?.[0];

  if (!ohlcv || timestamps.length === 0) {
    throw new Error('Empty quote data');
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
