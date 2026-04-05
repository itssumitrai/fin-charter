import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Chart Types/OHLC Bar',
  parameters: {
    docs: {
      description: {
        component: 'Traditional OHLC bar chart showing open, high, low, and close tick marks.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Default',
  parameters: {
    docs: {
      source: {
        code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'bar' });
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'bar' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>OHLC bar chart</strong> displays each period as a vertical bar with tick marks for open (left) and close (right). ' +
        'The bar extends from the high to the low price. This is a traditional chart type favored by commodity and futures traders.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'bar' });
series.setData(data);
      `,
    });
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addSeries({
  type: 'bar',
  upColor: '#00E396',
  downColor: '#FF3B5C',
});
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'bar',
      upColor: '#00E396',
      downColor: '#FF3B5C',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'Customize the up/down bar colors with <code>upColor</code> and <code>downColor</code>. ' +
        'Bullish bars (close &gt; open) use <code>upColor</code> and bearish bars use <code>downColor</code>.',
      code: `
const series = chart.addSeries({
  type: 'bar',
  upColor: '#00E396',   // Bullish bars
  downColor: '#FF3B5C', // Bearish bars
});
series.setData(data);
      `,
    });
  },
};
