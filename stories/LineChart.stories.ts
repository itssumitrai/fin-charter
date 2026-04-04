import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Chart Types/Line',
  parameters: {
    docs: {
      description: {
        component: 'Line chart connecting close prices across bars.',
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
const series = chart.addLineSeries();
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addLineSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CustomStyle: Story = {
  name: 'Custom Style',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addLineSeries({
  color: '#00e5ff',
  lineWidth: 2,
});
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addLineSeries({
      color: '#00e5ff',
      lineWidth: 2,
    });
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const HighVolatility: Story = {
  name: 'High Volatility',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addLineSeries({ color: '#ff6b6b' });
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addLineSeries({ color: '#ff6b6b' });
    series.setData(AAPL_DAILY);
    return container;
  },
};
