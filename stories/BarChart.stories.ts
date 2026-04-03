import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from './helpers';

const meta: Meta = {
  title: 'Charts/Bar (OHLC)',
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
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addBarSeries();
    series.setData(generateOHLCV(200));
    return container;
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addBarSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
    });
    series.setData(generateOHLCV(200));
    return container;
  },
};
