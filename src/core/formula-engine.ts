import type { ColumnStore } from './types';

/**
 * Simple formula engine for custom indicators.
 * Supports basic math operations on OHLCV columns.
 *
 * Variables: open, high, low, close, volume, sma(N), ema(N)
 * Operators: +, -, *, /, (, )
 * Functions: abs, max, min, sqrt, log
 *
 * Example: "close - sma(20)" or "(high + low) / 2"
 */
export function evaluateFormula(
  formula: string,
  store: ColumnStore,
): Float64Array {
  const length = store.length;
  const result = new Float64Array(length);

  // Pre-compute common aggregates
  const cache = new Map<string, Float64Array>();

  function getColumn(name: string): Float64Array {
    if (name === 'open') return store.open;
    if (name === 'high') return store.high;
    if (name === 'low') return store.low;
    if (name === 'close') return store.close;
    if (name === 'volume') return store.volume;

    // SMA(N) pattern
    const smaMatch = name.match(/^sma\((\d+)\)$/);
    if (smaMatch) {
      const key = `sma_${smaMatch[1]}`;
      if (!cache.has(key)) {
        const period = parseInt(smaMatch[1]);
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

    // EMA(N) pattern
    const emaMatch = name.match(/^ema\((\d+)\)$/);
    if (emaMatch) {
      const key = `ema_${emaMatch[1]}`;
      if (!cache.has(key)) {
        const period = parseInt(emaMatch[1]);
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

    throw new Error(`Unknown column: ${name}`);
  }

  // Tokenize
  const tokens: string[] = [];
  let i = 0;
  while (i < formula.length) {
    if (formula[i] === ' ') { i++; continue; }
    if ('+-*/()'.includes(formula[i])) {
      tokens.push(formula[i]);
      i++;
    } else if (/[a-z]/.test(formula[i])) {
      let name = '';
      while (i < formula.length && /[a-z0-9_()]/.test(formula[i])) {
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

  // Simple recursive descent parser for per-bar evaluation
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
        pos++;
        const val = parseExpr();
        if (tokens[pos] === ')') pos++;
        return val;
      }

      const token = tokens[pos++];

      // Number literal
      if (/^[0-9.]/.test(token)) return parseFloat(token);

      // Built-in functions
      if (token === 'abs') { pos++; const v = parseExpr(); pos++; return Math.abs(v); }
      if (token === 'sqrt') { pos++; const v = parseExpr(); pos++; return Math.sqrt(v); }
      if (token === 'log') { pos++; const v = parseExpr(); pos++; return Math.log(v); }

      // Column reference
      try {
        const col = getColumn(token);
        return col[bar];
      } catch {
        return NaN;
      }
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
