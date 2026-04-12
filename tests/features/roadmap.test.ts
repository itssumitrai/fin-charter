import { describe, it, expect } from 'vitest';
import { renderChartToSVG } from '@/api/ssr';
import { evaluateFormula } from '@/core/formula-engine';
import { ChartGrid } from '@/core/chart-grid';
import { computeVolumeProfile } from '@/core/volume-profile';
import { detectPatterns } from '@/core/pattern-recognition';
import { renderDepthChart } from '@/renderers/depth-chart';
import type { Bar, ColumnStore } from '@/core/types';

// Helper to create a mock store
function makeStore(length: number): ColumnStore {
  const store = {
    time: new Float64Array(length),
    open: new Float64Array(length),
    high: new Float64Array(length),
    low: new Float64Array(length),
    close: new Float64Array(length),
    volume: new Float64Array(length),
    length,
    capacity: length,
  };
  for (let i = 0; i < length; i++) {
    store.time[i] = 1700000000 + i * 86400;
    const price = 100 + Math.sin(i * 0.1) * 20;
    store.open[i] = price;
    store.high[i] = price + 3;
    store.low[i] = price - 3;
    store.close[i] = price + (i % 2 === 0 ? 1 : -1);
    store.volume[i] = 1000000;
  }
  return store;
}

describe('SSR - renderChartToSVG', () => {
  const bars: Bar[] = Array.from({ length: 20 }, (_, i) => ({
    time: 1700000000 + i * 86400,
    open: 100 + i, high: 105 + i, low: 95 + i, close: 102 + i, volume: 1000,
  }));

  it('returns SVG string for line chart', () => {
    const svg = renderChartToSVG(bars, { width: 800, height: 400 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('polyline');
  });

  it('returns SVG string for candlestick chart', () => {
    const svg = renderChartToSVG(bars, { width: 800, height: 400, type: 'candlestick' });
    expect(svg).toContain('<svg');
    expect(svg).toContain('rect');
  });

  it('handles empty bars', () => {
    const svg = renderChartToSVG([], { width: 400, height: 200 });
    expect(svg).toContain('<svg');
  });

  it('sanitizes backgroundColor to prevent SVG injection', () => {
    const malicious = '#fff</rect><script>alert(1)</script>';
    const svg = renderChartToSVG([], { width: 400, height: 200, backgroundColor: malicious });
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('</rect>');
  });

  it('sanitizes lineColor to prevent SVG injection', () => {
    const malicious = '#blue"><script>bad()</script>';
    const svg = renderChartToSVG(bars, { width: 400, height: 200, lineColor: malicious });
    expect(svg).not.toContain('<script>');
  });
});

describe('Formula Engine', () => {
  const store = makeStore(50);

  it('evaluates simple column reference', () => {
    const result = evaluateFormula('close', store);
    expect(result.length).toBe(50);
    expect(result[0]).toBe(store.close[0]);
  });

  it('evaluates arithmetic', () => {
    const result = evaluateFormula('(high + low) / 2', store);
    expect(result[0]).toBeCloseTo((store.high[0] + store.low[0]) / 2);
  });

  it('evaluates sma(N)', () => {
    const result = evaluateFormula('close - sma(5)', store);
    expect(result.length).toBe(50);
    expect(isNaN(result[0])).toBe(true); // warmup
    expect(isNaN(result[10])).toBe(false);
  });

  it('handles unknown column gracefully', () => {
    const result = evaluateFormula('unknown', store);
    expect(isNaN(result[0])).toBe(true);
  });

  it('evaluates max(a, b) function', () => {
    const result = evaluateFormula('max(high, close)', store);
    expect(result.length).toBe(50);
    for (let i = 0; i < 50; i++) {
      expect(result[i]).toBeCloseTo(Math.max(store.high[i], store.close[i]));
    }
  });

  it('evaluates min(a, b) function', () => {
    const result = evaluateFormula('min(low, close)', store);
    expect(result.length).toBe(50);
    for (let i = 0; i < 50; i++) {
      expect(result[i]).toBeCloseTo(Math.min(store.low[i], store.close[i]));
    }
  });
});

describe('ChartGrid', () => {
  it('creates grid cells', () => {
    const container = document.createElement('div');
    const grid = new ChartGrid(container, { columns: 2, rows: 2 });
    expect(grid.cellCount).toBe(4);
    expect(grid.getCells().length).toBe(4);
    grid.destroy();
  });

  it('getCell returns correct cell', () => {
    const container = document.createElement('div');
    const grid = new ChartGrid(container, { columns: 3, rows: 1 });
    expect(grid.getCell(0)).toBeDefined();
    expect(grid.getCell(2)).toBeDefined();
    expect(grid.getCell(5)).toBeUndefined();
    grid.destroy();
  });
});

describe('Volume Profile', () => {
  const store = makeStore(100);

  it('computes bins with POC and value area', () => {
    const result = computeVolumeProfile(store, 0, 99, { binCount: 20 });
    expect(result.bins.length).toBe(20);
    expect(result.poc).toBeGreaterThan(0);
    expect(result.vah).toBeGreaterThan(result.val);
  });

  it('handles single bar', () => {
    const result = computeVolumeProfile(store, 0, 0, { binCount: 10 });
    expect(result.bins.length).toBe(10);
  });

  it('returns totalVolume', () => {
    const result = computeVolumeProfile(store, 0, 99, { binCount: 20 });
    expect(result.totalVolume).toBeGreaterThan(0);
  });
});

describe('Pattern Recognition', () => {
  const store = makeStore(100);

  it('returns array of pattern matches', () => {
    const patterns = detectPatterns(store, 0, 99);
    expect(Array.isArray(patterns)).toBe(true);
    for (const p of patterns) {
      expect(p.type).toBeDefined();
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe('Depth Chart Renderer', () => {
  it('renders without throwing', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom may not support canvas

    const data = {
      bids: [
        { price: 99, cumVolume: 1000 },
        { price: 98, cumVolume: 2500 },
        { price: 97, cumVolume: 4000 },
      ],
      asks: [
        { price: 101, cumVolume: 800 },
        { price: 102, cumVolume: 2000 },
        { price: 103, cumVolume: 3500 },
      ],
    };

    expect(() => renderDepthChart(ctx, data, 400, 200)).not.toThrow();
  });

  it('handles empty data', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    expect(() => renderDepthChart(ctx, { bids: [], asks: [] }, 400, 200)).not.toThrow();
  });
});
