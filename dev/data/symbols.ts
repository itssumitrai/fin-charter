export interface SymbolInfo {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
}

export const SYMBOLS: SymbolInfo[] = [
  { symbol: 'AAPL', name: 'Apple Inc', exchange: 'NAS', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp', exchange: 'NAS', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', exchange: 'NAS', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', exchange: 'NAS', sector: 'Consumer' },
  { symbol: 'TSLA', name: 'Tesla Inc', exchange: 'NAS', sector: 'Automotive' },
  { symbol: 'META', name: 'Meta Platforms', exchange: 'NAS', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', exchange: 'NAS', sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE', sector: 'Finance' },
  { symbol: 'V', name: 'Visa Inc', exchange: 'NYSE', sector: 'Finance' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare' },
  { symbol: 'WMT', name: 'Walmart Inc', exchange: 'NYSE', sector: 'Consumer' },
  { symbol: 'DIS', name: 'Walt Disney Co', exchange: 'NYSE', sector: 'Entertainment' },
  { symbol: 'NFLX', name: 'Netflix Inc', exchange: 'NAS', sector: 'Entertainment' },
  { symbol: 'BA', name: 'Boeing Co', exchange: 'NYSE', sector: 'Industrial' },
  { symbol: 'INTC', name: 'Intel Corp', exchange: 'NAS', sector: 'Technology' },
  { symbol: 'AMD', name: 'AMD Inc', exchange: 'NAS', sector: 'Technology' },
  { symbol: 'COIN', name: 'Coinbase Global', exchange: 'NAS', sector: 'Finance' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', exchange: 'CRYPTO' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', exchange: 'CRYPTO' },
  { symbol: 'GC=F', name: 'Gold Futures', exchange: 'CME', sector: 'Commodities' },
];

export function searchSymbols(query: string): SymbolInfo[] {
  if (!query) return SYMBOLS;
  const q = query.toUpperCase();
  return SYMBOLS.filter(
    s => s.symbol.includes(q) || s.name.toUpperCase().includes(q),
  );
}

export function getSymbolInfo(symbol: string): SymbolInfo | undefined {
  return SYMBOLS.find(s => s.symbol === symbol);
}
