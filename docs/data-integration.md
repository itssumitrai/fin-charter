# Data Integration

This guide covers the four main data patterns in fin-charter: loading paginated history, streaming real-time updates, switching periodicity, and displaying multiple instruments side by side in comparison mode.

---

## Pagination — Loading Historical Bars on Demand

Use `series.prependData()` together with `series.barsInLogicalRange()` and `chart.subscribeVisibleRangeChange()` to implement infinite-history scrolling. When the user scrolls left and reaches bars close to the beginning of the loaded data, fetch older bars and prepend them.

```ts
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addCandlestickSeries();

// Load the initial (most recent) page
series.setData(await fetchBars({ limit: 500 }));
chart.timeScale().scrollToEnd();

let isFetching = false;

chart.subscribeVisibleRangeChange(async (range) => {
  if (!range || isFetching) return;

  const { barsBefore } = series.barsInLogicalRange(range);

  // When fewer than 50 bars remain before the viewport, load more
  if (barsBefore < 50) {
    isFetching = true;
    try {
      const store = series.dataByIndex(0);  // earliest loaded bar
      if (!store) return;
      const olderBars = await fetchBars({ before: store.time, limit: 500 });
      if (olderBars.length > 0) {
        series.prependData(olderBars);
      }
    } finally {
      isFetching = false;
    }
  }
});
```

### `prependData(data)`

```ts
series.prependData(data: Bar[] | ColumnData): void
```

Inserts bars at the beginning of the series. Bars must be in ascending time order and earlier than the first bar already loaded. Accepts the same `Bar[]` or zero-copy `ColumnData` format as `setData`.

### `barsInLogicalRange(range)`

```ts
series.barsInLogicalRange(range: { from: number; to: number }): {
  barsBefore: number;
  barsAfter:  number;
  from:       number;  // timestamp of the first bar in range
  to:         number;  // timestamp of the last bar in range
}
```

Returns metadata about how many loaded bars fall outside the given logical index range. Pass `chart.timeScale().visibleRange()` (or the range received by `subscribeVisibleRangeChange`) to determine how many bars lie before the viewport — the trigger condition for loading more history.

### `subscribeVisibleRangeChange(callback)`

```ts
chart.subscribeVisibleRangeChange(
  callback: (range: { from: number; to: number } | null) => void,
): void
```

Fires whenever the visible bar-index range changes due to pan, zoom, or programmatic navigation. Passes `null` when no data is loaded.

---

## Real-Time Streaming

Call `series.update(bar)` to push live ticks. If `bar.time` matches the last bar's timestamp the bar is updated in-place (O(1)). Otherwise a new bar is appended.

```ts
const chart  = createChart(container);
const series = chart.addCandlestickSeries();
series.setData(await fetchBars({ limit: 300 }));
chart.timeScale().scrollToEnd();

// Connect to a WebSocket feed
const ws = new WebSocket('wss://feed.example.com/ticks');

ws.onmessage = (event) => {
  const tick = JSON.parse(event.data) as {
    time: number; open: number; high: number; low: number; close: number; volume: number;
  };
  series.update(tick);
};

// To keep the last bar visible, optionally call scrollToRealTime()
// after each update when the user has not scrolled away
ws.onmessage = (event) => {
  series.update(JSON.parse(event.data));
  chart.scrollToRealTime();
};
```

For high-frequency feeds where many ticks arrive per second, the internal RAF batching means only one repaint happens per animation frame regardless of how many `update()` calls occur.

---

## Periodicity / Interval Switching

The periodicity model tracks the current bar interval and emits change notifications so that data-loading logic can reload bars at the new resolution.

```ts
import { createChart } from 'fin-charter';
import { aggregateOHLC } from 'fin-charter/transforms';

const chart  = createChart(container, { autoSize: true });
const series = chart.addCandlestickSeries();

// Set the initial periodicity
chart.setPeriodicity({ interval: 1, unit: 'day' });

// Subscribe to changes emitted when the user picks a new interval
chart.subscribePeriodicityChange(async (periodicity) => {
  const bars = await fetchBars({ periodicity });
  series.setData(bars);
  chart.timeScale().scrollToEnd();
});

// Trigger a change programmatically (e.g. from a toolbar button)
chart.setPeriodicity({ interval: 5, unit: 'minute' });
```

### Using `aggregateOHLC` for Client-Side Resampling

If you have 1-minute base data and want to display higher timeframes without a server round-trip, use `aggregateOHLC`:

```ts
import { aggregateOHLC } from 'fin-charter/transforms';
import type { ColumnStore } from 'fin-charter';

// Assume `baseStore` is the 1-minute ColumnStore obtained from a plugin or transform
const fiveMin = aggregateOHLC(baseStore, 5 * 60);   // 5-minute bars
const hourly  = aggregateOHLC(baseStore, 60 * 60);  // 1-hour bars
```

```ts
function aggregateOHLC(source: ColumnStore, targetIntervalSec: number): ColumnStore
```

Groups bars into buckets of `targetIntervalSec` seconds. For each bucket: open is the first bar's open, high is the maximum high, low is the minimum low, close is the last bar's close, and volume is the cumulative sum. Returns a new `ColumnStore`.

### Periodicity Type

```ts
interface Periodicity {
  interval: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
}
```

### `chart.getPeriodicity()` / `chart.setPeriodicity()`

```ts
chart.setPeriodicity(periodicity: Periodicity): void
chart.getPeriodicity(): Periodicity
```

Getter/setter for the current periodicity. `setPeriodicity` fires all `subscribePeriodicityChange` callbacks.

---

## Comparison Mode

Comparison mode normalises all series to percentage change from the first visible bar's close. It is useful for comparing the relative performance of multiple instruments on the same chart.

```ts
const chart = createChart(container, { autoSize: true });

// Load the base instrument
const appl = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350' });
appl.setData(await fetchBars('AAPL'));

// Add comparison instruments as line series
const msft = chart.addLineSeries({ color: '#2196F3', lineWidth: 2 });
msft.setData(await fetchBars('MSFT'));

const googl = chart.addLineSeries({ color: '#ff9800', lineWidth: 2 });
googl.setData(await fetchBars('GOOGL'));

// Enable comparison mode — Y-axis now shows % change from first visible bar
chart.setComparisonMode(true);
```

Toggle comparison mode at any time:

```ts
chart.setComparisonMode(false);  // restore absolute prices
console.log(chart.isComparisonMode());  // false
```

### Notes on Comparison Mode

- When enabled, the Y-axis labels change to show `+10.5 %` / `-3.2 %` style values.
- The basis price for each series is the close of the first bar that falls within the current visible range. Panning or zooming updates the basis automatically.
- Each series retains its own absolute price scale internally; disabling comparison mode instantly restores absolute labels.
- Add as many series as needed. There is no hard limit on the number of comparison instruments.

---

## Event Markers

`series.setEvents()` places interactive event markers on bars (e.g. earnings releases, dividends, news). Unlike `setMarkers()` (which renders small shapes), events are rendered as distinct shapes with labels and support hover tooltips.

```ts
import type { ChartEvent } from 'fin-charter';

const events: ChartEvent[] = [
  { time: 1700000000, type: 'earnings', label: 'Q3 EPS Beat', color: '#26a69a' },
  { time: 1700172800, type: 'dividend', label: '$0.23', color: '#2196F3' },
];

series.setEvents(events);
console.log(series.getEvents());  // readonly ChartEvent[]
```

### `ChartEvent`

```ts
interface ChartEvent {
  time:   number;   // Unix timestamp (seconds)
  type:   string;   // arbitrary event type string
  label?: string;   // tooltip text
  color?: string;   // marker color (overrides series default)
}
```

---

## Data Change Subscription

Subscribe to any data mutation on a series — useful for recomputing derived indicators when new bars arrive.

```ts
const unsubscribe = series.subscribeDataChanged(() => {
  // Recompute the SMA whenever setData / update / prependData fires
  const sma = computeSMA(store.close, store.length, 20);
  smaSeries.setData(buildBars(store.time, sma, store.length));
});

// Tear down when done
series.unsubscribeDataChanged(unsubscribe);
```

```ts
series.subscribeDataChanged(callback: () => void): void
series.unsubscribeDataChanged(callback: () => void): void
```
