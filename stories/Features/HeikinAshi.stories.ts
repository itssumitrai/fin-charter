import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Heikin-Ashi',
  parameters: {
    docs: {
      description: {
        component:
          'Heikin-Ashi candles are a smoothed version of standard candlesticks. ' +
          'They reduce noise and make trends easier to spot. Use chart.addHeikinAshiSeries() ' +
          'to display Heikin-Ashi computed from standard OHLCV data.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const HeikinAshiChart: Story = {
  name: 'Heikin-Ashi Chart',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const series = chart.addHeikinAshiSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    series.setData(AAPL_DAILY);

    return container;
  },
};
