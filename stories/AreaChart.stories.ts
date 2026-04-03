import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from './helpers';

const meta: Meta = {
  title: 'Charts/Area',
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
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addAreaSeries();
    series.setData(generateOHLCV(200));
    return container;
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addAreaSeries({
      lineColor: '#00e5ff',
      topColor: 'rgba(0, 229, 255, 0.4)',
      bottomColor: 'rgba(0, 229, 255, 0.0)',
    });
    series.setData(generateOHLCV(200));
    return container;
  },
};
