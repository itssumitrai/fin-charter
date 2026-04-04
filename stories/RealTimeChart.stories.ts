import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { Bar } from '../src/core/types';
import { generateOHLCV, createChartContainer } from './helpers';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Real-Time/Streaming',
  parameters: {
    chromatic: { disableSnapshot: true },
    docs: {
      description: {
        component:
          'Demonstrates real-time streaming updates using series.update(). A new bar is appended every 500ms.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const LiveStream: Story = {
  name: 'Live Stream (500ms interval)',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(historicalBars);

// Stream new bars in real time
setInterval(() => {
  const newBar = { time, open, high, low, close, volume };
  series.update(newBar);
}, 500);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });

    const seedData = generateOHLCV(100);
    series.setData(seedData);

    let lastBar = seedData[seedData.length - 1];

    const intervalId = setInterval(() => {
      const change = (Math.random() - 0.48) * 3;
      const open = lastBar.close;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = Math.round(50000 + Math.random() * 100000);
      const newBar: Bar = {
        time: lastBar.time + 86400,
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        close: +close.toFixed(2),
        volume,
      };
      series.update(newBar);
      lastBar = newBar;
    }, 500);

    const observer = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(intervalId);
        chart.remove();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return withDocs(container, {
      description:
        '<strong>Real-time streaming</strong> is achieved with <code>series.update(bar)</code>. When you pass a bar with a new timestamp, ' +
        'it is appended to the chart. When the timestamp matches the last bar, it updates in place.\n' +
        'This example appends a new candlestick every 500ms. Use a <code>MutationObserver</code> to clean up intervals when the story unmounts.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(historicalBars);

// Append a new bar every 500ms
setInterval(() => {
  const newBar = { time: nextTime, open, high, low, close, volume };
  series.update(newBar); // New timestamp → appends; same timestamp → updates in place
}, 500);
      `,
    });
  },
};

export const CandleBuilding: Story = {
  name: 'Candle Building (Tick Simulation)',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(historicalBars);

// Simulate tick-by-tick candle building
let candle = { time, open: lastClose, high: lastClose, low: lastClose, close: lastClose };
setInterval(() => {
  const tick = candle.close + (Math.random() - 0.48) * 0.5;
  candle.high = Math.max(candle.high, tick);
  candle.low = Math.min(candle.low, tick);
  candle.close = tick;
  series.update(candle);  // Same timestamp — updates in place with smooth animation
}, 100);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });

    const seedData = generateOHLCV(100);
    series.setData(seedData);

    const lastSeed = seedData[seedData.length - 1];
    let candleTime = lastSeed.time + 86400;
    let candle: Bar = {
      time: candleTime,
      open: lastSeed.close,
      high: lastSeed.close,
      low: lastSeed.close,
      close: lastSeed.close,
      volume: 0,
    };
    series.update(candle);

    let tickCount = 0;

    const intervalId = setInterval(() => {
      const tick = candle.close + (Math.random() - 0.48) * 0.5;
      candle = {
        ...candle,
        high: Math.max(candle.high, tick),
        low: Math.min(candle.low, tick),
        close: +tick.toFixed(2),
        volume: candle.volume! + Math.round(1000 + Math.random() * 5000),
      };
      series.update(candle);

      tickCount++;
      if (tickCount >= 50) {
        tickCount = 0;
        candleTime += 86400;
        candle = {
          time: candleTime,
          open: candle.close,
          high: candle.close,
          low: candle.close,
          close: candle.close,
          volume: 0,
        };
        series.update(candle);
      }
    }, 100);

    const observer = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(intervalId);
        chart.remove();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return withDocs(container, {
      description:
        '<strong>Candle building</strong> simulates tick-by-tick price updates within a single candle. ' +
        'By calling <code>series.update()</code> with the same timestamp repeatedly, the candle\'s high, low, and close animate in real time.\n' +
        'Every ~50 ticks (~5 seconds) a new candle starts. This mimics how live market data builds candles from individual trades.',
      code: `
// Start a new candle at the latest time + 1 day
let candle = { time: nextTime, open: lastClose, high: lastClose, low: lastClose, close: lastClose, volume: 0 };

setInterval(() => {
  const tick = candle.close + (Math.random() - 0.48) * 0.5;
  candle.high = Math.max(candle.high, tick);
  candle.low = Math.min(candle.low, tick);
  candle.close = tick;
  series.update(candle); // Same timestamp → updates in place
}, 100);
      `,
    });
  },
};

export const LiveLine: Story = {
  name: 'Live Line Chart',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'line', color: '#00e5ff', lineWidth: 2 });
series.setData(historicalBars);

setInterval(() => {
  series.update({ time, open, high, low, close, volume: 0 });
}, 500);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'line', color: '#00e5ff', lineWidth: 2 });

    const seedData = generateOHLCV(100);
    series.setData(seedData);

    let lastBar = seedData[seedData.length - 1];

    const intervalId = setInterval(() => {
      const change = (Math.random() - 0.48) * 3;
      const open = lastBar.close;
      const close = +( open + change).toFixed(2);
      const high = +(Math.max(open, close) + Math.random() * 2).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * 2).toFixed(2);
      const newBar: Bar = { time: lastBar.time + 86400, open, high, low, close, volume: 0 };
      series.update(newBar);
      lastBar = newBar;
    }, 500);

    const observer = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(intervalId);
        chart.remove();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return withDocs(container, {
      description:
        'Real-time streaming works with <strong>any series type</strong>, not just candlesticks. ' +
        'Here a <code>LineSeries</code> is updated every 500ms. The line chart shows only the close price, making it ideal for ticker-style displays.',
      code: `
const series = chart.addSeries({ type: 'line', color: '#00e5ff', lineWidth: 2 });
series.setData(historicalBars);

// Stream new points every 500ms
setInterval(() => {
  series.update({ time: nextTime, open, high, low, close, volume: 0 });
}, 500);
      `,
    });
  },
};
