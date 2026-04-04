import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { Bar } from '../../src/core/types';
import { createChartContainer, generateOHLCV } from '../helpers';

const meta: Meta = {
  title: 'Features/Pagination',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates infinite scroll-back (pagination). The chart starts with 200 bars of data. ' +
          'When the user scrolls to the left edge, more historical data is prepended automatically ' +
          'via series.prependData(). subscribeVisibleRangeChange() triggers the load.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const InfiniteScrollBack: Story = {
  name: 'Infinite Scroll-Back',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const statusBar = document.createElement('div');
    statusBar.style.cssText =
      'padding: 6px 12px; background: #1e2235; border-radius: 4px; ' +
      'font-size: 13px; font-family: monospace; color: #d1d4dc;';
    statusBar.textContent = 'Total bars: 200 — scroll left to load more history';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    // Seed initial 200 bars ending "today"
    const INITIAL_START = 1704067200; // 2024-01-01
    let totalBars = 200;
    const initialData = generateOHLCV(totalBars, 185, INITIAL_START);
    let earliestTime = initialData[0].time;

    const series = chart.addCandlestickSeries();
    series.setData(initialData);

    let loading = false;

    chart.subscribeVisibleRangeChange((range) => {
      if (!range || loading) return;

      // Check how many bars exist before the left edge of the visible range
      const info = series.barsInLogicalRange({ from: 0, to: Math.floor(range.from) });
      const LOAD_THRESHOLD = 20;

      if (info.barsBefore <= LOAD_THRESHOLD) {
        loading = true;
        statusBar.textContent = 'Loading more history…';

        // Simulate async fetch with a small timeout
        setTimeout(() => {
          const CHUNK = 100;
          const newStartTime = earliestTime - CHUNK * 86400;
          const newBars: Bar[] = generateOHLCV(CHUNK, 120, newStartTime);
          series.prependData(newBars);
          earliestTime = newBars[0].time;
          totalBars += CHUNK;
          statusBar.textContent = `Total bars: ${totalBars} — scroll left to load more history`;
          loading = false;
        }, 300);
      }
    });

    wrapper.appendChild(statusBar);
    wrapper.appendChild(container);
    return wrapper;
  },
};
