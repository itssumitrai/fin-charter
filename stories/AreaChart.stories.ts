import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

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

const chart = createChart(document.getElementById('chart'), { autoSize: true });
const series = chart.addAreaSeries();
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addAreaSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addAreaSeries({
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
    const chart = createChart(container, { autoSize: true });
    const series = chart.addAreaSeries({
      lineColor: '#00e5ff',
      topColor: 'rgba(0, 229, 255, 0.4)',
      bottomColor: 'rgba(0, 229, 255, 0.0)',
    });
    series.setData(AAPL_DAILY);
    return container;
  },
};
