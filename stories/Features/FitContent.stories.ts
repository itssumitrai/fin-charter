import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Features/Fit Content',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates chart.fitContent(). The chart starts zoomed out (barSpacing: 2). ' +
          'Click "Fit Content" to auto-scale so all bars fill the visible area.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const FitContentDemo: Story = {
  name: 'Fit Content Demo',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  timeScale: { barSpacing: 2 },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Auto-scale to fit all bars in the visible area
chart.fitContent();`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '12px';

    const button = document.createElement('button');
    button.textContent = 'Fit Content';
    button.style.cssText =
      'padding: 8px 16px; cursor: pointer; background: #4caf50; color: white; border: none; border-radius: 4px; font-size: 14px; width: fit-content;';

    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      timeScale: { barSpacing: 2 },
    });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    button.addEventListener('click', () => {
      chart.fitContent();
    });

    wrapper.appendChild(button);
    wrapper.appendChild(container);

    return withDocs(wrapper, {
      description:
        'Auto-fit all data to the visible area with <code>chart.fitContent()</code>. ' +
        'The chart starts with a narrow <code>barSpacing: 2</code> so bars are compressed. ' +
        'Click the <strong>Fit Content</strong> button to auto-scale so all bars fill the visible width.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  timeScale: { barSpacing: 2 },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Auto-scale to fit all bars in the visible area
chart.fitContent();
      `,
    });
  },
};
