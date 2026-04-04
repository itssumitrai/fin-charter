# TradingView Clone — Design Spec

## Goal

Build a full TradingView-like charting application using fin-charter's features, with reusable Svelte 5 components shared between the local dev server and a Storybook story.

## Layout

Chart-focused with collapsible right sidebar:
- **Top toolbar**: Symbol search, interval selector, chart type, indicators dialog, drawing tools, compare, timezone selector, utility buttons (fullscreen, screenshot, settings)
- **Main area**: fin-charter canvas (full height, resizable width when sidebar open)
- **Right sidebar** (collapsible): Watchlist with ~20 symbols, click to switch
- **Status bar**: Market status, exchange, currency, timezone, session info

## Data

- **Yahoo Finance v8 API** via a Vite dev server proxy (avoids CORS)
- Proxy endpoint: `/api/yahoo` → `https://query1.finance.yahoo.com/v8/finance/chart/`
- Supports multiple periodicities: 1m, 5m, 15m, 1h, 4h, 1D, 1W, 1M
- ~20 hardcoded symbols with metadata (name, exchange, sector)

## Svelte Components (all in `dev/components/`)

### Toolbar
- `Toolbar.svelte` — composition container
- `SymbolSearch.svelte` — dropdown with search input, filters symbol list
- `IntervalSelector.svelte` — periodicity buttons (1m, 5m, 15m, 1h, 4h, 1D, 1W, 1M)
- `ChartTypeSelector.svelte` — dropdown with chart type icons
- `IndicatorDialog.svelte` — modal/popover listing all 30 indicators, searchable
- `DrawingToolbar.svelte` — dropdown with drawing tools grouped by category
- `CompareButton.svelte` — opens symbol picker to add comparison overlays
- `TimezoneSelector.svelte` — dropdown with timezone options
- `UtilityButtons.svelte` — fullscreen, screenshot, settings

### Sidebar
- `Sidebar.svelte` — collapsible container with resize handle
- `Watchlist.svelte` — list of WatchlistItem components
- `WatchlistItem.svelte` — symbol, name, price, change %

### Status
- `StatusBar.svelte` — market status, exchange, currency, timezone, session

### Core
- `TradingViewApp.svelte` — top-level composition of all components + fin-charter instance

### Data Layer (in `dev/data/`)
- `yahoo-finance.ts` — fetch wrapper for Yahoo Finance via proxy
- `symbols.ts` — symbol list with metadata (name, exchange)
- `store.svelte.ts` — Svelte 5 runes-based state (current symbol, periodicity, chart type, indicators, etc.)

## Storybook Integration

A single story at `stories/TradingView/TradingView.stories.ts` that:
- Imports `TradingViewApp.svelte` from `dev/components/`
- Renders it fullscreen
- The `.storybook/main.ts` already aliases `fin-charter` to `src/`; add alias for `dev/components` and `dev/data`

## Styling

- Dark theme matching existing fin-charter Storybook theme (#0d0d1a background, #d1d4dc text)
- CSS variables for theming consistency
- No external CSS framework — plain CSS with Svelte scoped styles

## Vite Proxy Config

In `dev/vite.config.ts`, add:
```ts
server: {
  proxy: {
    '/api/yahoo': {
      target: 'https://query1.finance.yahoo.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/yahoo/, '/v8/finance/chart'),
    },
  },
}
```
