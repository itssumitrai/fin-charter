# CSS Design Tokens for Chart Customization — Design Spec

## Overview

Expand the existing `--fc-*` CSS variable system to cover every visual color in the chart — all 20 series types, volume, indicators, last price line, and band fills. CSS variables act as the middle layer in a three-tier resolution: **explicit JS options > CSS variables > built-in defaults**. Only explicitly passed JS options override CSS; if a consumer calls `addSeries({ type: 'candlestick' })` without specifying colors, CSS variables apply. Add a searchable Storybook documentation page listing every variable.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Chart + series defaults | Covers useful customization without over-engineering |
| Naming | Grouped by component | `--fc-candle-body-up`, `--fc-candle-wick-up`, etc. |
| Priority | Explicit JS > CSS > defaults | Only explicitly passed options override CSS |
| Integration | Chart reads CSS once, caches | Performant, keeps renderers simple |
| Backward compat | Old vars alias to new | `--fc-candle-up` → `--fc-candle-body-up` |

## Priority Resolution

When a series is created or options are applied:

```
1. Check: was this option explicitly passed in JS?  → use it
2. Check: is the CSS variable set on the container?  → use it
3. Fall back to built-in default
```

"Explicitly passed" means the key is present in the options object the consumer provided, not that it matches the default value. The chart tracks which options were explicitly set vs which are defaults.

## Implementation Architecture

### Reading CSS Variables

Expand `readCSSTheme()` in `src/core/css-theme.ts` to read all new variables. The function returns a `CSSThemeResult` with two sections:

```typescript
interface CSSThemeResult {
  chartOptions: DeepPartial<ChartOptions>;      // existing: layout, grid, crosshair, volume, watermark
  seriesDefaults: CSSSeriesDefaults;            // new: per-series-type color defaults
}

interface CSSSeriesDefaults {
  candlestick?: Partial<CandlestickRendererOptions>;
  bar?: Partial<BarOHLCRendererOptions>;
  baseline?: Partial<BaselineRendererOptions>;
  'hollow-candle'?: Partial<HollowCandleRendererOptions>;
  line?: Partial<LineRendererOptions>;
  area?: Partial<AreaRendererOptions>;
  histogram?: Partial<HistogramRendererOptions>;
  'step-line'?: Partial<StepLineRendererOptions>;
  'colored-line'?: Partial<ColoredLineRendererOptions>;
  'colored-mountain'?: Partial<ColoredMountainRendererOptions>;
  'hlc-area'?: Partial<HLCAreaRendererOptions>;
  'high-low'?: Partial<HighLowRendererOptions>;
  column?: Partial<ColumnRendererOptions>;
  'volume-candle'?: Partial<VolumeCandleRendererOptions>;
  'baseline-delta-mountain'?: Partial<BaselineDeltaMountainRendererOptions>;
  renko?: Partial<RenkoRendererOptions>;
  kagi?: Partial<KagiRendererOptions>;
  'line-break'?: Partial<LineBreakRendererOptions>;
  'point-figure'?: Partial<PointFigureRendererOptions>;
  lastPriceLine?: { upColor?: string; downColor?: string };
  bandFill?: { color?: string };
}
```

### Caching on the Chart

`ChartImpl` stores the CSS-derived defaults:

```typescript
private _cssSeriesDefaults: CSSSeriesDefaults = {};
```

This is populated:
- On chart creation (in constructor, after DOM mount)
- On `applyOptions()` (re-reads CSS in case classes changed)
- On a new public method `refreshCSSTheme()` for explicit re-reads

### Applying Defaults to Series

In `_addSeries()`, before merging with renderer defaults, merge CSS defaults under explicit options:

```
renderer defaults  ←  CSS series defaults  ←  explicit options
```

Only options NOT present in the explicit options object get the CSS value. The chart passes the consumer's raw options object (before merging with defaults) to distinguish explicit from default.

### Backward Compatibility

The old `--fc-candle-up` / `--fc-candle-down` variables continue to work. In `readCSSTheme()`:
- If `--fc-candle-body-up` is set, use it
- Else if `--fc-candle-up` is set, use it as the body color
- Same for `--fc-candle-body-down` / `--fc-candle-down`

## Complete CSS Variable Catalog

### Layout (existing)

| Variable | Default | Description |
|---|---|---|
| `--fc-bg` | `#1a1a2e` | Chart background color |
| `--fc-text` | `#d1d4dc` | Text/label color |
| `--fc-font-size` | `11` | Font size (px) |
| `--fc-font-family` | system font stack | Font family |

### Grid (existing)

| Variable | Default | Description |
|---|---|---|
| `--fc-grid-horz-color` | `rgba(255,255,255,0.06)` | Horizontal grid lines |
| `--fc-grid-vert-color` | `rgba(255,255,255,0.06)` | Vertical grid lines |

### Crosshair (existing)

| Variable | Default | Description |
|---|---|---|
| `--fc-crosshair-vert-color` | `#758696` | Vertical crosshair line |
| `--fc-crosshair-horz-color` | `#758696` | Horizontal crosshair line |

### Candlestick (expanded)

| Variable | Default | Description |
|---|---|---|
| `--fc-candle-body-up` | `#00E396` | Bullish candle body fill |
| `--fc-candle-body-down` | `#FF3B5C` | Bearish candle body fill |
| `--fc-candle-wick-up` | `#00E396` | Bullish wick color |
| `--fc-candle-wick-down` | `#FF3B5C` | Bearish wick color |
| `--fc-candle-border-up` | `#00E396` | Bullish body border |
| `--fc-candle-border-down` | `#FF3B5C` | Bearish body border |

Backward compat: `--fc-candle-up` aliases `--fc-candle-body-up`, `--fc-candle-down` aliases `--fc-candle-body-down`.

### Bar (OHLC) (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-bar-up` | `#00E396` | Bullish bar color |
| `--fc-bar-down` | `#FF3B5C` | Bearish bar color |

### Baseline (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-baseline-top-line` | `#00E396` | Above-base line color |
| `--fc-baseline-top-fill` | `rgba(0,227,150,0.28)` | Above-base fill |
| `--fc-baseline-bottom-line` | `#FF3B5C` | Below-base line color |
| `--fc-baseline-bottom-fill` | `rgba(255,59,92,0.28)` | Below-base fill |

### Hollow Candle (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-hollow-candle-up` | `#00E396` | Bullish hollow outline |
| `--fc-hollow-candle-down` | `#FF3B5C` | Bearish filled body |
| `--fc-hollow-candle-wick` | `#737375` | Wick color |

### Line (existing)

| Variable | Default | Description |
|---|---|---|
| `--fc-line-color` | `#2196F3` | Line series color |

### Area (existing)

| Variable | Default | Description |
|---|---|---|
| `--fc-area-line` | `#2196F3` | Area line color |
| `--fc-area-top` | `rgba(33,150,243,0.4)` | Area gradient top |
| `--fc-area-bottom` | `rgba(33,150,243,0)` | Area gradient bottom |

### Step Line (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-step-line-color` | `#2196F3` | Step line color |

### Colored Line (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-colored-line-up` | `#00E396` | Rising segment color |
| `--fc-colored-line-down` | `#FF3B5C` | Falling segment color |

### Colored Mountain (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-colored-mountain-up` | `#00E396` | Rising line color |
| `--fc-colored-mountain-down` | `#FF3B5C` | Falling line color |
| `--fc-colored-mountain-fill-up` | `rgba(0,227,150,0.28)` | Rising fill |
| `--fc-colored-mountain-fill-down` | `rgba(255,59,92,0.28)` | Falling fill |

### HLC Area (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-hlc-area-high` | `#00E396` | High line color |
| `--fc-hlc-area-low` | `#FF3B5C` | Low line color |
| `--fc-hlc-area-fill` | `rgba(33,150,243,0.2)` | Fill between high/low |

### High-Low (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-high-low-up` | `#00E396` | Bullish range bar |
| `--fc-high-low-down` | `#FF3B5C` | Bearish range bar |

### Column (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-column-up` | `#00E396` | Bullish column |
| `--fc-column-down` | `#FF3B5C` | Bearish column |

### Volume Candle (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-volume-candle-up` | `#00E396` | Bullish body |
| `--fc-volume-candle-down` | `#FF3B5C` | Bearish body |
| `--fc-volume-candle-wick-up` | `#00E396` | Bullish wick |
| `--fc-volume-candle-wick-down` | `#FF3B5C` | Bearish wick |

### Histogram (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-histogram-up` | `rgba(0,227,150,0.5)` | Bullish histogram bar |
| `--fc-histogram-down` | `rgba(255,59,92,0.5)` | Bearish histogram bar |

### Baseline Delta Mountain (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-bdm-top-line` | `#00E396` | Above-base line |
| `--fc-bdm-top-fill` | `rgba(0,227,150,0.56)` | Above-base fill |
| `--fc-bdm-bottom-line` | `#FF3B5C` | Below-base line |
| `--fc-bdm-bottom-fill` | `rgba(255,59,92,0.56)` | Below-base fill |

### Renko (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-renko-up` | `#00E396` | Bullish brick |
| `--fc-renko-down` | `#FF3B5C` | Bearish brick |

### Kagi (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-kagi-yang` | `#00E396` | Yang (bullish) line |
| `--fc-kagi-yin` | `#FF3B5C` | Yin (bearish) line |

### Line Break (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-line-break-up` | `#00E396` | Bullish block |
| `--fc-line-break-down` | `#FF3B5C` | Bearish block |

### Point & Figure (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-point-figure-up` | `#00E396` | X column (rising) |
| `--fc-point-figure-down` | `#FF3B5C` | O column (falling) |

### Volume Overlay (existing)

| Variable | Default | Description |
|---|---|---|
| `--fc-volume-up` | `rgba(0,227,150,0.24)` | Bullish volume bar |
| `--fc-volume-down` | `rgba(255,59,92,0.24)` | Bearish volume bar |

### Last Price Line (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-last-price-up` | `#00E396` | Bullish last price line |
| `--fc-last-price-down` | `#FF3B5C` | Bearish last price line |

### Band Indicators (new)

| Variable | Default | Description |
|---|---|---|
| `--fc-band-fill` | `rgba(66,165,245,0.08)` | Default band fill (bollinger/keltner/donchian/ichimoku) |

### Watermark (existing)

| Variable | Default | Description |
|---|---|---|
| `--fc-watermark-color` | `rgba(255,255,255,0.06)` | Watermark text color |

**Total: ~70 CSS variables** (17 existing + ~53 new)

## Files to Modify

| File | Changes |
|---|---|
| `src/core/css-theme.ts` | Expand `CSS_VARS`, update `readCSSTheme()` to return `CSSThemeResult` with `seriesDefaults`, update `generateCSSTheme()`/`applyCSSTheme()` |
| `src/api/chart-api.ts` | Store `_cssSeriesDefaults`, read on create/applyOptions, merge in `_addSeries()`, add `refreshCSSTheme()` |
| `src/api/chart-api.ts` | Update last price line drawing to use CSS vars |
| `src/api/chart-api.ts` | Update band fill to use CSS var default |
| `stories/Docs/CSSDesignTokens.mdx` | New doc page: searchable variable reference with live example |
| `stories/Docs/CSSTheming.mdx` | Update to reference the new design tokens page |
| `tests/core/css-theme.test.ts` | Tests for expanded readCSSTheme and backward compat |

## Storybook Documentation Page

New page: **Docs/CSS Design Tokens**

Content:
- Introduction: how CSS variables work with fin-charter, priority order
- Searchable/filterable table of every `--fc-*` variable grouped by category
- Each row: variable name, default value, description, category
- Live example: a chart themed entirely via CSS variables
- Code snippet showing CSS-only theming
- Note on backward compatibility (`--fc-candle-up` → `--fc-candle-body-up`)

## Out of Scope

- Toolbar/HUD/UI component tokens (those already have their own `--fc-toolbar-*` vars in Svelte components)
- Per-indicator color tokens (indicators use the `colors` option or inherit from series)
- Animation/transition tokens
- Spacing/sizing tokens
