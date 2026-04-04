import { describe, it, expect } from 'vitest';
import { isMarketDate, getNextOpen, isEarlyClose } from '../../src/market/market-calendar';
import { US_MARKET, CRYPTO_MARKET } from '../../src/market/market-definition';

describe('isMarketDate', () => {
  it('returns true for a regular trading day (Tue Jan 14 2025)', () => { expect(isMarketDate('2025-01-14', US_MARKET)).toBe(true); });
  it('returns false for Saturday', () => { expect(isMarketDate('2025-01-18', US_MARKET)).toBe(false); });
  it('returns false for Sunday', () => { expect(isMarketDate('2025-01-19', US_MARKET)).toBe(false); });
  it('returns false for US holiday (New Years)', () => { expect(isMarketDate('2025-01-01', US_MARKET)).toBe(false); });
  it('returns false for Thanksgiving', () => { expect(isMarketDate('2025-11-27', US_MARKET)).toBe(false); });
  it('returns true for crypto on any day', () => {
    expect(isMarketDate('2025-01-18', CRYPTO_MARKET)).toBe(true);
    expect(isMarketDate('2025-12-25', CRYPTO_MARKET)).toBe(true);
  });
});

describe('getNextOpen', () => {
  it('returns next Monday for a Friday after close (skipping MLK holiday)', () => {
    const fridayClose = Date.UTC(2025, 0, 17, 17, 0, 0) / 1000;
    const nextOpen = getNextOpen(fridayClose, US_MARKET);
    const date = new Date(nextOpen * 1000);
    expect(date.getUTCDate()).toBe(21);
    expect(date.getUTCMonth()).toBe(0);
  });

  it('returns same day regular open for pre-market time', () => {
    const preMarket = Date.UTC(2025, 0, 14, 10, 0, 0) / 1000;
    const nextOpen = getNextOpen(preMarket, US_MARKET);
    const date = new Date(nextOpen * 1000);
    expect(date.getUTCDate()).toBe(14);
    expect(date.getUTCHours()).toBe(14);
    expect(date.getUTCMinutes()).toBe(30);
  });

  it('returns current time for crypto (always open)', () => {
    const now = Date.UTC(2025, 0, 18, 3, 0, 0) / 1000;
    expect(getNextOpen(now, CRYPTO_MARKET)).toBe(now);
  });
});

describe('isEarlyClose', () => {
  it('returns null for regular trading day', () => { expect(isEarlyClose('2025-01-14', US_MARKET)).toBeNull(); });
  it('returns early close minute if defined', () => {
    const market = { ...US_MARKET, holidays: [...US_MARKET.holidays, { date: '2025-11-28', name: 'Day after Thanksgiving', earlyClose: 780 }] };
    expect(isEarlyClose('2025-11-28', market)).toBe(780);
  });
  it('returns null for full holiday', () => { expect(isEarlyClose('2025-12-25', US_MARKET)).toBeNull(); });
});
