import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Indicator Panes',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates addIndicator() with indicators rendered in separate panes below the main chart.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const RSIAndMACD: Story = {
  name: 'RSI + MACD Panes',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addCandlestickSeries();
series.setData(data);

chart.addIndicator('rsi', {
  source: series, params: { period: 14 }, color: '#00e5ff', label: 'RSI 14',
});
chart.addIndicator('macd', {
  source: series,
  params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  color: '#ff6b6b', label: 'MACD',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    // SMA 20 overlay
    chart.addIndicator('sma', {
      source: candleSeries,
      params: { period: 20 },
      color: '#f4c430',
      lineWidth: 2,
      label: 'SMA 20',
    });

    // RSI pane
    chart.addIndicator('rsi', {
      source: candleSeries,
      params: { period: 14 },
      color: '#00e5ff',
      label: 'RSI 14',
    });

    // MACD pane
    chart.addIndicator('macd', {
      source: candleSeries,
      params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      color: '#ff6b6b',
      label: 'MACD',
    });

    return container;
  },
};

export const AllIndicators: Story = {
  name: 'All Indicators',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('vwap', { source: series, color: '#ff9800', label: 'VWAP' });
chart.addIndicator('bollinger', {
  source: series, params: { period: 20, stdDev: 2 }, label: 'BB 20,2',
});
chart.addIndicator('stochastic', {
  source: series, params: { kPeriod: 14, dPeriod: 3 }, label: 'Stoch',
});
chart.addIndicator('atr', { source: series, params: { period: 14 }, label: 'ATR' });
chart.addIndicator('adx', { source: series, params: { period: 14 }, label: 'ADX' });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '800px';
    const chart = createChart(container, { autoSize: true });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    // VWAP overlay
    chart.addIndicator('vwap', {
      source: candleSeries,
      color: '#ff9800',
      lineWidth: 2,
      label: 'VWAP',
    });

    // Bollinger overlay
    chart.addIndicator('bollinger', {
      source: candleSeries,
      params: { period: 20, stdDev: 2 },
      color: '#ab47bc',
      label: 'BB 20,2',
    });

    // RSI pane
    chart.addIndicator('rsi', {
      source: candleSeries,
      params: { period: 14 },
      color: '#00e5ff',
      label: 'RSI 14',
    });

    // Stochastic pane
    chart.addIndicator('stochastic', {
      source: candleSeries,
      params: { kPeriod: 14, dPeriod: 3 },
      color: '#26a69a',
      label: 'Stoch 14,3',
    });

    // ATR pane
    chart.addIndicator('atr', {
      source: candleSeries,
      params: { period: 14 },
      color: '#ef5350',
      label: 'ATR 14',
    });

    // ADX pane
    chart.addIndicator('adx', {
      source: candleSeries,
      params: { period: 14 },
      color: '#ffd54f',
      label: 'ADX 14',
    });

    return container;
  },
};
