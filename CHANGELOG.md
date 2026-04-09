# @itssumitrai/fin-charter

## 0.4.0

### Minor Changes

- ## Breaking Changes
  - **Modular bundle architecture**: Series types and indicators must now be registered before use. The core `createChart` no longer bundles all 20 renderers and 30 indicators. Import only what you need for minimal bundles (~15KB gzip), or use `@itssumitrai/fin-charter/full` for the batteries-included experience (~55KB gzip).
  - **WebGL rendering temporarily disabled**: The WebGL fast path has been removed during the modular refactor. Canvas2D rendering is used for all series types. WebGL will be re-added as an optional registration in a future release.

  ## Migration Guide

  ```ts
  // Before (v0.3.x)
  import { createChart } from '@itssumitrai/fin-charter';

  // After — minimal bundle (import only what you need)
  import { createChart } from '@itssumitrai/fin-charter';
  import '@itssumitrai/fin-charter/series/candlestick';

  // After — full bundle (all features, backward compatible)
  import { createChart } from '@itssumitrai/fin-charter/full';
  ```

  ## New Features
  - **Y-axis zoom**: Drag up/down on the price axis to zoom in/out vertically. Double-click to reset to auto-scale.
  - **Registry API**: `registerSeries()`, `registerIndicator()`, `registerDrawing()`, `registerAll()` for programmatic registration of custom or built-in components.
  - **Individual series entry points**: `@itssumitrai/fin-charter/series/candlestick`, `/series/line`, etc. — import only the chart types you need.
  - **Full bundle entry point**: `@itssumitrai/fin-charter/full` — registers everything, backward compatible.

## 0.3.0

### Minor Changes

- ## New Features
  - **Pre/post market visual support** — session background shading (blue for pre-market, orange for post-market), 40% opacity for extended hours bars, three-way session filter (All/Regular/Extended) in toolbar, Yahoo Finance `includePrePost` parameter
  - **CSS design tokens** — ~70 `--fc-*` CSS variables for theming every series type's colors via CSS. Three-tier priority: explicit JS > CSS variables > built-in defaults. New `refreshCSSTheme()` API. Searchable Storybook reference page.
  - **Band indicator fills** — Bollinger Bands, Keltner Channel, Donchian Channel, and Ichimoku Cloud now render semi-transparent filled areas between upper/lower bands
  - **Legend color picker** — Click the color swatch in the OHLC legend to open a native color picker and change series colors instantly
  - **Bollinger Bands stories** — Three dedicated Storybook stories (chart-managed, manual compute, custom params)
  - **Replay feature story** — Interactive Storybook story with play/pause/stop, step forward/backward, speed control
  - **Brighter default colors** — Updated default up/down colors to neon variants (#00E396 green, #FF3B5C red)
  - **Auto-fit on load** — Charts automatically fit all data to the viewport on first paint
  - **Screenshot fix** — Screenshots now include the chart's background color (dark mode works correctly)
  - **Export downloads** — Export story triggers actual file downloads (CSV/SVG/PDF)

  ## Bug Fixes
  - Fixed comparison series showing wrong symbol in legend
  - Fixed comparison mode infinite scroll and chart jumping (basis price cache)
  - Fixed fallback data for intraday intervals (now generates correct-interval bars with market hours)
  - Fixed infinite scroll regression for intraday fallback data
  - Fixed band fill alignment with indicator line series
  - Fixed volume overlay crash when no series exist
  - Fixed `removePane` leaking subscriptions for ejected series
  - Fixed single-bar range skipped by all 19 renderers (`fromIdx >= toIdx` → `fromIdx > toIdx`)
  - Fixed `_getBasisPrice` returning NaN for indicator series in comparison mode
  - Fixed grid rendering infinite-loop for very small price ranges (capped at 200 iterations)
  - Fixed VWAP indicator — now resets accumulators at session boundaries
  - Fixed Supertrend indicator initialization (prevUpper/prevLower)
  - Fixed Ichimoku cloud shift direction (now shifted forward, not backward)
  - Fixed `setData(ColumnData)` — now validates equal column lengths
  - Fixed `visibleRange` returning phantom bar for empty data
  - Fixed log mode silently disabling when price ≤ 0
  - Fixed daily fallback data including weekend bars
  - Fixed `remove()` not clearing all collections (memory leak)
  - Fixed `importState` ignoring pane heights
  - Fixed 3 stories missing cleanup on unmount (InfiniteHistory, Pagination, DataChanged)

## 0.2.0

### Minor Changes

- [#70](https://github.com/itssumitrai/fin-charter/pull/70) [`d0e0adc`](https://github.com/itssumitrai/fin-charter/commit/d0e0adc52fd1b9fdfacf97df048233929f93c049) Thanks [@itssumitrai](https://github.com/itssumitrai)! - Add 20+ features to the charting library:
  - WebGL rendering backend for large datasets (100k+ bars)
  - CSV, SVG, and PDF export
  - Alert lines with crossing callbacks
  - Range selection and measure tools
  - Segment tree for O(log n) min/max queries
  - Undo/redo system with keyboard shortcuts
  - Logarithmic price scale
  - Historical data pagination with DataFeedManager
  - Reusable ChartToolbar Svelte component
  - WebSocket and polling streaming adapters with auto-reconnect
  - Mobile touch gestures (pinch-to-zoom, two-finger pan)
  - Symbol resolution and search infrastructure
  - Order lines and position lines for trading
  - Multi-chart synchronized crosshairs
  - Comprehensive accessibility (ARIA, screen reader, keyboard navigation)
  - Custom indicator plugin system
  - Drawing persistence with storage adapters (localStorage, IndexedDB)
  - Formal plugin API with lifecycle hooks and dependencies
  - CSS custom properties for runtime theming
  - Text labels and annotations
  - Replay/playback mode for historical data
  - Volume profile computation (POC, Value Area)
  - RTL layout support
