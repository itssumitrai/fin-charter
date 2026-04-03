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
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
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

export const LiveLine: Story = {
  name: 'Live Line Chart',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
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
