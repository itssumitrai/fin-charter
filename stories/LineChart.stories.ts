import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from './helpers';

const meta: Meta = {
  title: 'Charts/Line',
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
    series.setData(generateOHLCV(200));
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
    series.setData(generateOHLCV(200));
    return container;
  },
};

export const HighVolatility: Story = {
  name: 'High Volatility',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addLineSeries({ color: '#ff6b6b' });
    series.setData(generateOHLCV(300, 50));
    return container;
  },
};
