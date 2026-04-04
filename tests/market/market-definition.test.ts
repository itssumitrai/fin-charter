import { describe, it, expect } from 'vitest';
import {
  getMarket, registerMarket,
  US_MARKET, UK_MARKET, JP_MARKET, DE_MARKET, AU_MARKET, CRYPTO_MARKET,
} from '../../src/market/market-definition';
import type { MarketDefinition } from '../../src/market/market-definition';

describe('built-in markets', () => {
  it('US market has correct timezone', () => { expect(US_MARKET.timezone).toBe('America/New_York'); });
  it('US market has 3 sessions', () => {
    expect(US_MARKET.sessions).toHaveLength(3);
    expect(US_MARKET.sessions.map(s => s.id)).toContain('regular');
  });
  it('US market regular session is 9:30-16:00', () => {
    const regular = US_MARKET.sessions.find(s => s.id === 'regular')!;
    expect(regular.startMinute).toBe(570);
    expect(regular.endMinute).toBe(960);
  });
  it('UK market has London timezone', () => { expect(UK_MARKET.timezone).toBe('Europe/London'); });
  it('UK regular session is 8:00-16:30', () => {
    const regular = UK_MARKET.sessions.find(s => s.id === 'regular')!;
    expect(regular.startMinute).toBe(480);
    expect(regular.endMinute).toBe(990);
  });
  it('JP market has Tokyo timezone', () => { expect(JP_MARKET.timezone).toBe('Asia/Tokyo'); });
  it('JP market has morning and afternoon sessions', () => { expect(JP_MARKET.sessions.length).toBeGreaterThanOrEqual(2); });
  it('DE market has Frankfurt timezone', () => { expect(DE_MARKET.timezone).toBe('Europe/Berlin'); });
  it('AU market has Sydney timezone', () => { expect(AU_MARKET.timezone).toBe('Australia/Sydney'); });
  it('Crypto market is 24/7 UTC', () => {
    expect(CRYPTO_MARKET.timezone).toBe('UTC');
    expect(CRYPTO_MARKET.sessions.find(s => s.id === 'regular')!.startMinute).toBe(0);
    expect(CRYPTO_MARKET.sessions.find(s => s.id === 'regular')!.endMinute).toBe(1440);
  });
});

describe('getMarket', () => {
  it('returns US market by id', () => { expect(getMarket('us')).toBe(US_MARKET); });
  it('returns JP market by id', () => { expect(getMarket('jp')).toBe(JP_MARKET); });
  it('returns undefined for unknown', () => { expect(getMarket('unknown')).toBeUndefined(); });
});

describe('registerMarket', () => {
  it('registers and retrieves a custom market', () => {
    const custom: MarketDefinition = {
      id: 'custom', name: 'Custom', timezone: 'Asia/Singapore', currency: 'SGD',
      sessions: [{ id: 'regular', label: '', startMinute: 540, endMinute: 1020, bgColor: 'transparent' }],
      holidays: [],
    };
    registerMarket(custom);
    expect(getMarket('custom')).toEqual(custom);
  });
});
