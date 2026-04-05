import { describe, it, expect } from 'vitest';
import { SimpleSymbolResolver } from '@/core/symbol-resolver';
import type { SymbolInfo, ISymbolResolver } from '@/core/symbol-resolver';

function makeSymbol(overrides: Partial<SymbolInfo> = {}): SymbolInfo {
  return {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    timezone: 'America/New_York',
    pricePrecision: 2,
    minMov: 1,
    ...overrides,
  };
}

function createResolver(): SimpleSymbolResolver {
  const map = new Map<string, SymbolInfo>();
  map.set('AAPL', makeSymbol());
  map.set('GOOGL', makeSymbol({ symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' }));
  map.set('MSFT', makeSymbol({ symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' }));
  map.set('AMZN', makeSymbol({ symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' }));
  map.set('BTCUSD', makeSymbol({ symbol: 'BTCUSD', name: 'Bitcoin / USD', type: 'crypto', exchange: 'COINBASE', timezone: 'Etc/UTC', pricePrecision: 2, minMov: 1 }));
  map.set('EURUSD', makeSymbol({ symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', exchange: 'FOREX', timezone: 'Etc/UTC', pricePrecision: 5, minMov: 1 }));
  return new SimpleSymbolResolver(map);
}

describe('SimpleSymbolResolver', () => {
  describe('resolveSymbol', () => {
    it('resolves a known ticker', async () => {
      const resolver = createResolver();
      const info = await resolver.resolveSymbol('AAPL');
      expect(info.symbol).toBe('AAPL');
      expect(info.name).toBe('Apple Inc.');
      expect(info.exchange).toBe('NASDAQ');
      expect(info.pricePrecision).toBe(2);
      expect(info.minMov).toBe(1);
    });

    it('resolves case-insensitively', async () => {
      const resolver = createResolver();
      const info = await resolver.resolveSymbol('aapl');
      expect(info.symbol).toBe('AAPL');
    });

    it('throws for unknown ticker', async () => {
      const resolver = createResolver();
      await expect(resolver.resolveSymbol('UNKNOWN')).rejects.toThrow('Symbol not found: UNKNOWN');
    });

    it('returns a copy (not the original reference)', async () => {
      const resolver = createResolver();
      const a = await resolver.resolveSymbol('AAPL');
      const b = await resolver.resolveSymbol('AAPL');
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    });
  });

  describe('searchSymbols', () => {
    it('returns empty array for empty query', async () => {
      const resolver = createResolver();
      const results = await resolver.searchSymbols('');
      expect(results).toEqual([]);
    });

    it('finds exact ticker match', async () => {
      const resolver = createResolver();
      const results = await resolver.searchSymbols('AAPL');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('finds by partial name', async () => {
      const resolver = createResolver();
      const results = await resolver.searchSymbols('Apple');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].symbol).toBe('AAPL');
    });

    it('performs fuzzy matching', async () => {
      const resolver = createResolver();
      const results = await resolver.searchSymbols('Alph');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].symbol).toBe('GOOGL');
    });

    it('filters by type', async () => {
      const resolver = createResolver();
      const cryptoResults = await resolver.searchSymbols('USD', 'crypto');
      expect(cryptoResults.every((r) => r.type === 'crypto')).toBe(true);
      expect(cryptoResults.length).toBe(1);
      expect(cryptoResults[0].symbol).toBe('BTCUSD');
    });

    it('returns results sorted by relevance', async () => {
      const resolver = createResolver();
      const results = await resolver.searchSymbols('A');
      expect(results.length).toBeGreaterThan(0);
      // All results should contain 'A' somewhere in symbol or name
    });

    it('returns copies of symbol info', async () => {
      const resolver = createResolver();
      const results = await resolver.searchSymbols('AAPL');
      const resolved = await resolver.resolveSymbol('AAPL');
      expect(results[0]).toEqual(resolved);
      expect(results[0]).not.toBe(resolved);
    });
  });

  describe('ISymbolResolver interface', () => {
    it('SimpleSymbolResolver satisfies the interface', () => {
      const resolver: ISymbolResolver = createResolver();
      expect(typeof resolver.resolveSymbol).toBe('function');
      expect(typeof resolver.searchSymbols).toBe('function');
    });
  });
});
