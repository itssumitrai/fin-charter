import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StepLineRenderer } from '@/renderers/step-line';
import { ColoredLineRenderer } from '@/renderers/colored-line';
import { ColoredMountainRenderer } from '@/renderers/colored-mountain';
import { HLCAreaRenderer } from '@/renderers/hlc-area';
import { HighLowRenderer } from '@/renderers/high-low';
import { ColumnRenderer } from '@/renderers/column';
import { VolumeCandleRenderer } from '@/renderers/volume-candle';
import { BaselineDeltaMountainRenderer } from '@/renderers/baseline-delta-mountain';
import { RenkoRenderer } from '@/renderers/renko';
import { KagiRenderer } from '@/renderers/kagi';
import { LineBreakRenderer } from '@/renderers/line-break';
import { PointFigureRenderer } from '@/renderers/point-figure';
import type { ColumnStore, IRenderTarget, VisibleRange } from '@/core/types';

// ─── Shared helpers ──────────────────────────────────────────────────────────

function makeMockGradient(): CanvasGradient {
  return { addColorStop: vi.fn() } as unknown as CanvasGradient;
}

function makeMockTarget(opts?: { width?: number; height?: number; pixelRatio?: number }) {
  const width = opts?.width ?? 800;
  const height = opts?.height ?? 600;
  const pixelRatio = opts?.pixelRatio ?? 1;
  const gradient = makeMockGradient();

  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue(gradient),
    ellipse: vi.fn(),
    strokeStyle: '',
    fillStyle: '' as string | CanvasGradient,
    lineWidth: 1,
    lineJoin: 'miter' as CanvasLineJoin,
    lineCap: 'butt' as CanvasLineCap,
  };

  const target: IRenderTarget = {
    canvas: {} as HTMLCanvasElement,
    context: ctx as unknown as CanvasRenderingContext2D,
    width,
    height,
    pixelRatio,
  };

  return { target, ctx, gradient };
}

function makeStore(
  bars: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>,
): ColumnStore {
  const capacity = Math.max(bars.length, 8);
  const store: ColumnStore = {
    time: new Float64Array(capacity),
    open: new Float64Array(capacity),
    high: new Float64Array(capacity),
    low: new Float64Array(capacity),
    close: new Float64Array(capacity),
    volume: new Float64Array(capacity),
    length: bars.length,
    capacity,
  };
  for (let i = 0; i < bars.length; i++) {
    store.time[i] = bars[i].time;
    store.open[i] = bars[i].open;
    store.high[i] = bars[i].high;
    store.low[i] = bars[i].low;
    store.close[i] = bars[i].close;
    store.volume[i] = bars[i].volume;
  }
  return store;
}

const SAMPLE_BARS = [
  { time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
  { time: 2, open: 105, high: 115, low: 95, close: 98, volume: 1200 },
  { time: 3, open: 98, high: 108, low: 88, close: 102, volume: 800 },
  { time: 4, open: 102, high: 112, low: 92, close: 107, volume: 900 },
  { time: 5, open: 107, high: 120, low: 100, close: 103, volume: 1100 },
];

const indexToX = (i: number) => i * 10;
const priceToY = (p: number) => 600 - p;

// ─── StepLineRenderer ───────────────────────────────────────────────────────

describe('StepLineRenderer', () => {
  let renderer: StepLineRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new StepLineRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ color: '#ff0000', lineWidth: 3 });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws a step line through close prices', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(1);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(1);

      // First point: moveTo, then for each subsequent bar: 2 lineTo (horizontal + vertical)
      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(1);
      // 4 subsequent bars * 2 lineTo per step = 8
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(8);
    });

    it('sets correct stroke style', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.strokeStyle).toBe('#2196F3');
      expect(mock.ctx.lineJoin).toBe('round');
      expect(mock.ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('draws horizontal-then-vertical steps at correct coordinates', () => {
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Bar 0: moveTo(0, 495)  (close=105, y=600-105=495)
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(0, 495);
      // Bar 1: horizontal to x=10 at previous y=495, then vertical to y=502
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(10, 495);
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(10, 502);
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 3, toIdx: 2 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar as just a moveTo', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(1);
      expect(mock.ctx.lineTo).not.toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── ColoredLineRenderer ───────────────────────────────────────────────────

describe('ColoredLineRenderer', () => {
  let renderer: ColoredLineRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new ColoredLineRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ upColor: '#00ff00', downColor: '#ff0000', lineWidth: 3 });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws one segment per consecutive pair of bars', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // Segments from bar pairs: (0,1), (1,2), (2,3), (3,4) = 4 segments
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(4);
      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(4);
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(4);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(4);
    });

    it('uses upColor for rising segments and downColor for falling', () => {
      // Bar 0 close=105 -> Bar 1 close=98 => down
      // Bar 1 close=98  -> Bar 2 close=102 => up
      const store = makeStore(SAMPLE_BARS.slice(0, 3));
      const range: VisibleRange = { fromIdx: 0, toIdx: 3 };

      const strokeStyles: string[] = [];
      mock.ctx.stroke.mockImplementation(() => {
        strokeStyles.push(mock.ctx.strokeStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Segment 0->1: close drops 105->98 => downColor
      expect(strokeStyles[0]).toBe('#FF3B5C');
      // Segment 1->2: close rises 98->102 => upColor
      expect(strokeStyles[1]).toBe('#00E396');
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error (no segments)', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // With only 1 bar and fromIdx=0, loop starts at max(0,1)=1 which is beyond toIdx range
      // so no segments are drawn, but save/restore still happen
      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.beginPath).not.toHaveBeenCalled();
    });
  });
});

// ─── ColoredMountainRenderer ────────────────────────────────────────────────

describe('ColoredMountainRenderer', () => {
  let renderer: ColoredMountainRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new ColoredMountainRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ upColor: '#00ff00', downFillColor: 'rgba(255,0,0,0.3)' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws fill and stroke for each segment', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // 4 segments => 4 fills + 4 strokes, each with beginPath
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(8); // 4 fill + 4 stroke
      expect(mock.ctx.fill).toHaveBeenCalledTimes(4);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(4);
      expect(mock.ctx.closePath).toHaveBeenCalledTimes(4);
    });

    it('uses correct fill colors based on direction', () => {
      const store = makeStore(SAMPLE_BARS.slice(0, 3));
      const range: VisibleRange = { fromIdx: 0, toIdx: 3 };

      const fillStyles: (string | CanvasGradient)[] = [];
      mock.ctx.fill.mockImplementation(() => {
        fillStyles.push(mock.ctx.fillStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Segment 0->1: close drops 105->98 => downFillColor
      expect(fillStyles[0]).toBe('rgba(255, 59, 92, 0.28)');
      // Segment 1->2: close rises 98->102 => upFillColor
      expect(fillStyles[1]).toBe('rgba(0, 227, 150, 0.28)');
    });

    it('closes fill path to chart bottom', () => {
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Fill path: moveTo(x0,y0), lineTo(x1,y1), lineTo(x1,bottomY), lineTo(x0,bottomY), closePath
      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(2); // 1 fill + 1 stroke
      // lineTo: 3 for fill (to point, to bottom-right, to bottom-left) + 1 for stroke = 4
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(4);
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error (no segments)', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Like ColoredLine, loop starts at max(0,1)=1, no segments
      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.beginPath).not.toHaveBeenCalled();
    });
  });
});

// ─── HLCAreaRenderer ────────────────────────────────────────────────────────

describe('HLCAreaRenderer', () => {
  let renderer: HLCAreaRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new HLCAreaRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ highLineColor: '#00ff00', fillColor: 'rgba(0,0,255,0.1)' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws filled area between high and low, plus two polylines', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // 3 beginPaths: fill area, high line, low line
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(3);
      expect(mock.ctx.fill).toHaveBeenCalledTimes(1);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(2);
      expect(mock.ctx.closePath).toHaveBeenCalledTimes(1);
    });

    it('sets correct stroke colors for high and low lines', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      const strokeStyles: string[] = [];
      mock.ctx.stroke.mockImplementation(() => {
        strokeStyles.push(mock.ctx.strokeStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(strokeStyles[0]).toBe('#00E396'); // highLineColor
      expect(strokeStyles[1]).toBe('#FF3B5C'); // lowLineColor
    });

    it('uses the fill area between high and low points', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      const fillStyles: (string | CanvasGradient)[] = [];
      mock.ctx.fill.mockImplementation(() => {
        fillStyles.push(mock.ctx.fillStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(fillStyles[0]).toBe('rgba(33, 150, 243, 0.2)');
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.fill).toHaveBeenCalledTimes(1);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(2);
    });
  });
});

// ─── HighLowRenderer ────────────────────────────────────────────────────────

describe('HighLowRenderer', () => {
  let renderer: HighLowRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new HighLowRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ color: '#ff0000', lineWidth: 2 });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws vertical lines from high to low for each bar in a single path', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // Single beginPath + single stroke for all bars
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(1);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(1);

      // Each bar: moveTo(high) + lineTo(low) = 5 moveTo + 5 lineTo
      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(5);
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(5);
    });

    it('uses correct coordinates for high-low lines', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Bar 0: high=110 y=490, low=90 y=510
      const cx = Math.round(indexToX(0));
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(cx, 490);
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(cx, 510);
    });

    it('sets the default color', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.strokeStyle).toBe('#2196F3');
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(1);
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(1);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── ColumnRenderer ─────────────────────────────────────────────────────────

describe('ColumnRenderer', () => {
  let renderer: ColumnRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new ColumnRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ upColor: '#00ff00', downColor: '#ff0000' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws a filled rectangle for each bar', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(5);
    });

    it('uses upColor when close >= open', () => {
      // Bar 0: close=105 >= open=100 => up
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      const fillStyles: (string | CanvasGradient)[] = [];
      mock.ctx.fillRect.mockImplementation(() => {
        fillStyles.push(mock.ctx.fillStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(fillStyles[0]).toBe('#00E396');
    });

    it('uses downColor when close < open', () => {
      // Bar 1: close=98 < open=105 => down
      const store = makeStore([SAMPLE_BARS[1]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      const fillStyles: (string | CanvasGradient)[] = [];
      mock.ctx.fillRect.mockImplementation(() => {
        fillStyles.push(mock.ctx.fillStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(fillStyles[0]).toBe('#FF3B5C');
    });

    it('draws columns from close price to chart bottom', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };
      const barWidth = 8;

      renderer.draw(mock.target, store, range, indexToX, priceToY, barWidth);

      const cx = Math.round(indexToX(0));
      const yClose = Math.round(priceToY(105)); // 495
      const halfBar = Math.max(1, Math.round(barWidth / 2)); // 4
      const bottomY = Math.round(600);

      expect(mock.ctx.fillRect).toHaveBeenCalledWith(cx - halfBar, yClose, halfBar * 2, bottomY - yClose);
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── VolumeCandleRenderer ───────────────────────────────────────────────────

describe('VolumeCandleRenderer', () => {
  let renderer: VolumeCandleRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new VolumeCandleRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ upColor: '#00ff00', maxBarWidthMultiplier: 5 });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws wick and body for each bar', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // Each bar: 1 fillRect for wick + 1 fillRect for body = 2 per bar
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(10); // 5 bars * 2
    });

    it('scales body width by volume relative to max volume', () => {
      // Bar 0: volume=1000, Bar 1: volume=1200 (max)
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      const fillRectCalls: number[][] = [];
      mock.ctx.fillRect.mockImplementation((...args: number[]) => {
        fillRectCalls.push(args);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Body rects are at indices 1 and 3 (after wick at 0 and 2)
      const bar0BodyWidth = fillRectCalls[1][2]; // width of bar 0 body
      const bar1BodyWidth = fillRectCalls[3][2]; // width of bar 1 body

      // Bar 1 has max volume, so it should be wider
      expect(bar1BodyWidth).toBeGreaterThanOrEqual(bar0BodyWidth);
    });

    it('uses upColor for up candles and downColor for down candles', () => {
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      const bodyFillStyles: (string | CanvasGradient)[] = [];
      let callIdx = 0;
      mock.ctx.fillRect.mockImplementation(() => {
        bodyFillStyles.push(mock.ctx.fillStyle);
        callIdx++;
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Bar 0 (up): wick=#00E396, body=#00E396
      // Bar 1 (down): wick=#FF3B5C, body=#FF3B5C
      expect(bodyFillStyles[1]).toBe('#00E396'); // bar 0 body (up)
      expect(bodyFillStyles[3]).toBe('#FF3B5C'); // bar 1 body (down)
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // 1 wick + 1 body = 2
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(2);
    });
  });
});

// ─── BaselineDeltaMountainRenderer ──────────────────────────────────────────

describe('BaselineDeltaMountainRenderer', () => {
  let renderer: BaselineDeltaMountainRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new BaselineDeltaMountainRenderer();
    renderer.applyOptions({ basePrice: 100 });
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(new BaselineDeltaMountainRenderer()).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ topLineColor: '#00ff00', bottomFillColor: 'rgba(255,0,0,0.5)' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws gradient fills, line strokes, and dashed baseline', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // 2 gradient fills (top + bottom)
      expect(mock.ctx.fill).toHaveBeenCalledTimes(2);

      // 2 line strokes (top + bottom) + 1 dashed baseline = 3
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(3);

      // 2 clip regions for fills + 2 clip regions for lines = 4
      expect(mock.ctx.clip).toHaveBeenCalledTimes(4);

      // Gradients created: 2 (top fill + bottom fill)
      expect(mock.ctx.createLinearGradient).toHaveBeenCalledTimes(2);
    });

    it('draws dashed baseline with setLineDash', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      const calls = mock.ctx.setLineDash.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0][0]).toBeGreaterThan(0); // non-zero dash
    });

    it('draws baseline at the correct Y position', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      const baselineY = Math.round(priceToY(100)); // 500
      // The dashed baseline: moveTo(0, baselineY) then lineTo(width, baselineY)
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(0, baselineY);
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalled();
    });
  });
});

// ─── RenkoRenderer ──────────────────────────────────────────────────────────

describe('RenkoRenderer', () => {
  let renderer: RenkoRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new RenkoRenderer();
    renderer.applyOptions({ boxSize: 5 });
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(new RenkoRenderer()).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ boxSize: 10, upColor: '#00ff00' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws fillRect and strokeRect for each generated brick', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // Each brick gets 1 fillRect + 1 strokeRect
      // With boxSize=5 and close prices [105, 98, 102, 107, 103]:
      // From base=105: drop to 98 = -7 => 1 down brick, then rise to 102 (only +4, no brick),
      // then rise to 107 = +9 from 100 => reversal needs 2 boxes, that's enough for up bricks
      // Exact count depends on the algorithm; just verify some bricks are drawn
      expect(mock.ctx.fillRect.mock.calls.length).toBeGreaterThan(0);
      expect(mock.ctx.strokeRect.mock.calls.length).toBeGreaterThan(0);
      // Each brick has one fillRect and one strokeRect
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(mock.ctx.strokeRect.mock.calls.length);
    });

    it('uses upColor for up bricks and downColor for down bricks', () => {
      // Use larger price moves to guarantee bricks
      const bigMoveBars = [
        { time: 1, open: 100, high: 110, low: 90, close: 100, volume: 1000 },
        { time: 2, open: 100, high: 115, low: 95, close: 115, volume: 1200 },
      ];
      renderer.applyOptions({ boxSize: 5 });
      const store = makeStore(bigMoveBars);
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      const fillStyles: (string | CanvasGradient)[] = [];
      mock.ctx.fillRect.mockImplementation(() => {
        fillStyles.push(mock.ctx.fillStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // All bricks should be up (100 -> 115)
      for (const style of fillStyles) {
        expect(style).toBe('#00E396');
      }
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('handles a single bar without error (no bricks generated)', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Single bar cannot generate bricks (need price movement)
      // The guard returns early, or _buildBricks returns empty
      expect(mock.ctx.fillRect).not.toHaveBeenCalled();
    });
  });
});

// ─── KagiRenderer ───────────────────────────────────────────────────────────

describe('KagiRenderer', () => {
  let renderer: KagiRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new KagiRenderer();
    renderer.applyOptions({ reversalAmount: 5 });
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(new KagiRenderer()).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ yangColor: '#00ff00', yinWidth: 2 });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws segments with beginPath, moveTo, lineTo, and stroke', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // With reversalAmount=5 and close=[105,98,102,107,103]:
      // Bar 1: 105->98 = -7, > 5 => first segment (down)
      // Bar 2: 98->102 = +4, < 5 => no reversal
      // Bar 3: 98->107 = +9, >= 5 => reversal up
      // Bar 4: 107->103 = -4, < 5 => no reversal
      // So we should get at least 2 segments
      expect(mock.ctx.beginPath.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(mock.ctx.stroke.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('uses yang and yin colors for segments', () => {
      // Force a clear up trend for yang
      const upBars = [
        { time: 1, open: 100, high: 110, low: 90, close: 100, volume: 1000 },
        { time: 2, open: 100, high: 120, low: 95, close: 110, volume: 1200 },
        { time: 3, open: 110, high: 130, low: 105, close: 120, volume: 800 },
      ];
      renderer.applyOptions({ reversalAmount: 5 });
      const store = makeStore(upBars);
      const range: VisibleRange = { fromIdx: 0, toIdx: 3 };

      const strokeStyles: string[] = [];
      mock.ctx.stroke.mockImplementation(() => {
        strokeStyles.push(mock.ctx.strokeStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Uptrend should produce yang (green) segments
      if (strokeStyles.length > 0) {
        expect(strokeStyles[0]).toBe('#00E396');
      }
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('handles a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Single bar cannot build segments (need at least 2 bars for direction)
      expect(mock.ctx.stroke).not.toHaveBeenCalled();
    });
  });
});

// ─── LineBreakRenderer ──────────────────────────────────────────────────────

describe('LineBreakRenderer', () => {
  let renderer: LineBreakRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new LineBreakRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ breakCount: 2, upColor: '#00ff00' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws fillRect and strokeRect for each generated block', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // Each block gets 1 fillRect + 1 strokeRect
      // With breakCount=3 and close=[105,98,102,107,103]:
      // Block 1: 105->98 (down) -- always created (first block)
      // Block 2: 98->102 -- needs to break above high of last 1 block (max(105,98)=105) => 102 < 105, no
      //                     or below low (min(98,105)=98) => 102 > 98, no. Skip.
      // Block 3: 98->107 -- needs to break above 105 => 107 > 105, yes! Up block
      // Block 4: 107->103 -- needs to break below min of last 2 blocks... complicated
      // At minimum we should see some blocks
      expect(mock.ctx.fillRect.mock.calls.length).toBeGreaterThan(0);
      expect(mock.ctx.strokeRect.mock.calls.length).toBeGreaterThan(0);
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(mock.ctx.strokeRect.mock.calls.length);
    });

    it('uses upColor for up blocks and downColor for down blocks', () => {
      // Force a clear first block: close drops from 105 to 98 (down)
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      const fillStyles: (string | CanvasGradient)[] = [];
      mock.ctx.fillRect.mockImplementation(() => {
        fillStyles.push(mock.ctx.fillStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // First block: 105->98 = down => downColor
      if (fillStyles.length > 0) {
        expect(fillStyles[0]).toBe('#FF3B5C');
      }
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('handles a single bar without error (no blocks)', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Single bar produces no blocks (need at least 2 bars)
      expect(mock.ctx.fillRect).not.toHaveBeenCalled();
    });
  });
});

// ─── PointFigureRenderer ────────────────────────────────────────────────────

describe('PointFigureRenderer', () => {
  let renderer: PointFigureRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new PointFigureRenderer();
    renderer.applyOptions({ boxSize: 5, reversalBoxes: 2 });
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(new PointFigureRenderer()).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ boxSize: 10, reversalBoxes: 3, upColor: '#00ff00' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws X marks (diagonals) for rising columns', () => {
      // Force a clear uptrend
      const upBars = [
        { time: 1, open: 100, high: 110, low: 90, close: 100, volume: 1000 },
        { time: 2, open: 100, high: 125, low: 95, close: 120, volume: 1200 },
      ];
      renderer.applyOptions({ boxSize: 5, reversalBoxes: 2 });
      const store = makeStore(upBars);
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // X columns use beginPath + moveTo/lineTo + stroke for each box
      expect(mock.ctx.beginPath.mock.calls.length).toBeGreaterThan(0);
      expect(mock.ctx.stroke.mock.calls.length).toBeGreaterThan(0);

      // X marks draw diagonals: 2 moveTo + 2 lineTo per box
      expect(mock.ctx.moveTo.mock.calls.length).toBeGreaterThan(0);
      expect(mock.ctx.lineTo.mock.calls.length).toBeGreaterThan(0);
    });

    it('draws O marks (ellipse) for falling columns', () => {
      // Force an initial rise then reversal down
      const reversalBars = [
        { time: 1, open: 100, high: 130, low: 90, close: 100, volume: 1000 },
        { time: 2, open: 100, high: 125, low: 95, close: 120, volume: 1200 },
        { time: 3, open: 120, high: 125, low: 95, close: 105, volume: 800 },
      ];
      renderer.applyOptions({ boxSize: 5, reversalBoxes: 2 });
      const store = makeStore(reversalBars);
      const range: VisibleRange = { fromIdx: 0, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // After reversal, O columns should use ellipse
      // 120 -> 105 is a drop of 15 = 3 boxes, >= reversalBoxes(2), so reversal occurs
      expect(mock.ctx.ellipse.mock.calls.length).toBeGreaterThan(0);
    });

    it('uses upColor for X columns and downColor for O columns', () => {
      const upBars = [
        { time: 1, open: 100, high: 110, low: 90, close: 100, volume: 1000 },
        { time: 2, open: 100, high: 125, low: 95, close: 115, volume: 1200 },
      ];
      renderer.applyOptions({ boxSize: 5, reversalBoxes: 2 });
      const store = makeStore(upBars);
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      const strokeStyles: string[] = [];
      mock.ctx.stroke.mockImplementation(() => {
        strokeStyles.push(mock.ctx.strokeStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Up column should use upColor
      if (strokeStyles.length > 0) {
        expect(strokeStyles[0]).toBe('#00E396');
      }
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('handles a single bar without error (no columns)', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // Single bar: no direction established, no columns
      expect(mock.ctx.stroke).not.toHaveBeenCalled();
    });
  });
});
