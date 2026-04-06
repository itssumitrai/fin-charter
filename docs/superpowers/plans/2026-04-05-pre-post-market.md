# Pre/Post Market Visual Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the visual rendering layer for pre/post market sessions — background shading, candle opacity, session filtering, toolbar UI, and Yahoo Finance data integration.

**Architecture:** The existing session model (`MarketSession`, `setMarketSessions()`, `setSessionFilter()`) stores state but has no visual effect. This plan adds rendering logic in `_paintPane()` to paint session backgrounds, modulate opacity, and filter bars. A helper function `_getBarSessionInfo()` maps each bar to its session. The toolbar gets a new `SessionFilter.svelte` component.

**Tech Stack:** TypeScript, Canvas 2D, Svelte 5, Yahoo Finance API

---

### Task 1: Update US_EQUITY_SESSIONS Colors

**Files:**
- Modify: `src/core/market-session.ts:11-15`
- Modify: `tests/core/market-session.test.ts` (if it asserts bgColor values)

- [ ] **Step 1: Update the session colors**

In `src/core/market-session.ts`, change the `US_EQUITY_SESSIONS` array:

```typescript
export const US_EQUITY_SESSIONS: MarketSession[] = [
  { id: 'premarket', label: 'PRE', startMinute: 240, endMinute: 570, bgColor: 'rgba(33,150,243,0.06)' },
  { id: 'regular', label: '', startMinute: 570, endMinute: 960, bgColor: 'transparent' },
  { id: 'postmarket', label: 'POST', startMinute: 960, endMinute: 1200, bgColor: 'rgba(255,152,0,0.06)' },
];
```

- [ ] **Step 2: Check tests for hardcoded bgColor assertions**

Run: `grep -n "rgba(255,235,59" tests/core/market-session.test.ts`

If any assertions reference the old color, update them to match the new values. If none, proceed.

- [ ] **Step 3: Run tests**

Run: `npm test -- --run tests/core/market-session.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/core/market-session.ts tests/core/market-session.test.ts
git commit -m "feat: update US_EQUITY_SESSIONS colors (blue pre-market, orange post-market)"
```

---

### Task 2: Add Session Background Shading in _paintPane

**Files:**
- Modify: `src/api/chart-api.ts` — add `_paintSessionBackgrounds()` method and call it from `_paintPane()`

The session background should be painted after the grid but before series, so it appears behind candles but in front of grid lines.

- [ ] **Step 1: Add the `_paintSessionBackgrounds` method**

Add this private method to the `ChartImpl` class in `src/api/chart-api.ts` (near the other `_draw*` methods, around line 3200):

```typescript
private _paintSessionBackgrounds(
  ctx: CanvasRenderingContext2D,
  chartW: number,
  chartH: number,
  range: VisibleRange,
  store: ColumnStore,
  pixelRatio: number,
): void {
  if (this._marketSessions.length === 0) return;
  // Don't shade when filter is 'extended' (shading only serves as contrast against regular)
  if (this._sessionFilter === 'extended') return;

  const timezone = this._options.timezone ?? 'America/New_York';
  const { fromIdx, toIdx } = range;
  const to = Math.min(toIdx, store.length - 1);
  if (fromIdx > to) return;

  ctx.save();

  // Walk through visible bars, coalescing adjacent bars in the same session
  let runStart = fromIdx;
  let runSession: MarketSession | null = null;

  for (let i = fromIdx; i <= to + 1; i++) {
    let session: MarketSession | null = null;
    if (i <= to) {
      const minute = timestampToMinuteOfDay(store.time[i], timezone);
      session = getSessionForTime(minute, this._marketSessions);
    }

    // If session changed (or we're past the end), flush the current run
    if (session?.id !== runSession?.id || i > to) {
      if (runSession && runSession.bgColor && runSession.bgColor !== 'transparent') {
        // Only shade non-regular sessions
        if (runSession.id !== 'regular') {
          const barSpacing = this._timeScale.barSpacing;
          const halfBar = barSpacing / 2;
          const x0 = Math.round((this._timeScale.indexToX(runStart) - halfBar) * pixelRatio);
          const x1 = Math.round((this._timeScale.indexToX(i - 1) + halfBar) * pixelRatio);
          ctx.fillStyle = runSession.bgColor;
          ctx.fillRect(x0, 0, x1 - x0, Math.round(chartH * pixelRatio));
        }
      }
      runStart = i;
      runSession = session;
    }
  }

  ctx.restore();
}
```

- [ ] **Step 2: Add imports at top of chart-api.ts**

At the top of `src/api/chart-api.ts`, add imports from `market-session.ts`:

```typescript
import { timestampToMinuteOfDay, getSessionForTime } from '../core/market-session';
```

Check if these are already imported. If not, add them alongside the existing imports.

- [ ] **Step 3: Call `_paintSessionBackgrounds` from `_paintPane`**

In `_paintPane()` (around line 2420 in `chart-api.ts`), after the grid is drawn but before the series clip/draw, add:

```typescript
    // Session background shading (after grid, before series)
    if (this._marketSessions.length > 0 && primaryStore) {
      this._paintSessionBackgrounds(ctx, chartW, chartH, range, primaryStore, pixelRatio);
    }
```

Insert this right after the `_drawGrid(...)` call and before the `ctx.save()` / clip block.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Success, no type errors.

- [ ] **Step 5: Test with the ExtendedHours story**

Run: `npm run storybook` and navigate to Features > Extended Hours.
Expected: Pre-market bars should have a subtle blue background tint, post-market bars should have an orange tint, regular bars have no tint.

- [ ] **Step 6: Commit**

```bash
git add src/api/chart-api.ts
git commit -m "feat: paint session background shading in pre/post market regions"
```

---

### Task 3: Add Candle Opacity Modulation for Extended Hours

**Files:**
- Modify: `src/api/chart-api.ts` — wrap series and volume drawing with session-aware `globalAlpha`

Rather than modifying each renderer, we split the visible range into contiguous runs of regular vs extended bars, and draw each run with the appropriate `globalAlpha`.

- [ ] **Step 1: Add `_buildSessionRuns` helper method**

Add this private method to `ChartImpl` in `src/api/chart-api.ts`:

```typescript
/**
 * Split the visible range into contiguous runs of bars in the same session category
 * (regular vs extended). Returns an array of { fromIdx, toIdx, isExtended }.
 */
private _buildSessionRuns(
  store: ColumnStore,
  range: VisibleRange,
): Array<{ fromIdx: number; toIdx: number; isExtended: boolean }> {
  if (this._marketSessions.length === 0) {
    return [{ fromIdx: range.fromIdx, toIdx: range.toIdx, isExtended: false }];
  }

  const timezone = this._options.timezone ?? 'America/New_York';
  const to = Math.min(range.toIdx, store.length - 1);
  const runs: Array<{ fromIdx: number; toIdx: number; isExtended: boolean }> = [];

  let runStart = range.fromIdx;
  let runExtended = false;

  for (let i = range.fromIdx; i <= to; i++) {
    const minute = timestampToMinuteOfDay(store.time[i], timezone);
    const session = getSessionForTime(minute, this._marketSessions);
    const isExt = session !== null && session.id !== 'regular';

    if (i === range.fromIdx) {
      runExtended = isExt;
    } else if (isExt !== runExtended) {
      runs.push({ fromIdx: runStart, toIdx: i - 1, isExtended: runExtended });
      runStart = i;
      runExtended = isExt;
    }
  }

  runs.push({ fromIdx: runStart, toIdx: to, isExtended: runExtended });
  return runs;
}
```

- [ ] **Step 2: Modify series drawing in `_paintPane` to use session runs**

In `_paintPane()`, find the block that draws each series (around line 2450):

```typescript
    for (const entry of seriesForPane) {
      if (!entry.api.isVisible()) continue;
      // ...
      this._drawSeries(entry, target, store, range, indexToX, priceToY);
    }
```

Replace it with run-based drawing that modulates `globalAlpha`:

```typescript
    // Build session runs for opacity modulation
    const sessionRuns = (this._marketSessions.length > 0 && primaryStore && this._sessionFilter === 'all')
      ? this._buildSessionRuns(primaryStore, range)
      : [{ fromIdx: range.fromIdx, toIdx: Math.min(range.toIdx, (primaryStore?.length ?? 1) - 1), isExtended: false }];

    for (const entry of seriesForPane) {
      if (!entry.api.isVisible()) continue;

      const rawStore = entry.api.getDataLayer().store;
      const store = this._getEffectiveStore(entry, rawStore);
      let priceToY: (p: number) => number;
      if (this._comparisonMode) {
        const basis = this._getBasisPrice(entry, range);
        priceToY = (price: number) => {
          const pct = basis === 0 ? 0 : ((price - basis) / basis) * 100;
          return pane.priceScale.priceToY(pct);
        };
      } else {
        priceToY = (p: number) => pane.priceScale.priceToY(p);
      }

      // Draw each session run with appropriate opacity
      for (const run of sessionRuns) {
        const runRange = { fromIdx: run.fromIdx, toIdx: run.toIdx };
        if (run.isExtended) {
          ctx.save();
          ctx.globalAlpha = 0.4;
        }
        this._drawSeries(entry, target, store, runRange, indexToX, priceToY);
        if (run.isExtended) {
          ctx.restore();
        }
      }
    }
```

- [ ] **Step 3: Apply opacity to volume overlay**

In `_drawVolumeOverlay()` (around line 3234), add session-aware opacity. After the `ctx.save()` at the start of the bar loop, add a check:

```typescript
    const hasSessionInfo = this._marketSessions.length > 0 && this._sessionFilter === 'all';
    const timezone = this._options.timezone ?? 'America/New_York';

    ctx.save();
    for (let i = range.fromIdx; i <= to; i++) {
      const vol = primaryStore.volume[i];
      if (vol === 0) continue;

      // Reduce opacity for extended hours volume bars
      if (hasSessionInfo) {
        const minute = timestampToMinuteOfDay(primaryStore.time[i], timezone);
        const session = getSessionForTime(minute, this._marketSessions);
        ctx.globalAlpha = (session && session.id !== 'regular') ? 0.4 : 1.0;
      }

      const isUp = primaryStore.close[i] >= primaryStore.open[i];
      ctx.fillStyle = isUp ? volOpts.upColor : volOpts.downColor;
      // ... rest unchanged
```

- [ ] **Step 4: Build and test**

Run: `npm run build`
Expected: Success.

Run storybook, navigate to Features > Extended Hours. Pre/post bars should appear at 40% opacity with blue/orange background shading. Regular bars at full opacity.

- [ ] **Step 5: Commit**

```bash
git add src/api/chart-api.ts
git commit -m "feat: reduce candle and volume opacity for extended hours bars"
```

---

### Task 4: Implement Session Filter Logic (Hide/Show Bars)

**Files:**
- Modify: `src/api/chart-api.ts` — filter bars in `_paintPane()` and `_updatePaneDataRange()`

- [ ] **Step 1: Add `_isBarVisibleForFilter` helper method**

Add to `ChartImpl` class:

```typescript
/**
 * Returns true if the bar at `index` should be visible given the current session filter.
 * When no sessions are configured or filter is 'all', every bar is visible.
 */
private _isBarVisibleForFilter(store: ColumnStore, index: number): boolean {
  if (this._marketSessions.length === 0 || this._sessionFilter === 'all') return true;
  const timezone = this._options.timezone ?? 'America/New_York';
  const minute = timestampToMinuteOfDay(store.time[index], timezone);
  const session = getSessionForTime(minute, this._marketSessions);
  if (!session) return false;
  if (this._sessionFilter === 'regular') return session.id === 'regular';
  if (this._sessionFilter === 'extended') return session.id !== 'regular';
  return true;
}
```

- [ ] **Step 2: Apply filter in `_updatePaneDataRange`**

In `_updatePaneDataRange()` (around line 3092), in both the comparison-mode scan and the linear-scan fallback, add a visibility check. Before processing each bar add:

```typescript
        if (!this._isBarVisibleForFilter(store, i)) continue;
```

Add this line inside:
1. The comparison mode loop (after `for (let i = range.fromIdx; i <= to; i++) {`)
2. The linear scan fallback loop (after `for (let i = range.fromIdx; i <= to; i++) {`)

The segment tree path needs a linear fallback when filtering is active. Before the segment tree block, add a guard:

```typescript
        const useSegTree = store === rawStore
          && dataLayer.segmentTree.length === store.length
          && this._sessionFilter === 'all';  // can't use seg tree when filtering bars
        if (useSegTree) {
```

- [ ] **Step 3: Apply filter in `_paintSessionBackgrounds`**

In `_paintSessionBackgrounds()`, skip bars that don't pass the filter:

```typescript
    if (i <= to) {
      if (!this._isBarVisibleForFilter(store, i)) {
        // Bar filtered out — flush current run and skip
        // (same flush logic as session change)
        ...continue without including this bar
      }
      ...
    }
```

Actually, simpler: background shading is only drawn for 'all' filter mode. For 'regular' there are no extended bars visible, for 'extended' we skip shading per spec. The existing early return `if (this._sessionFilter === 'extended') return;` already handles extended. Add one more early return:

```typescript
  if (this._sessionFilter === 'regular') return; // no extended bars visible, no shading needed
```

- [ ] **Step 4: Apply filter in series drawing**

In the session runs block from Task 3, when the filter is `'regular'` or `'extended'`, filter the runs. Update the `sessionRuns` computation:

```typescript
    const needsFiltering = this._marketSessions.length > 0 && this._sessionFilter !== 'all';
    const sessionRuns = (this._marketSessions.length > 0 && primaryStore)
      ? this._buildSessionRuns(primaryStore, range)
      : [{ fromIdx: range.fromIdx, toIdx: Math.min(range.toIdx, (primaryStore?.length ?? 1) - 1), isExtended: false }];

    // Filter runs based on session filter
    const filteredRuns = needsFiltering
      ? sessionRuns.filter(run => {
          if (this._sessionFilter === 'regular') return !run.isExtended;
          if (this._sessionFilter === 'extended') return run.isExtended;
          return true;
        })
      : sessionRuns;
```

Then use `filteredRuns` instead of `sessionRuns` in the drawing loop. When filter is 'extended', draw at full opacity (no reduction):

```typescript
      for (const run of filteredRuns) {
        const runRange = { fromIdx: run.fromIdx, toIdx: run.toIdx };
        const reduceAlpha = run.isExtended && this._sessionFilter === 'all';
        if (reduceAlpha) {
          ctx.save();
          ctx.globalAlpha = 0.4;
        }
        this._drawSeries(entry, target, store, runRange, indexToX, priceToY);
        if (reduceAlpha) {
          ctx.restore();
        }
      }
```

- [ ] **Step 5: Apply filter in volume overlay**

In `_drawVolumeOverlay`, add the visibility check inside the bar loop:

```typescript
      if (!this._isBarVisibleForFilter(primaryStore, i)) continue;
```

- [ ] **Step 6: Build and test**

Run: `npm run build && npm test`
Expected: All tests pass. Build succeeds.

Storybook > Features > Extended Hours: click "Regular Only" — only regular hours bars visible. Click "Extended" — only pre/post bars visible at full opacity. Click "All Sessions" — all bars with shading + opacity.

- [ ] **Step 7: Commit**

```bash
git add src/api/chart-api.ts
git commit -m "feat: implement session filter to hide/show bars by session type"
```

---

### Task 5: Add Yahoo Finance `includePrePost` Parameter

**Files:**
- Modify: `dev/data/yahoo-finance.ts` — add `includePrePost=true` to intraday fetch URLs

- [ ] **Step 1: Add `isIntradayKey` helper**

Add near the top of `dev/data/yahoo-finance.ts`, after the `periodicityToKey` function:

```typescript
function isIntradayKey(key: string): boolean {
  return key.endsWith('m') || key.endsWith('h');
}
```

- [ ] **Step 2: Update `fetchBars` URL**

In `fetchBars()`, change the URL construction (around line 141):

```typescript
  const prePost = isIntradayKey(key) ? '&includePrePost=true' : '';
  const url = `/api/yahoo/${encodeURIComponent(symbol)}?interval=${config.interval}&range=${config.range}${prePost}`;
```

- [ ] **Step 3: Update `fetchChunk` URL**

In `fetchChunk()`, change the URL construction (around line 226-228):

```typescript
async function fetchChunk(
  symbol: string,
  yahooInterval: string,
  period1: number,
  period2: number,
  beforeTimestamp: number,
  includePrePost: boolean = false,
): Promise<Bar[]> {
  const prePost = includePrePost ? '&includePrePost=true' : '';
  const url =
    `/api/yahoo/${encodeURIComponent(symbol)}?interval=${yahooInterval}` +
    `&period1=${Math.floor(period1)}&period2=${Math.floor(period2)}${prePost}`;
```

- [ ] **Step 4: Pass `includePrePost` from `fetchMoreBars`**

In `fetchMoreBars()`, where `fetchChunk` is called (around line 317), pass the flag:

```typescript
    const chunk = await fetchChunk(symbol, yahooInterval, currentStart, currentEnd, beforeTimestamp, isIntradayKey(key));
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Success.

- [ ] **Step 6: Commit**

```bash
git add dev/data/yahoo-finance.ts
git commit -m "feat: add includePrePost=true to Yahoo Finance intraday requests"
```

---

### Task 6: Add Session Filter to App Store

**Files:**
- Modify: `dev/data/store.svelte.ts`

- [ ] **Step 1: Add sessionFilter state**

In `dev/data/store.svelte.ts`, add the reactive state variable after the other `_state` declarations (around line 71):

```typescript
let _sessionFilter = $state<'all' | 'regular' | 'extended'>('all');
```

- [ ] **Step 2: Add getter/setter to appStore**

Add to the `appStore` object (before the closing `};`):

```typescript
  get sessionFilter() { return _sessionFilter; },
  set sessionFilter(v: 'all' | 'regular' | 'extended') { _sessionFilter = v; },
```

- [ ] **Step 3: Commit**

```bash
git add dev/data/store.svelte.ts
git commit -m "feat: add sessionFilter to appStore"
```

---

### Task 7: Create SessionFilter Toolbar Component

**Files:**
- Create: `dev/components/Toolbar/SessionFilter.svelte`
- Modify: `dev/components/Toolbar/Toolbar.svelte`

- [ ] **Step 1: Create `SessionFilter.svelte`**

Create `dev/components/Toolbar/SessionFilter.svelte`:

```svelte
<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';

  const filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Regular', value: 'regular' as const },
    { label: 'Extended', value: 'extended' as const },
  ];

  // Only show for intraday periodicities (minute or hour)
  let isIntraday = $derived(
    appStore.periodicity.unit === 'minute' || appStore.periodicity.unit === 'hour'
  );
</script>

{#if isIntraday}
  <div class="session-filter">
    {#each filters as f}
      <button
        class="filter-btn"
        class:active={appStore.sessionFilter === f.value}
        onclick={() => { appStore.sessionFilter = f.value; }}
      >
        {f.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .session-filter {
    display: flex;
    border: 1px solid #434651;
    border-radius: 4px;
    overflow: hidden;
  }

  .filter-btn {
    padding: 3px 8px;
    background: #2a2e39;
    color: #d1d4dc;
    border: none;
    border-right: 1px solid #434651;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    transition: background 0.15s;
  }

  .filter-btn:last-child {
    border-right: none;
  }

  .filter-btn:hover {
    background: #363a45;
  }

  .filter-btn.active {
    background: #2962ff;
    color: #ffffff;
  }
</style>
```

- [ ] **Step 2: Add SessionFilter to Toolbar**

In `dev/components/Toolbar/Toolbar.svelte`, add the import and component:

```svelte
<script lang="ts">
  import SymbolSearch from './SymbolSearch.svelte';
  import IntervalSelector from './IntervalSelector.svelte';
  import ChartTypeSelector from './ChartTypeSelector.svelte';
  import IndicatorDialog from './IndicatorDialog.svelte';
  import DrawingToolbar from './DrawingToolbar.svelte';
  import CompareButton from './CompareButton.svelte';
  import TimezoneSelector from './TimezoneSelector.svelte';
  import UtilityButtons from './UtilityButtons.svelte';
  import SessionFilter from './SessionFilter.svelte';

  // ... rest unchanged
</script>

<div class="toolbar">
  <SymbolSearch />
  <IntervalSelector />
  <div class="sep"></div>
  <ChartTypeSelector />
  <IndicatorDialog />
  <DrawingToolbar />
  <CompareButton />
  <SessionFilter />
  <div class="spacer"></div>
  <TimezoneSelector />
  <UtilityButtons {onfullscreen} {onscreenshot} {onsettings} />
</div>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Success.

Run storybook > Advanced Chart. When periodicity is intraday (5m, 1h, etc.), the session filter buttons should appear in the toolbar. When daily/weekly/monthly, they should be hidden.

- [ ] **Step 4: Commit**

```bash
git add dev/components/Toolbar/SessionFilter.svelte dev/components/Toolbar/Toolbar.svelte
git commit -m "feat: add SessionFilter segmented control to toolbar"
```

---

### Task 8: Wire Session Filter in AdvancedChart

**Files:**
- Modify: `dev/components/AdvancedChart.svelte`

- [ ] **Step 1: Import US_EQUITY_SESSIONS**

At the top of `AdvancedChart.svelte`, add to the imports:

```typescript
  import { US_EQUITY_SESSIONS } from '@itssumitrai/fin-charter';
```

- [ ] **Step 2: Set market sessions on init and periodicity change**

In the `initChart()` function, after `chart = c;` and `mainSeries = createSeries(...)`, add:

```typescript
    // Set market sessions for intraday periodicities
    const isIntraday = appStore.periodicity.unit === 'minute' || appStore.periodicity.unit === 'hour';
    if (isIntraday) {
      c.setMarketSessions(US_EQUITY_SESSIONS);
    }
```

In the periodicity change `$effect` (around line 232), after `prevPeriodicity = label;`, add:

```typescript
      // Update market sessions based on periodicity type
      const isIntraday = appStore.periodicity.unit === 'minute' || appStore.periodicity.unit === 'hour';
      if (isIntraday) {
        chart.setMarketSessions(US_EQUITY_SESSIONS);
      } else {
        chart.setMarketSessions([]);
        appStore.sessionFilter = 'all';
      }
```

- [ ] **Step 3: Add session filter `$effect`**

After the existing `$effect` blocks (around line 280), add:

```typescript
  // React to session filter changes
  $effect(() => {
    const filter = appStore.sessionFilter;
    chart?.setSessionFilter(filter);
  });
```

- [ ] **Step 4: Build and test end-to-end**

Run: `npm run build`
Expected: Success.

Run storybook > Advanced Chart:
1. Switch to 5m periodicity — session filter buttons appear
2. Click "Regular" — only regular hours bars visible
3. Click "Extended" — only pre/post bars visible
4. Click "All" — all bars with shading and opacity
5. Switch to 1D — session filter buttons disappear

- [ ] **Step 5: Commit**

```bash
git add dev/components/AdvancedChart.svelte
git commit -m "feat: wire session filter and market sessions in AdvancedChart"
```

---

### Task 9: Update ExtendedHours Story

**Files:**
- Modify: `stories/Features/ExtendedHours.stories.ts`

- [ ] **Step 1: Update story description**

Update the story description to reflect the new visual features:

```typescript
const meta: Meta = {
  title: 'Features/Extended Hours',
  parameters: {
    docs: {
      description: {
        component:
          'Pre/post market session support with visual differentiation. Extended hours bars are rendered ' +
          'with reduced opacity (40%) and colored background shading (blue for pre-market, orange for post-market). ' +
          'Use setSessionFilter() to toggle between all sessions, regular only, or extended only.',
      },
    },
  },
};
```

- [ ] **Step 2: Update description text in withDocs**

Update the `withDocs` description (around line 137):

```typescript
    return withDocs(wrapper, {
      description:
        'Display <strong>pre-market</strong> and <strong>post-market</strong> trading sessions alongside regular hours. ' +
        'Extended hours bars are rendered at <strong>40% opacity</strong> with colored background shading: ' +
        '<span style="color:#2196F3">blue</span> for pre-market, <span style="color:#ff9800">orange</span> for post-market. ' +
        'Use <code>chart.setMarketSessions()</code> to define session boundaries and ' +
        '<code>chart.setSessionFilter()</code> to toggle between <code>"all"</code>, <code>"regular"</code>, or <code>"extended"</code> sessions.',
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Success.

- [ ] **Step 4: Commit**

```bash
git add stories/Features/ExtendedHours.stories.ts
git commit -m "docs: update ExtendedHours story for new visual features"
```

---

### Task 10: Run Full Test Suite and Final Verification

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

- [ ] **Step 4: Visual verification in storybook**

Run: `npm run storybook`

Verify:
1. **Features > Extended Hours**: Blue pre-market shading, orange post-market shading, 40% opacity on extended bars, session filter buttons work
2. **Advanced Chart**: Session filter appears for intraday periodicities, disappears for daily+. Filters work correctly.
3. **Other stories** (Candlestick, Line, Area, etc.): No regression — charts without market sessions render normally

- [ ] **Step 5: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: address any issues found during final verification"
```
