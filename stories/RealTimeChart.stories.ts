import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { Bar } from '../src/core/types';
import { generateOHLCV, createChartContainer } from './helpers';

const meta: Meta = {
  title: 'Real-Time/Streaming',
  parameters: {
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
const series = chart.addCandlestickSeries();
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
    const series = chart.addCandlestickSeries();

    // Seed with 100 historical bars
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

    // Clean up on story unmount via a MutationObserver watching container removal
    const observer = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(intervalId);
        chart.remove();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return container;
  },
};

export const CandleBuilding: Story = {
  name: 'Candle Building (Tick Simulation)',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
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
    const series = chart.addCandlestickSeries();

    // Seed with 100 historical bars
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
      // Simulate a price tick
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
      // Every ~50 ticks (~5 seconds), start a new candle
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

    return container;
  },
};

export const LiveLine: Story = {
  name: 'Live Line Chart',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addLineSeries({ color: '#00e5ff', lineWidth: 2 });
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
    const series = chart.addLineSeries({ color: '#00e5ff', lineWidth: 2 });

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

    return container;
  },
};
