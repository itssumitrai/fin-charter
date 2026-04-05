import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Range Selection',
  parameters: {
    docs: {
      description: {
        component:
          'Range selection allows users to drag-select a time range on the chart and view summary ' +
          'statistics such as high, low, price change, percent change, bar count, and total volume.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function makeButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText =
    'padding: 6px 12px; margin-right: 6px; background: #2a2e39; color: #d1d4dc; ' +
    'border: 1px solid #434651; border-radius: 4px; cursor: pointer; font-size: 13px;';
  btn.addEventListener('click', onClick);
  return btn;
}

export const RangeMode: Story = {
  name: 'Range Selection Mode',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Enable range selection mode
chart.setRangeSelectionActive(true);

// Listen for selection results
chart.onRangeSelected((stats) => {
  if (stats) {
    console.log('Bars:', stats.barCount);
    console.log('Change:', stats.priceChange.toFixed(2));
    console.log('Volume:', stats.totalVolume);
  }
});`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display: flex; align-items: center; padding: 8px; background: #1e2235; border-radius: 4px;';

    const status = document.createElement('span');
    status.style.cssText = 'margin-left: 12px; color: #787b86; font-size: 13px; font-family: monospace;';
    status.textContent = 'Click "Enable" then drag on the chart to select a range';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.onRangeSelected((stats) => {
      if (stats) {
        status.textContent =
          `Bars: ${stats.barCount} | Change: ${stats.priceChange.toFixed(2)} ` +
          `(${stats.percentChange.toFixed(2)}%) | Volume: ${stats.totalVolume.toLocaleString()}`;
      } else {
        status.textContent = 'Selection cleared';
      }
    });

    const enableBtn = makeButton('Enable Range Select', () => {
      chart.setRangeSelectionActive(true);
      status.textContent = 'Range selection active — drag on chart';
      enableBtn.style.background = '#1a4a6b';
      enableBtn.style.borderColor = '#2196F3';
      disableBtn.style.background = '#2a2e39';
      disableBtn.style.borderColor = '#434651';
    });

    const disableBtn = makeButton('Disable', () => {
      chart.setRangeSelectionActive(false);
      status.textContent = 'Range selection disabled';
      disableBtn.style.background = '#1a4a6b';
      disableBtn.style.borderColor = '#2196F3';
      enableBtn.style.background = '#2a2e39';
      enableBtn.style.borderColor = '#434651';
    });

    toolbar.appendChild(enableBtn);
    toolbar.appendChild(disableBtn);
    toolbar.appendChild(status);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);

    const description = '<strong>Range selection</strong> lets users drag-select a time range to view summary statistics. Call <code>chart.setRangeSelectionActive(true)</code> to enter selection mode, then subscribe via <code>chart.onRangeSelected(callback)</code>. The callback receives a <code>RangeSelectionStats</code> object with <code>barCount</code>, <code>priceChange</code>, <code>percentChange</code>, <code>totalVolume</code>, <code>high</code>, and <code>low</code>.';
    const code = `// Enable range selection mode
chart.setRangeSelectionActive(true);

// Listen for selection results
chart.onRangeSelected((stats) => {
  if (stats) {
    console.log('Bars:', stats.barCount);
    console.log('Change:', stats.priceChange.toFixed(2));
    console.log('Percent:', stats.percentChange.toFixed(2) + '%');
    console.log('Volume:', stats.totalVolume);
  }
});

// Disable range selection
chart.setRangeSelectionActive(false);`;

    return withDocs(wrapper, { description, code });
  },
};
