import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Chart Types/Hollow Candle',
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
  parameters: {
    docs: {
      source: {
        code: `
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true });
const series = chart.addHollowCandleSeries();
series.setData(data);
`.trim(),
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addHollowCandleSeries({
  upColor: '#00e5ff',
  downColor: '#ff4081',
  wickColor: '#aaaaaa',
});
series.setData(data);
`.trim(),
      },
    },
  },
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
