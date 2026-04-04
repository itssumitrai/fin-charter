import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AreaRenderer } from '@/renderers/area';
import { BarOHLCRenderer } from '@/renderers/bar-ohlc';
import { BaselineRenderer } from '@/renderers/baseline';
import { HistogramRenderer } from '@/renderers/histogram';
import { HollowCandleRenderer } from '@/renderers/hollow-candle';
import { LineRenderer } from '@/renderers/line';
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

/**
 * Build a ColumnStore from a simple bar array.
 */
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

/** Identity mapping functions — index maps to itself, price maps to itself. */
const indexToX = (i: number) => i * 10;
const priceToY = (p: number) => 600 - p;

// ─── AreaRenderer ────────────────────────────────────────────────────────────

describe('AreaRenderer', () => {
  let renderer: AreaRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new AreaRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ lineColor: '#ff0000', lineWidth: 3 });
    // No throw — options are stored internally
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws gradient fill and line stroke', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Should save/restore context
      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // Should create a gradient for the fill area
      expect(mock.ctx.createLinearGradient).toHaveBeenCalled();
      expect(mock.gradient.addColorStop).toHaveBeenCalledTimes(2);

      // Should call fill for the gradient area
      expect(mock.ctx.fill).toHaveBeenCalled();

      // Should call stroke for the line
      expect(mock.ctx.stroke).toHaveBeenCalled();

      // beginPath called twice: once for fill, once for line
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(2);

      // moveTo called twice (fill path + line path), lineTo for each subsequent point
      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(2);
      // 4 points lineTo in fill + 2 extra to close fill area + 4 in line = 10
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(10);

      // closePath called once for the fill path
      expect(mock.ctx.closePath).toHaveBeenCalledTimes(1);

      // Line style
      expect(mock.ctx.setLineDash).toHaveBeenCalledWith([]);
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 3, toIdx: 2 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
      expect(mock.ctx.stroke).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.fill).toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('pixelRatio scaling', () => {
    it('scales coordinates by pixelRatio', () => {
      mock = makeMockTarget({ pixelRatio: 2 });
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // First point: indexToX(0)=0, priceToY(105)=495
      // Scaled: x=0*2=0, y=495*2=990
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(0, 990);
    });
  });
});

// ─── BarOHLCRenderer ─────────────────────────────────────────────────────────

describe('BarOHLCRenderer', () => {
  let renderer: BarOHLCRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new BarOHLCRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ upColor: '#00ff00', downColor: '#ff0000', lineWidth: 2 });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws vertical high-low line and open/close ticks for each bar', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };
      const barWidth = 8;

      renderer.draw(mock.target, store, range, indexToX, priceToY, barWidth);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // For each bar: 3 strokes (high-low, open tick, close tick)
      // 5 bars * 3 = 15
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(15);
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(15);
    });

    it('uses upColor when close >= open', () => {
      // Bar 0: open=100, close=105 => up
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.strokeStyle).toBe('#22AB94');
    });

    it('uses downColor when close < open', () => {
      // Bar 1: open=105, close=98 => down
      const store = makeStore([SAMPLE_BARS[1]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.strokeStyle).toBe('#F7525F');
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

    it('draws a single bar correctly', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // 3 strokes for 1 bar
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(3);
    });
  });

  describe('OHLC coordinates', () => {
    it('draws high-low vertical line with correct Y coordinates', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      const cx = Math.round(indexToX(0));
      const highY = Math.round(priceToY(110));
      const lowY = Math.round(priceToY(90));

      // First beginPath+moveTo+lineTo is the high-low line
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(cx, highY);
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(cx, lowY);
    });
  });
});

// ─── BaselineRenderer ────────────────────────────────────────────────────────

describe('BaselineRenderer', () => {
  let renderer: BaselineRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new BaselineRenderer();
    renderer.applyOptions({ basePrice: 100 });
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(new BaselineRenderer()).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ topLineColor: '#00ff00', bottomLineColor: '#ff0000' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws fill regions, line strokes, and dashed baseline', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // 2 fill regions (top + bottom) each use fill
      expect(mock.ctx.fill).toHaveBeenCalledTimes(2);

      // stroke called: 2 line draws (top + bottom) + 1 dashed baseline = 3
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(3);

      // clip called: 2 fills + 2 lines = 4
      expect(mock.ctx.clip).toHaveBeenCalledTimes(4);
    });

    it('draws the dashed baseline with setLineDash', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // setLineDash called with empty array for lines, and with dashes for baseline
      const calls = mock.ctx.setLineDash.mock.calls;
      // The last setLineDash call should be the dashed baseline
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0][0]).toBeGreaterThan(0); // non-zero dash
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

    it('draws with a single bar without error', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('baseline Y coordinate', () => {
    it('draws the baseline at the correct Y for the configured basePrice', () => {
      renderer.applyOptions({ basePrice: 100 });
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      const baselineY = Math.round(priceToY(100)); // 500
      // The dashed baseline moveTo starts at (0, baselineY)
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(0, baselineY);
    });
  });
});

// ─── HistogramRenderer ───────────────────────────────────────────────────────

describe('HistogramRenderer', () => {
  let renderer: HistogramRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new HistogramRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ upColor: 'green', downColor: 'red' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws a filled rectangle for each bar', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // One fillRect per bar = 5
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(5);
    });

    it('uses upColor when close >= open', () => {
      // Bar 0: close=105 >= open=100 => up
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // fillStyle should have been set to the default upColor
      expect(mock.ctx.fillStyle).toBe('rgba(34, 171, 148, 0.5)');
    });

    it('uses downColor when close < open', () => {
      // Bar 1: close=98 < open=105 => down
      const store = makeStore([SAMPLE_BARS[1]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.fillStyle).toBe('rgba(247, 82, 95, 0.5)');
    });
  });

  describe('bar geometry', () => {
    it('draws bars extending from the close price down to the bottom', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };
      const barWidth = 8;
      const pr = 1;

      renderer.draw(mock.target, store, range, indexToX, priceToY, barWidth);

      const cx = Math.round(indexToX(0) * pr);
      const topY = Math.round(priceToY(105) * pr); // close=105 => y=495
      const halfBar = Math.max(1, Math.round((barWidth * pr) / 2));
      const bottomY = Math.round(600 * pr);
      const barH = Math.max(1, bottomY - topY);

      expect(mock.ctx.fillRect).toHaveBeenCalledWith(cx - halfBar, topY, halfBar * 2, barH);
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

// ─── HollowCandleRenderer ───────────────────────────────────────────────────

describe('HollowCandleRenderer', () => {
  let renderer: HollowCandleRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new HollowCandleRenderer();
    mock = makeMockTarget();
  });

  it('can be instantiated with default options', () => {
    expect(renderer).toBeDefined();
  });

  it('accepts custom options via applyOptions', () => {
    renderer.applyOptions({ upColor: '#00ff00', downColor: '#ff0000', wickColor: '#000' });
    expect(renderer).toBeDefined();
  });

  describe('draw() with sample bars', () => {
    it('draws wick and body for each bar', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();

      // Each bar draws a wick (fillRect). For up candles, body is strokeRect.
      // For down candles, body is fillRect.
      // Bars: 0=up, 1=down, 2=up, 3=up, 4=down
      // Wicks: 5 fillRect calls
      // Down body fills: 2 fillRect calls (bars 1, 4)
      // Up body strokes: 3 strokeRect calls (bars 0, 2, 3)
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(7); // 5 wicks + 2 down bodies
      expect(mock.ctx.strokeRect).toHaveBeenCalledTimes(3); // 3 up bodies
    });

    it('uses upColor for hollow (up) candles via strokeRect', () => {
      // Bar 0: close=105 >= open=100 => up (hollow)
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // strokeStyle should be upColor for the hollow body
      expect(mock.ctx.strokeStyle).toBe('#22AB94');
      expect(mock.ctx.strokeRect).toHaveBeenCalledTimes(1);
    });

    it('uses downColor for filled (down) candles via fillRect', () => {
      // Bar 1: close=98 < open=105 => down (filled)
      const store = makeStore([SAMPLE_BARS[1]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      // fillRect called twice: once for wick, once for body
      expect(mock.ctx.fillRect).toHaveBeenCalledTimes(2);
      expect(mock.ctx.strokeRect).not.toHaveBeenCalled();
    });

    it('draws wick with wickColor', () => {
      const customWickColor = '#123456';
      renderer.applyOptions({ wickColor: customWickColor });

      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      // Track fillStyle at each fillRect call
      let currentFillStyle = '';
      Object.defineProperty(mock.ctx, 'fillStyle', {
        configurable: true,
        get() { return currentFillStyle; },
        set(value: string | CanvasGradient | CanvasPattern) { currentFillStyle = String(value); },
      });

      const fillStyleAtFillRect: string[] = [];
      mock.ctx.fillRect.mockImplementation(() => {
        fillStyleAtFillRect.push(currentFillStyle);
      });

      renderer.draw(mock.target, store, range, indexToX, priceToY, 8);

      expect(mock.ctx.fillRect).toHaveBeenCalled();
      // The wick is drawn first, so the first fillRect should use wickColor
      expect(fillStyleAtFillRect[0]).toBe(customWickColor);
    });
  });

  describe('candle body geometry', () => {
    it('computes correct body top/bottom for up candle', () => {
      const store = makeStore([SAMPLE_BARS[0]]); // open=100, close=105
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };
      const barWidth = 8;
      const pr = 1;

      renderer.draw(mock.target, store, range, indexToX, priceToY, barWidth);

      const cx = Math.round(indexToX(0) * pr);
      const openY = Math.round(priceToY(100) * pr);  // 500
      const closeY = Math.round(priceToY(105) * pr); // 495
      const halfBody = Math.max(1, Math.round((barWidth * pr) / 2));
      const bodyTop = Math.min(openY, closeY);   // 495
      const bodyBottom = Math.max(openY, closeY); // 500
      const bodyHeight = Math.max(1, bodyBottom - bodyTop); // 5
      const borderWidth = Math.max(1, Math.round(pr));

      // Up candle: strokeRect
      expect(mock.ctx.strokeRect).toHaveBeenCalledWith(
        cx - halfBody + borderWidth / 2,
        bodyTop + borderWidth / 2,
        halfBody * 2 - borderWidth,
        bodyHeight - borderWidth,
      );
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

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.fillRect).toHaveBeenCalled(); // at least wick
    });
  });
});

// ─── LineRenderer ────────────────────────────────────────────────────────────

describe('LineRenderer', () => {
  let renderer: LineRenderer;
  let mock: ReturnType<typeof makeMockTarget>;

  beforeEach(() => {
    renderer = new LineRenderer();
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
    it('draws a polyline through close prices', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).toHaveBeenCalled();
      expect(mock.ctx.restore).toHaveBeenCalled();
      expect(mock.ctx.beginPath).toHaveBeenCalledTimes(1);

      // moveTo for first point, lineTo for remaining 4
      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(1);
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(4);
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it('sets the correct line style', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.strokeStyle).toBe('#2196F3');
      expect(mock.ctx.lineWidth).toBe(2); // default lineWidth=2, pr=1
      expect(mock.ctx.lineJoin).toBe('round');
      expect(mock.ctx.lineCap).toBe('round');
      expect(mock.ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('applies custom color via applyOptions', () => {
      renderer.applyOptions({ color: '#ff0000' });
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.strokeStyle).toBe('#ff0000');
    });
  });

  describe('coordinate calculations', () => {
    it('uses correct x and y pixel positions', () => {
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Bar 0: x=indexToX(0)*1=0, y=priceToY(105)*1=495
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(0, 495);
      // Bar 1: x=indexToX(1)*1=10, y=priceToY(98)*1=502
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(10, 502);
    });

    it('scales coordinates by pixelRatio', () => {
      mock = makeMockTarget({ pixelRatio: 2 });
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 2 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Bar 0: x=0*2=0, y=495*2=990
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(0, 990);
      // Bar 1: x=10*2=20, y=502*2=1004
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(20, 1004);
    });
  });

  describe('edge cases', () => {
    it('does nothing when fromIdx >= toIdx', () => {
      const store = makeStore(SAMPLE_BARS);
      const range: VisibleRange = { fromIdx: 5, toIdx: 3 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
      expect(mock.ctx.stroke).not.toHaveBeenCalled();
    });

    it('does nothing when store is empty', () => {
      const store = makeStore([]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 5 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.save).not.toHaveBeenCalled();
    });

    it('draws a single bar as just a moveTo (no lineTo)', () => {
      const store = makeStore([SAMPLE_BARS[0]]);
      const range: VisibleRange = { fromIdx: 0, toIdx: 1 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(1);
      expect(mock.ctx.lineTo).not.toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalledTimes(1);
    });

    it('clamps to store.length when toIdx exceeds it', () => {
      const store = makeStore(SAMPLE_BARS.slice(0, 2));
      const range: VisibleRange = { fromIdx: 0, toIdx: 10 };

      renderer.draw(mock.target, store, range, indexToX, priceToY);

      // Only 2 bars in store
      expect(mock.ctx.moveTo).toHaveBeenCalledTimes(1);
      expect(mock.ctx.lineTo).toHaveBeenCalledTimes(1);
    });
  });
});
