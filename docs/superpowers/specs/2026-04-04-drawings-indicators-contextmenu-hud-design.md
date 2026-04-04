# Drawing Tools, Indicators, Context Menu, HUD Redesign & API Unification

**Date**: 2026-04-04
**Scope**: Tier 1 feature expansion — new drawings, new indicators, context menu, HUD redesign, unified series API, docs/stories update, bundle size recording

---

## 1. Unified `addSeries()` API

### Problem

8 separate methods (`addCandlestickSeries()`, `addLineSeries()`, etc.) that all delegate to `_addSeries()`. Verbose, hard to discover, requires new public method per type.

### Design

Add a single `addSeries(options)` method using a discriminated union on `type`:

```typescript
// New unified API
const series = chart.addSeries({ type: 'candlestick', upColor: '#22AB94' });
const line = chart.addSeries({ type: 'line', color: '#2196F3' });

// Type-safe via discriminated union
type SeriesOptions =
  | ({ type: 'candlestick' } & Partial<CandlestickSeriesOptions>)
  | ({ type: 'line' } & Partial<LineSeriesOptions>)
  | ({ type: 'area' } & Partial<AreaSeriesOptions>)
  | ({ type: 'bar' } & Partial<BarSeriesOptions>)
  | ({ type: 'baseline' } & Partial<BaselineSeriesOptions>)
  | ({ type: 'hollow-candle' } & Partial<HollowCandleSeriesOptions>)
  | ({ type: 'histogram' } & Partial<HistogramSeriesOptions>)
  | ({ type: 'heikin-ashi' } & Partial<CandlestickSeriesOptions>);
```

**Backward compatibility**: Keep the old `addCandlestickSeries()` etc. methods but mark them `@deprecated` in JSDoc. They become one-line wrappers around `addSeries()`. No breaking change.

### Return type

`addSeries()` returns `ISeriesApi<SeriesType>`. The generic parameter is inferred from the discriminated `type` field.

---

## 2. New Drawing Tools (10 additions)

### Existing (6)

horizontal-line, vertical-line, trendline, rectangle, fibonacci, text-annotation

### New Tools

Each extends `BaseDrawing`, implements `_createPaneView()` and `_hitTestDrawing()`, and registers in `DRAWING_REGISTRY`.

| Tool | File | Points | Hit-test approach | Render description |
|------|------|--------|------|------|
| **ray** | `ray.ts` | 2 | `distToSegment` on extended line (clip to chart bounds) | Line from p1 through p2, extending to chart edge |
| **arrow** | `arrow.ts` | 2 | `distToSegment` + triangle hit-test at tip | Line with arrowhead triangle at p2 |
| **channel** | `channel.ts` | 3 | `distToSegment` on two parallel lines + fill rect | Two parallel trendlines with optional fill between |
| **ellipse** | `ellipse.ts` | 2 | Point-in-ellipse formula | Ellipse inscribed in bounding box defined by p1, p2 |
| **pitchfork** | `pitchfork.ts` | 3 | `distToSegment` on median + two tines | Andrew's pitchfork: median line from p1 through midpoint(p2,p3), parallel lines through p2 and p3 |
| **fib-projection** | `fib-projection.ts` | 3 | `distToSegment` on each level line | 3-point: project fib ratios from p1-p2 move onto p3 baseline. Levels: 0%, 61.8%, 100%, 161.8%, 261.8% |
| **fib-arc** | `fib-arc.ts` | 2 | Distance to each arc path | Semi-circular arcs at fib ratios of p1-p2 distance, centered on p2. Ratios: 23.6%, 38.2%, 50%, 61.8% |
| **fib-fan** | `fib-fan.ts` | 2 | `distToSegment` on each fan line | Lines from p1 through fib ratio points on vertical at p2. Ratios: 23.6%, 38.2%, 50%, 61.8%, 78.6% |
| **crossline** | `crossline.ts` | 1 | Distance to horizontal or vertical line | Horizontal + vertical line through one point (crosshair marker) |
| **measurement** | `measurement.ts` | 2 | `pointInRect` on label area + `distToSegment` on connector | Dashed connector between p1 and p2 with info label showing: price change, % change, bar count |

### Drawing options extensions

`DrawingOptions` gains an optional `showLabels?: boolean` field (for measurement, fib tools).

### Registration

Each new tool exports a `createXxx()` factory. `registerBuiltinDrawings()` in `src/drawings/index.ts` registers all 16 tools.

### DrawingHitTestResult extension

Add `'handle3'` to the `part` union for 3-point drawings (channel, pitchfork, fib-projection):

```typescript
part: 'body' | 'handle1' | 'handle2' | 'handle3' | 'edge';
```

### DrawingHandler changes

The `DrawingHandler` state machine already supports multi-point placement (`requiredPoints`). For 3-point tools, placement continues until the third click finalizes. No structural change needed — just ensure the `PLACING` state counts clicks up to `requiredPoints`.

---

## 3. New Technical Indicators (12 additions)

### Existing (18)

SMA, EMA, VWAP, RSI, MACD, Bollinger, ATR, ADX, OBV, Williams %R, Stochastic, Ichimoku, Parabolic SAR, Keltner, Donchian, CCI, Pivot Points, Volume

### New Indicators

Each is a pure `compute*()` function in `src/indicators/` returning `Float64Array` or a typed result object. Chart-api wires them into `addIndicator()`.

| Indicator | File | Pane | Outputs | Default params | Formula summary |
|-----------|------|------|---------|----------------|-----------------|
| **Aroon** | `aroon.ts` | Separate | Aroon Up (line), Aroon Down (line) | period=25 | Up = ((period - bars since highest high) / period) * 100; Down = same for lowest low |
| **Awesome Oscillator** | `awesome-oscillator.ts` | Separate | Histogram (green/red) | fast=5, slow=34 | SMA(median, fast) - SMA(median, slow); median = (high+low)/2 |
| **Chaikin Money Flow** | `chaikin-mf.ts` | Separate | Single line | period=20 | Sum(MFV, period) / Sum(volume, period); MFV = ((close-low)-(high-close))/(high-low) * volume |
| **Coppock Curve** | `coppock.ts` | Separate | Single line | wma=10, longROC=14, shortROC=11 | WMA(ROC(close, longROC) + ROC(close, shortROC), wma) |
| **Elder Force Index** | `elder-force.ts` | Separate | Single line | period=13 | EMA((close - prevClose) * volume, period) |
| **TRIX** | `trix.ts` | Separate | Line + signal | period=15, signal=9 | Rate of change of triple-smoothed EMA; signal = EMA(trix, signal) |
| **Supertrend** | `supertrend.ts` | Overlay | Color-changing line | period=10, multiplier=3 | ATR-based trailing stop that flips direction on price cross |
| **VWMA** | `vwma.ts` | Overlay | Single line | period=20 | Sum(close * volume, period) / Sum(volume, period) |
| **Choppiness Index** | `choppiness.ts` | Separate | Single line (0-100) | period=14 | 100 * LOG10(Sum(ATR,period) / (highest-high - lowest-low)) / LOG10(period); zones at 38.2 and 61.8 |
| **MFI** | `mfi.ts` | Separate | Single line (0-100) | period=14 | Like RSI but uses typical price * volume instead of close; overbought=80, oversold=20 |
| **ROC** | `roc.ts` | Separate | Single line | period=12 | ((close - close[n periods ago]) / close[n periods ago]) * 100 |
| **Linear Regression** | `linear-regression.ts` | Overlay | Single line | period=20 | Least-squares regression line over rolling window |

### IndicatorType extension

Add all 12 new types to the `IndicatorType` union in `src/api/options.ts`.

### Indicator registration

Each indicator is wired into `chart-api.ts`'s `_computeIndicator()` switch statement, following the exact same pattern as existing indicators.

---

## 4. Context Menu

### New files

- `src/ui/context-menu.ts` — DOM-based context menu component
- `src/interactions/context-menu-handler.ts` — handles `contextmenu` event, hit-tests, shows menu

### Context menu component (`context-menu.ts`)

Lightweight DOM popup:

```typescript
interface ContextMenuItem {
  label: string;
  icon?: string;       // SVG path data (MDI icon)
  action: () => void;
  separator?: boolean; // render a divider line before this item
}

function createContextMenu(
  items: ContextMenuItem[],
  position: { x: number; y: number },
  theme: { bg: string; text: string; border: string },
): HTMLDivElement;
```

Styling: dark/light theme-aware, rounded corners, box-shadow, 200px min-width. Each item is a `<div>` with hover highlight. Click triggers action and closes menu. Click outside or Escape closes menu.

### Context menu handler (`context-menu-handler.ts`)

Listens for `contextmenu` event on the chart overlay canvas. Prevents default browser context menu. Hit-tests in order:

1. **Drawing hit**: Uses existing `drawingHitTest()` on all drawings → shows drawing menu
2. **Indicator pane**: If click is in a non-main pane → shows indicator menu
3. **Empty chart**: No hit → shows chart menu

### Menu items by context

**Drawing menu** (right-click on drawing):
| Item | Action |
|------|--------|
| Edit | Select the drawing + open settings popup (reuse existing HUD settings flow) |
| Duplicate | Clone the drawing with offset (+10px right, +10px down) |
| Remove | Delete the drawing |
| --- (separator) | |
| Bring to Front | Move to end of drawings array (renders last = on top) |
| Send to Back | Move to start of drawings array |

**Indicator menu** (right-click in indicator pane):
| Item | Action |
|------|--------|
| Settings | Open indicator settings popup |
| Hide | Toggle indicator visibility |
| Remove | Remove indicator and pane |

**Chart menu** (right-click on empty chart area):
| Item | Action |
|------|--------|
| Reset Zoom | Call `timeScale.fitContent()` |
| Scroll to Latest | Call `scrollToRealTime()` |
| --- (separator) | |
| Toggle Crosshair | Toggle crosshair visibility |

### Integration

The `ContextMenuHandler` is added to the `EventRouter` in `chart-api.ts` constructor. It needs access to:
- `getDrawings()` for hit-testing
- `_series` for pane identification
- `_indicators` for indicator identification
- Chart action methods (`fitContent`, `scrollToRealTime`, etc.)

It does NOT consume pointer events (returns `false` from `onPointerDown` etc.) — it only handles the `contextmenu` event.

### EventRouter extension

Add `onContextMenu(x, y)` to the `EventHandler` interface. `EventRouter` adds a `contextmenu` listener that routes through handlers.

---

## 5. HUD Redesign (TV-style Global Collapse)

### Current behavior

Each HUD row has its own collapse chevron. Collapsing hides that row's values line. No global toggle.

### New behavior

**Global collapse chevron** at the top of each pane's HUD. One click collapses/expands the entire HUD.

**Collapsed state** (per pane):
- Main pane: Shows one compact line: `AAPL  O 182.45  H 183.20  L 181.90  C 182.85`
- Indicator pane: Shows just the indicator label: `RSI 14`
- No per-row controls visible
- No indicator rows visible (main pane only)

**Expanded state** (per pane):
- First row: symbol + OHLC (as today)
- Subsequent rows: each indicator/series with hover controls (eye, gear, X)
- Per-row collapse chevrons are **removed** — only the global chevron exists

**Global sync**: When the main pane HUD is collapsed, all indicator pane HUDs collapse too. Expanding the main pane HUD expands all. Individual indicator pane HUDs can still be collapsed independently.

### Implementation changes to `HudManager`

```typescript
class HudManager {
  // New state
  private _globalCollapsed: boolean = false;

  // New method: collapse all rows, show compact view
  setGlobalCollapsed(collapsed: boolean): void;

  // Global chevron replaces per-row chevrons
  // Per-row chevrons removed
}
```

### DOM structure (redesigned)

```
[▼] AAPL  O 182.45  H 183.20  L 181.90  C 182.85     ← Compact header (always visible)
    ── expanded content (hidden when collapsed) ──
    [●] SMA 20           123.45    [👁] [⚙] [✕]
    [●] Bollinger 20,2   UB LB     [👁] [⚙] [✕]
```

The global chevron is the first element. When collapsed, only the compact header line is visible. When expanded, all indicator rows appear below.

### Cross-pane sync

`ChartApi` holds a `_hudGlobalCollapsed: boolean` flag. When toggled on main pane:
- Iterates all pane HudManagers
- Calls `setGlobalCollapsed(collapsed)` on each

---

## 6. Documentation & Storybook Stories

### Storybook stories

Every new drawing tool and indicator gets a Storybook story with:
- `parameters.docs.source.code` containing a clean code snippet
- At least one visual variant showing the feature in action

Story files:
- `stories/Drawings/NewDrawings.stories.ts` — one story per new drawing tool (ray, arrow, channel, ellipse, pitchfork, fib-projection, fib-arc, fib-fan, crossline, measurement)
- `stories/Indicators/NewIndicators.stories.ts` — one story per new indicator
- `stories/Features/ContextMenu.stories.ts` — demonstrates right-click interactions
- `stories/Features/HudCollapse.stories.ts` — demonstrates TV-style global HUD collapse

### README updates

1. **Bundle size table**: Replace "targets" with actual measured sizes:

| Entry point | Actual (gzip) |
|---|---|
| `fin-charter` (core only) | ~12.8 KB |
| `fin-charter/indicators` (all) | ~11.7 KB |
| Core + 3 indicators (SMA, RSI, MACD) | ~14.5 KB |
| Full bundle (everything) | ~29.3 KB |

(Exact numbers measured at build time via a script and recorded.)

2. **Chart Types table**: Update to show unified API: `chart.addSeries({ type: 'candlestick' })` instead of `addCandlestickSeries()`.

3. **Feature list**: Update indicator count (18 → 30), drawing tool count (6 → 16), add context menu and HUD redesign mentions.

4. **Quick Start**: Update to use `addSeries()` API.

### Bundle size measurement

Add an npm script `"size"` that builds, then uses `gzip -c` to measure and print actual sizes of:
- Core entry point + chart-api chunk
- Indicators entry point
- Full bundle (all JS concatenated)

This runs post-build and output is recorded in README.

### Docs updates

- `docs/api-reference.md` — add `addSeries()`, deprecation notes for old methods
- `docs/drawings.md` — add 10 new drawing tools with screenshots
- `docs/indicators.md` — add 12 new indicators with parameter tables

---

## 7. File inventory

### New files (38 total)

**Drawings (10)**:
- `src/drawings/ray.ts`
- `src/drawings/arrow.ts`
- `src/drawings/channel.ts`
- `src/drawings/ellipse.ts`
- `src/drawings/pitchfork.ts`
- `src/drawings/fib-projection.ts`
- `src/drawings/fib-arc.ts`
- `src/drawings/fib-fan.ts`
- `src/drawings/crossline.ts`
- `src/drawings/measurement.ts`

**Indicators (12)**:
- `src/indicators/aroon.ts`
- `src/indicators/awesome-oscillator.ts`
- `src/indicators/chaikin-mf.ts`
- `src/indicators/coppock.ts`
- `src/indicators/elder-force.ts`
- `src/indicators/trix.ts`
- `src/indicators/supertrend.ts`
- `src/indicators/vwma.ts`
- `src/indicators/choppiness.ts`
- `src/indicators/mfi.ts`
- `src/indicators/roc.ts`
- `src/indicators/linear-regression.ts`

**Context menu (2)**:
- `src/ui/context-menu.ts`
- `src/interactions/context-menu-handler.ts`

**Stories (4)**:
- `stories/Drawings/NewDrawings.stories.ts`
- `stories/Indicators/NewIndicators.stories.ts`
- `stories/Features/ContextMenu.stories.ts`
- `stories/Features/HudCollapse.stories.ts`

**Tests (10 — one per new drawing + one per new indicator group)**:
- `tests/drawings/ray.test.ts` (and similar for each drawing)
- `tests/indicators/aroon.test.ts` (and similar for each indicator)

### Modified files

- `src/api/chart-api.ts` — `addSeries()`, context menu integration, HUD sync, indicator wiring
- `src/api/options.ts` — `SeriesOptions` union type, `IndicatorType` extension
- `src/api/series-api.ts` — no structural change (ISeriesApi unchanged)
- `src/drawings/index.ts` — register 10 new drawings
- `src/drawings/base.ts` — `handle3` in hit-test part union
- `src/indicators/index.ts` — export 12 new compute functions
- `src/interactions/event-router.ts` — add `onContextMenu` handler support
- `src/interactions/drawing-handler.ts` — ensure 3-point placement works
- `src/ui/hud.ts` — global collapse redesign, remove per-row chevrons
- `README.md` — bundle sizes, feature counts, unified API
- `docs/api-reference.md`, `docs/drawings.md`, `docs/indicators.md`

---

## 8. Testing strategy

- **Indicator math**: Each new `compute*()` function gets unit tests comparing output against known-good values (calculated independently or from reference implementations in finance-cosaic)
- **Drawing hit-test**: Each new drawing gets hit-test unit tests (point on body, point on handle, point outside)
- **Context menu**: Integration test verifying menu items appear for each context (drawing, indicator pane, empty chart)
- **HUD collapse**: Test global collapse state propagation across panes
- **API**: Test that `addSeries({ type: 'candlestick' })` produces identical result to `addCandlestickSeries()`
- **Build**: Verify tree-shaking still works (importing only core doesn't pull in indicators)

---

## 9. Out of scope

- Tier 2 drawings (freeform, elliott wave, gann fan, volume profile, etc.)
- Tier 2 indicators (60+ niche indicators)
- Drawing persistence to localStorage (already exists via `serializeDrawings()`)
- Undo/redo for drawings
- Drag-and-drop indicator reordering in HUD
