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
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addLineSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CustomStyle: Story = {
  name: 'Custom Style',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
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
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addLineSeries({ color: '#ff6b6b' });
    series.setData(AAPL_DAILY);
    return container;
  },
};
