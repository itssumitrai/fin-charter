import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Volume Overlay',
  parameters: {
    docs: {
      description: {
        component:
          'Candlestick chart with the built-in volume overlay enabled. Volume bars are rendered ' +
          'at the bottom of the chart using the same up/down color conventions as the candles.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Volume Enabled',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: { visible: true },
});
const series = chart.addCandlestickSeries();
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      volume: { visible: true },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CustomVolumeColors: Story = {
  name: 'Custom Volume Colors',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: {
    visible: true,
    upColor: 'rgba(0, 229, 255, 0.5)',
    downColor: 'rgba(255, 64, 129, 0.5)',
  },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      volume: {
        visible: true,
        upColor: 'rgba(0, 229, 255, 0.5)',
        downColor: 'rgba(255, 64, 129, 0.5)',
      },
    });
    const series = chart.addCandlestickSeries({
      upColor: '#00e5ff',
      downColor: '#ff4081',
      wickUpColor: '#00e5ff',
      wickDownColor: '#ff4081',
    });
    series.setData(AAPL_DAILY);
    return container;
  },
};
