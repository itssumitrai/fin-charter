import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Chart Types/Baseline',
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
  parameters: {
    docs: {
      source: {
        code: `
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true });
const series = chart.addBaselineSeries();
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addBaselineSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CustomBaseline: Story = {
  name: 'Custom Baseline Value',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addBaselineSeries({
  basePrice: 110,
  topLineColor: '#00e5ff',
  bottomLineColor: '#ff6b6b',
  topFillColor: 'rgba(0, 229, 255, 0.28)',
  bottomFillColor: 'rgba(255, 107, 107, 0.28)',
});
series.setData(data);
`.trim(),
      },
    },
  },
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
    series.setData(AAPL_DAILY);
    return container;
  },
};
