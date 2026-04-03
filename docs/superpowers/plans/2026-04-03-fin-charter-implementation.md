# fin-charter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tree-shakeable, Canvas-based TypeScript financial charting library with TradingView-compatible plugin architecture, 6 chart types, 6 indicators, and <15KB gzipped core.

**Architecture:** Layered canvas rendering with InvalidateMask scheduling, columnar Float64Array data storage, Svelte-compiled DOM overlays, and ISeriesPrimitive plugin system. Single npm package with deep import paths for tree-shaking.

**Tech Stack:** TypeScript (strict), Svelte 5, Vite (library mode + dev server), Vitest, ESLint, Prettier

---

## File Structure

### Project Config Files
- `package.json` — npm package config, exports map, scripts, sideEffects: false
- `tsconfig.json` — TypeScript strict config
- `tsconfig.node.json` — Node config for Vite
- `vite.config.ts` — Library build + dev server config
- `svelte.config.js` — Svelte preprocessor config
- `eslint.config.js` — ESLint flat config
- `.prettierrc` — Prettier config
- `vitest.config.ts` — Vitest config

### Core (`src/core/`)
- `src/core/types.ts` — All shared types, interfaces (Bar, ColumnData, ColumnStore, options, etc.)
- `src/core/data-layer.ts` — ColumnStore creation, Bar[] conversion, binary search, append, update
- `src/core/invalidation.ts` — InvalidateMask enum and per-pane tracking
- `src/core/time-scale.ts` — TimeScale: viewport, barSpacing, index↔pixel conversion, visible range
- `src/core/price-scale.ts` — PriceScale: price↔pixel, auto-scale, manual range
- `src/core/series.ts` — Base Series: owns DataLayer + PriceScale reference, manages primitives
- `src/core/crosshair.ts` — Crosshair: snap-to-bar, position state
- `src/core/pane.ts` — Pane: holds series list, price scales, invalidation level
- `src/core/chart.ts` — ChartModel: orchestrator, pane management, RAF render loop

### Renderers (`src/renderers/`)
- `src/renderers/renderer.ts` — IRenderer, IRenderTarget, IPaneRenderer, IPaneView, RenderStyle types
- `src/renderers/canvas-renderer.ts` — CanvasRenderer: wraps Canvas2D context
- `src/renderers/text-cache.ts` — TextMetricsCache: glyph width caching for fast text measurement
- `src/renderers/line.ts` — LineRenderer: draws close-price polyline
- `src/renderers/candlestick.ts` — CandlestickRenderer: draws OHLC candles
- `src/renderers/area.ts` — AreaRenderer: line + gradient fill
- `src/renderers/bar-ohlc.ts` — BarOHLCRenderer: traditional OHLC bars
- `src/renderers/baseline.ts` — BaselineRenderer: above/below base price coloring
- `src/renderers/hollow-candle.ts` — HollowCandleRenderer: filled/hollow candles
- `src/renderers/histogram.ts` — HistogramRenderer: volume-style bars

### Series (`src/series/`)
- `src/series/line.ts` — LineSeries: connects LineRenderer + Series base
- `src/series/candlestick.ts` — CandlestickSeries
- `src/series/area.ts` — AreaSeries
- `src/series/bar.ts` — BarSeries
- `src/series/baseline.ts` — BaselineSeries
- `src/series/hollow-candle.ts` — HollowCandleSeries
- `src/series/volume.ts` — VolumeSeries

### Indicators (`src/indicators/`)
- `src/indicators/sma.ts` — SMA compute + ISeriesPrimitive wrapper
- `src/indicators/ema.ts` — EMA compute + ISeriesPrimitive wrapper
- `src/indicators/bollinger.ts` — Bollinger Bands compute + ISeriesPrimitive wrapper
- `src/indicators/rsi.ts` — RSI compute + ISeriesPrimitive wrapper
- `src/indicators/macd.ts` — MACD compute + ISeriesPrimitive wrapper
- `src/indicators/volume.ts` — Volume indicator + ISeriesPrimitive wrapper
- `src/indicators/index.ts` — Barrel export for `fin-charter/indicators`

### Interactions (`src/interactions/`)
- `src/interactions/event-router.ts` — Unified PointerEvent router, pane targeting
- `src/interactions/pan-zoom.ts` — Pan + wheel/pinch zoom with kinetic scrolling
- `src/interactions/crosshair.ts` — Crosshair interaction handler
- `src/interactions/keyboard-nav.ts` — Keyboard navigation (opt-in)
- `src/interactions/axis-drag.ts` — Axis drag-scaling (opt-in)

### GUI (`src/gui/`)
- `src/gui/ChartWidget.svelte` — Root container, ResizeObserver, pane layout
- `src/gui/PaneWidget.svelte` — 3 layered canvases, routes events
- `src/gui/PriceAxisWidget.svelte` — Price axis labels
- `src/gui/TimeAxisWidget.svelte` — Time axis labels
- `src/gui/CrosshairLabel.svelte` — Floating crosshair tooltip
- `src/gui/PaneSeparator.svelte` — Draggable pane divider
- `src/gui/Legend.svelte` — OHLCV values display

### API (`src/api/`)
- `src/api/options.ts` — ChartOptions, SeriesOptions, DeepPartial, defaults
- `src/api/series-api.ts` — ISeriesApi implementation wrapping Series model
- `src/api/pane-api.ts` — IPaneApi implementation wrapping Pane model
- `src/api/chart-api.ts` — createChart(), IChartApi implementation wrapping ChartModel

### Entry Points
- `src/index.ts` — Public barrel: exports createChart, types, series option types

### Dev App
- `dev/index.html` — HTML shell
- `dev/main.ts` — Mount dev app
- `dev/App.svelte` — Dev playground with sample chart
- `dev/data.ts` — Sample OHLCV data generator

### Tests
- `tests/core/data-layer.test.ts`
- `tests/core/invalidation.test.ts`
- `tests/core/time-scale.test.ts`
- `tests/core/price-scale.test.ts`
- `tests/core/crosshair.test.ts`
- `tests/renderers/canvas-renderer.test.ts`
- `tests/renderers/text-cache.test.ts`
- `tests/indicators/sma.test.ts`
- `tests/indicators/ema.test.ts`
- `tests/indicators/rsi.test.ts`
- `tests/indicators/macd.test.ts`
- `tests/indicators/bollinger.test.ts`
- `tests/indicators/volume.test.ts`
- `tests/interactions/pan-zoom.test.ts`
- `tests/interactions/crosshair.test.ts`
- `tests/api/chart-api.test.ts`

### Docs
- `docs/getting-started.md`
- `docs/api-reference.md`
- `docs/indicators.md`
- `docs/plugins.md`
- `docs/performance.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `svelte.config.js`, `eslint.config.js`, `.prettierrc`, `vitest.config.ts`, `src/index.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/raisumit/Documents/My\ Programs/fin-charter
npm init -y
```

Then replace `package.json` contents with:

```json
{
  "name": "fin-charter",
  "version": "0.1.0",
  "description": "Ultra-fast, tree-shakeable financial charting library",
  "type": "module",
  "license": "MIT",
  "sideEffects": false,
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./indicators": {
      "types": "./dist/indicators/index.d.ts",
      "import": "./dist/indicators/index.js"
    },
    "./indicators/*": {
      "types": "./dist/indicators/*.d.ts",
      "import": "./dist/indicators/*.js"
    },
    "./interactions/*": {
      "types": "./dist/interactions/*.d.ts",
      "import": "./dist/interactions/*.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "vite dev/",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "format": "prettier --write \"src/**/*.{ts,svelte}\"",
    "format:check": "prettier --check \"src/**/*.{ts,svelte}\""
  },
  "keywords": ["chart", "financial", "trading", "candlestick", "canvas", "lightweight"],
  "devDependencies": {},
  "peerDependencies": {}
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install --save-dev typescript svelte @sveltejs/vite-plugin-svelte vite vitest eslint @eslint/js typescript-eslint eslint-plugin-svelte prettier prettier-plugin-svelte svelte-check
```

- [ ] **Step 3: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"],
  "exclude": ["node_modules", "dist", "dev", "tests"]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "svelte.config.js", "vitest.config.ts"]
}
```

- [ ] **Step 5: Create vite.config.ts**

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
    target: 'es2021',
    minify: 'terser',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 6: Create svelte.config.js**

Create `svelte.config.js`:

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    customElement: false,
  },
};
```

- [ ] **Step 7: Create eslint.config.js**

Create `eslint.config.js`:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'dev/'],
  },
];
```

- [ ] **Step 8: Create .prettierrc**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

- [ ] **Step 9: Create vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 10: Create entry point stub**

Create `src/index.ts`:

```typescript
export const VERSION = '0.1.0';
```

- [ ] **Step 11: Verify setup**

Run:
```bash
npx tsc --noEmit
npx vitest run
```

Expected: TypeScript compiles with no errors. Vitest runs with 0 tests.

- [ ] **Step 12: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts svelte.config.js eslint.config.js .prettierrc vitest.config.ts src/index.ts package-lock.json
git commit -m "feat: scaffold project with TypeScript, Svelte, Vite, Vitest, ESLint, Prettier"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/core/types.ts`
- Test: `tests/core/types.test.ts`

- [ ] **Step 1: Write type validation test**

Create `tests/core/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  createColumnStore,
  barsToColumnStore,
  type Bar,
  type ColumnData,
  type ColumnStore,
  InvalidationLevel,
} from '@/core/types';

describe('ColumnStore', () => {
  it('creates empty store with given capacity', () => {
    const store = createColumnStore(100);
    expect(store.length).toBe(0);
    expect(store.capacity).toBe(100);
    expect(store.time).toBeInstanceOf(Float64Array);
    expect(store.time.length).toBe(100);
    expect(store.open.length).toBe(100);
    expect(store.high.length).toBe(100);
    expect(store.low.length).toBe(100);
    expect(store.close.length).toBe(100);
    expect(store.volume.length).toBe(100);
  });

  it('converts Bar[] to ColumnStore', () => {
    const bars: Bar[] = [
      { time: 1000, open: 10, high: 15, low: 8, close: 12, volume: 100 },
      { time: 2000, open: 12, high: 18, low: 11, close: 16, volume: 200 },
    ];
    const store = barsToColumnStore(bars);
    expect(store.length).toBe(2);
    expect(store.capacity).toBeGreaterThanOrEqual(2);
    expect(store.time[0]).toBe(1000);
    expect(store.time[1]).toBe(2000);
    expect(store.open[0]).toBe(10);
    expect(store.close[1]).toBe(16);
    expect(store.volume[1]).toBe(200);
  });

  it('sets default capacity to max(dataLength * 1.5, 2048)', () => {
    const bars: Bar[] = Array.from({ length: 10 }, (_, i) => ({
      time: i * 1000,
      open: 10,
      high: 15,
      low: 8,
      close: 12,
    }));
    const store = barsToColumnStore(bars);
    expect(store.capacity).toBe(2048);

    const largeBars: Bar[] = Array.from({ length: 3000 }, (_, i) => ({
      time: i * 1000,
      open: 10,
      high: 15,
      low: 8,
      close: 12,
    }));
    const largeStore = barsToColumnStore(largeBars);
    expect(largeStore.capacity).toBe(4500);
  });
});

describe('InvalidationLevel', () => {
  it('has correct numeric values for ordering', () => {
    expect(InvalidationLevel.None).toBe(0);
    expect(InvalidationLevel.Cursor).toBe(1);
    expect(InvalidationLevel.Light).toBe(2);
    expect(InvalidationLevel.Full).toBe(3);
    expect(InvalidationLevel.Full > InvalidationLevel.Light).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/types.test.ts`
Expected: FAIL — cannot find module `@/core/types`

- [ ] **Step 3: Implement core types**

Create `src/core/types.ts`:

```typescript
// ─── Data Types ─────────────────────────────────────────

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ColumnData {
  time: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume?: Float64Array;
}

export interface ColumnStore {
  time: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
  length: number;
  capacity: number;
}

export function createColumnStore(capacity: number): ColumnStore {
  return {
    time: new Float64Array(capacity),
    open: new Float64Array(capacity),
    high: new Float64Array(capacity),
    low: new Float64Array(capacity),
    close: new Float64Array(capacity),
    volume: new Float64Array(capacity),
    length: 0,
    capacity,
  };
}

export function barsToColumnStore(bars: Bar[]): ColumnStore {
  const capacity = Math.max(Math.ceil(bars.length * 1.5), 2048);
  const store = createColumnStore(capacity);
  const len = bars.length;
  for (let i = 0; i < len; i++) {
    const bar = bars[i];
    store.time[i] = bar.time;
    store.open[i] = bar.open;
    store.high[i] = bar.high;
    store.low[i] = bar.low;
    store.close[i] = bar.close;
    store.volume[i] = bar.volume ?? 0;
  }
  store.length = len;
  return store;
}

// ─── Invalidation ───────────────────────────────────────

export const enum InvalidationLevel {
  None = 0,
  Cursor = 1,
  Light = 2,
  Full = 3,
}

// ─── Visible Range ──────────────────────────────────────

export interface VisibleRange {
  fromIdx: number;
  toIdx: number;
}

export interface TimeRange {
  from: number;
  to: number;
}

// ─── Rendering Types ────────────────────────────────────

export interface PathCommand {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface RenderStyle {
  strokeColor?: string;
  fillColor?: string;
  lineWidth?: number;
  lineDash?: number[];
  font?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  globalAlpha?: number;
}

export interface GradientStop {
  offset: number;
  color: string;
}

export type Gradient = CanvasGradient;

export type PrimitiveZOrder = 'bottom' | 'main' | 'top';

// ─── Series Types ───────────────────────────────────────

export type SeriesType =
  | 'Candlestick'
  | 'Line'
  | 'Area'
  | 'Bar'
  | 'Baseline'
  | 'HollowCandle';

// ─── Plugin Interfaces ──────────────────────────────────

export interface DataUpdateScope {
  seriesData: ColumnStore;
  visibleRange: VisibleRange;
}

export interface AttachedParams {
  requestInvalidation: (level: InvalidationLevel) => void;
}

export interface IRenderTarget {
  context: CanvasRenderingContext2D;
  pixelRatio: number;
  width: number;
  height: number;
}

export interface IPaneRenderer {
  draw(target: IRenderTarget): void;
  drawBackground?(target: IRenderTarget): void;
}

export interface IPaneView {
  update(): void;
  renderer(): IPaneRenderer | null;
  zOrder?(): PrimitiveZOrder;
}

export interface IPriceAxisView {
  coordinate(): number;
  text(): string;
  color(): string;
}

export interface ITimeAxisView {
  coordinate(): number;
  text(): string;
  color(): string;
}

export interface PrimitiveHitTestResult {
  primitiveId: string;
  cursorStyle?: string;
}

export interface ISeriesPrimitive {
  onDataUpdate?(scope: DataUpdateScope): void;
  paneViews(): IPaneView[];
  priceAxisViews?(): IPriceAxisView[];
  timeAxisViews?(): ITimeAxisView[];
  attached?(params: AttachedParams): void;
  detached?(): void;
  hitTest?(x: number, y: number): PrimitiveHitTestResult | null;
}

export interface IPanePrimitive {
  paneViews(): IPaneView[];
  priceAxisViews?(): IPriceAxisView[];
  timeAxisViews?(): ITimeAxisView[];
  attached?(params: AttachedParams): void;
  detached?(): void;
}

// ─── Utility Types ──────────────────────────────────────

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/types.test.ts`
Expected: PASS

Note: The `const enum` won't be directly testable in vitest (it gets inlined at compile time). If tests fail due to `InvalidationLevel` not being importable, change to a regular `enum` or a plain object:

```typescript
export const InvalidationLevel = {
  None: 0,
  Cursor: 1,
  Light: 2,
  Full: 3,
} as const;
export type InvalidationLevel = (typeof InvalidationLevel)[keyof typeof InvalidationLevel];
```

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts tests/core/types.test.ts
git commit -m "feat: add core types — Bar, ColumnStore, InvalidationLevel, plugin interfaces"
```

---

## Task 3: DataLayer

**Files:**
- Create: `src/core/data-layer.ts`
- Test: `tests/core/data-layer.test.ts`

- [ ] **Step 1: Write DataLayer tests**

Create `tests/core/data-layer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { DataLayer } from '@/core/data-layer';
import type { Bar, ColumnData } from '@/core/types';

function makeBars(count: number, startTime = 1000, interval = 60): Bar[] {
  return Array.from({ length: count }, (_, i) => ({
    time: startTime + i * interval,
    open: 100 + i,
    high: 110 + i,
    low: 90 + i,
    close: 105 + i,
    volume: 1000 + i * 100,
  }));
}

describe('DataLayer', () => {
  describe('setData with Bar[]', () => {
    it('ingests bar array and stores as ColumnStore', () => {
      const dl = new DataLayer();
      const bars = makeBars(5);
      dl.setData(bars);

      expect(dl.store.length).toBe(5);
      expect(dl.store.time[0]).toBe(1000);
      expect(dl.store.time[4]).toBe(1240);
      expect(dl.store.close[2]).toBe(107);
    });

    it('replaces existing data on second setData call', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(10));
      expect(dl.store.length).toBe(10);

      dl.setData(makeBars(3));
      expect(dl.store.length).toBe(3);
    });
  });

  describe('setData with ColumnData', () => {
    it('ingests typed arrays directly', () => {
      const dl = new DataLayer();
      const colData: ColumnData = {
        time: new Float64Array([1000, 2000, 3000]),
        open: new Float64Array([10, 20, 30]),
        high: new Float64Array([15, 25, 35]),
        low: new Float64Array([8, 18, 28]),
        close: new Float64Array([12, 22, 32]),
        volume: new Float64Array([100, 200, 300]),
      };
      dl.setData(colData);

      expect(dl.store.length).toBe(3);
      expect(dl.store.time[1]).toBe(2000);
      expect(dl.store.close[2]).toBe(32);
    });
  });

  describe('update', () => {
    it('updates last bar when timestamp matches', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(3));
      const lastTime = dl.store.time[2];

      dl.update({ time: lastTime, open: 999, high: 999, low: 999, close: 999, volume: 999 });
      expect(dl.store.length).toBe(3);
      expect(dl.store.close[2]).toBe(999);
      expect(dl.store.open[2]).toBe(999);
    });

    it('appends new bar when timestamp is newer', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(3));

      dl.update({ time: 99999, open: 50, high: 60, low: 40, close: 55, volume: 500 });
      expect(dl.store.length).toBe(4);
      expect(dl.store.time[3]).toBe(99999);
      expect(dl.store.close[3]).toBe(55);
    });

    it('grows capacity when store is full', () => {
      const dl = new DataLayer();
      // Force small capacity by creating minimal data
      const bars = makeBars(2);
      dl.setData(bars);
      const oldCapacity = dl.store.capacity;

      // Fill to capacity then overflow
      for (let i = 0; i < oldCapacity; i++) {
        dl.update({ time: 100000 + i * 60, open: 1, high: 2, low: 0, close: 1, volume: 1 });
      }

      expect(dl.store.capacity).toBeGreaterThan(oldCapacity);
      expect(dl.store.length).toBe(2 + oldCapacity);
    });
  });

  describe('binarySearch', () => {
    it('finds exact timestamp', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(100));

      const idx = dl.findIndex(1000 + 50 * 60);
      expect(idx).toBe(50);
    });

    it('returns nearest index for non-exact timestamp', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(100));

      const idx = dl.findIndex(1000 + 50 * 60 + 30);
      expect(idx).toBe(50);
    });

    it('clamps to 0 for timestamp before data', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(10));

      const idx = dl.findIndex(0);
      expect(idx).toBe(0);
    });

    it('clamps to last index for timestamp after data', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(10));

      const idx = dl.findIndex(999999);
      expect(idx).toBe(9);
    });
  });

  describe('barAt', () => {
    it('returns bar object at given index', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(5));

      const bar = dl.barAt(2);
      expect(bar).toEqual({
        time: 1120,
        open: 102,
        high: 112,
        low: 92,
        close: 107,
        volume: 1200,
      });
    });

    it('returns null for out of bounds index', () => {
      const dl = new DataLayer();
      dl.setData(makeBars(5));

      expect(dl.barAt(-1)).toBeNull();
      expect(dl.barAt(5)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/data-layer.test.ts`
Expected: FAIL — cannot find module `@/core/data-layer`

- [ ] **Step 3: Implement DataLayer**

Create `src/core/data-layer.ts`:

```typescript
import {
  type Bar,
  type ColumnData,
  type ColumnStore,
  createColumnStore,
} from './types';

function isColumnData(data: Bar[] | ColumnData): data is ColumnData {
  return 'time' in data && data.time instanceof Float64Array;
}

export class DataLayer {
  store: ColumnStore = createColumnStore(2048);

  setData(data: Bar[] | ColumnData): void {
    if (isColumnData(data)) {
      this.setColumnData(data);
    } else {
      this.setBarData(data);
    }
  }

  private setBarData(bars: Bar[]): void {
    const len = bars.length;
    const capacity = Math.max(Math.ceil(len * 1.5), 2048);
    const store = createColumnStore(capacity);

    for (let i = 0; i < len; i++) {
      const bar = bars[i];
      store.time[i] = bar.time;
      store.open[i] = bar.open;
      store.high[i] = bar.high;
      store.low[i] = bar.low;
      store.close[i] = bar.close;
      store.volume[i] = bar.volume ?? 0;
    }
    store.length = len;
    this.store = store;
  }

  private setColumnData(data: ColumnData): void {
    const len = data.time.length;
    const capacity = Math.max(Math.ceil(len * 1.5), 2048);
    const store = createColumnStore(capacity);

    store.time.set(data.time);
    store.open.set(data.open);
    store.high.set(data.high);
    store.low.set(data.low);
    store.close.set(data.close);
    if (data.volume) {
      store.volume.set(data.volume);
    }
    store.length = len;
    this.store = store;
  }

  update(bar: Bar): void {
    const store = this.store;
    const lastIdx = store.length - 1;

    if (store.length > 0 && store.time[lastIdx] === bar.time) {
      // Update last bar in-place
      store.open[lastIdx] = bar.open;
      store.high[lastIdx] = bar.high;
      store.low[lastIdx] = bar.low;
      store.close[lastIdx] = bar.close;
      store.volume[lastIdx] = bar.volume ?? 0;
    } else {
      // Append new bar
      if (store.length >= store.capacity) {
        this.grow();
      }
      const idx = store.length;
      store.time[idx] = bar.time;
      store.open[idx] = bar.open;
      store.high[idx] = bar.high;
      store.low[idx] = bar.low;
      store.close[idx] = bar.close;
      store.volume[idx] = bar.volume ?? 0;
      store.length++;
    }
  }

  findIndex(time: number): number {
    const { time: times, length } = this.store;
    if (length === 0) return -1;
    if (time <= times[0]) return 0;
    if (time >= times[length - 1]) return length - 1;

    let lo = 0;
    let hi = length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const midTime = times[mid];
      if (midTime === time) return mid;
      if (midTime < time) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    // Return nearest index
    if (lo >= length) return length - 1;
    if (hi < 0) return 0;
    return (time - times[hi]) <= (times[lo] - time) ? hi : lo;
  }

  barAt(index: number): Bar | null {
    const { store } = this;
    if (index < 0 || index >= store.length) return null;
    return {
      time: store.time[index],
      open: store.open[index],
      high: store.high[index],
      low: store.low[index],
      close: store.close[index],
      volume: store.volume[index],
    };
  }

  private grow(): void {
    const oldStore = this.store;
    const newCapacity = oldStore.capacity * 2;
    const newStore = createColumnStore(newCapacity);

    newStore.time.set(oldStore.time.subarray(0, oldStore.length));
    newStore.open.set(oldStore.open.subarray(0, oldStore.length));
    newStore.high.set(oldStore.high.subarray(0, oldStore.length));
    newStore.low.set(oldStore.low.subarray(0, oldStore.length));
    newStore.close.set(oldStore.close.subarray(0, oldStore.length));
    newStore.volume.set(oldStore.volume.subarray(0, oldStore.length));
    newStore.length = oldStore.length;

    this.store = newStore;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/data-layer.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/data-layer.ts tests/core/data-layer.test.ts
git commit -m "feat: add DataLayer — ColumnStore, binary search, real-time update"
```

---

## Task 4: InvalidateMask

**Files:**
- Create: `src/core/invalidation.ts`
- Test: `tests/core/invalidation.test.ts`

- [ ] **Step 1: Write InvalidateMask tests**

Create `tests/core/invalidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { InvalidateMask } from '@/core/invalidation';
import { InvalidationLevel } from '@/core/types';

describe('InvalidateMask', () => {
  it('starts with None for all panes', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    expect(mask.level('main')).toBe(InvalidationLevel.None);
  });

  it('sets invalidation level for a pane', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    mask.invalidate('main', InvalidationLevel.Light);
    expect(mask.level('main')).toBe(InvalidationLevel.Light);
  });

  it('keeps highest invalidation level', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    mask.invalidate('main', InvalidationLevel.Full);
    mask.invalidate('main', InvalidationLevel.Cursor);
    expect(mask.level('main')).toBe(InvalidationLevel.Full);
  });

  it('escalates invalidation level', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    mask.invalidate('main', InvalidationLevel.Cursor);
    mask.invalidate('main', InvalidationLevel.Light);
    expect(mask.level('main')).toBe(InvalidationLevel.Light);
  });

  it('resets all panes to None', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    mask.addPane('rsi');
    mask.invalidate('main', InvalidationLevel.Full);
    mask.invalidate('rsi', InvalidationLevel.Light);
    mask.reset();
    expect(mask.level('main')).toBe(InvalidationLevel.None);
    expect(mask.level('rsi')).toBe(InvalidationLevel.None);
  });

  it('tracks multiple panes independently', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    mask.addPane('rsi');
    mask.invalidate('main', InvalidationLevel.Full);
    mask.invalidate('rsi', InvalidationLevel.Cursor);
    expect(mask.level('main')).toBe(InvalidationLevel.Full);
    expect(mask.level('rsi')).toBe(InvalidationLevel.Cursor);
  });

  it('reports whether any pane needs repaint', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    expect(mask.needsRepaint()).toBe(false);
    mask.invalidate('main', InvalidationLevel.Cursor);
    expect(mask.needsRepaint()).toBe(true);
  });

  it('invalidateAll sets level on all panes', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    mask.addPane('rsi');
    mask.invalidateAll(InvalidationLevel.Full);
    expect(mask.level('main')).toBe(InvalidationLevel.Full);
    expect(mask.level('rsi')).toBe(InvalidationLevel.Full);
  });

  it('removes a pane', () => {
    const mask = new InvalidateMask();
    mask.addPane('main');
    mask.addPane('rsi');
    mask.removePane('rsi');
    expect(mask.level('rsi')).toBe(InvalidationLevel.None);
    expect(mask.paneIds()).toEqual(['main']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/invalidation.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement InvalidateMask**

Create `src/core/invalidation.ts`:

```typescript
import { InvalidationLevel } from './types';

export class InvalidateMask {
  private levels = new Map<string, InvalidationLevel>();

  addPane(id: string): void {
    this.levels.set(id, InvalidationLevel.None);
  }

  removePane(id: string): void {
    this.levels.delete(id);
  }

  invalidate(paneId: string, level: InvalidationLevel): void {
    const current = this.levels.get(paneId);
    if (current === undefined) return;
    if (level > current) {
      this.levels.set(paneId, level);
    }
  }

  invalidateAll(level: InvalidationLevel): void {
    for (const id of this.levels.keys()) {
      this.invalidate(id, level);
    }
  }

  level(paneId: string): InvalidationLevel {
    return this.levels.get(paneId) ?? InvalidationLevel.None;
  }

  needsRepaint(): boolean {
    for (const level of this.levels.values()) {
      if (level > InvalidationLevel.None) return true;
    }
    return false;
  }

  paneIds(): string[] {
    return Array.from(this.levels.keys());
  }

  reset(): void {
    for (const id of this.levels.keys()) {
      this.levels.set(id, InvalidationLevel.None);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/invalidation.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/invalidation.ts tests/core/invalidation.test.ts
git commit -m "feat: add InvalidateMask — per-pane dirty tracking with level escalation"
```

---

## Task 5: TimeScale

**Files:**
- Create: `src/core/time-scale.ts`
- Test: `tests/core/time-scale.test.ts`

- [ ] **Step 1: Write TimeScale tests**

Create `tests/core/time-scale.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TimeScale } from '@/core/time-scale';

describe('TimeScale', () => {
  function createScale(dataLength = 100, width = 800, barSpacing = 8): TimeScale {
    const ts = new TimeScale();
    ts.setOptions({ barSpacing, rightOffset: 5, minBarSpacing: 2, maxBarSpacing: 50 });
    ts.setWidth(width);
    ts.setDataLength(dataLength);
    return ts;
  }

  describe('visible range', () => {
    it('computes visible range from width and barSpacing', () => {
      const ts = createScale(200, 800, 8);
      const range = ts.visibleRange();
      // 800px / 8px per bar = 100 visible bars
      expect(range.toIdx - range.fromIdx + 1).toBeLessThanOrEqual(101);
      expect(range.fromIdx).toBeGreaterThanOrEqual(0);
      expect(range.toIdx).toBeLessThan(200);
    });

    it('clamps visible range to data bounds', () => {
      const ts = createScale(10, 800, 8);
      const range = ts.visibleRange();
      expect(range.fromIdx).toBe(0);
      expect(range.toIdx).toBe(9);
    });
  });

  describe('coordinate conversion', () => {
    it('converts index to x coordinate', () => {
      const ts = createScale(100, 800, 8);
      const range = ts.visibleRange();
      const x0 = ts.indexToX(range.fromIdx);
      const x1 = ts.indexToX(range.fromIdx + 1);
      expect(x1 - x0).toBeCloseTo(8, 1);
    });

    it('converts x coordinate to index', () => {
      const ts = createScale(100, 800, 8);
      const range = ts.visibleRange();
      const x = ts.indexToX(range.fromIdx + 10);
      const idx = ts.xToIndex(x);
      expect(idx).toBeCloseTo(range.fromIdx + 10, 0);
    });
  });

  describe('scrolling', () => {
    it('scrollByPixels shifts the offset', () => {
      const ts = createScale(200, 800, 8);
      const rangeBefore = ts.visibleRange();
      ts.scrollByPixels(80); // 10 bars worth
      const rangeAfter = ts.visibleRange();
      expect(rangeAfter.fromIdx).toBeCloseTo(rangeBefore.fromIdx - 10, 0);
    });

    it('scrollToEnd puts last bar in view', () => {
      const ts = createScale(200, 800, 8);
      ts.scrollToEnd();
      const range = ts.visibleRange();
      expect(range.toIdx).toBe(199);
    });
  });

  describe('zoom', () => {
    it('zoomAt changes barSpacing', () => {
      const ts = createScale(200, 800, 8);
      const oldSpacing = ts.barSpacing;
      ts.zoomAt(400, 1.5);
      expect(ts.barSpacing).toBeGreaterThan(oldSpacing);
    });

    it('clamps barSpacing to min/max', () => {
      const ts = createScale(200, 800, 8);
      ts.zoomAt(400, 100); // extreme zoom in
      expect(ts.barSpacing).toBe(50);

      ts.zoomAt(400, 0.001); // extreme zoom out
      expect(ts.barSpacing).toBe(2);
    });
  });

  describe('fitContent', () => {
    it('adjusts barSpacing so all data fits in view', () => {
      const ts = createScale(200, 800, 8);
      ts.fitContent();
      const range = ts.visibleRange();
      expect(range.fromIdx).toBe(0);
      expect(range.toIdx).toBe(199);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/time-scale.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement TimeScale**

Create `src/core/time-scale.ts`:

```typescript
import type { VisibleRange } from './types';

export interface TimeScaleOptions {
  barSpacing: number;
  rightOffset: number;
  minBarSpacing: number;
  maxBarSpacing: number;
}

const DEFAULT_OPTIONS: TimeScaleOptions = {
  barSpacing: 8,
  rightOffset: 5,
  minBarSpacing: 2,
  maxBarSpacing: 50,
};

export class TimeScale {
  private options: TimeScaleOptions = { ...DEFAULT_OPTIONS };
  private width = 0;
  private dataLength = 0;
  private scrollOffset = 0; // in bars, from the right edge

  get barSpacing(): number {
    return this.options.barSpacing;
  }

  setOptions(opts: Partial<TimeScaleOptions>): void {
    Object.assign(this.options, opts);
    this.clampBarSpacing();
  }

  setWidth(width: number): void {
    this.width = width;
  }

  setDataLength(length: number): void {
    this.dataLength = length;
    if (this.scrollOffset === 0) {
      this.scrollToEnd();
    }
  }

  visibleRange(): VisibleRange {
    if (this.dataLength === 0) {
      return { fromIdx: 0, toIdx: -1 };
    }

    const barsInView = Math.ceil(this.width / this.options.barSpacing);
    const lastVisibleBar = this.dataLength - 1 - this.scrollOffset + this.options.rightOffset;
    const firstVisibleBar = lastVisibleBar - barsInView;

    const fromIdx = Math.max(0, Math.round(firstVisibleBar));
    const toIdx = Math.min(this.dataLength - 1, Math.max(0, Math.round(lastVisibleBar)));

    return { fromIdx, toIdx };
  }

  indexToX(index: number): number {
    const range = this.visibleRange();
    return (index - range.fromIdx) * this.options.barSpacing;
  }

  xToIndex(x: number): number {
    const range = this.visibleRange();
    return range.fromIdx + x / this.options.barSpacing;
  }

  scrollByPixels(deltaX: number): void {
    const barsDelta = deltaX / this.options.barSpacing;
    this.scrollOffset += barsDelta;
    this.clampScroll();
  }

  scrollToEnd(): void {
    this.scrollOffset = 0;
  }

  scrollToPosition(position: number): void {
    this.scrollOffset = position;
    this.clampScroll();
  }

  zoomAt(x: number, factor: number): void {
    const indexAtCursor = this.xToIndex(x);
    const newSpacing = this.options.barSpacing * factor;
    this.options.barSpacing = Math.max(
      this.options.minBarSpacing,
      Math.min(this.options.maxBarSpacing, newSpacing),
    );

    // Adjust offset to keep the bar under the cursor in place
    const newIndexAtX = this.xToIndex(x);
    const drift = newIndexAtX - indexAtCursor;
    this.scrollOffset -= drift;
    this.clampScroll();
  }

  fitContent(): void {
    if (this.dataLength === 0 || this.width === 0) return;
    this.options.barSpacing = Math.max(
      this.options.minBarSpacing,
      Math.min(this.options.maxBarSpacing, this.width / this.dataLength),
    );
    this.scrollOffset = 0;
  }

  private clampBarSpacing(): void {
    this.options.barSpacing = Math.max(
      this.options.minBarSpacing,
      Math.min(this.options.maxBarSpacing, this.options.barSpacing),
    );
  }

  private clampScroll(): void {
    const maxScroll = this.dataLength - 1;
    const barsInView = Math.ceil(this.width / this.options.barSpacing);
    const minScroll = -(barsInView - 1);
    this.scrollOffset = Math.max(minScroll, Math.min(maxScroll, this.scrollOffset));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/time-scale.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/time-scale.ts tests/core/time-scale.test.ts
git commit -m "feat: add TimeScale — viewport, barSpacing, scroll, zoom, fitContent"
```

---

## Task 6: PriceScale

**Files:**
- Create: `src/core/price-scale.ts`
- Test: `tests/core/price-scale.test.ts`

- [ ] **Step 1: Write PriceScale tests**

Create `tests/core/price-scale.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PriceScale } from '@/core/price-scale';

describe('PriceScale', () => {
  function createScale(height = 400): PriceScale {
    const ps = new PriceScale('right');
    ps.setHeight(height);
    return ps;
  }

  describe('auto-scale', () => {
    it('computes price range from data with margin', () => {
      const ps = createScale(400);
      ps.autoScale(100, 200);
      // Should add some margin (~5%) around the data range
      expect(ps.priceToY(100)).toBeGreaterThan(0);
      expect(ps.priceToY(200)).toBeLessThan(400);
      expect(ps.priceToY(100)).toBeGreaterThan(ps.priceToY(200)); // higher price = lower Y
    });

    it('handles flat price range (all same price)', () => {
      const ps = createScale(400);
      ps.autoScale(100, 100);
      // Should still produce valid coordinates
      const y = ps.priceToY(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(400);
    });
  });

  describe('coordinate conversion', () => {
    it('priceToY maps linearly with Y inverted', () => {
      const ps = createScale(400);
      ps.autoScale(100, 200);
      const y100 = ps.priceToY(100);
      const y200 = ps.priceToY(200);
      const y150 = ps.priceToY(150);

      expect(y200).toBeLessThan(y150);
      expect(y150).toBeLessThan(y100);

      // Midpoint should be roughly in the middle
      expect(y150).toBeCloseTo((y100 + y200) / 2, 0);
    });

    it('yToPrice inverts priceToY', () => {
      const ps = createScale(400);
      ps.autoScale(100, 200);

      const y = ps.priceToY(150);
      const price = ps.yToPrice(y);
      expect(price).toBeCloseTo(150, 2);
    });
  });

  describe('manual range', () => {
    it('setRange overrides auto-scale', () => {
      const ps = createScale(400);
      ps.autoScale(100, 200);
      ps.setRange(50, 300);

      const y50 = ps.priceToY(50);
      const y300 = ps.priceToY(300);
      expect(y50).toBeGreaterThan(0);
      expect(y300).toBeLessThan(400);
    });

    it('resetAutoScale returns to auto behavior', () => {
      const ps = createScale(400);
      ps.autoScale(100, 200);
      const yBefore = ps.priceToY(150);

      ps.setRange(0, 500);
      const yDuring = ps.priceToY(150);
      expect(yDuring).not.toBeCloseTo(yBefore, 0);

      ps.resetAutoScale();
      ps.autoScale(100, 200);
      const yAfter = ps.priceToY(150);
      expect(yAfter).toBeCloseTo(yBefore, 2);
    });
  });

  describe('position', () => {
    it('stores position (left/right)', () => {
      const left = new PriceScale('left');
      const right = new PriceScale('right');
      expect(left.position).toBe('left');
      expect(right.position).toBe('right');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/price-scale.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement PriceScale**

Create `src/core/price-scale.ts`:

```typescript
export type PriceScalePosition = 'left' | 'right';

const MARGIN_PERCENT = 0.05;

export class PriceScale {
  readonly position: PriceScalePosition;
  private height = 0;
  private minPrice = 0;
  private maxPrice = 0;
  private isManual = false;

  constructor(position: PriceScalePosition) {
    this.position = position;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  autoScale(minPrice: number, maxPrice: number): void {
    if (this.isManual) return;
    this.applyRange(minPrice, maxPrice);
  }

  setRange(minPrice: number, maxPrice: number): void {
    this.isManual = true;
    this.applyRange(minPrice, maxPrice);
  }

  resetAutoScale(): void {
    this.isManual = false;
  }

  priceToY(price: number): number {
    const range = this.maxPrice - this.minPrice;
    if (range === 0) return this.height / 2;
    return this.height * (1 - (price - this.minPrice) / range);
  }

  yToPrice(y: number): number {
    const range = this.maxPrice - this.minPrice;
    if (range === 0) return this.minPrice;
    return this.minPrice + (1 - y / this.height) * range;
  }

  get priceRange(): { min: number; max: number } {
    return { min: this.minPrice, max: this.maxPrice };
  }

  private applyRange(minPrice: number, maxPrice: number): void {
    let range = maxPrice - minPrice;
    if (range === 0) {
      range = minPrice === 0 ? 1 : Math.abs(minPrice) * 0.1;
    }
    const margin = range * MARGIN_PERCENT;
    this.minPrice = minPrice - margin;
    this.maxPrice = maxPrice + margin;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/price-scale.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/price-scale.ts tests/core/price-scale.test.ts
git commit -m "feat: add PriceScale — price↔Y conversion, auto-scale, manual range"
```

---

## Task 7: Crosshair State

**Files:**
- Create: `src/core/crosshair.ts`
- Test: `tests/core/crosshair.test.ts`

- [ ] **Step 1: Write Crosshair tests**

Create `tests/core/crosshair.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Crosshair } from '@/core/crosshair';

describe('Crosshair', () => {
  it('starts invisible', () => {
    const ch = new Crosshair();
    expect(ch.visible).toBe(false);
  });

  it('updates position and becomes visible', () => {
    const ch = new Crosshair();
    ch.update({ x: 100, y: 200, barIndex: 5, price: 150.50, time: 1000 });
    expect(ch.visible).toBe(true);
    expect(ch.x).toBe(100);
    expect(ch.y).toBe(200);
    expect(ch.barIndex).toBe(5);
    expect(ch.price).toBe(150.50);
    expect(ch.time).toBe(1000);
  });

  it('hide makes it invisible', () => {
    const ch = new Crosshair();
    ch.update({ x: 100, y: 200, barIndex: 5, price: 150, time: 1000 });
    ch.hide();
    expect(ch.visible).toBe(false);
  });

  it('snappedX returns the snapped x coordinate', () => {
    const ch = new Crosshair();
    ch.update({ x: 100, y: 200, barIndex: 5, price: 150, time: 1000, snappedX: 104 });
    expect(ch.snappedX).toBe(104);
  });

  it('snappedX falls back to x when not provided', () => {
    const ch = new Crosshair();
    ch.update({ x: 100, y: 200, barIndex: 5, price: 150, time: 1000 });
    expect(ch.snappedX).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/crosshair.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Crosshair**

Create `src/core/crosshair.ts`:

```typescript
export interface CrosshairState {
  x: number;
  y: number;
  barIndex: number;
  price: number;
  time: number;
  snappedX?: number;
}

export class Crosshair {
  visible = false;
  x = 0;
  y = 0;
  barIndex = -1;
  price = 0;
  time = 0;
  private _snappedX: number | undefined;

  get snappedX(): number {
    return this._snappedX ?? this.x;
  }

  update(state: CrosshairState): void {
    this.visible = true;
    this.x = state.x;
    this.y = state.y;
    this.barIndex = state.barIndex;
    this.price = state.price;
    this.time = state.time;
    this._snappedX = state.snappedX;
  }

  hide(): void {
    this.visible = false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/crosshair.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/crosshair.ts tests/core/crosshair.test.ts
git commit -m "feat: add Crosshair — position state management with snap support"
```

---

## Task 8: Renderer Interface & CanvasRenderer

**Files:**
- Create: `src/renderers/renderer.ts`, `src/renderers/canvas-renderer.ts`
- Test: `tests/renderers/canvas-renderer.test.ts`

- [ ] **Step 1: Write CanvasRenderer tests**

Create `tests/renderers/canvas-renderer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasRenderer } from '@/renderers/canvas-renderer';
import type { RenderStyle } from '@/core/types';

function createMockContext(): CanvasRenderingContext2D {
  return {
    canvas: { width: 800, height: 600 },
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    rect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    setLineDash: vi.fn(),
    closePath: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'top' as CanvasTextBaseline,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe('CanvasRenderer', () => {
  let ctx: CanvasRenderingContext2D;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    ctx = createMockContext();
    renderer = new CanvasRenderer(ctx);
  });

  it('clear calls clearRect on full canvas', () => {
    renderer.setSize(800, 600);
    renderer.clear();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  it('save and restore delegate to context', () => {
    renderer.save();
    renderer.restore();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('drawLine draws a line between two points', () => {
    renderer.drawLine(10, 20, 100, 200);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 200);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('fillRect delegates to context', () => {
    renderer.fillRect(10, 20, 50, 60);
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 50, 60);
  });

  it('setStyle applies stroke and fill colors', () => {
    const style: RenderStyle = {
      strokeColor: '#ff0000',
      fillColor: '#00ff00',
      lineWidth: 2,
      lineDash: [5, 3],
      globalAlpha: 0.5,
    };
    renderer.setStyle(style);
    expect(ctx.strokeStyle).toBe('#ff0000');
    expect(ctx.fillStyle).toBe('#00ff00');
    expect(ctx.lineWidth).toBe(2);
    expect(ctx.setLineDash).toHaveBeenCalledWith([5, 3]);
    expect(ctx.globalAlpha).toBe(0.5);
  });

  it('fillText delegates to context', () => {
    renderer.fillText('hello', 10, 20);
    expect(ctx.fillText).toHaveBeenCalledWith('hello', 10, 20);
  });

  it('measureText delegates to context', () => {
    const w = renderer.measureText('test');
    expect(ctx.measureText).toHaveBeenCalledWith('test');
    expect(w).toBe(50);
  });

  it('clip sets clipping rectangle', () => {
    renderer.clip(10, 20, 100, 200);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalledWith(10, 20, 100, 200);
  });

  it('createGradient returns a CanvasGradient', () => {
    const grad = renderer.createGradient(0, 0, 0, 100, [
      { offset: 0, color: '#fff' },
      { offset: 1, color: '#000' },
    ]);
    expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 100);
    expect(grad).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/renderers/canvas-renderer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement IRenderer interface**

Create `src/renderers/renderer.ts`:

```typescript
import type { PathCommand, RenderStyle, GradientStop, Gradient } from '@/core/types';

export interface IRenderer {
  setSize(width: number, height: number): void;
  clear(): void;
  save(): void;
  restore(): void;
  clip(x: number, y: number, w: number, h: number): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  drawLine(x1: number, y1: number, x2: number, y2: number): void;
  drawRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawPath(commands: PathCommand[]): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): number;
  setStyle(style: RenderStyle): void;
  createGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: GradientStop[],
  ): Gradient;
}
```

- [ ] **Step 4: Implement CanvasRenderer**

Create `src/renderers/canvas-renderer.ts`:

```typescript
import type { PathCommand, RenderStyle, GradientStop, Gradient } from '@/core/types';
import type { IRenderer } from './renderer';

export class CanvasRenderer implements IRenderer {
  private width = 0;
  private height = 0;

  constructor(private ctx: CanvasRenderingContext2D) {}

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  save(): void {
    this.ctx.save();
  }

  restore(): void {
    this.ctx.restore();
  }

  clip(x: number, y: number, w: number, h: number): void {
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.clip();
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.ctx.setTransform(a, b, c, d, e, f);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  drawRect(x: number, y: number, w: number, h: number): void {
    this.ctx.strokeRect(x, y, w, h);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.ctx.fillRect(x, y, w, h);
  }

  drawPath(commands: PathCommand[]): void {
    this.ctx.beginPath();
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      switch (cmd.type) {
        case 'M':
          this.ctx.moveTo(cmd.x!, cmd.y!);
          break;
        case 'L':
          this.ctx.lineTo(cmd.x!, cmd.y!);
          break;
        case 'Q':
          this.ctx.quadraticCurveTo(cmd.x1!, cmd.y1!, cmd.x!, cmd.y!);
          break;
        case 'C':
          this.ctx.bezierCurveTo(cmd.x1!, cmd.y1!, cmd.x2!, cmd.y2!, cmd.x!, cmd.y!);
          break;
        case 'Z':
          this.ctx.closePath();
          break;
      }
    }
    this.ctx.stroke();
  }

  fillText(text: string, x: number, y: number): void {
    this.ctx.fillText(text, x, y);
  }

  measureText(text: string): number {
    return this.ctx.measureText(text).width;
  }

  setStyle(style: RenderStyle): void {
    if (style.strokeColor !== undefined) this.ctx.strokeStyle = style.strokeColor;
    if (style.fillColor !== undefined) this.ctx.fillStyle = style.fillColor;
    if (style.lineWidth !== undefined) this.ctx.lineWidth = style.lineWidth;
    if (style.lineDash !== undefined) this.ctx.setLineDash(style.lineDash);
    if (style.font !== undefined) this.ctx.font = style.font;
    if (style.textAlign !== undefined) this.ctx.textAlign = style.textAlign;
    if (style.textBaseline !== undefined) this.ctx.textBaseline = style.textBaseline;
    if (style.globalAlpha !== undefined) this.ctx.globalAlpha = style.globalAlpha;
  }

  createGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: GradientStop[],
  ): Gradient {
    const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i++) {
      gradient.addColorStop(stops[i].offset, stops[i].color);
    }
    return gradient;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/renderers/canvas-renderer.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/renderers/renderer.ts src/renderers/canvas-renderer.ts tests/renderers/canvas-renderer.test.ts
git commit -m "feat: add IRenderer interface and CanvasRenderer implementation"
```

---

## Task 9: TextMetricsCache

**Files:**
- Create: `src/renderers/text-cache.ts`
- Test: `tests/renderers/text-cache.test.ts`

- [ ] **Step 1: Write TextMetricsCache tests**

Create `tests/renderers/text-cache.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { TextMetricsCache } from '@/renderers/text-cache';

function createMockContext(): CanvasRenderingContext2D {
  const charWidths: Record<string, number> = {};
  // Simulate monospace-ish: digits 7px, letters 8px, others 5px
  for (let i = 48; i <= 57; i++) charWidths[String.fromCharCode(i)] = 7;
  for (let i = 65; i <= 90; i++) charWidths[String.fromCharCode(i)] = 8;
  for (let i = 97; i <= 122; i++) charWidths[String.fromCharCode(i)] = 8;
  charWidths['.'] = 4;
  charWidths[','] = 4;
  charWidths['-'] = 5;
  charWidths[' '] = 4;
  charWidths['$'] = 7;
  charWidths['%'] = 9;
  charWidths[':'] = 4;
  charWidths['/'] = 5;

  return {
    measureText: vi.fn((text: string) => ({
      width: text.split('').reduce((sum, ch) => sum + (charWidths[ch] ?? 6), 0),
    })),
    font: '12px sans-serif',
  } as unknown as CanvasRenderingContext2D;
}

describe('TextMetricsCache', () => {
  it('prepare measures all financial characters', () => {
    const ctx = createMockContext();
    const cache = new TextMetricsCache();
    cache.prepare(ctx, '12px sans-serif');

    // Should have called measureText for each character in the financial set
    expect(ctx.measureText).toHaveBeenCalled();
    const callCount = (ctx.measureText as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(70);
  });

  it('measureWidth returns correct width via arithmetic', () => {
    const ctx = createMockContext();
    const cache = new TextMetricsCache();
    cache.prepare(ctx, '12px sans-serif');

    // "123.45" = 7+7+7+4+7+7 = 39
    expect(cache.measureWidth('123.45')).toBe(39);
  });

  it('measureWidth does not call ctx.measureText after prepare', () => {
    const ctx = createMockContext();
    const cache = new TextMetricsCache();
    cache.prepare(ctx, '12px sans-serif');
    (ctx.measureText as ReturnType<typeof vi.fn>).mockClear();

    cache.measureWidth('100.00');
    cache.measureWidth('$99.99');
    cache.measureWidth('12:30');
    expect(ctx.measureText).not.toHaveBeenCalled();
  });

  it('handles unknown characters by falling back to ctx.measureText', () => {
    const ctx = createMockContext();
    const cache = new TextMetricsCache();
    cache.prepare(ctx, '12px sans-serif');
    (ctx.measureText as ReturnType<typeof vi.fn>).mockClear();

    // Unicode character not in the set
    const width = cache.measureWidth('\u00e9');
    expect(ctx.measureText).toHaveBeenCalledWith('\u00e9');
    expect(typeof width).toBe('number');
  });

  it('re-prepares for a different font', () => {
    const ctx = createMockContext();
    const cache = new TextMetricsCache();
    cache.prepare(ctx, '12px sans-serif');
    const calls1 = (ctx.measureText as ReturnType<typeof vi.fn>).mock.calls.length;

    cache.prepare(ctx, '14px monospace');
    const calls2 = (ctx.measureText as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(calls2).toBeGreaterThan(calls1);
  });

  it('skips re-prepare for same font', () => {
    const ctx = createMockContext();
    const cache = new TextMetricsCache();
    cache.prepare(ctx, '12px sans-serif');
    const calls1 = (ctx.measureText as ReturnType<typeof vi.fn>).mock.calls.length;

    cache.prepare(ctx, '12px sans-serif');
    const calls2 = (ctx.measureText as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(calls2).toBe(calls1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/renderers/text-cache.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement TextMetricsCache**

Create `src/renderers/text-cache.ts`:

```typescript
// Financial character set — all characters that appear in axis labels, tooltips, legends
const FINANCIAL_CHARS =
  '0123456789.,-+$%:/() ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export class TextMetricsCache {
  private widths = new Map<string, number>();
  private currentFont = '';
  private fallbackCtx: CanvasRenderingContext2D | null = null;

  prepare(ctx: CanvasRenderingContext2D, font: string): void {
    if (font === this.currentFont) return;
    this.currentFont = font;
    this.fallbackCtx = ctx;
    this.widths.clear();

    const prevFont = ctx.font;
    ctx.font = font;

    for (let i = 0; i < FINANCIAL_CHARS.length; i++) {
      const ch = FINANCIAL_CHARS[i];
      this.widths.set(ch, ctx.measureText(ch).width);
    }

    ctx.font = prevFont;
  }

  measureWidth(text: string): number {
    let total = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const cached = this.widths.get(ch);
      if (cached !== undefined) {
        total += cached;
      } else {
        // Fallback for unknown characters — measure and cache for next time
        const w = this.measureAndCache(ch);
        total += w;
      }
    }
    return total;
  }

  private measureAndCache(ch: string): number {
    if (!this.fallbackCtx) return 0;
    const prevFont = this.fallbackCtx.font;
    this.fallbackCtx.font = this.currentFont;
    const w = this.fallbackCtx.measureText(ch).width;
    this.fallbackCtx.font = prevFont;
    this.widths.set(ch, w);
    return w;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/renderers/text-cache.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderers/text-cache.ts tests/renderers/text-cache.test.ts
git commit -m "feat: add TextMetricsCache — pretext.js-style glyph caching for fast text measurement"
```

---

## Task 10: Line Renderer

**Files:**
- Create: `src/renderers/line.ts`
- Test: (renderer drawing logic tested visually via dev app; unit test validates coordinate math)

- [ ] **Step 1: Implement LineRenderer**

Create `src/renderers/line.ts`:

```typescript
import type { IRenderTarget, ColumnStore, VisibleRange } from '@/core/types';

export interface LineRendererOptions {
  color: string;
  lineWidth: number;
}

const DEFAULTS: LineRendererOptions = {
  color: '#2196F3',
  lineWidth: 2,
};

export class LineRenderer {
  private options: LineRendererOptions;

  constructor(options?: Partial<LineRendererOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (index: number) => number,
    priceToY: (price: number) => number,
  ): void {
    const { context: ctx, pixelRatio } = target;
    const { fromIdx, toIdx } = range;
    if (fromIdx > toIdx) return;

    ctx.save();
    ctx.strokeStyle = this.options.color;
    ctx.lineWidth = this.options.lineWidth * pixelRatio;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const close = store.close;
    let started = false;
    for (let i = fromIdx; i <= toIdx; i++) {
      const x = Math.round(indexToX(i) * pixelRatio);
      const y = Math.round(priceToY(close[i]) * pixelRatio);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  applyOptions(options: Partial<LineRendererOptions>): void {
    Object.assign(this.options, options);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderers/line.ts
git commit -m "feat: add LineRenderer — close-price polyline drawing"
```

---

## Task 11: Candlestick Renderer

**Files:**
- Create: `src/renderers/candlestick.ts`

- [ ] **Step 1: Implement CandlestickRenderer**

Create `src/renderers/candlestick.ts`:

```typescript
import type { IRenderTarget, ColumnStore, VisibleRange } from '@/core/types';

export interface CandlestickRendererOptions {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  borderUpColor: string;
  borderDownColor: string;
}

const DEFAULTS: CandlestickRendererOptions = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
};

export class CandlestickRenderer {
  private options: CandlestickRendererOptions;

  constructor(options?: Partial<CandlestickRendererOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (index: number) => number,
    priceToY: (price: number) => number,
    barWidth: number,
  ): void {
    const { context: ctx, pixelRatio } = target;
    const { fromIdx, toIdx } = range;
    if (fromIdx > toIdx) return;

    const { open, high, low, close } = store;
    const halfBar = Math.max(1, Math.floor((barWidth * pixelRatio * 0.8) / 2));
    const wickWidth = Math.max(1, Math.round(pixelRatio));

    ctx.save();

    for (let i = fromIdx; i <= toIdx; i++) {
      const isUp = close[i] >= open[i];
      const x = Math.round(indexToX(i) * pixelRatio);
      const yOpen = Math.round(priceToY(open[i]) * pixelRatio);
      const yClose = Math.round(priceToY(close[i]) * pixelRatio);
      const yHigh = Math.round(priceToY(high[i]) * pixelRatio);
      const yLow = Math.round(priceToY(low[i]) * pixelRatio);

      const bodyTop = Math.min(yOpen, yClose);
      const bodyBottom = Math.max(yOpen, yClose);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      // Wick
      ctx.fillStyle = isUp ? this.options.wickUpColor : this.options.wickDownColor;
      const wickX = x - Math.floor(wickWidth / 2);
      ctx.fillRect(wickX, yHigh, wickWidth, yLow - yHigh);

      // Body
      ctx.fillStyle = isUp ? this.options.upColor : this.options.downColor;
      ctx.fillRect(x - halfBar, bodyTop, halfBar * 2, bodyHeight);

      // Border
      ctx.strokeStyle = isUp ? this.options.borderUpColor : this.options.borderDownColor;
      ctx.lineWidth = pixelRatio;
      ctx.strokeRect(x - halfBar, bodyTop, halfBar * 2, bodyHeight);
    }

    ctx.restore();
  }

  applyOptions(options: Partial<CandlestickRendererOptions>): void {
    Object.assign(this.options, options);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderers/candlestick.ts
git commit -m "feat: add CandlestickRenderer — OHLC candle drawing with up/down colors"
```

---

## Task 12: Area, BarOHLC, Baseline, HollowCandle, and Histogram Renderers

**Files:**
- Create: `src/renderers/area.ts`, `src/renderers/bar-ohlc.ts`, `src/renderers/baseline.ts`, `src/renderers/hollow-candle.ts`, `src/renderers/histogram.ts`

- [ ] **Step 1: Implement AreaRenderer**

Create `src/renderers/area.ts`:

```typescript
import type { IRenderTarget, ColumnStore, VisibleRange } from '@/core/types';

export interface AreaRendererOptions {
  lineColor: string;
  lineWidth: number;
  topColor: string;
  bottomColor: string;
}

const DEFAULTS: AreaRendererOptions = {
  lineColor: '#2196F3',
  lineWidth: 2,
  topColor: 'rgba(33, 150, 243, 0.4)',
  bottomColor: 'rgba(33, 150, 243, 0.0)',
};

export class AreaRenderer {
  private options: AreaRendererOptions;

  constructor(options?: Partial<AreaRendererOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (index: number) => number,
    priceToY: (price: number) => number,
    areaBottom: number,
  ): void {
    const { context: ctx, pixelRatio } = target;
    const { fromIdx, toIdx } = range;
    if (fromIdx > toIdx) return;

    const close = store.close;
    const bottom = Math.round(areaBottom * pixelRatio);

    ctx.save();

    // Build path for the line
    ctx.beginPath();
    const firstX = Math.round(indexToX(fromIdx) * pixelRatio);
    const firstY = Math.round(priceToY(close[fromIdx]) * pixelRatio);
    ctx.moveTo(firstX, firstY);

    for (let i = fromIdx + 1; i <= toIdx; i++) {
      ctx.lineTo(
        Math.round(indexToX(i) * pixelRatio),
        Math.round(priceToY(close[i]) * pixelRatio),
      );
    }

    // Fill area
    const lastX = Math.round(indexToX(toIdx) * pixelRatio);
    ctx.lineTo(lastX, bottom);
    ctx.lineTo(firstX, bottom);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, bottom);
    gradient.addColorStop(0, this.options.topColor);
    gradient.addColorStop(1, this.options.bottomColor);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line on top
    ctx.beginPath();
    ctx.moveTo(firstX, firstY);
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      ctx.lineTo(
        Math.round(indexToX(i) * pixelRatio),
        Math.round(priceToY(close[i]) * pixelRatio),
      );
    }
    ctx.strokeStyle = this.options.lineColor;
    ctx.lineWidth = this.options.lineWidth * pixelRatio;
    ctx.stroke();

    ctx.restore();
  }

  applyOptions(options: Partial<AreaRendererOptions>): void {
    Object.assign(this.options, options);
  }
}
```

- [ ] **Step 2: Implement BarOHLCRenderer**

Create `src/renderers/bar-ohlc.ts`:

```typescript
import type { IRenderTarget, ColumnStore, VisibleRange } from '@/core/types';

export interface BarOHLCRendererOptions {
  upColor: string;
  downColor: string;
  lineWidth: number;
}

const DEFAULTS: BarOHLCRendererOptions = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  lineWidth: 1,
};

export class BarOHLCRenderer {
  private options: BarOHLCRendererOptions;

  constructor(options?: Partial<BarOHLCRendererOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (index: number) => number,
    priceToY: (price: number) => number,
    barWidth: number,
  ): void {
    const { context: ctx, pixelRatio } = target;
    const { fromIdx, toIdx } = range;
    if (fromIdx > toIdx) return;

    const { open, high, low, close } = store;
    const tickLen = Math.max(2, Math.floor((barWidth * pixelRatio * 0.4)));
    const lw = this.options.lineWidth * pixelRatio;

    ctx.save();
    ctx.lineWidth = lw;

    for (let i = fromIdx; i <= toIdx; i++) {
      const isUp = close[i] >= open[i];
      ctx.strokeStyle = isUp ? this.options.upColor : this.options.downColor;
      const x = Math.round(indexToX(i) * pixelRatio);
      const yHigh = Math.round(priceToY(high[i]) * pixelRatio);
      const yLow = Math.round(priceToY(low[i]) * pixelRatio);
      const yOpen = Math.round(priceToY(open[i]) * pixelRatio);
      const yClose = Math.round(priceToY(close[i]) * pixelRatio);

      ctx.beginPath();
      // Vertical line (high to low)
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      // Open tick (left)
      ctx.moveTo(x - tickLen, yOpen);
      ctx.lineTo(x, yOpen);
      // Close tick (right)
      ctx.moveTo(x, yClose);
      ctx.lineTo(x + tickLen, yClose);
      ctx.stroke();
    }

    ctx.restore();
  }

  applyOptions(options: Partial<BarOHLCRendererOptions>): void {
    Object.assign(this.options, options);
  }
}
```

- [ ] **Step 3: Implement BaselineRenderer**

Create `src/renderers/baseline.ts`:

```typescript
import type { IRenderTarget, ColumnStore, VisibleRange } from '@/core/types';

export interface BaselineRendererOptions {
  basePrice: number;
  topLineColor: string;
  topFillColor: string;
  bottomLineColor: string;
  bottomFillColor: string;
  lineWidth: number;
}

const DEFAULTS: BaselineRendererOptions = {
  basePrice: 0,
  topLineColor: '#26a69a',
  topFillColor: 'rgba(38, 166, 154, 0.2)',
  bottomLineColor: '#ef5350',
  bottomFillColor: 'rgba(239, 83, 80, 0.2)',
  lineWidth: 2,
};

export class BaselineRenderer {
  private options: BaselineRendererOptions;

  constructor(options?: Partial<BaselineRendererOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (index: number) => number,
    priceToY: (price: number) => number,
  ): void {
    const { context: ctx, pixelRatio } = target;
    const { fromIdx, toIdx } = range;
    if (fromIdx > toIdx) return;

    const close = store.close;
    const baseY = Math.round(priceToY(this.options.basePrice) * pixelRatio);

    ctx.save();

    // Collect points
    const points: Array<{ x: number; y: number }> = [];
    for (let i = fromIdx; i <= toIdx; i++) {
      points.push({
        x: Math.round(indexToX(i) * pixelRatio),
        y: Math.round(priceToY(close[i]) * pixelRatio),
      });
    }

    // Fill above baseline
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);
    for (const p of points) {
      ctx.lineTo(p.x, Math.min(p.y, baseY));
    }
    ctx.lineTo(points[points.length - 1].x, baseY);
    ctx.closePath();
    ctx.fillStyle = this.options.topFillColor;
    ctx.fill();

    // Fill below baseline
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);
    for (const p of points) {
      ctx.lineTo(p.x, Math.max(p.y, baseY));
    }
    ctx.lineTo(points[points.length - 1].x, baseY);
    ctx.closePath();
    ctx.fillStyle = this.options.bottomFillColor;
    ctx.fill();

    // Draw line with color switching at baseline crossings
    ctx.lineWidth = this.options.lineWidth * pixelRatio;
    ctx.lineJoin = 'round';

    // Simple approach: draw line above baseline in top color, below in bottom color
    // For simplicity, draw the full line then overdraw. More accurate would be
    // clipping, but this is good enough for v1.
    // Top portion (clip above baseline)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, target.width * pixelRatio, baseY);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = this.options.topLineColor;
    ctx.stroke();
    ctx.restore();

    // Bottom portion (clip below baseline)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, baseY, target.width * pixelRatio, target.height * pixelRatio - baseY);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = this.options.bottomLineColor;
    ctx.lineWidth = this.options.lineWidth * pixelRatio;
    ctx.stroke();
    ctx.restore();

    // Baseline reference line
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);
    ctx.lineTo(points[points.length - 1].x, baseY);
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = pixelRatio;
    ctx.setLineDash([4 * pixelRatio, 4 * pixelRatio]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  applyOptions(options: Partial<BaselineRendererOptions>): void {
    Object.assign(this.options, options);
  }
}
```

- [ ] **Step 4: Implement HollowCandleRenderer**

Create `src/renderers/hollow-candle.ts`:

```typescript
import type { IRenderTarget, ColumnStore, VisibleRange } from '@/core/types';

export interface HollowCandleRendererOptions {
  upColor: string;
  downColor: string;
  wickColor: string;
}

const DEFAULTS: HollowCandleRendererOptions = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  wickColor: '#737375',
};

export class HollowCandleRenderer {
  private options: HollowCandleRendererOptions;

  constructor(options?: Partial<HollowCandleRendererOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (index: number) => number,
    priceToY: (price: number) => number,
    barWidth: number,
  ): void {
    const { context: ctx, pixelRatio } = target;
    const { fromIdx, toIdx } = range;
    if (fromIdx > toIdx) return;

    const { open, high, low, close } = store;
    const halfBar = Math.max(1, Math.floor((barWidth * pixelRatio * 0.8) / 2));
    const lw = Math.max(1, Math.round(pixelRatio));

    ctx.save();
    ctx.lineWidth = lw;

    for (let i = fromIdx; i <= toIdx; i++) {
      const isUp = close[i] >= open[i];
      const color = isUp ? this.options.upColor : this.options.downColor;
      const x = Math.round(indexToX(i) * pixelRatio);
      const yOpen = Math.round(priceToY(open[i]) * pixelRatio);
      const yClose = Math.round(priceToY(close[i]) * pixelRatio);
      const yHigh = Math.round(priceToY(high[i]) * pixelRatio);
      const yLow = Math.round(priceToY(low[i]) * pixelRatio);

      const bodyTop = Math.min(yOpen, yClose);
      const bodyBottom = Math.max(yOpen, yClose);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      // Wick
      ctx.fillStyle = this.options.wickColor;
      ctx.fillRect(x - Math.floor(lw / 2), yHigh, lw, yLow - yHigh);

      if (isUp) {
        // Hollow candle — stroke only
        ctx.strokeStyle = color;
        ctx.strokeRect(x - halfBar, bodyTop, halfBar * 2, bodyHeight);
      } else {
        // Filled candle
        ctx.fillStyle = color;
        ctx.fillRect(x - halfBar, bodyTop, halfBar * 2, bodyHeight);
      }
    }

    ctx.restore();
  }

  applyOptions(options: Partial<HollowCandleRendererOptions>): void {
    Object.assign(this.options, options);
  }
}
```

- [ ] **Step 5: Implement HistogramRenderer**

Create `src/renderers/histogram.ts`:

```typescript
import type { IRenderTarget, ColumnStore, VisibleRange } from '@/core/types';

export interface HistogramRendererOptions {
  upColor: string;
  downColor: string;
}

const DEFAULTS: HistogramRendererOptions = {
  upColor: 'rgba(38, 166, 154, 0.5)',
  downColor: 'rgba(239, 83, 80, 0.5)',
};

export class HistogramRenderer {
  private options: HistogramRendererOptions;

  constructor(options?: Partial<HistogramRendererOptions>) {
    this.options = { ...DEFAULTS, ...options };
  }

  draw(
    target: IRenderTarget,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (index: number) => number,
    valueToY: (value: number) => number,
    barWidth: number,
    bottomY: number,
  ): void {
    const { context: ctx, pixelRatio } = target;
    const { fromIdx, toIdx } = range;
    if (fromIdx > toIdx) return;

    const { close, open, volume } = store;
    const halfBar = Math.max(1, Math.floor((barWidth * pixelRatio * 0.8) / 2));
    const bottom = Math.round(bottomY * pixelRatio);

    ctx.save();

    for (let i = fromIdx; i <= toIdx; i++) {
      const isUp = close[i] >= open[i];
      ctx.fillStyle = isUp ? this.options.upColor : this.options.downColor;
      const x = Math.round(indexToX(i) * pixelRatio);
      const y = Math.round(valueToY(volume[i]) * pixelRatio);
      const barHeight = bottom - y;
      ctx.fillRect(x - halfBar, y, halfBar * 2, barHeight);
    }

    ctx.restore();
  }

  applyOptions(options: Partial<HistogramRendererOptions>): void {
    Object.assign(this.options, options);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/renderers/area.ts src/renderers/bar-ohlc.ts src/renderers/baseline.ts src/renderers/hollow-candle.ts src/renderers/histogram.ts
git commit -m "feat: add Area, BarOHLC, Baseline, HollowCandle, Histogram renderers"
```

---

## Task 13: Indicator Compute Functions (SMA, EMA, RSI, MACD, Bollinger, Volume)

**Files:**
- Create: `src/indicators/sma.ts`, `src/indicators/ema.ts`, `src/indicators/rsi.ts`, `src/indicators/macd.ts`, `src/indicators/bollinger.ts`, `src/indicators/volume.ts`, `src/indicators/index.ts`
- Test: `tests/indicators/sma.test.ts`, `tests/indicators/ema.test.ts`, `tests/indicators/rsi.test.ts`, `tests/indicators/macd.test.ts`, `tests/indicators/bollinger.test.ts`, `tests/indicators/volume.test.ts`

- [ ] **Step 1: Write SMA test**

Create `tests/indicators/sma.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeSMA } from '@/indicators/sma';

describe('computeSMA', () => {
  it('computes simple moving average', () => {
    const close = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeSMA(close, 10, 3);
    // SMA(3): NaN, NaN, 2, 3, 4, 5, 6, 7, 8, 9
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBeCloseTo(2, 10);
    expect(result[3]).toBeCloseTo(3, 10);
    expect(result[9]).toBeCloseTo(9, 10);
  });

  it('handles period equal to data length', () => {
    const close = new Float64Array([10, 20, 30]);
    const result = computeSMA(close, 3, 3);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBeCloseTo(20, 10);
  });

  it('returns NaN for all if period > data length', () => {
    const close = new Float64Array([10, 20]);
    const result = computeSMA(close, 2, 5);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/indicators/sma.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement computeSMA**

Create `src/indicators/sma.ts`:

```typescript
export function computeSMA(
  close: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const result = new Float64Array(length);

  if (period > length) {
    result.fill(NaN);
    return result;
  }

  // Fill initial values with NaN
  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  // Compute first SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += close[i];
  }
  result[period - 1] = sum / period;

  // Sliding window — O(1) per bar
  for (let i = period; i < length; i++) {
    sum += close[i] - close[i - period];
    result[i] = sum / period;
  }

  return result;
}
```

- [ ] **Step 4: Run SMA test**

Run: `npx vitest run tests/indicators/sma.test.ts`
Expected: PASS

- [ ] **Step 5: Write EMA test**

Create `tests/indicators/ema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeEMA } from '@/indicators/ema';

describe('computeEMA', () => {
  it('first EMA value equals SMA over period', () => {
    const close = new Float64Array([22, 24, 23, 25, 26]);
    const result = computeEMA(close, 5, 3);
    // First EMA = SMA(3) of first 3 values = (22+24+23)/3 = 23
    expect(result[2]).toBeCloseTo(23, 10);
  });

  it('subsequent values apply EMA formula', () => {
    const close = new Float64Array([22, 24, 23, 25, 26]);
    const result = computeEMA(close, 5, 3);
    const k = 2 / (3 + 1); // 0.5
    // EMA[3] = 25 * 0.5 + 23 * 0.5 = 24
    expect(result[3]).toBeCloseTo(24, 10);
    // EMA[4] = 26 * 0.5 + 24 * 0.5 = 25
    expect(result[4]).toBeCloseTo(25, 10);
  });

  it('returns NaN before period', () => {
    const close = new Float64Array([1, 2, 3, 4, 5]);
    const result = computeEMA(close, 5, 3);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
  });
});
```

- [ ] **Step 6: Implement computeEMA**

Create `src/indicators/ema.ts`:

```typescript
export function computeEMA(
  close: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const result = new Float64Array(length);

  if (period > length) {
    result.fill(NaN);
    return result;
  }

  for (let i = 0; i < period - 1; i++) {
    result[i] = NaN;
  }

  // First value is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += close[i];
  }
  result[period - 1] = sum / period;

  // EMA multiplier
  const k = 2 / (period + 1);

  for (let i = period; i < length; i++) {
    result[i] = close[i] * k + result[i - 1] * (1 - k);
  }

  return result;
}
```

- [ ] **Step 7: Run EMA test**

Run: `npx vitest run tests/indicators/ema.test.ts`
Expected: PASS

- [ ] **Step 8: Write RSI test**

Create `tests/indicators/rsi.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeRSI } from '@/indicators/rsi';

describe('computeRSI', () => {
  it('returns values between 0 and 100', () => {
    const close = new Float64Array([
      44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
      45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64,
    ]);
    const result = computeRSI(close, 20, 14);
    for (let i = 14; i < 20; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(100);
    }
  });

  it('returns NaN before period', () => {
    const close = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeRSI(close, 10, 5);
    for (let i = 0; i < 5; i++) {
      expect(result[i]).toBeNaN();
    }
  });

  it('returns 100 for monotonically increasing prices', () => {
    const close = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = computeRSI(close, 10, 3);
    // All gains, no losses → RSI = 100
    expect(result[3]).toBe(100);
  });

  it('returns 0 for monotonically decreasing prices', () => {
    const close = new Float64Array([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    const result = computeRSI(close, 10, 3);
    // All losses, no gains → RSI = 0
    expect(result[3]).toBe(0);
  });
});
```

- [ ] **Step 9: Implement computeRSI**

Create `src/indicators/rsi.ts`:

```typescript
export function computeRSI(
  close: Float64Array,
  length: number,
  period: number,
): Float64Array {
  const result = new Float64Array(length);

  if (period >= length) {
    result.fill(NaN);
    return result;
  }

  for (let i = 0; i <= period; i++) {
    result[i] = NaN;
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = close[i] - close[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    result[period] = 100 - 100 / (1 + avgGain / avgLoss);
  }

  // Smoothed RSI using Wilder's method
  for (let i = period + 1; i < length; i++) {
    const change = close[i] - close[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      result[i] = 100 - 100 / (1 + avgGain / avgLoss);
    }
  }

  return result;
}
```

- [ ] **Step 10: Run RSI test**

Run: `npx vitest run tests/indicators/rsi.test.ts`
Expected: PASS

- [ ] **Step 11: Write MACD test**

Create `tests/indicators/macd.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeMACD, type MACDResult } from '@/indicators/macd';

describe('computeMACD', () => {
  const close = new Float64Array([
    171.00, 171.00, 169.35, 170.69, 173.16, 171.57, 170.35, 170.01, 171.83, 171.65,
    172.89, 172.39, 171.66, 174.97, 175.36, 175.53, 175.15, 175.11, 174.53, 174.77,
    175.23, 175.24, 176.00, 175.95, 176.44, 176.25, 175.07, 175.99, 176.78, 177.64,
    178.76, 178.10, 176.78, 177.99, 178.75, 180.02, 179.84, 178.66, 178.35, 179.28,
  ]);

  it('returns three arrays of correct length', () => {
    const result: MACDResult = computeMACD(close, 40, 12, 26, 9);
    expect(result.macd.length).toBe(40);
    expect(result.signal.length).toBe(40);
    expect(result.histogram.length).toBe(40);
  });

  it('MACD values are NaN before slow period', () => {
    const result = computeMACD(close, 40, 12, 26, 9);
    for (let i = 0; i < 25; i++) {
      expect(result.macd[i]).toBeNaN();
    }
  });

  it('histogram equals MACD minus signal', () => {
    const result = computeMACD(close, 40, 12, 26, 9);
    for (let i = 34; i < 40; i++) {
      if (!isNaN(result.macd[i]) && !isNaN(result.signal[i])) {
        expect(result.histogram[i]).toBeCloseTo(result.macd[i] - result.signal[i], 10);
      }
    }
  });
});
```

- [ ] **Step 12: Implement computeMACD**

Create `src/indicators/macd.ts`:

```typescript
import { computeEMA } from './ema';

export interface MACDResult {
  macd: Float64Array;
  signal: Float64Array;
  histogram: Float64Array;
}

export function computeMACD(
  close: Float64Array,
  length: number,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): MACDResult {
  const macd = new Float64Array(length);
  const signal = new Float64Array(length);
  const histogram = new Float64Array(length);

  if (slowPeriod > length) {
    macd.fill(NaN);
    signal.fill(NaN);
    histogram.fill(NaN);
    return { macd, signal, histogram };
  }

  const fastEMA = computeEMA(close, length, fastPeriod);
  const slowEMA = computeEMA(close, length, slowPeriod);

  // MACD line = Fast EMA - Slow EMA
  for (let i = 0; i < length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macd[i] = NaN;
    } else {
      macd[i] = fastEMA[i] - slowEMA[i];
    }
  }

  // Signal line = EMA of MACD (only over non-NaN MACD values)
  // Find first valid MACD index
  let firstValid = -1;
  for (let i = 0; i < length; i++) {
    if (!isNaN(macd[i])) {
      firstValid = i;
      break;
    }
  }

  if (firstValid === -1 || firstValid + signalPeriod > length) {
    signal.fill(NaN);
    histogram.fill(NaN);
    return { macd, signal, histogram };
  }

  // Fill signal NaN before it starts
  for (let i = 0; i < firstValid + signalPeriod - 1; i++) {
    signal[i] = NaN;
  }

  // First signal = SMA of first signalPeriod MACD values
  let sum = 0;
  for (let i = firstValid; i < firstValid + signalPeriod; i++) {
    sum += macd[i];
  }
  signal[firstValid + signalPeriod - 1] = sum / signalPeriod;

  // EMA of MACD
  const k = 2 / (signalPeriod + 1);
  for (let i = firstValid + signalPeriod; i < length; i++) {
    signal[i] = macd[i] * k + signal[i - 1] * (1 - k);
  }

  // Histogram = MACD - Signal
  for (let i = 0; i < length; i++) {
    if (isNaN(macd[i]) || isNaN(signal[i])) {
      histogram[i] = NaN;
    } else {
      histogram[i] = macd[i] - signal[i];
    }
  }

  return { macd, signal, histogram };
}
```

- [ ] **Step 13: Run MACD test**

Run: `npx vitest run tests/indicators/macd.test.ts`
Expected: PASS

- [ ] **Step 14: Write Bollinger test**

Create `tests/indicators/bollinger.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeBollinger, type BollingerResult } from '@/indicators/bollinger';

describe('computeBollinger', () => {
  const close = new Float64Array([
    25.5, 26.75, 27.0, 26.5, 27.25, 28.0, 27.5, 27.0, 26.75, 27.5,
    28.25, 28.0, 27.75, 28.5, 29.0, 28.75, 28.5, 29.25, 29.5, 30.0,
  ]);

  it('returns three arrays of correct length', () => {
    const result: BollingerResult = computeBollinger(close, 20, 20, 2);
    expect(result.upper.length).toBe(20);
    expect(result.middle.length).toBe(20);
    expect(result.lower.length).toBe(20);
  });

  it('middle band equals SMA', () => {
    const result = computeBollinger(close, 20, 5, 2);
    // Middle band at index 4 = SMA(5) = (25.5+26.75+27+26.5+27.25)/5 = 26.6
    expect(result.middle[4]).toBeCloseTo(26.6, 1);
  });

  it('upper > middle > lower', () => {
    const result = computeBollinger(close, 20, 5, 2);
    for (let i = 4; i < 20; i++) {
      expect(result.upper[i]).toBeGreaterThan(result.middle[i]);
      expect(result.middle[i]).toBeGreaterThan(result.lower[i]);
    }
  });

  it('bands are NaN before period', () => {
    const result = computeBollinger(close, 20, 5, 2);
    for (let i = 0; i < 4; i++) {
      expect(result.upper[i]).toBeNaN();
      expect(result.middle[i]).toBeNaN();
      expect(result.lower[i]).toBeNaN();
    }
  });
});
```

- [ ] **Step 15: Implement computeBollinger**

Create `src/indicators/bollinger.ts`:

```typescript
import { computeSMA } from './sma';

export interface BollingerResult {
  upper: Float64Array;
  middle: Float64Array;
  lower: Float64Array;
}

export function computeBollinger(
  close: Float64Array,
  length: number,
  period: number,
  stdDev: number,
): BollingerResult {
  const middle = computeSMA(close, length, period);
  const upper = new Float64Array(length);
  const lower = new Float64Array(length);

  for (let i = 0; i < period - 1; i++) {
    upper[i] = NaN;
    lower[i] = NaN;
  }

  for (let i = period - 1; i < length; i++) {
    // Standard deviation over window
    let sumSq = 0;
    const mean = middle[i];
    for (let j = i - period + 1; j <= i; j++) {
      const diff = close[j] - mean;
      sumSq += diff * diff;
    }
    const sd = Math.sqrt(sumSq / period);
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }

  return { upper, middle, lower };
}
```

- [ ] **Step 16: Run Bollinger test**

Run: `npx vitest run tests/indicators/bollinger.test.ts`
Expected: PASS

- [ ] **Step 17: Write Volume indicator test**

Create `tests/indicators/volume.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeVolume } from '@/indicators/volume';

describe('computeVolume', () => {
  it('passes through volume data', () => {
    const volume = new Float64Array([100, 200, 300, 400, 500]);
    const result = computeVolume(volume, 5);
    expect(result[0]).toBe(100);
    expect(result[4]).toBe(500);
  });

  it('returns a new array (not the same reference)', () => {
    const volume = new Float64Array([100, 200]);
    const result = computeVolume(volume, 2);
    expect(result).not.toBe(volume);
  });
});
```

- [ ] **Step 18: Implement computeVolume**

Create `src/indicators/volume.ts`:

```typescript
export function computeVolume(
  volume: Float64Array,
  length: number,
): Float64Array {
  const result = new Float64Array(length);
  result.set(volume.subarray(0, length));
  return result;
}
```

- [ ] **Step 19: Create barrel export**

Create `src/indicators/index.ts`:

```typescript
export { computeSMA } from './sma';
export { computeEMA } from './ema';
export { computeRSI } from './rsi';
export { computeMACD, type MACDResult } from './macd';
export { computeBollinger, type BollingerResult } from './bollinger';
export { computeVolume } from './volume';
```

- [ ] **Step 20: Run all indicator tests**

Run: `npx vitest run tests/indicators/`
Expected: ALL PASS

- [ ] **Step 21: Commit**

```bash
git add src/indicators/ tests/indicators/
git commit -m "feat: add 6 indicators — SMA, EMA, RSI, MACD, Bollinger Bands, Volume"
```

---

## Task 14: Interactions — EventRouter, Pan/Zoom, Crosshair

**Files:**
- Create: `src/interactions/event-router.ts`, `src/interactions/pan-zoom.ts`, `src/interactions/crosshair.ts`
- Test: `tests/interactions/pan-zoom.test.ts`, `tests/interactions/crosshair.test.ts`

- [ ] **Step 1: Write pan/zoom test**

Create `tests/interactions/pan-zoom.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { PanZoomHandler } from '@/interactions/pan-zoom';

describe('PanZoomHandler', () => {
  function createMockTimeScale() {
    return {
      scrollByPixels: vi.fn(),
      zoomAt: vi.fn(),
      barSpacing: 8,
    };
  }

  function createMockInvalidate() {
    return vi.fn();
  }

  it('onPointerDown + onPointerMove scrolls the time scale', () => {
    const ts = createMockTimeScale();
    const invalidate = createMockInvalidate();
    const handler = new PanZoomHandler(ts as any, invalidate);

    handler.onPointerDown(100, 200, 1);
    handler.onPointerMove(150, 200, 1);
    expect(ts.scrollByPixels).toHaveBeenCalledWith(50);
    expect(invalidate).toHaveBeenCalled();
  });

  it('ignores move without prior pointerdown', () => {
    const ts = createMockTimeScale();
    const invalidate = createMockInvalidate();
    const handler = new PanZoomHandler(ts as any, invalidate);

    handler.onPointerMove(150, 200, 1);
    expect(ts.scrollByPixels).not.toHaveBeenCalled();
  });

  it('onWheel zooms at cursor position', () => {
    const ts = createMockTimeScale();
    const invalidate = createMockInvalidate();
    const handler = new PanZoomHandler(ts as any, invalidate);

    handler.onWheel(400, 200, -100);
    expect(ts.zoomAt).toHaveBeenCalled();
    const [x, factor] = (ts.zoomAt as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(x).toBe(400);
    expect(factor).toBeGreaterThan(1); // negative deltaY = zoom in
  });

  it('onPointerUp stops panning', () => {
    const ts = createMockTimeScale();
    const invalidate = createMockInvalidate();
    const handler = new PanZoomHandler(ts as any, invalidate);

    handler.onPointerDown(100, 200, 1);
    handler.onPointerUp(1);
    handler.onPointerMove(200, 200, 1);
    // Only the move during active pan should have triggered scrollByPixels
    expect(ts.scrollByPixels).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/interactions/pan-zoom.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement EventRouter**

Create `src/interactions/event-router.ts`:

```typescript
export interface EventHandler {
  onPointerDown?(x: number, y: number, pointerId: number): void;
  onPointerMove?(x: number, y: number, pointerId: number): void;
  onPointerUp?(pointerId: number): void;
  onWheel?(x: number, y: number, deltaY: number): void;
  onKeyDown?(key: string, shiftKey: boolean): void;
}

export class EventRouter {
  private handlers: EventHandler[] = [];
  private element: HTMLElement | null = null;

  attach(element: HTMLElement): void {
    this.element = element;
    element.addEventListener('pointerdown', this.handlePointerDown);
    element.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('pointerup', this.handlePointerUp);
    element.addEventListener('pointerleave', this.handlePointerLeave);
    element.addEventListener('wheel', this.handleWheel, { passive: false });
    element.addEventListener('keydown', this.handleKeyDown);
    element.style.touchAction = 'none'; // Prevent browser handling of touch
  }

  detach(): void {
    if (!this.element) return;
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointerleave', this.handlePointerLeave);
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element = null;
  }

  addHandler(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  removeHandler(handler: EventHandler): void {
    const idx = this.handlers.indexOf(handler);
    if (idx !== -1) this.handlers.splice(idx, 1);
  }

  private getLocalCoords(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const rect = this.element!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private handlePointerDown = (e: PointerEvent): void => {
    const { x, y } = this.getLocalCoords(e);
    for (const h of this.handlers) h.onPointerDown?.(x, y, e.pointerId);
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const { x, y } = this.getLocalCoords(e);
    for (const h of this.handlers) h.onPointerMove?.(x, y, e.pointerId);
  };

  private handlePointerUp = (e: PointerEvent): void => {
    for (const h of this.handlers) h.onPointerUp?.(e.pointerId);
  };

  private handlePointerLeave = (e: PointerEvent): void => {
    for (const h of this.handlers) h.onPointerUp?.(e.pointerId);
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const { x, y } = this.getLocalCoords(e);
    for (const h of this.handlers) h.onWheel?.(x, y, e.deltaY);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    for (const h of this.handlers) h.onKeyDown?.(e.key, e.shiftKey);
  };
}
```

- [ ] **Step 4: Implement PanZoomHandler**

Create `src/interactions/pan-zoom.ts`:

```typescript
import type { TimeScale } from '@/core/time-scale';
import type { EventHandler } from './event-router';

const ZOOM_SENSITIVITY = 0.005;
const KINETIC_DAMPING = 0.95;
const KINETIC_MIN_VELOCITY = 0.5;

export class PanZoomHandler implements EventHandler {
  private isPanning = false;
  private lastX = 0;
  private activePointerId = -1;
  private velocity = 0;
  private kineticRaf = 0;

  constructor(
    private timeScale: TimeScale,
    private requestInvalidation: () => void,
  ) {}

  onPointerDown(x: number, _y: number, pointerId: number): void {
    this.isPanning = true;
    this.lastX = x;
    this.activePointerId = pointerId;
    this.velocity = 0;
    if (this.kineticRaf) {
      cancelAnimationFrame(this.kineticRaf);
      this.kineticRaf = 0;
    }
  }

  onPointerMove(x: number, _y: number, pointerId: number): void {
    if (!this.isPanning || pointerId !== this.activePointerId) return;
    const dx = x - this.lastX;
    this.velocity = dx;
    this.lastX = x;
    this.timeScale.scrollByPixels(dx);
    this.requestInvalidation();
  }

  onPointerUp(pointerId: number): void {
    if (pointerId !== this.activePointerId) return;
    this.isPanning = false;
    this.activePointerId = -1;

    // Start kinetic scrolling
    if (Math.abs(this.velocity) > KINETIC_MIN_VELOCITY) {
      this.startKinetic();
    }
  }

  onWheel(x: number, _y: number, deltaY: number): void {
    const factor = deltaY < 0 ? 1 + Math.abs(deltaY) * ZOOM_SENSITIVITY : 1 / (1 + Math.abs(deltaY) * ZOOM_SENSITIVITY);
    this.timeScale.zoomAt(x, factor);
    this.requestInvalidation();
  }

  destroy(): void {
    if (this.kineticRaf) {
      cancelAnimationFrame(this.kineticRaf);
      this.kineticRaf = 0;
    }
  }

  private startKinetic(): void {
    const tick = () => {
      this.velocity *= KINETIC_DAMPING;
      if (Math.abs(this.velocity) < KINETIC_MIN_VELOCITY) {
        this.kineticRaf = 0;
        return;
      }
      this.timeScale.scrollByPixels(this.velocity);
      this.requestInvalidation();
      this.kineticRaf = requestAnimationFrame(tick);
    };
    this.kineticRaf = requestAnimationFrame(tick);
  }
}
```

- [ ] **Step 5: Implement CrosshairHandler**

Create `src/interactions/crosshair.ts`:

```typescript
import type { Crosshair } from '@/core/crosshair';
import type { DataLayer } from '@/core/data-layer';
import type { TimeScale } from '@/core/time-scale';
import type { PriceScale } from '@/core/price-scale';
import type { EventHandler } from './event-router';

export class CrosshairHandler implements EventHandler {
  constructor(
    private crosshair: Crosshair,
    private dataLayer: DataLayer,
    private timeScale: TimeScale,
    private priceScale: PriceScale,
    private requestInvalidation: () => void,
  ) {}

  onPointerMove(x: number, y: number, _pointerId: number): void {
    const barIndex = Math.round(this.timeScale.xToIndex(x));
    const store = this.dataLayer.store;

    if (barIndex < 0 || barIndex >= store.length) {
      this.crosshair.hide();
      this.requestInvalidation();
      return;
    }

    const snappedX = this.timeScale.indexToX(barIndex);
    const price = this.priceScale.yToPrice(y);
    const time = store.time[barIndex];

    this.crosshair.update({
      x,
      y,
      barIndex,
      price,
      time,
      snappedX,
    });
    this.requestInvalidation();
  }

  onPointerUp(): void {
    this.crosshair.hide();
    this.requestInvalidation();
  }
}
```

- [ ] **Step 6: Write crosshair interaction test**

Create `tests/interactions/crosshair.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CrosshairHandler } from '@/interactions/crosshair';
import { Crosshair } from '@/core/crosshair';
import { DataLayer } from '@/core/data-layer';
import { TimeScale } from '@/core/time-scale';
import { PriceScale } from '@/core/price-scale';

describe('CrosshairHandler', () => {
  function setup() {
    const crosshair = new Crosshair();
    const dl = new DataLayer();
    dl.setData([
      { time: 1000, open: 100, high: 110, low: 90, close: 105 },
      { time: 2000, open: 105, high: 115, low: 95, close: 110 },
      { time: 3000, open: 110, high: 120, low: 100, close: 115 },
    ]);

    const ts = new TimeScale();
    ts.setOptions({ barSpacing: 100, rightOffset: 0, minBarSpacing: 2, maxBarSpacing: 200 });
    ts.setWidth(300);
    ts.setDataLength(3);

    const ps = new PriceScale('right');
    ps.setHeight(400);
    ps.autoScale(90, 120);

    const invalidate = vi.fn();
    const handler = new CrosshairHandler(crosshair, dl, ts, ps, invalidate);

    return { crosshair, handler, invalidate };
  }

  it('updates crosshair position on pointer move', () => {
    const { crosshair, handler, invalidate } = setup();
    handler.onPointerMove(150, 200, 1);
    expect(crosshair.visible).toBe(true);
    expect(crosshair.barIndex).toBeGreaterThanOrEqual(0);
    expect(invalidate).toHaveBeenCalled();
  });

  it('hides crosshair on pointer up', () => {
    const { crosshair, handler } = setup();
    handler.onPointerMove(150, 200, 1);
    expect(crosshair.visible).toBe(true);
    handler.onPointerUp();
    expect(crosshair.visible).toBe(false);
  });
});
```

- [ ] **Step 7: Run all interaction tests**

Run: `npx vitest run tests/interactions/`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add src/interactions/ tests/interactions/
git commit -m "feat: add EventRouter, PanZoomHandler, CrosshairHandler"
```

---

## Task 15: Keyboard Navigation & Axis Drag (Opt-in Interactions)

**Files:**
- Create: `src/interactions/keyboard-nav.ts`, `src/interactions/axis-drag.ts`

- [ ] **Step 1: Implement KeyboardNavHandler**

Create `src/interactions/keyboard-nav.ts`:

```typescript
import type { TimeScale } from '@/core/time-scale';
import type { EventHandler } from './event-router';

export class KeyboardNavHandler implements EventHandler {
  constructor(
    private timeScale: TimeScale,
    private requestInvalidation: () => void,
  ) {}

  onKeyDown(key: string, shiftKey: boolean): void {
    const step = shiftKey ? 10 : 1;

    switch (key) {
      case 'ArrowLeft':
        this.timeScale.scrollByPixels(step * this.timeScale.barSpacing);
        this.requestInvalidation();
        break;
      case 'ArrowRight':
        this.timeScale.scrollByPixels(-step * this.timeScale.barSpacing);
        this.requestInvalidation();
        break;
      case 'ArrowUp':
      case '+':
      case '=':
        this.timeScale.zoomAt(0, 1.2);
        this.requestInvalidation();
        break;
      case 'ArrowDown':
      case '-':
        this.timeScale.zoomAt(0, 1 / 1.2);
        this.requestInvalidation();
        break;
      case 'Home':
        this.timeScale.scrollToPosition(this.timeScale.barSpacing * 1000);
        this.requestInvalidation();
        break;
      case 'End':
        this.timeScale.scrollToEnd();
        this.requestInvalidation();
        break;
    }
  }
}
```

- [ ] **Step 2: Implement AxisDragHandler**

Create `src/interactions/axis-drag.ts`:

```typescript
import type { PriceScale } from '@/core/price-scale';
import type { TimeScale } from '@/core/time-scale';
import type { EventHandler } from './event-router';

export class AxisDragHandler implements EventHandler {
  private isDragging = false;
  private dragTarget: 'price' | 'time' | null = null;
  private lastY = 0;
  private lastX = 0;
  private activePointerId = -1;

  constructor(
    private priceScale: PriceScale,
    private timeScale: TimeScale,
    private requestInvalidation: () => void,
    private priceAxisRect: () => { x: number; y: number; w: number; h: number },
    private timeAxisRect: () => { x: number; y: number; w: number; h: number },
  ) {}

  onPointerDown(x: number, y: number, pointerId: number): void {
    const priceRect = this.priceAxisRect();
    const timeRect = this.timeAxisRect();

    if (
      x >= priceRect.x &&
      x <= priceRect.x + priceRect.w &&
      y >= priceRect.y &&
      y <= priceRect.y + priceRect.h
    ) {
      this.isDragging = true;
      this.dragTarget = 'price';
      this.lastY = y;
      this.activePointerId = pointerId;
    } else if (
      x >= timeRect.x &&
      x <= timeRect.x + timeRect.w &&
      y >= timeRect.y &&
      y <= timeRect.y + timeRect.h
    ) {
      this.isDragging = true;
      this.dragTarget = 'time';
      this.lastX = x;
      this.activePointerId = pointerId;
    }
  }

  onPointerMove(x: number, y: number, pointerId: number): void {
    if (!this.isDragging || pointerId !== this.activePointerId) return;

    if (this.dragTarget === 'price') {
      const dy = y - this.lastY;
      this.lastY = y;
      const { min, max } = this.priceScale.priceRange;
      const range = max - min;
      const scaleFactor = 1 + dy * 0.005;
      const mid = (min + max) / 2;
      const newRange = range * scaleFactor;
      this.priceScale.setRange(mid - newRange / 2, mid + newRange / 2);
      this.requestInvalidation();
    } else if (this.dragTarget === 'time') {
      const dx = x - this.lastX;
      this.lastX = x;
      this.timeScale.scrollByPixels(dx);
      this.requestInvalidation();
    }
  }

  onPointerUp(pointerId: number): void {
    if (pointerId !== this.activePointerId) return;
    this.isDragging = false;
    this.dragTarget = null;
    this.activePointerId = -1;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/interactions/keyboard-nav.ts src/interactions/axis-drag.ts
git commit -m "feat: add keyboard navigation and axis drag-scaling interactions"
```

---

## Task 16: Svelte GUI Components

**Files:**
- Create: `src/gui/ChartWidget.svelte`, `src/gui/PaneWidget.svelte`, `src/gui/PriceAxisWidget.svelte`, `src/gui/TimeAxisWidget.svelte`, `src/gui/CrosshairLabel.svelte`, `src/gui/PaneSeparator.svelte`, `src/gui/Legend.svelte`

This is a large task. Each component is a separate step.

- [ ] **Step 1: Create PaneWidget.svelte**

Create `src/gui/PaneWidget.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let width: number;
  export let height: number;
  export let pixelRatio: number = window.devicePixelRatio || 1;

  let containerEl: HTMLDivElement;
  let bgCanvas: HTMLCanvasElement;
  let mainCanvas: HTMLCanvasElement;
  let overlayCanvas: HTMLCanvasElement;

  export function getContexts() {
    return {
      bg: bgCanvas.getContext('2d')!,
      main: mainCanvas.getContext('2d')!,
      overlay: overlayCanvas.getContext('2d')!,
    };
  }

  function updateCanvasSize(canvas: HTMLCanvasElement) {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  $: if (bgCanvas && mainCanvas && overlayCanvas) {
    updateCanvasSize(bgCanvas);
    updateCanvasSize(mainCanvas);
    updateCanvasSize(overlayCanvas);
  }
</script>

<div class="fc-pane" bind:this={containerEl} style="width:{width}px;height:{height}px;">
  <canvas class="fc-canvas fc-bg" bind:this={bgCanvas}></canvas>
  <canvas class="fc-canvas fc-main" bind:this={mainCanvas}></canvas>
  <canvas class="fc-canvas fc-overlay" bind:this={overlayCanvas}></canvas>
  <slot />
</div>

<style>
  .fc-pane {
    position: relative;
    overflow: hidden;
  }
  .fc-canvas {
    position: absolute;
    top: 0;
    left: 0;
  }
  .fc-bg { z-index: 1; }
  .fc-main { z-index: 2; }
  .fc-overlay { z-index: 3; }
</style>
```

- [ ] **Step 2: Create PriceAxisWidget.svelte**

Create `src/gui/PriceAxisWidget.svelte`:

```svelte
<script lang="ts">
  export let labels: Array<{ price: number; y: number; text: string }> = [];
  export let width: number = 60;
  export let height: number;
  export let currentPrice: { y: number; text: string; color: string } | null = null;
</script>

<div class="fc-price-axis" style="width:{width}px;height:{height}px;">
  {#each labels as label (label.price)}
    <span class="fc-price-label" style="top:{label.y}px;">{label.text}</span>
  {/each}
  {#if currentPrice}
    <span
      class="fc-price-current"
      style="top:{currentPrice.y}px;background:{currentPrice.color};"
    >{currentPrice.text}</span>
  {/if}
</div>

<style>
  .fc-price-axis {
    position: relative;
    overflow: hidden;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .fc-price-label {
    position: absolute;
    right: 4px;
    transform: translateY(-50%);
    color: var(--fc-text-color, #999);
    white-space: nowrap;
    pointer-events: none;
  }
  .fc-price-current {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    color: #fff;
    padding: 1px 4px;
    border-radius: 2px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
  }
</style>
```

- [ ] **Step 3: Create TimeAxisWidget.svelte**

Create `src/gui/TimeAxisWidget.svelte`:

```svelte
<script lang="ts">
  export let labels: Array<{ x: number; text: string }> = [];
  export let height: number = 28;
  export let crosshairLabel: { x: number; text: string } | null = null;
</script>

<div class="fc-time-axis" style="height:{height}px;">
  {#each labels as label (label.x)}
    <span class="fc-time-label" style="left:{label.x}px;">{label.text}</span>
  {/each}
  {#if crosshairLabel}
    <span class="fc-time-crosshair" style="left:{crosshairLabel.x}px;">
      {crosshairLabel.text}
    </span>
  {/if}
</div>

<style>
  .fc-time-axis {
    position: relative;
    overflow: hidden;
    border-top: 1px solid var(--fc-border-color, #2a2a3e);
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .fc-time-label {
    position: absolute;
    top: 4px;
    transform: translateX(-50%);
    color: var(--fc-text-color, #999);
    white-space: nowrap;
    pointer-events: none;
  }
  .fc-time-crosshair {
    position: absolute;
    top: 2px;
    transform: translateX(-50%);
    background: var(--fc-crosshair-bg, #4c525e);
    color: #fff;
    padding: 1px 6px;
    border-radius: 2px;
    white-space: nowrap;
    pointer-events: none;
  }
</style>
```

- [ ] **Step 4: Create CrosshairLabel.svelte**

Create `src/gui/CrosshairLabel.svelte`:

```svelte
<script lang="ts">
  export let x: number = 0;
  export let y: number = 0;
  export let priceText: string = '';
  export let visible: boolean = false;
</script>

{#if visible}
  <div class="fc-crosshair-label" style="left:{x}px;top:{y}px;">
    {priceText}
  </div>
{/if}

<style>
  .fc-crosshair-label {
    position: absolute;
    z-index: 10;
    background: var(--fc-crosshair-bg, #4c525e);
    color: #fff;
    padding: 2px 6px;
    border-radius: 2px;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    white-space: nowrap;
    pointer-events: none;
    transform: translateY(-50%);
  }
</style>
```

- [ ] **Step 5: Create PaneSeparator.svelte**

Create `src/gui/PaneSeparator.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ resize: { deltaY: number } }>();

  let isDragging = false;
  let startY = 0;

  function onPointerDown(e: PointerEvent) {
    isDragging = true;
    startY = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    startY = e.clientY;
    dispatch('resize', { deltaY });
  }

  function onPointerUp() {
    isDragging = false;
  }
</script>

<div
  class="fc-pane-separator"
  class:dragging={isDragging}
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  role="separator"
  tabindex="-1"
></div>

<style>
  .fc-pane-separator {
    height: 4px;
    cursor: row-resize;
    background: var(--fc-border-color, #2a2a3e);
    position: relative;
    z-index: 5;
    flex-shrink: 0;
  }
  .fc-pane-separator:hover,
  .fc-pane-separator.dragging {
    background: var(--fc-accent-color, #4c8bf5);
  }
</style>
```

- [ ] **Step 6: Create Legend.svelte**

Create `src/gui/Legend.svelte`:

```svelte
<script lang="ts">
  export let seriesName: string = '';
  export let ohlcv: {
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  } | null = null;
  export let isUp: boolean = true;
</script>

<div class="fc-legend">
  {#if seriesName}
    <span class="fc-legend-name">{seriesName}</span>
  {/if}
  {#if ohlcv}
    <span class="fc-legend-item">O <span class:up={isUp} class:down={!isUp}>{ohlcv.open}</span></span>
    <span class="fc-legend-item">H <span class:up={isUp} class:down={!isUp}>{ohlcv.high}</span></span>
    <span class="fc-legend-item">L <span class:up={isUp} class:down={!isUp}>{ohlcv.low}</span></span>
    <span class="fc-legend-item">C <span class:up={isUp} class:down={!isUp}>{ohlcv.close}</span></span>
    <span class="fc-legend-item">V <span class="vol">{ohlcv.volume}</span></span>
  {/if}
</div>

<style>
  .fc-legend {
    position: absolute;
    top: 4px;
    left: 8px;
    z-index: 10;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    gap: 8px;
    pointer-events: none;
  }
  .fc-legend-name {
    color: var(--fc-text-color, #999);
    font-weight: 500;
  }
  .fc-legend-item {
    color: var(--fc-text-color, #999);
  }
  .up { color: #26a69a; }
  .down { color: #ef5350; }
  .vol { color: var(--fc-text-color, #999); }
</style>
```

- [ ] **Step 7: Create ChartWidget.svelte**

Create `src/gui/ChartWidget.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let width: number = 0;
  export let height: number = 0;
  export let container: HTMLElement;

  let chartEl: HTMLDivElement;
  let resizeObserver: ResizeObserver;

  export let onResize: ((w: number, h: number) => void) | undefined = undefined;

  onMount(() => {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        width = cr.width;
        height = cr.height;
        onResize?.(width, height);
      }
    });
    resizeObserver.observe(container);
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
  });
</script>

<div
  class="fc-chart"
  bind:this={chartEl}
  style="width:100%;height:100%;display:flex;flex-direction:column;"
  tabindex="0"
>
  <slot {width} {height} />
</div>

<style>
  .fc-chart {
    position: relative;
    overflow: hidden;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
  }
</style>
```

- [ ] **Step 8: Commit**

```bash
git add src/gui/
git commit -m "feat: add Svelte GUI components — ChartWidget, PaneWidget, axes, crosshair, legend"
```

---

## Task 17: API Layer — Options, SeriesApi, PaneApi, ChartApi

**Files:**
- Create: `src/api/options.ts`, `src/api/series-api.ts`, `src/api/pane-api.ts`, `src/api/chart-api.ts`
- Modify: `src/index.ts`
- Test: `tests/api/chart-api.test.ts`

- [ ] **Step 1: Create options.ts**

Create `src/api/options.ts`:

```typescript
import type { DeepPartial, Bar, ColumnData, SeriesType } from '@/core/types';

export interface LayoutOptions {
  background: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
}

export interface TimeScaleOptions {
  rightOffset: number;
  barSpacing: number;
  minBarSpacing: number;
  maxBarSpacing: number;
  timeVisible: boolean;
  secondsVisible: boolean;
}

export interface CrosshairOptions {
  mode: 'normal' | 'magnet';
  lineColor: string;
  lineWidth: number;
  lineDash: number[];
}

export interface ChartOptions {
  width: number;
  height: number;
  autoSize: boolean;
  layout: LayoutOptions;
  timeScale: TimeScaleOptions;
  crosshair: CrosshairOptions;
}

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  width: 0,
  height: 0,
  autoSize: true,
  layout: {
    background: '#1a1a2e',
    textColor: '#d1d4dc',
    fontSize: 12,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  timeScale: {
    rightOffset: 5,
    barSpacing: 8,
    minBarSpacing: 2,
    maxBarSpacing: 50,
    timeVisible: true,
    secondsVisible: false,
  },
  crosshair: {
    mode: 'normal',
    lineColor: 'rgba(255, 255, 255, 0.3)',
    lineWidth: 1,
    lineDash: [4, 4],
  },
};

export interface BaseSeriesOptions {
  data?: Bar[] | ColumnData;
  priceScaleId?: string;
  visible?: boolean;
}

export interface CandlestickSeriesOptions extends BaseSeriesOptions {
  upColor?: string;
  downColor?: string;
  wickUpColor?: string;
  wickDownColor?: string;
  borderUpColor?: string;
  borderDownColor?: string;
}

export interface LineSeriesOptions extends BaseSeriesOptions {
  color?: string;
  lineWidth?: number;
}

export interface AreaSeriesOptions extends BaseSeriesOptions {
  lineColor?: string;
  lineWidth?: number;
  topColor?: string;
  bottomColor?: string;
}

export interface BarSeriesOptions extends BaseSeriesOptions {
  upColor?: string;
  downColor?: string;
}

export interface BaselineSeriesOptions extends BaseSeriesOptions {
  basePrice?: number;
  topLineColor?: string;
  topFillColor?: string;
  bottomLineColor?: string;
  bottomFillColor?: string;
}

export interface HollowCandleSeriesOptions extends BaseSeriesOptions {
  upColor?: string;
  downColor?: string;
  wickColor?: string;
}

export interface PaneOptions {
  height?: number;
  minHeight?: number;
}

export type SeriesOptionsMap = {
  Candlestick: CandlestickSeriesOptions;
  Line: LineSeriesOptions;
  Area: AreaSeriesOptions;
  Bar: BarSeriesOptions;
  Baseline: BaselineSeriesOptions;
  HollowCandle: HollowCandleSeriesOptions;
};

export function mergeOptions<T extends object>(defaults: T, overrides: DeepPartial<T>): T {
  const result = { ...defaults };
  for (const key in overrides) {
    const val = overrides[key as keyof typeof overrides];
    if (val !== undefined && val !== null && typeof val === 'object' && !Array.isArray(val)) {
      (result as any)[key] = mergeOptions(
        (result as any)[key] ?? {},
        val as any,
      );
    } else if (val !== undefined) {
      (result as any)[key] = val;
    }
  }
  return result;
}
```

- [ ] **Step 2: Create series-api.ts**

Create `src/api/series-api.ts`:

```typescript
import type {
  Bar,
  ColumnData,
  SeriesType,
  ISeriesPrimitive,
  DeepPartial,
} from '@/core/types';
import type { DataLayer } from '@/core/data-layer';
import type { PriceScale } from '@/core/price-scale';
import type { SeriesOptionsMap } from './options';

export interface ISeriesApi<T extends SeriesType> {
  setData(data: Bar[] | ColumnData): void;
  update(bar: Bar): void;
  attachPrimitive(primitive: ISeriesPrimitive): void;
  detachPrimitive(primitive: ISeriesPrimitive): void;
  applyOptions(options: DeepPartial<SeriesOptionsMap[T]>): void;
  options(): Readonly<SeriesOptionsMap[T]>;
  priceScale(): PriceScale;
  dataByIndex(index: number): Bar | null;
  readonly seriesType: T;
}

export class SeriesApi<T extends SeriesType> implements ISeriesApi<T> {
  private primitives: ISeriesPrimitive[] = [];

  constructor(
    public readonly seriesType: T,
    private dataLayer: DataLayer,
    private _priceScale: PriceScale,
    private seriesOptions: SeriesOptionsMap[T],
    private onDataChanged: () => void,
  ) {}

  setData(data: Bar[] | ColumnData): void {
    this.dataLayer.setData(data);
    this.onDataChanged();
  }

  update(bar: Bar): void {
    this.dataLayer.update(bar);
    this.onDataChanged();
  }

  attachPrimitive(primitive: ISeriesPrimitive): void {
    this.primitives.push(primitive);
    primitive.attached?.({
      requestInvalidation: () => this.onDataChanged(),
    });
  }

  detachPrimitive(primitive: ISeriesPrimitive): void {
    const idx = this.primitives.indexOf(primitive);
    if (idx !== -1) {
      this.primitives.splice(idx, 1);
      primitive.detached?.();
    }
  }

  applyOptions(options: DeepPartial<SeriesOptionsMap[T]>): void {
    Object.assign(this.seriesOptions, options);
    this.onDataChanged();
  }

  options(): Readonly<SeriesOptionsMap[T]> {
    return this.seriesOptions;
  }

  priceScale(): PriceScale {
    return this._priceScale;
  }

  dataByIndex(index: number): Bar | null {
    return this.dataLayer.barAt(index);
  }

  getPrimitives(): ISeriesPrimitive[] {
    return this.primitives;
  }

  getDataLayer(): DataLayer {
    return this.dataLayer;
  }
}
```

- [ ] **Step 3: Create pane-api.ts**

Create `src/api/pane-api.ts`:

```typescript
import type { IPanePrimitive } from '@/core/types';

export interface IPaneApi {
  attachPrimitive(primitive: IPanePrimitive): void;
  detachPrimitive(primitive: IPanePrimitive): void;
  setHeight(height: number): void;
}

export class PaneApi implements IPaneApi {
  private primitives: IPanePrimitive[] = [];

  constructor(
    public readonly id: string,
    private onChanged: () => void,
  ) {}

  attachPrimitive(primitive: IPanePrimitive): void {
    this.primitives.push(primitive);
    primitive.attached?.({
      requestInvalidation: () => this.onChanged(),
    });
  }

  detachPrimitive(primitive: IPanePrimitive): void {
    const idx = this.primitives.indexOf(primitive);
    if (idx !== -1) {
      this.primitives.splice(idx, 1);
      primitive.detached?.();
    }
  }

  setHeight(_height: number): void {
    this.onChanged();
  }

  getPrimitives(): IPanePrimitive[] {
    return this.primitives;
  }
}
```

- [ ] **Step 4: Create chart-api.ts**

Create `src/api/chart-api.ts`:

```typescript
import type {
  Bar,
  ColumnData,
  SeriesType,
  DeepPartial,
} from '@/core/types';
import { InvalidationLevel } from '@/core/types';
import { DataLayer } from '@/core/data-layer';
import { InvalidateMask } from '@/core/invalidation';
import { TimeScale } from '@/core/time-scale';
import { PriceScale } from '@/core/price-scale';
import { Crosshair } from '@/core/crosshair';
import { EventRouter } from '@/interactions/event-router';
import { PanZoomHandler } from '@/interactions/pan-zoom';
import { CrosshairHandler } from '@/interactions/crosshair';
import { CanvasRenderer } from '@/renderers/canvas-renderer';
import { LineRenderer } from '@/renderers/line';
import { CandlestickRenderer } from '@/renderers/candlestick';
import { AreaRenderer } from '@/renderers/area';
import { BarOHLCRenderer } from '@/renderers/bar-ohlc';
import { BaselineRenderer } from '@/renderers/baseline';
import { HollowCandleRenderer } from '@/renderers/hollow-candle';
import { HistogramRenderer } from '@/renderers/histogram';
import { SeriesApi, type ISeriesApi } from './series-api';
import {
  type ChartOptions,
  type CandlestickSeriesOptions,
  type LineSeriesOptions,
  type AreaSeriesOptions,
  type BarSeriesOptions,
  type BaselineSeriesOptions,
  type HollowCandleSeriesOptions,
  type PaneOptions,
  DEFAULT_CHART_OPTIONS,
  mergeOptions,
} from './options';
import { PaneApi, type IPaneApi } from './pane-api';

export interface IChartApi {
  addCandlestickSeries(options?: CandlestickSeriesOptions): ISeriesApi<'Candlestick'>;
  addLineSeries(options?: LineSeriesOptions): ISeriesApi<'Line'>;
  addAreaSeries(options?: AreaSeriesOptions): ISeriesApi<'Area'>;
  addBarSeries(options?: BarSeriesOptions): ISeriesApi<'Bar'>;
  addBaselineSeries(options?: BaselineSeriesOptions): ISeriesApi<'Baseline'>;
  addHollowCandleSeries(options?: HollowCandleSeriesOptions): ISeriesApi<'HollowCandle'>;
  removeSeries(series: ISeriesApi<any>): void;
  addPane(options?: PaneOptions): IPaneApi;
  removePane(pane: IPaneApi): void;
  timeScale(): TimeScale;
  priceScale(id?: string): PriceScale;
  applyOptions(options: DeepPartial<ChartOptions>): void;
  options(): Readonly<ChartOptions>;
  resize(width: number, height: number): void;
  remove(): void;
  subscribeCrosshairMove(callback: (params: any) => void): void;
  unsubscribeCrosshairMove(callback: (params: any) => void): void;
  subscribeClick(callback: (params: any) => void): void;
  unsubscribeClick(callback: (params: any) => void): void;
}

interface ManagedSeries {
  api: SeriesApi<any>;
  renderer: any;
  type: SeriesType;
}

let paneCounter = 0;

export class ChartApi implements IChartApi {
  private opts: ChartOptions;
  private _timeScale: TimeScale;
  private _priceScale: PriceScale;
  private crosshair: Crosshair;
  private mask: InvalidateMask;
  private eventRouter: EventRouter;
  private seriesList: ManagedSeries[] = [];
  private panes: PaneApi[] = [];
  private crosshairCallbacks: Array<(params: any) => void> = [];
  private clickCallbacks: Array<(params: any) => void> = [];
  private rafId = 0;
  private container: HTMLElement;
  private chartEl: HTMLDivElement;
  private canvasEl: HTMLCanvasElement;
  private overlayCanvasEl: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlayCtx: CanvasRenderingContext2D;
  private renderer: CanvasRenderer;
  private overlayRenderer: CanvasRenderer;
  private resizeObserver: ResizeObserver;
  private pixelRatio: number;

  constructor(container: HTMLElement, options?: DeepPartial<ChartOptions>) {
    this.container = container;
    this.opts = mergeOptions(DEFAULT_CHART_OPTIONS, options ?? {});
    this.pixelRatio = window.devicePixelRatio || 1;

    // Create DOM structure
    this.chartEl = document.createElement('div');
    this.chartEl.style.cssText =
      'position:relative;width:100%;height:100%;overflow:hidden;user-select:none;-webkit-user-select:none;outline:none;';
    this.chartEl.tabIndex = 0;

    this.canvasEl = document.createElement('canvas');
    this.canvasEl.style.cssText = 'position:absolute;top:0;left:0;z-index:2;';
    this.overlayCanvasEl = document.createElement('canvas');
    this.overlayCanvasEl.style.cssText = 'position:absolute;top:0;left:0;z-index:3;';

    this.chartEl.appendChild(this.canvasEl);
    this.chartEl.appendChild(this.overlayCanvasEl);
    container.appendChild(this.chartEl);

    this.ctx = this.canvasEl.getContext('2d')!;
    this.overlayCtx = this.overlayCanvasEl.getContext('2d')!;
    this.renderer = new CanvasRenderer(this.ctx);
    this.overlayRenderer = new CanvasRenderer(this.overlayCtx);

    // Core model
    this._timeScale = new TimeScale();
    this._timeScale.setOptions(this.opts.timeScale);
    this._priceScale = new PriceScale('right');
    this.crosshair = new Crosshair();
    this.mask = new InvalidateMask();
    this.mask.addPane('main');

    // Interactions
    this.eventRouter = new EventRouter();
    this.eventRouter.attach(this.chartEl);

    const invalidate = () => this.requestRepaint(InvalidationLevel.Light);
    const panZoom = new PanZoomHandler(this._timeScale, invalidate);
    this.eventRouter.addHandler(panZoom);

    // Sizing
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        this.resize(cr.width, cr.height);
      }
    });

    if (this.opts.autoSize) {
      this.resizeObserver.observe(container);
    }

    if (this.opts.width > 0 && this.opts.height > 0) {
      this.resize(this.opts.width, this.opts.height);
    }
  }

  addCandlestickSeries(options?: CandlestickSeriesOptions): ISeriesApi<'Candlestick'> {
    return this.addSeries('Candlestick', options ?? {});
  }

  addLineSeries(options?: LineSeriesOptions): ISeriesApi<'Line'> {
    return this.addSeries('Line', options ?? {});
  }

  addAreaSeries(options?: AreaSeriesOptions): ISeriesApi<'Area'> {
    return this.addSeries('Area', options ?? {});
  }

  addBarSeries(options?: BarSeriesOptions): ISeriesApi<'Bar'> {
    return this.addSeries('Bar', options ?? {});
  }

  addBaselineSeries(options?: BaselineSeriesOptions): ISeriesApi<'Baseline'> {
    return this.addSeries('Baseline', options ?? {});
  }

  addHollowCandleSeries(options?: HollowCandleSeriesOptions): ISeriesApi<'HollowCandle'> {
    return this.addSeries('HollowCandle', options ?? {});
  }

  removeSeries(series: ISeriesApi<any>): void {
    const idx = this.seriesList.findIndex((s) => s.api === series);
    if (idx !== -1) {
      this.seriesList.splice(idx, 1);
      this.requestRepaint(InvalidationLevel.Full);
    }
  }

  addPane(options?: PaneOptions): IPaneApi {
    const id = `pane_${++paneCounter}`;
    const pane = new PaneApi(id, () => this.requestRepaint(InvalidationLevel.Light));
    this.panes.push(pane);
    this.mask.addPane(id);
    return pane;
  }

  removePane(pane: IPaneApi): void {
    const idx = this.panes.findIndex((p) => p === pane);
    if (idx !== -1) {
      this.mask.removePane((pane as PaneApi).id);
      this.panes.splice(idx, 1);
      this.requestRepaint(InvalidationLevel.Full);
    }
  }

  timeScale(): TimeScale {
    return this._timeScale;
  }

  priceScale(_id?: string): PriceScale {
    return this._priceScale;
  }

  applyOptions(options: DeepPartial<ChartOptions>): void {
    this.opts = mergeOptions(this.opts, options);
    if (options.timeScale) {
      this._timeScale.setOptions(options.timeScale as any);
    }
    if (options.layout) {
      this.chartEl.style.background = this.opts.layout.background;
    }
    this.requestRepaint(InvalidationLevel.Full);
  }

  options(): Readonly<ChartOptions> {
    return this.opts;
  }

  resize(width: number, height: number): void {
    const pr = this.pixelRatio;
    this.canvasEl.width = Math.round(width * pr);
    this.canvasEl.height = Math.round(height * pr);
    this.canvasEl.style.width = `${width}px`;
    this.canvasEl.style.height = `${height}px`;
    this.overlayCanvasEl.width = Math.round(width * pr);
    this.overlayCanvasEl.height = Math.round(height * pr);
    this.overlayCanvasEl.style.width = `${width}px`;
    this.overlayCanvasEl.style.height = `${height}px`;

    this.renderer.setSize(Math.round(width * pr), Math.round(height * pr));
    this.overlayRenderer.setSize(Math.round(width * pr), Math.round(height * pr));

    this._timeScale.setWidth(width);
    this._priceScale.setHeight(height);

    this.requestRepaint(InvalidationLevel.Full);
  }

  remove(): void {
    this.resizeObserver.disconnect();
    this.eventRouter.detach();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.container.removeChild(this.chartEl);
  }

  subscribeCrosshairMove(callback: (params: any) => void): void {
    this.crosshairCallbacks.push(callback);
  }

  unsubscribeCrosshairMove(callback: (params: any) => void): void {
    const idx = this.crosshairCallbacks.indexOf(callback);
    if (idx !== -1) this.crosshairCallbacks.splice(idx, 1);
  }

  subscribeClick(callback: (params: any) => void): void {
    this.clickCallbacks.push(callback);
  }

  unsubscribeClick(callback: (params: any) => void): void {
    const idx = this.clickCallbacks.indexOf(callback);
    if (idx !== -1) this.clickCallbacks.splice(idx, 1);
  }

  // ─── Private ──────────────────────────────────────────

  private addSeries<T extends SeriesType>(
    type: T,
    options: any,
  ): ISeriesApi<T> {
    const dataLayer = new DataLayer();
    const priceScale = this._priceScale;
    const api = new SeriesApi<T>(
      type,
      dataLayer,
      priceScale,
      options,
      () => {
        this.updateDataRange();
        this.requestRepaint(InvalidationLevel.Light);
      },
    );

    const renderer = this.createRenderer(type, options);
    this.seriesList.push({ api, renderer, type });

    // Ingest initial data if provided
    if (options.data) {
      api.setData(options.data);
    }

    // Set up crosshair handler for the first series
    if (this.seriesList.length === 1) {
      const chHandler = new CrosshairHandler(
        this.crosshair,
        dataLayer,
        this._timeScale,
        priceScale,
        () => this.requestRepaint(InvalidationLevel.Cursor),
      );
      this.eventRouter.addHandler(chHandler);
    }

    return api;
  }

  private createRenderer(type: SeriesType, options: any): any {
    switch (type) {
      case 'Candlestick':
        return new CandlestickRenderer(options);
      case 'Line':
        return new LineRenderer(options);
      case 'Area':
        return new AreaRenderer(options);
      case 'Bar':
        return new BarOHLCRenderer(options);
      case 'Baseline':
        return new BaselineRenderer(options);
      case 'HollowCandle':
        return new HollowCandleRenderer(options);
      default:
        return new LineRenderer(options);
    }
  }

  private updateDataRange(): void {
    if (this.seriesList.length === 0) return;
    const primary = this.seriesList[0];
    const store = primary.api.getDataLayer().store;
    if (store.length === 0) return;

    this._timeScale.setDataLength(store.length);
    const range = this._timeScale.visibleRange();

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = range.fromIdx; i <= range.toIdx; i++) {
      if (store.low[i] < minPrice) minPrice = store.low[i];
      if (store.high[i] > maxPrice) maxPrice = store.high[i];
    }

    if (minPrice !== Infinity) {
      this._priceScale.autoScale(minPrice, maxPrice);
    }
  }

  private requestRepaint(level: InvalidationLevel): void {
    this.mask.invalidate('main', level);
    if (this.rafId === 0) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = 0;
        this.paint();
      });
    }
  }

  private paint(): void {
    if (!this.mask.needsRepaint()) return;
    const level = this.mask.level('main');

    if (level >= InvalidationLevel.Light) {
      this.paintMain();
    }
    if (level >= InvalidationLevel.Cursor) {
      this.paintOverlay();
    }

    this.mask.reset();
  }

  private paintMain(): void {
    this.renderer.clear();
    this.updateDataRange();

    const range = this._timeScale.visibleRange();
    if (range.fromIdx > range.toIdx) return;

    const pr = this.pixelRatio;
    const width = this.canvasEl.width / pr;
    const height = this.canvasEl.height / pr;
    const target = {
      context: this.ctx,
      pixelRatio: pr,
      width,
      height,
    };
    const indexToX = (i: number) => this._timeScale.indexToX(i);
    const priceToY = (p: number) => this._priceScale.priceToY(p);

    // Draw grid lines
    this.paintGrid(target, range);

    // Draw each series
    for (const managed of this.seriesList) {
      const store = managed.api.getDataLayer().store;
      if (store.length === 0) continue;

      switch (managed.type) {
        case 'Line':
          managed.renderer.draw(target, store, range, indexToX, priceToY);
          break;
        case 'Candlestick':
        case 'Bar':
        case 'HollowCandle':
          managed.renderer.draw(
            target,
            store,
            range,
            indexToX,
            priceToY,
            this._timeScale.barSpacing,
          );
          break;
        case 'Area':
          managed.renderer.draw(target, store, range, indexToX, priceToY, height);
          break;
        case 'Baseline':
          managed.renderer.draw(target, store, range, indexToX, priceToY);
          break;
      }
    }
  }

  private paintGrid(target: { context: CanvasRenderingContext2D; pixelRatio: number; width: number; height: number }, range: any): void {
    const { context: ctx, pixelRatio: pr, width, height } = target;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = pr;

    // Horizontal grid lines
    const priceRange = this._priceScale.priceRange;
    const priceStep = this.niceStep(priceRange.max - priceRange.min, 6);
    const startPrice = Math.ceil(priceRange.min / priceStep) * priceStep;
    for (let p = startPrice; p <= priceRange.max; p += priceStep) {
      const y = Math.round(this._priceScale.priceToY(p) * pr) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width * pr, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const barStep = Math.max(1, Math.round(50 / this._timeScale.barSpacing));
    for (let i = range.fromIdx; i <= range.toIdx; i += barStep) {
      const x = Math.round(this._timeScale.indexToX(i) * pr) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height * pr);
      ctx.stroke();
    }

    ctx.restore();
  }

  private paintOverlay(): void {
    this.overlayRenderer.clear();
    if (!this.crosshair.visible) return;

    const pr = this.pixelRatio;
    const ctx = this.overlayCtx;
    const width = this.overlayCanvasEl.width;
    const height = this.overlayCanvasEl.height;

    ctx.save();
    ctx.strokeStyle = this.opts.crosshair.lineColor;
    ctx.lineWidth = this.opts.crosshair.lineWidth * pr;
    ctx.setLineDash(this.opts.crosshair.lineDash.map((d) => d * pr));

    // Horizontal line
    const y = Math.round(this.crosshair.y * pr) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Vertical line (snapped to bar center)
    const x = Math.round(this.crosshair.snappedX * pr) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.restore();
  }

  private niceStep(range: number, targetSteps: number): number {
    const rough = range / targetSteps;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    let nice: number;
    if (norm <= 1.5) nice = 1;
    else if (norm <= 3) nice = 2;
    else if (norm <= 7) nice = 5;
    else nice = 10;
    return nice * mag;
  }
}

export function createChart(
  container: HTMLElement,
  options?: DeepPartial<ChartOptions>,
): IChartApi {
  return new ChartApi(container, options);
}
```

- [ ] **Step 5: Update src/index.ts**

Replace `src/index.ts`:

```typescript
export { createChart, type IChartApi } from './api/chart-api';
export type { ISeriesApi } from './api/series-api';
export type { IPaneApi } from './api/pane-api';
export type {
  ChartOptions,
  CandlestickSeriesOptions,
  LineSeriesOptions,
  AreaSeriesOptions,
  BarSeriesOptions,
  BaselineSeriesOptions,
  HollowCandleSeriesOptions,
  PaneOptions,
} from './api/options';
export type {
  Bar,
  ColumnData,
  SeriesType,
  DeepPartial,
  ISeriesPrimitive,
  IPanePrimitive,
  IPaneView,
  IPaneRenderer,
  IRenderTarget,
  IPriceAxisView,
  ITimeAxisView,
} from './core/types';
export { InvalidationLevel } from './core/types';
```

- [ ] **Step 6: Write chart-api test**

Create `tests/api/chart-api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChart, type IChartApi } from '@/api/chart-api';
import type { Bar } from '@/core/types';

// Mock RAF
let rafCallback: FrameRequestCallback | null = null;
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  rafCallback = cb;
  return 1;
});
vi.stubGlobal('cancelAnimationFrame', vi.fn());

function flushRAF() {
  if (rafCallback) {
    const cb = rafCallback;
    rafCallback = null;
    cb(0);
  }
}

function makeBars(count: number): Bar[] {
  return Array.from({ length: count }, (_, i) => ({
    time: 1000 + i * 60,
    open: 100 + Math.sin(i) * 10,
    high: 110 + Math.sin(i) * 10,
    low: 90 + Math.sin(i) * 10,
    close: 105 + Math.sin(i) * 10,
    volume: 1000 + i * 100,
  }));
}

describe('createChart', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    // Mock ResizeObserver
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it('creates a chart instance', () => {
    const chart = createChart(container, { width: 800, height: 600, autoSize: false });
    expect(chart).toBeDefined();
    expect(chart.options().width).toBe(800);
    chart.remove();
  });

  it('adds and removes a candlestick series', () => {
    const chart = createChart(container, { width: 800, height: 600, autoSize: false });
    const series = chart.addCandlestickSeries({ data: makeBars(50) });
    expect(series.seriesType).toBe('Candlestick');
    expect(series.dataByIndex(0)?.time).toBe(1000);

    chart.removeSeries(series);
    chart.remove();
  });

  it('adds a line series with data', () => {
    const chart = createChart(container, { width: 800, height: 600, autoSize: false });
    const series = chart.addLineSeries({ data: makeBars(20), color: '#ff0000' });
    expect(series.seriesType).toBe('Line');
    expect(series.dataByIndex(19)?.time).toBe(1000 + 19 * 60);
    chart.remove();
  });

  it('real-time update appends bar', () => {
    const chart = createChart(container, { width: 800, height: 600, autoSize: false });
    const series = chart.addCandlestickSeries({ data: makeBars(10) });
    series.update({ time: 99999, open: 50, high: 60, low: 40, close: 55, volume: 500 });
    expect(series.dataByIndex(10)?.time).toBe(99999);
    chart.remove();
  });

  it('applyOptions updates chart options', () => {
    const chart = createChart(container, { width: 800, height: 600, autoSize: false });
    chart.applyOptions({ layout: { background: '#000' } });
    expect(chart.options().layout.background).toBe('#000');
    chart.remove();
  });

  it('timeScale and priceScale return instances', () => {
    const chart = createChart(container, { width: 800, height: 600, autoSize: false });
    expect(chart.timeScale()).toBeDefined();
    expect(chart.priceScale()).toBeDefined();
    chart.remove();
  });
});
```

- [ ] **Step 7: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add src/api/ src/index.ts tests/api/
git commit -m "feat: add API layer — createChart, IChartApi, ISeriesApi, options, render loop"
```

---

## Task 18: Dev App

**Files:**
- Create: `dev/index.html`, `dev/main.ts`, `dev/App.svelte`, `dev/data.ts`, `dev/vite.config.ts`

- [ ] **Step 1: Create dev/vite.config.ts**

Create `dev/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      'fin-charter': resolve(__dirname, '../src/index.ts'),
      'fin-charter/indicators': resolve(__dirname, '../src/indicators/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
```

- [ ] **Step 2: Create dev/index.html**

Create `dev/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>fin-charter dev</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0d0d1a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: Create dev/data.ts**

Create `dev/data.ts`:

```typescript
import type { Bar } from '../src/core/types';

export function generateOHLCV(count: number, startPrice = 100, startTime = 1609459200): Bar[] {
  const bars: Bar[] = [];
  let price = startPrice;
  let time = startTime;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 3;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.round(50000 + Math.random() * 100000);

    bars.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    price = close;
    time += 86400; // daily bars
  }

  return bars;
}
```

- [ ] **Step 4: Create dev/main.ts**

Create `dev/main.ts`:

```typescript
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

- [ ] **Step 5: Create dev/App.svelte**

Create `dev/App.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { createChart } from '../src/index';
  import { generateOHLCV } from './data';

  let chartContainer: HTMLDivElement;
  let seriesType = 'Candlestick';
  let chart: any;
  let series: any;

  const seriesTypes = ['Candlestick', 'Line', 'Area', 'Bar', 'Baseline', 'HollowCandle'];
  const data = generateOHLCV(500);

  function buildChart(type: string) {
    if (chart) chart.remove();

    chart = createChart(chartContainer, {
      layout: {
        background: '#1a1a2e',
        textColor: '#d1d4dc',
      },
    });

    switch (type) {
      case 'Candlestick':
        series = chart.addCandlestickSeries({ data });
        break;
      case 'Line':
        series = chart.addLineSeries({ data, color: '#2196F3' });
        break;
      case 'Area':
        series = chart.addAreaSeries({ data });
        break;
      case 'Bar':
        series = chart.addBarSeries({ data });
        break;
      case 'Baseline':
        series = chart.addBaselineSeries({ data, basePrice: data[0].close });
        break;
      case 'HollowCandle':
        series = chart.addHollowCandleSeries({ data });
        break;
    }
  }

  function simulateRealTime() {
    const last = data[data.length - 1];
    let price = last.close;
    let time = last.time + 86400;

    setInterval(() => {
      const change = (Math.random() - 0.48) * 2;
      price += change;
      const bar = {
        time,
        open: Math.round(price * 100) / 100,
        high: Math.round((price + Math.random() * 2) * 100) / 100,
        low: Math.round((price - Math.random() * 2) * 100) / 100,
        close: Math.round(price * 100) / 100,
        volume: Math.round(50000 + Math.random() * 100000),
      };

      if (Math.random() > 0.7) {
        time += 86400;
      }
      series.update(bar);
    }, 500);
  }

  onMount(() => {
    buildChart(seriesType);
  });

  $: if (chartContainer && seriesType) {
    buildChart(seriesType);
  }
</script>

<div class="controls">
  <h1>fin-charter dev</h1>
  <div class="buttons">
    {#each seriesTypes as st}
      <button
        class:active={seriesType === st}
        on:click={() => (seriesType = st)}
      >
        {st}
      </button>
    {/each}
    <button on:click={simulateRealTime}>Start Real-Time</button>
  </div>
</div>

<div class="chart-wrapper" bind:this={chartContainer}></div>

<style>
  .controls {
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 24px;
  }
  h1 {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }
  .buttons {
    display: flex;
    gap: 8px;
  }
  button {
    background: #2a2a3e;
    border: 1px solid #3a3a5e;
    color: #d1d4dc;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }
  button:hover { background: #3a3a5e; }
  button.active {
    background: #4c8bf5;
    border-color: #4c8bf5;
    color: #fff;
  }
  .chart-wrapper {
    width: 100%;
    height: calc(100vh - 70px);
  }
</style>
```

- [ ] **Step 6: Update package.json dev script**

In `package.json`, update the dev script:

```json
"dev": "vite --config dev/vite.config.ts"
```

- [ ] **Step 7: Verify dev server starts**

Run: `npm run dev`
Expected: Vite dev server starts, opens browser with chart rendered.

- [ ] **Step 8: Commit**

```bash
git add dev/ package.json
git commit -m "feat: add Vite dev app with chart type switcher and real-time simulation"
```

---

## Task 19: Documentation

**Files:**
- Create: `docs/getting-started.md`, `docs/api-reference.md`, `docs/indicators.md`, `docs/plugins.md`, `docs/performance.md`, `README.md`

- [ ] **Step 1: Create README.md**

Create `README.md` at project root with: project overview, features, installation (`npm install fin-charter`), quick start example showing `createChart` + `addCandlestickSeries`, link to docs/, bundle size targets, license.

- [ ] **Step 2: Create docs/getting-started.md**

Cover: installation, basic chart setup, adding series with data, chart types overview, real-time updates via `series.update()`, auto-sizing, options.

- [ ] **Step 3: Create docs/api-reference.md**

Cover: `createChart()`, `IChartApi` (all methods), `ISeriesApi` (all methods), `ChartOptions` and all sub-option interfaces, `ITimeScaleApi`, `IPriceScaleApi`, `Bar` and `ColumnData` types.

- [ ] **Step 4: Create docs/indicators.md**

Cover: importing indicators (`from 'fin-charter/indicators'`), each indicator (SMA, EMA, RSI, MACD, Bollinger, Volume) with parameters and usage example, how to use indicators with `series.attachPrimitive()`.

- [ ] **Step 5: Create docs/plugins.md**

Cover: `ISeriesPrimitive` and `IPanePrimitive` interfaces, `IPaneView` / `IPaneRenderer` pattern, creating a custom overlay, `IRenderTarget` and direct canvas access, z-order slots, `hitTest`, lifecycle (`attached` / `detached`).

- [ ] **Step 6: Create docs/performance.md**

Cover: ColumnStore typed arrays, layered canvas architecture, InvalidateMask levels, text measurement caching, data conflation, pre-allocation strategy, bundle size budget table, tree-shaking with `sideEffects: false`.

- [ ] **Step 7: Commit**

```bash
git add README.md docs/
git commit -m "docs: add getting-started, API reference, indicators, plugins, performance guides"
```

---

## Task 20: Final Integration Test & PR

**Files:**
- Modify: various (fix any issues found)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Run linter**

Run: `npx eslint src/`
Fix any issues found.

- [ ] **Step 3: Run formatter**

Run: `npx prettier --write "src/**/*.{ts,svelte}" "tests/**/*.ts"`

- [ ] **Step 4: Verify build**

Run: `npx vite build`
Expected: Build succeeds, output in `dist/`

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: lint, format, fix integration issues"
```

- [ ] **Step 6: Create PR**

```bash
gh pr create --title "feat: fin-charter v0.1.0 — financial charting library" --body "$(cat <<'EOF'
## Summary
- Ultra-fast, tree-shakeable TypeScript financial charting library
- Canvas-based rendering with layered canvases and InvalidateMask scheduling
- 6 chart types: Candlestick, Line, Area, Bar (OHLC), Baseline, Hollow Candle
- 6 indicators: SMA, EMA, RSI, MACD, Bollinger Bands, Volume
- TradingView-compatible plugin architecture (ISeriesPrimitive)
- Real-time data support with incremental updates
- Svelte-compiled DOM overlays (zero runtime overhead)
- Pan, zoom, crosshair, keyboard nav, axis drag interactions
- Target: <15KB gzipped core

## Test plan
- [ ] `npm test` — all unit tests pass
- [ ] `npm run dev` — dev server loads, all chart types render
- [ ] `npm run build` — production build succeeds
- [ ] Real-time simulation works (click "Start Real-Time" in dev app)
- [ ] Pan/zoom interactions work
- [ ] Crosshair snaps to bars

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
