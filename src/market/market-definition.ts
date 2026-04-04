import type { MarketSession } from '../core/market-session';

export interface MarketHoliday {
  date: string;      // 'YYYY-MM-DD'
  name?: string;
  earlyClose?: number;  // minute of day for early close, or omit for full day
}

export interface MarketDefinition {
  id: string;
  name: string;
  timezone: string;       // IANA timezone
  currency: string;       // ISO 4217
  sessions: MarketSession[];
  holidays: MarketHoliday[];
}

const _markets = new Map<string, MarketDefinition>();

export const US_MARKET: MarketDefinition = {
  id: 'us',
  name: 'US Equities',
  timezone: 'America/New_York',
  currency: 'USD',
  sessions: [
    { id: 'premarket', label: 'PRE', startMinute: 240, endMinute: 570, bgColor: 'rgba(255,235,59,0.05)' },
    { id: 'regular', label: '', startMinute: 570, endMinute: 960, bgColor: 'transparent' },
    { id: 'postmarket', label: 'POST', startMinute: 960, endMinute: 1200, bgColor: 'rgba(255,235,59,0.05)' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-01-20', name: 'MLK Day' },
    { date: '2025-02-17', name: "Presidents' Day" },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-05-26', name: 'Memorial Day' },
    { date: '2025-06-19', name: 'Juneteenth' },
    { date: '2025-07-04', name: 'Independence Day' },
    { date: '2025-09-01', name: 'Labor Day' },
    { date: '2025-11-27', name: 'Thanksgiving' },
    { date: '2025-12-25', name: 'Christmas' },
  ],
};

export const UK_MARKET: MarketDefinition = {
  id: 'uk', name: 'London Stock Exchange', timezone: 'Europe/London', currency: 'GBP',
  sessions: [{ id: 'regular', label: '', startMinute: 480, endMinute: 990, bgColor: 'transparent' }],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Easter Monday' },
    { date: '2025-05-05', name: 'Early May Bank Holiday' },
    { date: '2025-05-26', name: 'Spring Bank Holiday' },
    { date: '2025-08-25', name: 'Summer Bank Holiday' },
    { date: '2025-12-25', name: 'Christmas' },
    { date: '2025-12-26', name: 'Boxing Day' },
  ],
};

export const JP_MARKET: MarketDefinition = {
  id: 'jp', name: 'Japan Exchange', timezone: 'Asia/Tokyo', currency: 'JPY',
  sessions: [
    { id: 'morning', label: 'AM', startMinute: 540, endMinute: 690, bgColor: 'transparent' },
    { id: 'afternoon', label: 'PM', startMinute: 750, endMinute: 900, bgColor: 'transparent' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-01-02', name: 'Bank Holiday' },
    { date: '2025-01-03', name: 'Bank Holiday' },
    { date: '2025-01-13', name: 'Coming of Age Day' },
    { date: '2025-02-11', name: 'National Foundation Day' },
    { date: '2025-02-23', name: "Emperor's Birthday" },
    { date: '2025-03-20', name: 'Vernal Equinox' },
    { date: '2025-04-29', name: 'Showa Day' },
    { date: '2025-05-03', name: 'Constitution Memorial Day' },
    { date: '2025-05-05', name: "Children's Day" },
    { date: '2025-05-06', name: 'Substitute Holiday' },
  ],
};

export const DE_MARKET: MarketDefinition = {
  id: 'de', name: 'Deutsche Boerse', timezone: 'Europe/Berlin', currency: 'EUR',
  sessions: [{ id: 'regular', label: '', startMinute: 540, endMinute: 1050, bgColor: 'transparent' }],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Easter Monday' },
    { date: '2025-05-01', name: 'Labour Day' },
    { date: '2025-12-24', name: 'Christmas Eve' },
    { date: '2025-12-25', name: 'Christmas' },
    { date: '2025-12-26', name: "St Stephen's Day" },
    { date: '2025-12-31', name: "New Year's Eve" },
  ],
};

export const AU_MARKET: MarketDefinition = {
  id: 'au', name: 'Australian Securities Exchange', timezone: 'Australia/Sydney', currency: 'AUD',
  sessions: [
    { id: 'preopen', label: 'PRE', startMinute: 420, endMinute: 600, bgColor: 'rgba(255,235,59,0.05)' },
    { id: 'regular', label: '', startMinute: 600, endMinute: 960, bgColor: 'transparent' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-01-27', name: 'Australia Day' },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Easter Monday' },
    { date: '2025-04-25', name: 'ANZAC Day' },
    { date: '2025-06-09', name: "Queen's Birthday" },
    { date: '2025-12-25', name: 'Christmas' },
    { date: '2025-12-26', name: 'Boxing Day' },
  ],
};

export const CRYPTO_MARKET: MarketDefinition = {
  id: 'crypto', name: 'Cryptocurrency', timezone: 'UTC', currency: 'USD',
  sessions: [{ id: 'regular', label: '', startMinute: 0, endMinute: 1440, bgColor: 'transparent' }],
  holidays: [],
};

for (const m of [US_MARKET, UK_MARKET, JP_MARKET, DE_MARKET, AU_MARKET, CRYPTO_MARKET]) {
  _markets.set(m.id, m);
}

export function getMarket(id: string): MarketDefinition | undefined {
  return _markets.get(id);
}

export function registerMarket(market: MarketDefinition): void {
  _markets.set(market.id, market);
}
