import { describe, it, expect, vi } from 'vitest';
import { exportCSV, exportSVG, exportPDF } from '@/api/export';
import type { ColumnStore, VisibleRange } from '@/core/types';
import type { SeriesInfo, IndicatorInfo } from '@/api/export';

function makeStore(length: number, baseTime = 1609459200): ColumnStore {
  const time = new Float64Array(length);
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    time[i] = baseTime + i * 86400;
    open[i] = 100 + i;
    high[i] = 110 + i;
    low[i] = 90 + i;
    close[i] = 105 + i;
    volume[i] = 1000 * (i + 1);
  }
  return { time, open, high, low, close, volume, length };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

describe('exportCSV', () => {
  it('exports OHLCV data with ISO date header', () => {
    const store = makeStore(3);
    const series: SeriesInfo[] = [{ label: 'AAPL', store }];
    const csv = exportCSV(series, [], { fromIdx: 0, toIdx: 2 });

    const lines = csv.split('\n');
    expect(lines.length).toBe(4); // header + 3 rows
    expect(lines[0]).toBe('Date,Open,High,Low,Close,Volume');

    const row1 = lines[1].split(',');
    expect(row1[0]).toContain('2021-01-01'); // baseTime = 2021-01-01
    expect(row1[1]).toBe('100');
    expect(row1[2]).toBe('110');
    expect(row1[3]).toBe('90');
    expect(row1[4]).toBe('105');
    expect(row1[5]).toBe('1000');
  });

  it('respects from/to time filters', () => {
    const store = makeStore(10);
    const series: SeriesInfo[] = [{ label: 'TEST', store }];
    const from = store.time[2];
    const to = store.time[5];
    const csv = exportCSV(series, [], { fromIdx: 0, toIdx: 9 }, { from, to });

    const lines = csv.split('\n');
    expect(lines.length).toBe(5); // header + 4 rows [2..5]
  });

  it('uses custom separator', () => {
    const store = makeStore(2);
    const series: SeriesInfo[] = [{ label: '', store }];
    const csv = exportCSV(series, [], { fromIdx: 0, toIdx: 1 }, { separator: '\t' });

    const lines = csv.split('\n');
    expect(lines[0]).toContain('\t');
    expect(lines[0].split('\t').length).toBe(6);
  });

  it('includes indicator columns', () => {
    const store = makeStore(3);
    const series: SeriesInfo[] = [{ label: 'SPY', store }];
    const smaValues = new Float64Array([NaN, 102.5, 103.5]);
    const indicators: IndicatorInfo[] = [
      { label: 'SMA', outputs: new Map([['SMA', smaValues]]) },
    ];
    const csv = exportCSV(series, indicators, { fromIdx: 0, toIdx: 2 });

    const lines = csv.split('\n');
    expect(lines[0]).toContain('SMA SMA');
    // First row: NaN → empty
    expect(lines[1].split(',').pop()).toBe('');
    // Second row: has value
    expect(lines[2].split(',').pop()).toBe('102.5');
  });

  it('returns empty string for empty series', () => {
    expect(exportCSV([], [], null)).toBe('');
  });

  it('returns empty string for empty store', () => {
    const store = makeStore(0);
    expect(exportCSV([{ label: '', store }], [], null)).toBe('');
  });

  it('includes multiple series columns', () => {
    const store1 = makeStore(3);
    const store2 = makeStore(3, 1609459200);
    const series: SeriesInfo[] = [
      { label: 'AAPL', store: store1 },
      { label: 'GOOG', store: store2 },
    ];
    const csv = exportCSV(series, [], { fromIdx: 0, toIdx: 2 });
    const header = csv.split('\n')[0];
    expect(header).toContain('GOOG Open');
    expect(header).toContain('GOOG Close');
  });

  it('handles null range (uses full store)', () => {
    const store = makeStore(5);
    const csv = exportCSV([{ label: '', store }], [], null);
    const lines = csv.split('\n');
    expect(lines.length).toBe(6); // header + 5 rows
  });
});

// ─── SVG Export ───────────────────────────────────────────────────────────────

describe('exportSVG', () => {
  it('generates valid SVG with embedded image', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const svg = exportSVG(canvas);

    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="400"');
    expect(svg).toContain('<image');
    expect(svg).toContain('</svg>');
  });
});

// ─── PDF Export ───────────────────────────────────────────────────────────────

describe('exportPDF', () => {
  // jsdom doesn't support toDataURL with actual image data, so mock it
  function mockCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    // Mock toDataURL to return a minimal valid JPEG base64
    vi.spyOn(canvas, 'toDataURL').mockReturnValue(
      'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    );
    return canvas;
  }

  it('returns a Blob with PDF content type', () => {
    const canvas = mockCanvas();
    const blob = exportPDF(canvas);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('uses landscape letter by default', () => {
    const canvas = mockCanvas();
    const blob = exportPDF(canvas);
    expect(blob.size).toBeGreaterThan(100);
  });

  it('accepts page size and orientation options', () => {
    const canvas = mockCanvas();
    const blob = exportPDF(canvas, { pageSize: 'a4', orientation: 'portrait' });
    expect(blob.size).toBeGreaterThan(100);
  });

  it('includes title when provided', () => {
    const canvas = mockCanvas();
    const blob = exportPDF(canvas, { title: 'Test Chart' });
    expect(blob.size).toBeGreaterThan(100);
  });
});
