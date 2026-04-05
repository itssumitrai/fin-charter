// ─── Symbol Resolution & Search ─────────────────────────────────────────────

export interface SymbolInfo {
  /** Ticker symbol, e.g. "AAPL" */
  symbol: string;
  /** Human-readable name, e.g. "Apple Inc." */
  name: string;
  /** Instrument type, e.g. "stock", "crypto", "forex" */
  type: string;
  /** Exchange identifier, e.g. "NASDAQ" */
  exchange: string;
  /** IANA timezone, e.g. "America/New_York" */
  timezone: string;
  /** Decimal places for price display */
  pricePrecision: number;
  /** Minimum price movement (e.g. 1 for whole-cent, 0.5 for half-tick) */
  minMov: number;
}

export interface ISymbolResolver {
  /** Resolve a ticker string to full symbol information. */
  resolveSymbol(ticker: string): Promise<SymbolInfo>;
  /** Search symbols by query string, optionally filtered by instrument type. */
  searchSymbols(query: string, type?: string): Promise<SymbolInfo[]>;
}

/**
 * Compute a simple fuzzy-match score between a query and a target string.
 * Returns a value between 0 and 1 (1 = perfect match). Returns 0 if any
 * query character is missing from the target in order.
 */
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t === q) return 1;
  if (t.startsWith(q)) return 0.9;
  if (t.includes(q)) return 0.8;

  // Character-by-character ordered matching
  let qi = 0;
  let matched = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      matched++;
      qi++;
    }
  }

  if (qi < q.length) return 0; // not all query chars found
  return (matched / Math.max(t.length, q.length)) * 0.7;
}

/**
 * A simple in-memory symbol resolver that searches a pre-loaded map of symbols
 * using fuzzy matching on both the ticker symbol and the human-readable name.
 */
export class SimpleSymbolResolver implements ISymbolResolver {
  private readonly _symbols: Map<string, SymbolInfo>;

  constructor(symbols: Map<string, SymbolInfo>) {
    this._symbols = new Map(symbols);
  }

  async resolveSymbol(ticker: string): Promise<SymbolInfo> {
    const upper = ticker.trim().toUpperCase();
    const info = this._symbols.get(upper);
    if (!info) {
      throw new Error(`Symbol not found: ${upper}`);
    }
    return { ...info };
  }

  async searchSymbols(query: string, type?: string): Promise<SymbolInfo[]> {
    const q = query.trim();
    if (!q) return [];

    const results: Array<{ info: SymbolInfo; score: number }> = [];

    for (const info of this._symbols.values()) {
      if (type && info.type !== type) continue;

      const symbolScore = fuzzyScore(q, info.symbol);
      const nameScore = fuzzyScore(q, info.name);
      const bestScore = Math.max(symbolScore, nameScore);

      if (bestScore > 0) {
        results.push({ info: { ...info }, score: bestScore });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.map((r) => r.info);
  }
}
