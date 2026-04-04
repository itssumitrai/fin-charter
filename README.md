<p align="center">
  <img src="public/logo.svg" alt="fin-charter" width="128" height="128" />
</p>

<h1 align="center">fin-charter</h1>

<p align="center">Ultra-fast, tree-shakeable financial charting library for the browser.</p>

**[Live Storybook Documentation & Examples](https://itssumitrai.github.io/fin-charter/)**

## Key Features

- **Ultra-fast canvas rendering** — direct 2D canvas drawing, no virtual DOM
- **Tiny bundle** — core is under 15 KB gzipped; unused chart types tree-shake away
- **Tree-shakeable** — `"sideEffects": false` ES module package
- **8 chart types** — Candlestick, Line, Area, Bar (OHLC), Baseline, Hollow Candle, Histogram, Heikin-Ashi
- **18 built-in indicators** — SMA, EMA, Bollinger Bands, RSI, MACD, VWAP, Stochastic, ATR, ADX, OBV, Williams %R, Volume, Ichimoku Cloud, Parabolic SAR, Keltner Channel, Donchian Channel, CCI, Pivot Points
- **Chart-managed indicators** — `chart.addIndicator('rsi', { source: series })` with auto-compute and auto-pane creation
- **Multi-pane layout** — indicator panes with draggable dividers and independent price scales
- **Interactive HUD** — series/indicator management with visibility toggle, settings editor, and remove
- **TradingView-compatible plugin system** — `ISeriesPrimitive` / `IPanePrimitive` interfaces
- **Real-time data** — `series.update(bar)` appends or overwrites the last bar in O(1)
- **Drawing tools** — 6 built-in types (horizontal line, vertical line, trendline, fibonacci, rectangle, text); extensible via `registerDrawingType()`
- **Comparison mode** — normalise multiple series to percentage change for side-by-side performance comparison
- **Heikin-Ashi** — `chart.addHeikinAshiSeries()` with automatic OHLC-to-HA transform
- **Market sessions** — define pre/post-market windows with background highlights; filter bars by session
- **Chart state save/restore** — `exportState()` / `importState()` round-trips the full chart configuration
- **Data pagination** — `series.prependData()` + `barsInLogicalRange()` + `subscribeVisibleRangeChange()` for infinite-history scrolling
- **Event markers** — `series.setEvents()` places interactive earnings/dividend/news markers on bars
- **Periodicity model** — `setPeriodicity()` / `subscribePeriodicityChange()` for interval switching with data-reload hooks
- **OHLC aggregation** — `aggregateOHLC(store, intervalSec)` for client-side timeframe resampling
- **Screenshot export** — `chart.takeScreenshot()` composites all panes to a canvas
- **TypeScript-first** — full type definitions included

## Installation

```bash
npm install fin-charter
```

## Quick Start

```ts
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart')!, {
  width: 800,
  height: 400,
});

const series = chart.addCandlestickSeries();

series.setData([
  { time: 1700000000, open: 100, high: 110, low: 95,  close: 107 },
  { time: 1700086400, open: 107, high: 115, low: 104, close: 112 },
  { time: 1700172800, open: 112, high: 118, low: 108, close: 109 },
]);
```

## Chart Types

| Type | Method | Description |
|---|---|---|
| Candlestick | `addCandlestickSeries()` | OHLC candles with filled body and wick |
| Line | `addLineSeries()` | Close-price polyline |
| Area | `addAreaSeries()` | Close-price line with gradient fill below |
| Bar (OHLC) | `addBarSeries()` | Traditional OHLC tick bars |
| Baseline | `addBaselineSeries()` | Two-color fill above/below a base price |
| Hollow Candle | `addHollowCandleSeries()` | Up candles hollow (outline only), down candles filled |
| Histogram | `addHistogramSeries()` | Vertical bars from the bottom; useful for volume |
| Heikin-Ashi | `addHeikinAshiSeries()` | Smoothed OHLC candles with automatic HA transform |

## Bundle Size Targets

| Entry point | Target (gzip) |
|---|---|
| `fin-charter` (core) | < 15 KB |
| `fin-charter/indicators` | < 4 KB |
| Full bundle (all chart types + indicators) | < 20 KB |

## Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Indicators](docs/indicators.md)
- [Drawing Tools](docs/drawings.md)
- [Data Integration](docs/data-integration.md)
- [Plugins](docs/plugins.md)
- [Performance](docs/performance.md)

## License

MIT
