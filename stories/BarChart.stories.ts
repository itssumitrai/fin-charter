import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

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
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true });
const series = chart.addBarSeries();
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addBarSeries();
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
const series = chart.addBarSeries({
  upColor: '#22AB94',
  downColor: '#F7525F',
});
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addBarSeries({
      upColor: '#22AB94',
      downColor: '#F7525F',
    });
    series.setData(AAPL_DAILY);
    return container;
  },
};
