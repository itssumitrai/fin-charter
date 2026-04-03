# fin-charter

Ultra-fast, tree-shakeable financial charting library for the browser.

**[Live Storybook Documentation & Examples](https://itssumitrai.github.io/fin-charter/)**

## Key Features

- **Ultra-fast canvas rendering** — direct 2D canvas drawing, no virtual DOM
- **Tiny bundle** — core is under 15 KB gzipped; unused chart types tree-shake away
- **Tree-shakeable** — `"sideEffects": false` ES module package
- **6 chart types** — Candlestick, Line, Area, Bar (OHLC), Baseline, Hollow Candle, Histogram
- **6 built-in indicators** — SMA, EMA, Bollinger Bands, RSI, MACD, Volume (separate import)
- **TradingView-compatible plugin system** — `ISeriesPrimitive` / `IPanePrimitive` interfaces
- **Real-time data** — `series.update(bar)` appends or overwrites the last bar in O(1)
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
- [Plugins](docs/plugins.md)
- [Performance](docs/performance.md)

## License

MIT
