import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Chart Types/Area',
  parameters: {
    docs: {
      description: {
        component: 'Area chart with filled gradient below the price line.',
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
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'area' });
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'area' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'An <strong>area chart</strong> renders a line at the close price with a gradient fill extending down to the bottom of the chart. ' +
        'It provides a clear visual sense of magnitude and is often used for portfolio value or index tracking.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'area' });
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
  type: 'area',
  lineColor: '#00e5ff',
  topColor: 'rgba(0, 229, 255, 0.4)',
  bottomColor: 'rgba(0, 229, 255, 0.0)',
});
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'area',
      lineColor: '#00e5ff',
      topColor: 'rgba(0, 229, 255, 0.4)',
      bottomColor: 'rgba(0, 229, 255, 0.0)',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'Customize the area gradient with <code>lineColor</code>, <code>topColor</code>, and <code>bottomColor</code>. ' +
        'Use RGBA values for <code>topColor</code> / <code>bottomColor</code> to control the gradient opacity.',
      code: `
const series = chart.addSeries({
  type: 'area',
  lineColor: '#00e5ff',                    // Line at the top of the area
  topColor: 'rgba(0, 229, 255, 0.4)',      // Gradient start (near line)
  bottomColor: 'rgba(0, 229, 255, 0.0)',   // Gradient end (transparent)
});
series.setData(data);
      `,
    });
  },
};
