import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Customization/Custom Fonts',
  parameters: {
    docs: {
      description: {
        component:
          'The chart uses the fontFamily and fontSize from layout options for all text elements ' +
          'including axis labels, the OHLC legend, and the tooltip.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Monospace: Story = {
  name: 'Monospace Font',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 11,
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const SystemSansSerif: Story = {
  name: 'System Sans-Serif',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 12,
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const LargeFontSize: Story = {
  name: 'Large Font Size (14px)',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 14,
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};
