import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Customization/Price Formatter',
  parameters: {
    docs: {
      description: {
        component:
          'Custom price formatters let you control how price values are displayed on the Y-axis ' +
          'and in the OHLC legend. Pass a priceFormatter function to createChart().',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const CurrencyFormat: Story = {
  name: 'Currency Format ($XXX.XX)',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      priceFormatter: (price: number) => `$${price.toFixed(2)}`,
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CompactFormat: Story = {
  name: 'Compact Format (1.5K, 2.3M)',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      priceFormatter: (price: number) => {
        if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`;
        if (price >= 1_000) return `${(price / 1_000).toFixed(1)}K`;
        return price.toFixed(2);
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const BasisPoints: Story = {
  name: 'Basis Points (×100)',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      priceFormatter: (price: number) => `${(price * 100).toFixed(0)} bps`,
    });
    const series = chart.addLineSeries({ color: '#9c27b0', lineWidth: 2 });
    // Normalize data to a 0-1 scale for demonstration
    const base = AAPL_DAILY[0].close;
    const normalized = AAPL_DAILY.map((b) => ({
      ...b,
      open: b.open / base,
      high: b.high / base,
      low: b.low / base,
      close: b.close / base,
    }));
    series.setData(normalized);
    return container;
  },
};
