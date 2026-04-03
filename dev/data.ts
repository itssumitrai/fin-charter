import type { Bar } from 'fin-charter';

/**
 * Generate random walk OHLCV data with daily bars.
 *
 * @param count      Number of bars to generate
 * @param startPrice Starting price (default 100)
 * @param startTime  Unix timestamp of the first bar in seconds (default 2021-01-01)
 */
export function generateOHLCV(
  count: number,
  startPrice = 100,
  startTime = 1609459200,
): Bar[] {
  const bars: Bar[] = [];
  const DAY_SECONDS = 86400;
  let price = startPrice;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * DAY_SECONDS;

    // Random walk: price changes by up to ±2 %
    const change = price * (Math.random() * 0.04 - 0.02);
    const open = price;
    const close = Math.max(0.01, price + change);

    // Intra-bar volatility: wicks up to ±1.5 %
    const volatility = price * 0.015;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.max(0.01, Math.min(open, close) - Math.random() * volatility);

    const volume = Math.round(100_000 + Math.random() * 900_000);

    bars.push({ time, open, high, low, close, volume });

    price = close;
  }

  return bars;
}
