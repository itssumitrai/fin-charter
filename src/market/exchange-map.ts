import type { MarketDefinition } from './market-definition';
import { getMarket } from './market-definition';

const _exchangeToMarket = new Map<string, string>();

for (const code of ['NYSE', 'NAS', 'NASDAQ', 'AMEX', 'ARCA', 'BATS', 'IEX', 'OTC', 'PNK', 'NYSEARCA']) {
  _exchangeToMarket.set(code, 'us');
}
for (const code of ['LSE', 'LON', 'AIM']) {
  _exchangeToMarket.set(code, 'uk');
}
for (const code of ['JPX', 'TSE', 'TYO']) {
  _exchangeToMarket.set(code, 'jp');
}
for (const code of ['FRA', 'ETR', 'BER', 'STU', 'XETRA']) {
  _exchangeToMarket.set(code, 'de');
}
for (const code of ['ASX', 'AX']) {
  _exchangeToMarket.set(code, 'au');
}
for (const code of ['CRYPTO', 'BINANCE', 'COINBASE', 'KRAKEN']) {
  _exchangeToMarket.set(code, 'crypto');
}

export function getMarketForExchange(exchangeCode: string): MarketDefinition | undefined {
  const marketId = _exchangeToMarket.get(exchangeCode.toUpperCase());
  if (!marketId) return undefined;
  return getMarket(marketId);
}

export function registerExchange(exchangeCode: string, marketId: string): void {
  _exchangeToMarket.set(exchangeCode.toUpperCase(), marketId);
}
