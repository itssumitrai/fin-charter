import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { Bar } from '../../src/core/types';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Data Changed',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates series.subscribeDataChanged(). A counter increments each time data is ' +
          'updated via the series API. A setInterval simulates real-time bar updates every second.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const DataChangedCounter: Story = {
  name: 'Data Changed Counter',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '12px';

    const counter = document.createElement('div');
    counter.style.cssText =
      'padding: 8px 14px; background: #1e2235; color: #d1d4dc; border-radius: 4px; font-size: 14px; font-family: monospace; width: fit-content;';
    counter.textContent = 'Data change events: 0';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    let changeCount = 0;

    series.subscribeDataChanged(() => {
      changeCount++;
      counter.textContent = `Data change events: ${changeCount}`;
    });

    // Simulate real-time updates — extend the last bar's close slightly each second
    const lastBar = AAPL_DAILY[AAPL_DAILY.length - 1];
    let currentTime = lastBar.time + 86400; // next day
    let currentPrice = lastBar.close;

    const intervalId = setInterval(() => {
      const change = (Math.random() - 0.48) * 2;
      const open = currentPrice;
      const close = +(currentPrice + change).toFixed(2);
      const high = +(Math.max(open, close) + Math.random()).toFixed(2);
      const low = +(Math.min(open, close) - Math.random()).toFixed(2);
      const volume = Math.round(40000 + Math.random() * 60000);

      const bar: Bar = { time: currentTime, open, high, low, close, volume };
      series.update(bar);

      currentPrice = close;
      currentTime += 86400;
    }, 1000);

    // Clean up interval when the element is removed from DOM
    wrapper.addEventListener('disconnected', () => clearInterval(intervalId));

    wrapper.appendChild(counter);
    wrapper.appendChild(container);

    return wrapper;
  },
};
