import type { ColumnStore } from './types';

export interface PatternMatch {
  type: string;
  startIdx: number;
  endIdx: number;
  confidence: number; // 0-1
  direction: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Detect common chart patterns in OHLCV data.
 */
export function detectPatterns(store: ColumnStore, fromIdx: number, toIdx: number): PatternMatch[] {
  const patterns: PatternMatch[] = [];
  const to = Math.min(toIdx, store.length - 1);

  // Double Top
  for (let i = fromIdx + 10; i <= to - 5; i++) {
    const window = 20;
    if (i - window < fromIdx || i + window > to) continue;

    // Find two peaks within window
    let peak1 = -1, peak1Val = -Infinity;
    let peak2 = -1, peak2Val = -Infinity;

    for (let j = i - window; j < i; j++) {
      if (store.high[j] > peak1Val) { peak1Val = store.high[j]; peak1 = j; }
    }
    for (let j = i; j <= Math.min(i + window, to); j++) {
      if (store.high[j] > peak2Val) { peak2Val = store.high[j]; peak2 = j; }
    }

    if (peak1 === -1 || peak2 === -1) continue;
    if (peak2 - peak1 < 5) continue;

    // Peaks should be similar height (within 2%)
    const diff = Math.abs(peak1Val - peak2Val) / peak1Val;
    if (diff < 0.02) {
      // Valley between peaks should be lower
      let valley = Infinity;
      for (let j = peak1 + 1; j < peak2; j++) {
        if (store.low[j] < valley) valley = store.low[j];
      }
      const depth = (peak1Val - valley) / peak1Val;
      if (depth > 0.02) {
        patterns.push({
          type: 'double-top',
          startIdx: peak1,
          endIdx: peak2,
          confidence: Math.min(1, (1 - diff) * depth * 10),
          direction: 'bearish',
        });
        i = peak2 + 5; // skip ahead
      }
    }
  }

  // Double Bottom (mirror of double top)
  for (let i = fromIdx + 10; i <= to - 5; i++) {
    const window = 20;
    if (i - window < fromIdx || i + window > to) continue;

    let trough1 = -1, trough1Val = Infinity;
    let trough2 = -1, trough2Val = Infinity;

    for (let j = i - window; j < i; j++) {
      if (store.low[j] < trough1Val) { trough1Val = store.low[j]; trough1 = j; }
    }
    for (let j = i; j <= Math.min(i + window, to); j++) {
      if (store.low[j] < trough2Val) { trough2Val = store.low[j]; trough2 = j; }
    }

    if (trough1 === -1 || trough2 === -1) continue;
    if (trough2 - trough1 < 5) continue;

    const diff = Math.abs(trough1Val - trough2Val) / trough1Val;
    if (diff < 0.02) {
      let peak = -Infinity;
      for (let j = trough1 + 1; j < trough2; j++) {
        if (store.high[j] > peak) peak = store.high[j];
      }
      const depth = (peak - trough1Val) / trough1Val;
      if (depth > 0.02) {
        patterns.push({
          type: 'double-bottom',
          startIdx: trough1,
          endIdx: trough2,
          confidence: Math.min(1, (1 - diff) * depth * 10),
          direction: 'bullish',
        });
        i = trough2 + 5;
      }
    }
  }

  // Support/Resistance levels
  // Find price levels where price bounced multiple times
  const levels = new Map<number, number>(); // rounded price → touch count
  const precision = (store.high[fromIdx] - store.low[fromIdx]) * 0.5 || 1;

  for (let i = fromIdx; i <= to; i++) {
    const roundedHigh = Math.round(store.high[i] / precision) * precision;
    const roundedLow = Math.round(store.low[i] / precision) * precision;
    levels.set(roundedHigh, (levels.get(roundedHigh) ?? 0) + 1);
    levels.set(roundedLow, (levels.get(roundedLow) ?? 0) + 1);
  }

  for (const [price, touches] of levels) {
    if (touches >= 3) {
      patterns.push({
        type: 'support-resistance',
        startIdx: fromIdx,
        endIdx: to,
        confidence: Math.min(1, touches / 10),
        direction: 'neutral',
      });
    }
  }

  return patterns;
}
