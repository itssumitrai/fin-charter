import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import type { Bar } from '../../src/core/types';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Navigation/Infinite History',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates infinite history loading. When the user pans to the left edge, ' +
          'more historical bars are prepended to the series. A loading indicator is shown ' +
          'while the (simulated) fetch is in progress.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/** Generate synthetic historical bars that precede an existing dataset. */
function generatePreceding(existing: Bar[], count: number): Bar[] {
  const firstTime = existing[0].time;
  const firstPrice = existing[0].open;
  const bars: Bar[] = [];
  let price = firstPrice;
  for (let i = count; i >= 1; i--) {
    const time = firstTime - i * 86400;
    const change = (Math.random() - 0.48) * 3;
    const open = price;
    const close = +(price + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * 2).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * 2).toFixed(2);
    bars.push({ time, open: +open.toFixed(2), high, low, close, volume: Math.round(40000 + Math.random() * 80000) });
    price = close;
  }
  return bars;
}

export const Default: Story = {
  name: 'Infinite History',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(bars);

chart.subscribeVisibleRangeChange(async (range) => {
  if (range.from <= firstBarTime) {
    const olderBars = await fetchHistory();
    series.setData([...olderBars, ...bars]);
  }
});`,
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.style.gap = '8px';

    // Loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText =
      'display:none;padding:4px 12px;background:#1a1a2e;color:#aaa;font-size:11px;' +
      'font-family:monospace;border-radius:4px;text-align:center;';
    loadingEl.textContent = 'Loading historical data...';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });

    let allBars: Bar[] = [...AAPL_DAILY];
    series.setData(allBars);

    let isFetching = false;

    chart.subscribeVisibleRangeChange((range) => {
      if (!range || isFetching) return;

      const firstBarTime = allBars[0].time;
      // Trigger fetch when visible range starts at or before first bar
      if (range.from <= firstBarTime) {
        isFetching = true;
        loadingEl.style.display = 'block';

        // Simulate async fetch with 600ms delay
        setTimeout(() => {
          const newBars = generatePreceding(allBars, 60);
          allBars = [...newBars, ...allBars];
          series.setData(allBars);
          loadingEl.style.display = 'none';
          isFetching = false;
        }, 600);
      }
    });

    const observer = new MutationObserver(() => {
      if (!root.isConnected) {
        observer.disconnect();
        chart.remove();
      }
    });
    requestAnimationFrame(() => {
      if (root.isConnected) observer.observe(document.body, { childList: true, subtree: true });
    });

    root.appendChild(loadingEl);
    root.appendChild(container);
    return withDocs(root, {
      description:
        'Load <strong>historical data on demand</strong> when the user pans to the left edge of the chart. ' +
        'Subscribe to <code>chart.subscribeVisibleRangeChange()</code> and detect when <code>range.from</code> ' +
        'reaches the earliest bar time, then fetch and prepend older data with <code>series.setData()</code>.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(bars);

chart.subscribeVisibleRangeChange(async (range) => {
  if (range.from <= firstBarTime) {
    const olderBars = await fetchHistory();
    series.setData([...olderBars, ...bars]);
  }
});
      `,
    });
  },
};
