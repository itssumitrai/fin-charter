import type { ColumnStore } from './types';

/**
 * Simple formula engine for custom indicators.
 * Supports basic math operations on OHLCV columns.
 *
 * Variables: open, high, low, close, volume
 * Functions: sma(N), ema(N), abs(x), sqrt(x), log(x), max(a,b), min(a,b)
 * Operators: +, -, *, /, (, )
 *
 * Example: "close - sma(20)" or "(high + low) / 2" or "max(high, close)"
 */
export function evaluateFormula(
  formula: string,
  store: ColumnStore,
): Float64Array {
  const length = store.length;
  const result = new Float64Array(length);

  // Pre-compute rolling aggregates (cached across bars)
  const cache = new Map<string, Float64Array>();

  function getSmaColumn(period: number): Float64Array {
    const key = `sma_${period}`;
    if (!cache.has(key)) {
      const sma = new Float64Array(length);
      let sum = 0;
      for (let i = 0; i < length; i++) {
        sum += store.close[i];
        if (i >= period) sum -= store.close[i - period];
        sma[i] = i >= period - 1 ? sum / period : NaN;
      }
      cache.set(key, sma);
    }
    return cache.get(key)!;
  }

  function getEmaColumn(period: number): Float64Array {
    const key = `ema_${period}`;
    if (!cache.has(key)) {
      const ema = new Float64Array(length);
      const multiplier = 2 / (period + 1);
      ema[0] = store.close[0];
      for (let i = 1; i < length; i++) {
        ema[i] = (store.close[i] - ema[i - 1]) * multiplier + ema[i - 1];
      }
      for (let i = 0; i < period - 1 && i < length; i++) ema[i] = NaN;
      cache.set(key, ema);
    }
    return cache.get(key)!;
  }

  function getColumnByName(name: string): Float64Array | null {
    if (name === 'open') return store.open;
    if (name === 'high') return store.high;
    if (name === 'low') return store.low;
    if (name === 'close') return store.close;
    if (name === 'volume') return store.volume;
    return null;
  }

  // Tokenize — identifiers do NOT include '(' or ')'
  const tokens: string[] = [];
  let i = 0;
  while (i < formula.length) {
    if (formula[i] === ' ') { i++; continue; }
    if ('+-*/(),'.includes(formula[i])) {
      tokens.push(formula[i]);
      i++;
    } else if (/[a-z]/i.test(formula[i])) {
      let name = '';
      while (i < formula.length && /[a-z0-9_]/i.test(formula[i])) {
        name += formula[i];
        i++;
      }
      tokens.push(name);
    } else if (/[0-9.]/.test(formula[i])) {
      let num = '';
      while (i < formula.length && /[0-9.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      tokens.push(num);
    } else {
      i++;
    }
  }

  // Simple recursive descent parser — evaluated per-bar
  for (let bar = 0; bar < length; bar++) {
    let pos = 0;

    function parseExpr(): number {
      let val = parseTerm();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const right = parseTerm();
        val = op === '+' ? val + right : val - right;
      }
      return val;
    }

    function parseTerm(): number {
      let val = parseFactor();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++];
        const right = parseFactor();
        val = op === '*' ? val * right : val / right;
      }
      return val;
    }

    function parseFactor(): number {
      if (tokens[pos] === '(') {
        pos++; // consume '('
        const val = parseExpr();
        if (tokens[pos] === ')') pos++; // consume ')'
        return val;
      }

      const token = tokens[pos++];
      if (token === undefined) return NaN;

      // Number literal
      if (/^[0-9.]/.test(token)) return parseFloat(token);

      // Single-arg built-in functions: name ( expr )
      if (token === 'abs') {
        pos++; const v = parseExpr(); pos++;
        return Math.abs(v);
      }
      if (token === 'sqrt') {
        pos++; const v = parseExpr(); pos++;
        return Math.sqrt(v);
      }
      if (token === 'log') {
        pos++; const v = parseExpr(); pos++;
        return Math.log(v);
      }

      // Two-arg built-in functions: name ( expr , expr )
      if (token === 'max') {
        pos++; // consume '('
        const a = parseExpr();
        if (tokens[pos] === ',') pos++; // consume ','
        const b = parseExpr();
        if (tokens[pos] === ')') pos++; // consume ')'
        return Math.max(a, b);
      }
      if (token === 'min') {
        pos++; // consume '('
        const a = parseExpr();
        if (tokens[pos] === ',') pos++; // consume ','
        const b = parseExpr();
        if (tokens[pos] === ')') pos++; // consume ')'
        return Math.min(a, b);
      }

      // Rolling window functions: sma(N), ema(N)
      if ((token === 'sma' || token === 'ema') && tokens[pos] === '(') {
        pos++; // consume '('
        const numTok = tokens[pos++];
        const period = parseInt(numTok, 10);
        if (tokens[pos] === ')') pos++; // consume ')'
        const col = token === 'sma' ? getSmaColumn(period) : getEmaColumn(period);
        return col[bar];
      }

      // Column reference (plain name, no parens)
      const col = getColumnByName(token);
      if (col !== null) return col[bar];

      return NaN;
    }

    try {
      pos = 0;
      result[bar] = parseExpr();
    } catch {
      result[bar] = NaN;
    }
  }

  return result;
}
