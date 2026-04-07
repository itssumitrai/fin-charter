# CSS Design Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the `--fc-*` CSS variable system to ~70 tokens covering every series type's colors, with a three-tier resolution (explicit JS > CSS > built-in defaults) and a searchable Storybook documentation page.

**Architecture:** Expand `CSS_VARS` and `readCSSTheme()` in `css-theme.ts` to read all new variables and return a `CSSSeriesDefaults` map. The chart stores these defaults and merges them under explicit options in `_addSeries()`. Renderers are unchanged — they receive already-resolved options.

**Tech Stack:** TypeScript, CSS custom properties, Storybook MDX

---

### Task 1: Expand CSS_VARS with all new variable names

**Files:**
- Modify: `src/core/css-theme.ts:8-37`
- Test: `tests/core/css-theme.test.ts`

- [ ] **Step 1: Add all new CSS variable names to `CSS_VARS`**

In `src/core/css-theme.ts`, replace the `CSS_VARS` object with:

```typescript
export const CSS_VARS = {
  // Layout
  bg: '--fc-bg',
  text: '--fc-text',
  fontSize: '--fc-font-size',
  fontFamily: '--fc-font-family',

  // Grid
  gridHorzColor: '--fc-grid-horz-color',
  gridVertColor: '--fc-grid-vert-color',

  // Crosshair
  crosshairVertColor: '--fc-crosshair-vert-color',
  crosshairHorzColor: '--fc-crosshair-horz-color',

  // Candlestick
  candleBodyUp: '--fc-candle-body-up',
  candleBodyDown: '--fc-candle-body-down',
  candleWickUp: '--fc-candle-wick-up',
  candleWickDown: '--fc-candle-wick-down',
  candleBorderUp: '--fc-candle-border-up',
  candleBorderDown: '--fc-candle-border-down',
  // Backward compat aliases (read-only, not in the object — handled in readCSSTheme)
  candleUpColor: '--fc-candle-up',
  candleDownColor: '--fc-candle-down',

  // Line / Area
  lineColor: '--fc-line-color',
  areaTopColor: '--fc-area-top',
  areaBottomColor: '--fc-area-bottom',
  areaLineColor: '--fc-area-line',

  // Bar (OHLC)
  barUp: '--fc-bar-up',
  barDown: '--fc-bar-down',

  // Baseline
  baselineTopLine: '--fc-baseline-top-line',
  baselineTopFill: '--fc-baseline-top-fill',
  baselineBottomLine: '--fc-baseline-bottom-line',
  baselineBottomFill: '--fc-baseline-bottom-fill',

  // Hollow Candle
  hollowCandleUp: '--fc-hollow-candle-up',
  hollowCandleDown: '--fc-hollow-candle-down',
  hollowCandleWick: '--fc-hollow-candle-wick',

  // Step Line
  stepLineColor: '--fc-step-line-color',

  // Colored Line
  coloredLineUp: '--fc-colored-line-up',
  coloredLineDown: '--fc-colored-line-down',

  // Colored Mountain
  coloredMountainUp: '--fc-colored-mountain-up',
  coloredMountainDown: '--fc-colored-mountain-down',
  coloredMountainFillUp: '--fc-colored-mountain-fill-up',
  coloredMountainFillDown: '--fc-colored-mountain-fill-down',

  // HLC Area
  hlcAreaHigh: '--fc-hlc-area-high',
  hlcAreaLow: '--fc-hlc-area-low',
  hlcAreaFill: '--fc-hlc-area-fill',

  // High-Low
  highLowUp: '--fc-high-low-up',
  highLowDown: '--fc-high-low-down',

  // Column
  columnUp: '--fc-column-up',
  columnDown: '--fc-column-down',

  // Volume Candle
  volumeCandleUp: '--fc-volume-candle-up',
  volumeCandleDown: '--fc-volume-candle-down',
  volumeCandleWickUp: '--fc-volume-candle-wick-up',
  volumeCandleWickDown: '--fc-volume-candle-wick-down',

  // Histogram
  histogramUp: '--fc-histogram-up',
  histogramDown: '--fc-histogram-down',

  // Baseline Delta Mountain
  bdmTopLine: '--fc-bdm-top-line',
  bdmTopFill: '--fc-bdm-top-fill',
  bdmBottomLine: '--fc-bdm-bottom-line',
  bdmBottomFill: '--fc-bdm-bottom-fill',

  // Renko
  renkoUp: '--fc-renko-up',
  renkoDown: '--fc-renko-down',

  // Kagi
  kagiYang: '--fc-kagi-yang',
  kagiYin: '--fc-kagi-yin',

  // Line Break
  lineBreakUp: '--fc-line-break-up',
  lineBreakDown: '--fc-line-break-down',

  // Point & Figure
  pointFigureUp: '--fc-point-figure-up',
  pointFigureDown: '--fc-point-figure-down',

  // Volume overlay
  volumeUpColor: '--fc-volume-up',
  volumeDownColor: '--fc-volume-down',

  // Last Price Line
  lastPriceUp: '--fc-last-price-up',
  lastPriceDown: '--fc-last-price-down',

  // Band fill
  bandFill: '--fc-band-fill',

  // Watermark
  watermarkColor: '--fc-watermark-color',
} as const;
```

- [ ] **Step 2: Verify existing test still passes**

Run: `npm test -- --run tests/core/css-theme.test.ts`
Expected: All tests pass (the `--fc-` prefix test should still work since all new vars are prefixed).

- [ ] **Step 3: Commit**

```bash
git add src/core/css-theme.ts
git commit -m "feat: expand CSS_VARS with all series type design tokens"
```

---

### Task 2: Add CSSSeriesDefaults type and expand readCSSTheme

**Files:**
- Modify: `src/core/css-theme.ts`
- Test: `tests/core/css-theme.test.ts`

- [ ] **Step 1: Add the `CSSSeriesDefaults` interface**

At the top of `src/core/css-theme.ts`, after the existing imports, add:

```typescript
import type { SeriesType } from './types';

/** Per-series-type color defaults read from CSS variables. */
export interface CSSSeriesDefaults {
  candlestick?: { upColor?: string; downColor?: string; wickUpColor?: string; wickDownColor?: string; borderUpColor?: string; borderDownColor?: string };
  bar?: { upColor?: string; downColor?: string };
  baseline?: { topLineColor?: string; topFillColor?: string; bottomLineColor?: string; bottomFillColor?: string };
  'hollow-candle'?: { upColor?: string; downColor?: string; wickColor?: string };
  line?: { color?: string };
  area?: { lineColor?: string; topColor?: string; bottomColor?: string };
  histogram?: { upColor?: string; downColor?: string };
  'step-line'?: { color?: string };
  'colored-line'?: { upColor?: string; downColor?: string };
  'colored-mountain'?: { upColor?: string; downColor?: string; upFillColor?: string; downFillColor?: string };
  'hlc-area'?: { highLineColor?: string; lowLineColor?: string; fillColor?: string };
  'high-low'?: { upColor?: string; downColor?: string };
  column?: { upColor?: string; downColor?: string };
  'volume-candle'?: { upColor?: string; downColor?: string; wickUpColor?: string; wickDownColor?: string };
  'baseline-delta-mountain'?: { topLineColor?: string; topFillColor?: string; bottomLineColor?: string; bottomFillColor?: string };
  renko?: { upColor?: string; downColor?: string };
  kagi?: { yangColor?: string; yinColor?: string };
  'line-break'?: { upColor?: string; downColor?: string };
  'point-figure'?: { upColor?: string; downColor?: string };
  lastPriceLine?: { upColor?: string; downColor?: string };
  bandFill?: { color?: string };
}

export interface CSSThemeResult {
  chartOptions: DeepPartial<ChartOptions>;
  seriesDefaults: CSSSeriesDefaults;
}
```

- [ ] **Step 2: Update `readCSSTheme` to return `CSSThemeResult`**

Change the signature and add series defaults reading. The function currently returns `DeepPartial<ChartOptions>`. Change it to return `CSSThemeResult`:

```typescript
export function readCSSTheme(container: HTMLElement): CSSThemeResult {
  const style = getComputedStyle(container);
  const get = (name: string): string | undefined => {
    const val = style.getPropertyValue(name).trim();
    return val || undefined;
  };

  // ── Chart options (existing logic, unchanged) ──
  const opts: DeepPartial<ChartOptions> = {};
  // ... keep all existing chart options reading unchanged ...

  // ── Series defaults (new) ──
  const seriesDefaults: CSSSeriesDefaults = {};

  // Candlestick (with backward compat for --fc-candle-up/down)
  const candleBodyUp = get(CSS_VARS.candleBodyUp) ?? get(CSS_VARS.candleUpColor);
  const candleBodyDown = get(CSS_VARS.candleBodyDown) ?? get(CSS_VARS.candleDownColor);
  const candleWickUp = get(CSS_VARS.candleWickUp);
  const candleWickDown = get(CSS_VARS.candleWickDown);
  const candleBorderUp = get(CSS_VARS.candleBorderUp);
  const candleBorderDown = get(CSS_VARS.candleBorderDown);
  if (candleBodyUp || candleBodyDown || candleWickUp || candleWickDown || candleBorderUp || candleBorderDown) {
    seriesDefaults.candlestick = {};
    if (candleBodyUp) seriesDefaults.candlestick.upColor = candleBodyUp;
    if (candleBodyDown) seriesDefaults.candlestick.downColor = candleBodyDown;
    if (candleWickUp) seriesDefaults.candlestick.wickUpColor = candleWickUp;
    if (candleWickDown) seriesDefaults.candlestick.wickDownColor = candleWickDown;
    if (candleBorderUp) seriesDefaults.candlestick.borderUpColor = candleBorderUp;
    if (candleBorderDown) seriesDefaults.candlestick.borderDownColor = candleBorderDown;
  }

  // Bar
  const barUp = get(CSS_VARS.barUp);
  const barDown = get(CSS_VARS.barDown);
  if (barUp || barDown) {
    seriesDefaults.bar = {};
    if (barUp) seriesDefaults.bar.upColor = barUp;
    if (barDown) seriesDefaults.bar.downColor = barDown;
  }

  // Baseline
  const bTopLine = get(CSS_VARS.baselineTopLine);
  const bTopFill = get(CSS_VARS.baselineTopFill);
  const bBottomLine = get(CSS_VARS.baselineBottomLine);
  const bBottomFill = get(CSS_VARS.baselineBottomFill);
  if (bTopLine || bTopFill || bBottomLine || bBottomFill) {
    seriesDefaults.baseline = {};
    if (bTopLine) seriesDefaults.baseline.topLineColor = bTopLine;
    if (bTopFill) seriesDefaults.baseline.topFillColor = bTopFill;
    if (bBottomLine) seriesDefaults.baseline.bottomLineColor = bBottomLine;
    if (bBottomFill) seriesDefaults.baseline.bottomFillColor = bBottomFill;
  }

  // Hollow Candle
  const hcUp = get(CSS_VARS.hollowCandleUp);
  const hcDown = get(CSS_VARS.hollowCandleDown);
  const hcWick = get(CSS_VARS.hollowCandleWick);
  if (hcUp || hcDown || hcWick) {
    seriesDefaults['hollow-candle'] = {};
    if (hcUp) seriesDefaults['hollow-candle'].upColor = hcUp;
    if (hcDown) seriesDefaults['hollow-candle'].downColor = hcDown;
    if (hcWick) seriesDefaults['hollow-candle'].wickColor = hcWick;
  }

  // Line
  const lc = get(CSS_VARS.lineColor);
  if (lc) seriesDefaults.line = { color: lc };

  // Area
  const aLine = get(CSS_VARS.areaLineColor);
  const aTop = get(CSS_VARS.areaTopColor);
  const aBottom = get(CSS_VARS.areaBottomColor);
  if (aLine || aTop || aBottom) {
    seriesDefaults.area = {};
    if (aLine) seriesDefaults.area.lineColor = aLine;
    if (aTop) seriesDefaults.area.topColor = aTop;
    if (aBottom) seriesDefaults.area.bottomColor = aBottom;
  }

  // Step Line
  const slc = get(CSS_VARS.stepLineColor);
  if (slc) seriesDefaults['step-line'] = { color: slc };

  // Colored Line
  const clUp = get(CSS_VARS.coloredLineUp);
  const clDown = get(CSS_VARS.coloredLineDown);
  if (clUp || clDown) {
    seriesDefaults['colored-line'] = {};
    if (clUp) seriesDefaults['colored-line'].upColor = clUp;
    if (clDown) seriesDefaults['colored-line'].downColor = clDown;
  }

  // Colored Mountain
  const cmUp = get(CSS_VARS.coloredMountainUp);
  const cmDown = get(CSS_VARS.coloredMountainDown);
  const cmFUp = get(CSS_VARS.coloredMountainFillUp);
  const cmFDown = get(CSS_VARS.coloredMountainFillDown);
  if (cmUp || cmDown || cmFUp || cmFDown) {
    seriesDefaults['colored-mountain'] = {};
    if (cmUp) seriesDefaults['colored-mountain'].upColor = cmUp;
    if (cmDown) seriesDefaults['colored-mountain'].downColor = cmDown;
    if (cmFUp) seriesDefaults['colored-mountain'].upFillColor = cmFUp;
    if (cmFDown) seriesDefaults['colored-mountain'].downFillColor = cmFDown;
  }

  // HLC Area
  const hlcH = get(CSS_VARS.hlcAreaHigh);
  const hlcL = get(CSS_VARS.hlcAreaLow);
  const hlcF = get(CSS_VARS.hlcAreaFill);
  if (hlcH || hlcL || hlcF) {
    seriesDefaults['hlc-area'] = {};
    if (hlcH) seriesDefaults['hlc-area'].highLineColor = hlcH;
    if (hlcL) seriesDefaults['hlc-area'].lowLineColor = hlcL;
    if (hlcF) seriesDefaults['hlc-area'].fillColor = hlcF;
  }

  // High-Low
  const hlUp = get(CSS_VARS.highLowUp);
  const hlDown = get(CSS_VARS.highLowDown);
  if (hlUp || hlDown) {
    seriesDefaults['high-low'] = {};
    if (hlUp) seriesDefaults['high-low'].upColor = hlUp;
    if (hlDown) seriesDefaults['high-low'].downColor = hlDown;
  }

  // Column
  const colUp = get(CSS_VARS.columnUp);
  const colDown = get(CSS_VARS.columnDown);
  if (colUp || colDown) {
    seriesDefaults.column = {};
    if (colUp) seriesDefaults.column.upColor = colUp;
    if (colDown) seriesDefaults.column.downColor = colDown;
  }

  // Volume Candle
  const vcUp = get(CSS_VARS.volumeCandleUp);
  const vcDown = get(CSS_VARS.volumeCandleDown);
  const vcWUp = get(CSS_VARS.volumeCandleWickUp);
  const vcWDown = get(CSS_VARS.volumeCandleWickDown);
  if (vcUp || vcDown || vcWUp || vcWDown) {
    seriesDefaults['volume-candle'] = {};
    if (vcUp) seriesDefaults['volume-candle'].upColor = vcUp;
    if (vcDown) seriesDefaults['volume-candle'].downColor = vcDown;
    if (vcWUp) seriesDefaults['volume-candle'].wickUpColor = vcWUp;
    if (vcWDown) seriesDefaults['volume-candle'].wickDownColor = vcWDown;
  }

  // Histogram
  const histUp = get(CSS_VARS.histogramUp);
  const histDown = get(CSS_VARS.histogramDown);
  if (histUp || histDown) {
    seriesDefaults.histogram = {};
    if (histUp) seriesDefaults.histogram.upColor = histUp;
    if (histDown) seriesDefaults.histogram.downColor = histDown;
  }

  // Baseline Delta Mountain
  const bdmTL = get(CSS_VARS.bdmTopLine);
  const bdmTF = get(CSS_VARS.bdmTopFill);
  const bdmBL = get(CSS_VARS.bdmBottomLine);
  const bdmBF = get(CSS_VARS.bdmBottomFill);
  if (bdmTL || bdmTF || bdmBL || bdmBF) {
    seriesDefaults['baseline-delta-mountain'] = {};
    if (bdmTL) seriesDefaults['baseline-delta-mountain'].topLineColor = bdmTL;
    if (bdmTF) seriesDefaults['baseline-delta-mountain'].topFillColor = bdmTF;
    if (bdmBL) seriesDefaults['baseline-delta-mountain'].bottomLineColor = bdmBL;
    if (bdmBF) seriesDefaults['baseline-delta-mountain'].bottomFillColor = bdmBF;
  }

  // Renko
  const rkUp = get(CSS_VARS.renkoUp);
  const rkDown = get(CSS_VARS.renkoDown);
  if (rkUp || rkDown) {
    seriesDefaults.renko = {};
    if (rkUp) seriesDefaults.renko.upColor = rkUp;
    if (rkDown) seriesDefaults.renko.downColor = rkDown;
  }

  // Kagi
  const kYang = get(CSS_VARS.kagiYang);
  const kYin = get(CSS_VARS.kagiYin);
  if (kYang || kYin) {
    seriesDefaults.kagi = {};
    if (kYang) seriesDefaults.kagi.yangColor = kYang;
    if (kYin) seriesDefaults.kagi.yinColor = kYin;
  }

  // Line Break
  const lbUp = get(CSS_VARS.lineBreakUp);
  const lbDown = get(CSS_VARS.lineBreakDown);
  if (lbUp || lbDown) {
    seriesDefaults['line-break'] = {};
    if (lbUp) seriesDefaults['line-break'].upColor = lbUp;
    if (lbDown) seriesDefaults['line-break'].downColor = lbDown;
  }

  // Point & Figure
  const pfUp = get(CSS_VARS.pointFigureUp);
  const pfDown = get(CSS_VARS.pointFigureDown);
  if (pfUp || pfDown) {
    seriesDefaults['point-figure'] = {};
    if (pfUp) seriesDefaults['point-figure'].upColor = pfUp;
    if (pfDown) seriesDefaults['point-figure'].downColor = pfDown;
  }

  // Last Price Line
  const lpUp = get(CSS_VARS.lastPriceUp);
  const lpDown = get(CSS_VARS.lastPriceDown);
  if (lpUp || lpDown) {
    seriesDefaults.lastPriceLine = {};
    if (lpUp) seriesDefaults.lastPriceLine.upColor = lpUp;
    if (lpDown) seriesDefaults.lastPriceLine.downColor = lpDown;
  }

  // Band Fill
  const bf = get(CSS_VARS.bandFill);
  if (bf) seriesDefaults.bandFill = { color: bf };

  return { chartOptions: opts, seriesDefaults };
}
```

Note: The existing `readCSSTheme` return type changes from `DeepPartial<ChartOptions>` to `CSSThemeResult`. This is a breaking change for consumers who call `readCSSTheme()` directly. Add a note in the doc.

- [ ] **Step 3: Write tests for the expanded readCSSTheme**

Add to `tests/core/css-theme.test.ts`:

```typescript
describe('readCSSTheme (series defaults)', () => {
  it('reads candlestick body/wick/border CSS variables', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-candle-body-up', '#11ff11');
    el.style.setProperty('--fc-candle-wick-down', '#ff1111');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.candlestick?.upColor).toBe('#11ff11');
    expect(seriesDefaults.candlestick?.wickDownColor).toBe('#ff1111');

    document.body.removeChild(el);
  });

  it('falls back to --fc-candle-up when --fc-candle-body-up is not set', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-candle-up', '#aabbcc');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.candlestick?.upColor).toBe('#aabbcc');

    document.body.removeChild(el);
  });

  it('--fc-candle-body-up takes priority over --fc-candle-up', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-candle-up', '#old');
    el.style.setProperty('--fc-candle-body-up', '#new');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.candlestick?.upColor).toBe('#new');

    document.body.removeChild(el);
  });

  it('reads bar up/down CSS variables', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-bar-up', '#00ff00');
    el.style.setProperty('--fc-bar-down', '#ff0000');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.bar?.upColor).toBe('#00ff00');
    expect(seriesDefaults.bar?.downColor).toBe('#ff0000');

    document.body.removeChild(el);
  });

  it('reads last price line CSS variables', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('--fc-last-price-up', '#00ff00');
    el.style.setProperty('--fc-last-price-down', '#ff0000');

    const { seriesDefaults } = readCSSTheme(el);
    expect(seriesDefaults.lastPriceLine?.upColor).toBe('#00ff00');
    expect(seriesDefaults.lastPriceLine?.downColor).toBe('#ff0000');

    document.body.removeChild(el);
  });

  it('returns empty seriesDefaults when no CSS vars set', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const { seriesDefaults } = readCSSTheme(el);
    expect(Object.keys(seriesDefaults)).toHaveLength(0);

    document.body.removeChild(el);
  });
});
```

- [ ] **Step 4: Update existing tests for the new return type**

The existing `readCSSTheme` tests access the return value directly as `DeepPartial<ChartOptions>`. Update them to access `.chartOptions`:

```typescript
// Old:
const theme = readCSSTheme(el);
expect(theme.layout?.backgroundColor).toBe('#1a1a2e');

// New:
const { chartOptions } = readCSSTheme(el);
expect(chartOptions.layout?.backgroundColor).toBe('#1a1a2e');
```

Update both existing `readCSSTheme` tests.

- [ ] **Step 5: Run tests**

Run: `npm test -- --run tests/core/css-theme.test.ts`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/core/css-theme.ts tests/core/css-theme.test.ts
git commit -m "feat: expand readCSSTheme to return CSSSeriesDefaults for all series types"
```

---

### Task 3: Export new types and update public API

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Export the new types**

In `src/index.ts`, find the existing CSS theme export line:

```typescript
export { CSS_VARS, readCSSTheme, generateCSSTheme, applyCSSTheme } from './core/css-theme';
```

Add the type exports:

```typescript
export { CSS_VARS, readCSSTheme, generateCSSTheme, applyCSSTheme } from './core/css-theme';
export type { CSSSeriesDefaults, CSSThemeResult } from './core/css-theme';
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: export CSSSeriesDefaults and CSSThemeResult types"
```

---

### Task 4: Store CSS series defaults on ChartImpl and merge in _addSeries

**Files:**
- Modify: `src/api/chart-api.ts`

- [ ] **Step 1: Add CSS defaults storage and reading**

In `src/api/chart-api.ts`, add an import for the new types:

```typescript
import { readCSSTheme } from '../core/css-theme';
import type { CSSSeriesDefaults } from '../core/css-theme';
```

Add a private field to ChartImpl (near the other private fields, around line 450):

```typescript
private _cssSeriesDefaults: CSSSeriesDefaults = {};
```

- [ ] **Step 2: Read CSS vars on chart creation**

In the constructor, after the container is set up and the wrapper is appended to the container (after `this._container.appendChild(this._wrapper);`), add:

```typescript
    // Read CSS design tokens from the container for series defaults
    this._readCSSDefaults();
```

Add the private method:

```typescript
  private _readCSSDefaults(): void {
    try {
      const { seriesDefaults } = readCSSTheme(this._container);
      this._cssSeriesDefaults = seriesDefaults;
    } catch {
      // Container may not be in the DOM yet — defaults will be empty
      this._cssSeriesDefaults = {};
    }
  }
```

- [ ] **Step 3: Re-read CSS vars on applyOptions**

In the `applyOptions()` method, after the existing options merge logic, add:

```typescript
    // Re-read CSS design tokens in case CSS classes changed
    this._readCSSDefaults();
```

- [ ] **Step 4: Add public refreshCSSTheme method**

Add to the IChartApi interface:

```typescript
  refreshCSSTheme(): void;
```

And the implementation:

```typescript
  refreshCSSTheme(): void {
    this._readCSSDefaults();
    this.requestRepaint(InvalidationLevel.Full);
  }
```

- [ ] **Step 5: Merge CSS defaults in _addSeries**

In `_addSeries()` (around line 4074), the consumer's options are in the `options` parameter. Before passing to `_createRenderer`, merge CSS defaults under the explicit options. Change:

```typescript
  private _addSeries<T extends SeriesType>(
    type: T,
    options: DeepPartial<SeriesOptionsMap[T]>,
    _internal: boolean = false,
  ): ISeriesApi<T> {
    const dataLayer = new DataLayer();
    const resolvedOptions = (options ?? {}) as SeriesOptionsMap[T];
```

To:

```typescript
  private _addSeries<T extends SeriesType>(
    type: T,
    options: DeepPartial<SeriesOptionsMap[T]>,
    _internal: boolean = false,
  ): ISeriesApi<T> {
    const dataLayer = new DataLayer();

    // Merge CSS design token defaults under explicit options.
    // Priority: explicit JS options > CSS variables > built-in renderer defaults
    const cssDefaults = this._getCSSDefaultsForType(type);
    const mergedOptions = cssDefaults
      ? { ...cssDefaults, ...(options ?? {}) } as SeriesOptionsMap[T]
      : (options ?? {}) as SeriesOptionsMap[T];
    const resolvedOptions = mergedOptions;
```

Then update all subsequent references in the method from `options` to `resolvedOptions` where they were using the raw options. The key lines to update:

```typescript
    const renderer = this._createRenderer(type, resolvedOptions as unknown as Record<string, unknown>);
    const api = new SeriesApi<T>(type, dataLayer, pane.priceScale, resolvedOptions, () =>
```

(These already use `resolvedOptions` so no change needed.)

- [ ] **Step 6: Add `_getCSSDefaultsForType` helper**

```typescript
  private _getCSSDefaultsForType(type: SeriesType): Record<string, unknown> | null {
    const d = this._cssSeriesDefaults;
    switch (type) {
      case 'candlestick':
      case 'heikin-ashi':
        return d.candlestick ? { ...d.candlestick } : null;
      case 'bar':
        return d.bar ? { ...d.bar } : null;
      case 'baseline':
        return d.baseline ? { ...d.baseline } : null;
      case 'hollow-candle':
        return d['hollow-candle'] ? { ...d['hollow-candle'] } : null;
      case 'line':
        return d.line ? { ...d.line } : null;
      case 'area':
        return d.area ? { ...d.area } : null;
      case 'histogram':
        return d.histogram ? { ...d.histogram } : null;
      case 'step-line':
        return d['step-line'] ? { ...d['step-line'] } : null;
      case 'colored-line':
        return d['colored-line'] ? { ...d['colored-line'] } : null;
      case 'colored-mountain':
        return d['colored-mountain'] ? { ...d['colored-mountain'] } : null;
      case 'hlc-area':
        return d['hlc-area'] ? { ...d['hlc-area'] } : null;
      case 'high-low':
        return d['high-low'] ? { ...d['high-low'] } : null;
      case 'column':
        return d.column ? { ...d.column } : null;
      case 'volume-candle':
        return d['volume-candle'] ? { ...d['volume-candle'] } : null;
      case 'baseline-delta-mountain':
        return d['baseline-delta-mountain'] ? { ...d['baseline-delta-mountain'] } : null;
      case 'renko':
        return d.renko ? { ...d.renko } : null;
      case 'kagi':
        return d.kagi ? { ...d.kagi } : null;
      case 'line-break':
        return d['line-break'] ? { ...d['line-break'] } : null;
      case 'point-figure':
        return d['point-figure'] ? { ...d['point-figure'] } : null;
      default:
        return null;
    }
  }
```

- [ ] **Step 7: Apply CSS defaults to last price line**

In `_paintPane()`, find the last price line drawing (around line 2585):

```typescript
      const lineColor = isUp ? '#00E396' : '#FF3B5C';
```

Replace with:

```typescript
      const lpDefaults = this._cssSeriesDefaults.lastPriceLine;
      const lineColor = isUp
        ? (lpDefaults?.upColor ?? '#00E396')
        : (lpDefaults?.downColor ?? '#FF3B5C');
```

- [ ] **Step 8: Apply CSS defaults to band fill**

In `_createIndicatorSeries()`, find where `bandFillColor` is set. Add CSS fallback:

```typescript
      indicator.bandFillColor = indicator.options().bandFillColor
        ?? this._cssSeriesDefaults.bandFill?.color
        ?? defaultFill;
```

- [ ] **Step 9: Build and test**

Run: `npm run build && npm test`
Expected: All tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/api/chart-api.ts
git commit -m "feat: store CSS series defaults on chart, merge in _addSeries with priority resolution"
```

---

### Task 5: Create Storybook CSS Design Tokens documentation page

**Files:**
- Create: `stories/Docs/CSSDesignTokens.mdx`

- [ ] **Step 1: Create the documentation page**

Create `stories/Docs/CSSDesignTokens.mdx` with:
- Introduction explaining the three-tier priority (JS > CSS > defaults)
- Searchable table of all ~70 variables grouped by category
- Each row: variable name, default value, description
- Live theming example
- Backward compatibility note
- `refreshCSSTheme()` API reference

The full content is extensive — the subagent should create a complete MDX file with all variables from the spec's catalog, organized by category with a code example showing CSS-only theming.

- [ ] **Step 2: Build storybook**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add stories/Docs/CSSDesignTokens.mdx
git commit -m "docs: add searchable CSS Design Tokens reference page"
```

---

### Task 6: Update existing CSSTheming.mdx

**Files:**
- Modify: `stories/Docs/CSSTheming.mdx`

- [ ] **Step 1: Update to reference new design tokens page and new return type**

Update the `readCSSTheme` section to show the new `CSSThemeResult` return type:

```typescript
const { chartOptions, seriesDefaults } = readCSSTheme(container);
const chart = createChart(container, {
  autoSize: true,
  ...chartOptions,
});
```

Add a note linking to the CSS Design Tokens page for the full variable reference.

Update the example CSS block to show the new grouped variable names alongside the old ones.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Commit**

```bash
git add stories/Docs/CSSTheming.mdx
git commit -m "docs: update CSSTheming page for new return type and design tokens"
```

---

### Task 7: Run Full Test Suite and Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All 1478+ tests pass.

- [ ] **Step 2: Build library**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Build dev app**

Run: `npx vite build --config dev/vite.config.ts`
Expected: Success.

- [ ] **Step 4: Verify in storybook**

Run: `npm run storybook`

Verify:
1. **Docs > CSS Design Tokens** — new page shows searchable variable reference
2. **Docs > CSS Theming** — updated examples work
3. **All chart type stories** — no regression (CSS vars not set = use built-in defaults)

- [ ] **Step 5: Commit if any fixups needed**

```bash
git add -A
git commit -m "fix: address any issues found during final verification"
```
