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
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addHeikinAshiSeries({
  upColor: '#22AB94',
  downColor: '#F7525F',
});
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addHeikinAshiSeries({
      upColor: '#22AB94',
      downColor: '#F7525F',
      borderUpColor: '#22AB94',
      borderDownColor: '#F7525F',
      wickUpColor: '#22AB94',
      wickDownColor: '#F7525F',
    });

    series.setData(AAPL_DAILY);

    return container;
  },
};
