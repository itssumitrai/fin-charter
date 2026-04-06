# Pre/Post Market Visual Support — Design Spec

## Overview

Complete the visual and data layers for pre/post market (extended hours) support in fin-charter. The session model infrastructure already exists (MarketSession, API methods, state persistence, timezone helpers). This spec covers: rendering session background shading, reducing candle opacity for extended hours bars, applying session filters to hide/show bars, adding a toolbar UI control, and fetching pre/post data from Yahoo Finance.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Visual distinction | Background shading + candle opacity | Clearest signal — matches TradingView approach |
| Shading colors | Blue for pre-market, orange for post-market | Differentiates sessions at a glance |
| Candle treatment | 40% opacity for extended hours | Simple, works across all 20 chart types |
| Toggle UI | Three-way segmented control (All / Regular / Extended) | Matches existing `setSessionFilter` API |
| Data fetching | Always include pre/post data | Instant toggle with no reload flash |

## Visual Rendering

### Background Shading

Paint colored rectangles behind chart data to mark pre/post market regions.

- **Pre-market:** `rgba(33,150,243,0.06)` (light blue)
- **Post-market:** `rgba(255,152,0,0.06)` (light orange)
- **Regular hours:** `transparent` (no shading)

Implementation:
- Painted in `_paintPane()` in `chart-api.ts`, before series rendering
- Loop through visible bars, look up each bar's session via `getSessionForTime(minuteOfDay, sessions)`
- For non-regular sessions, fill a rect from the bar's left edge to right edge, full pane height
- Coalesce adjacent bars in the same session into a single rect for efficiency

### Candle/Bar Opacity

Bars in pre/post market sessions are rendered at reduced opacity.

- Extended hours bars: `globalAlpha = 0.4`
- Regular session bars: `globalAlpha = 1.0`
- Applied to all chart types uniformly by modulating `globalAlpha` around the series draw calls
- Volume overlay bars in extended hours also get reduced opacity

Implementation:
- In `_paintPane()`, split the visible range into contiguous runs of same-session bars
- Draw each run with the appropriate `globalAlpha` set on the canvas context
- This avoids modifying individual renderer classes (candlestick, line, area, etc.)

### Session Filter Behavior

The existing `setSessionFilter()` API accepts `'all' | 'regular' | 'extended'`.

| Filter | Behavior |
|---|---|
| `'all'` | Show all bars. Pre/post get shading + reduced opacity. Regular at full opacity. |
| `'regular'` | Hide pre/post bars entirely. Skip during render, exclude from price auto-scaling. |
| `'extended'` | Hide regular bars. Show only pre/post bars at full opacity, no background shading (since they're the primary data and shading only serves as contrast against regular bars). |

Implementation:
- Filtering applied at render time in `_paintPane()` when iterating the visible range
- Bars whose session doesn't match the filter are skipped (not drawn, not included in price range)
- The time scale still sees all bars so scrolling/zooming indices remain consistent
- `_updatePaneDataRange()` also respects the filter so Y-axis auto-scaling reflects only visible bars

### Session Lookup

Use existing helpers from `src/core/market-session.ts`:
- `timestampToMinuteOfDay(timestamp, timezone)` — converts bar time to minute-of-day
- `getSessionForTime(minuteOfDay, sessions)` — returns the MarketSession for that minute
- The chart's `timezone` option (or market definition timezone) provides the timezone

## Toolbar UI

### Session Filter Control

A three-way segmented button group added to `Toolbar.svelte`:

- Labels: **All** | **Regular** | **Extended**
- Styled to match existing toolbar buttons (dark background `#2a2e39`, subtle borders `#434651`)
- Active state highlighted (e.g., `#2962ff` background)
- Only visible when the chart periodicity is intraday (minute or hour unit). Hidden for daily/weekly/monthly since those don't have meaningful session distinctions.
- Default: "All"

### Store Integration

- Add `sessionFilter: 'all' | 'regular' | 'extended'` to `appStore` in `dev/data/store.svelte.ts`
- `AdvancedChart.svelte` watches `sessionFilter` changes and calls `chart.setSessionFilter()`
- On init (and on periodicity change to intraday), call `chart.setMarketSessions(US_EQUITY_SESSIONS)`
- On periodicity change to daily+, clear market sessions and reset filter to `'all'`

## Yahoo Finance Data Integration

### Always Fetch Pre/Post Data

Add `includePrePost=true` to all Yahoo Finance API requests:

- `fetchBars()`: append `&includePrePost=true` to the URL for intraday intervals (1m, 5m, 15m, 1h, 4h)
- `fetchChunk()`: same — append `&includePrePost=true` for intraday intervals
- Daily/weekly/monthly intervals don't need this parameter

### Interval Detection

Intraday intervals: `1m`, `5m`, `15m`, `1h`, `4h` (keys ending in `m` or `h`).
Non-intraday: `1D`, `1W`, `1M`.

Use `periodicityToKey()` to determine the interval key and check if it's intraday.

## Updated Session Colors

Update `US_EQUITY_SESSIONS` in `src/core/market-session.ts`:

```typescript
export const US_EQUITY_SESSIONS: MarketSession[] = [
  { id: 'premarket',  label: 'PRE',  startMinute: 240, endMinute: 570,  bgColor: 'rgba(33,150,243,0.06)' },
  { id: 'regular',    label: '',     startMinute: 570, endMinute: 960,  bgColor: 'transparent' },
  { id: 'postmarket', label: 'POST', startMinute: 960, endMinute: 1200, bgColor: 'rgba(255,152,0,0.06)' },
];
```

## Files to Modify

| File | Changes |
|---|---|
| `src/api/chart-api.ts` | Session background painting, opacity modulation, session filter logic in `_paintPane()` and `_updatePaneDataRange()` |
| `src/core/market-session.ts` | Update `US_EQUITY_SESSIONS` bgColor values |
| `dev/data/yahoo-finance.ts` | Add `includePrePost=true` to intraday fetch URLs |
| `dev/data/store.svelte.ts` | Add `sessionFilter` to appStore |
| `dev/components/Toolbar/Toolbar.svelte` | Add session filter segmented control |
| `dev/components/AdvancedChart.svelte` | Wire session filter to chart API, auto-set market sessions for intraday |
| `stories/Features/ExtendedHours.stories.ts` | Update to demonstrate the new visual rendering |

## Out of Scope

- Custom session definition UI (users use the API)
- Session-specific price lines or labels
- Separate pre/post price axis
- Server-side session filtering
- New chart types or renderers
