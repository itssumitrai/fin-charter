import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Charts/Hollow Candle',
  parameters: {
    docs: {
      description: {
        component:
          'Hollow candle chart: bullish candles are drawn hollow (border only), bearish candles are filled.',
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
    const series = chart.addHollowCandleSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addHollowCandleSeries({
      upColor: '#00e5ff',
      downColor: '#ff4081',
      wickColor: '#aaaaaa',
    });
    series.setData(AAPL_DAILY);
    return container;
  },
};
