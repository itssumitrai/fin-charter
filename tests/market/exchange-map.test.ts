import { describe, it, expect } from 'vitest';
import { getMarketForExchange, registerExchange } from '../../src/market/exchange-map';

describe('getMarketForExchange', () => {
  it('maps NYSE to us market', () => { expect(getMarketForExchange('NYSE')!.id).toBe('us'); });
  it('maps NAS to us market', () => { expect(getMarketForExchange('NAS')!.id).toBe('us'); });
  it('maps LSE to uk market', () => { expect(getMarketForExchange('LSE')!.id).toBe('uk'); });
  it('maps JPX to jp market', () => { expect(getMarketForExchange('JPX')!.id).toBe('jp'); });
  it('maps FRA to de market', () => { expect(getMarketForExchange('FRA')!.id).toBe('de'); });
  it('maps ASX to au market', () => { expect(getMarketForExchange('ASX')!.id).toBe('au'); });
  it('returns undefined for unknown', () => { expect(getMarketForExchange('UNKNOWN')).toBeUndefined(); });
  it('is case-insensitive', () => { expect(getMarketForExchange('nyse')!.id).toBe('us'); });
});

describe('registerExchange', () => {
  it('registers a custom exchange mapping', () => {
    registerExchange('SGX', 'custom');
    expect(getMarketForExchange('SGX')).toBeUndefined(); // custom market not registered
  });
});
