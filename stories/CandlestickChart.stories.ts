import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Chart Types/Candlestick',
  parameters: {
    docs: {
      description: {
        component: 'Classic OHLC candlestick chart. Green candles for bullish bars, red for bearish.',
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
        code: `import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(data); // Array of { time, open, high, low, close, volume }`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addCandlestickSeries({
  upColor: '#00e5ff',
  downColor: '#ff4081',
  wickUpColor: '#00e5ff',
  wickDownColor: '#ff4081',
});
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
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

export const FewBars: Story = {
  name: 'Few Bars (20)',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addCandlestickSeries();
series.setData(data.slice(0, 20)); // Only 20 bars`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(20));
    return container;
  },
};

export const WithoutLastPriceLine: Story = {
  name: 'Without Last Price Line',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: false },
});
const series = chart.addCandlestickSeries();
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL', lastPriceLine: { visible: false } });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};
