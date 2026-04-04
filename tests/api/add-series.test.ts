import { describe, it, expect } from 'vitest';
import type { SeriesOptions } from '@/api/options';

describe('addSeries() unified API', () => {
  it('SeriesOptions type covers all series types', () => {
    // Compile-time check — if this file compiles, the union is correct
    const options: SeriesOptions[] = [
      { type: 'candlestick' },
      { type: 'line', color: '#ff0000' },
      { type: 'area', lineColor: '#00ff00' },
      { type: 'bar' },
      { type: 'baseline' },
      { type: 'hollow-candle' },
      { type: 'histogram' },
      { type: 'heikin-ashi' },
    ];
    expect(options).toHaveLength(8);
  });
});
