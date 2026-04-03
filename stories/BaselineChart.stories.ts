import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from './helpers';

const meta: Meta = {
  title: 'Charts/Baseline',
  parameters: {
    docs: {
      description: {
        component:
          'Baseline chart that splits into two color zones above and below a reference price level.',
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
    const series = chart.addBaselineSeries();
    series.setData(generateOHLCV(200));
    return container;
  },
};

export const CustomBaseline: Story = {
  name: 'Custom Baseline Value',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addBaselineSeries({
      basePrice: 110,
      topLineColor: '#00e5ff',
      bottomLineColor: '#ff6b6b',
      topFillColor: 'rgba(0, 229, 255, 0.28)',
      bottomFillColor: 'rgba(255, 107, 107, 0.28)',
    });
    series.setData(generateOHLCV(200, 100));
    return container;
  },
};
