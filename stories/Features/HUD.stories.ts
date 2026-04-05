import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/HUD',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates the HUD (Heads-Up Display) with multiple series and indicators. ' +
          'The HUD shows OHLC values, series labels, and indicator values under the crosshair.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const FullHUD: Story = {
  name: 'Full HUD',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick', label: 'AAPL' });
series.setData(data);

chart.addIndicator('sma', {
  source: series, params: { period: 20 }, color: '#f4c430', label: 'SMA 20',
});
chart.addIndicator('rsi', {
  source: series, params: { period: 14 }, color: '#ab47bc', label: 'RSI',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '700px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addSeries({ type: 'candlestick', label: 'AAPL' });
    candleSeries.setData(AAPL_DAILY);

    // SMA 20 overlay
    chart.addIndicator('sma', {
      source: candleSeries,
      params: { period: 20 },
      color: '#f4c430',
      lineWidth: 2,
      label: 'SMA 20',
    });

    // EMA 50 overlay
    chart.addIndicator('ema', {
      source: candleSeries,
      params: { period: 50 },
      color: '#00e5ff',
      lineWidth: 2,
      label: 'EMA 50',
    });

    // RSI pane
    chart.addIndicator('rsi', {
      source: candleSeries,
      params: { period: 14 },
      color: '#ab47bc',
      label: 'RSI',
    });

    // MACD pane
    chart.addIndicator('macd', {
      source: candleSeries,
      params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      color: '#ff6b6b',
      label: 'MACD',
    });

    const description = 'The <strong>HUD (Heads-Up Display)</strong> shows real-time OHLC values, series labels, and indicator values as the crosshair moves over the chart. Each indicator (overlay or separate pane) automatically adds a row to the HUD. Hover over the chart to see live values update.';
    const code = `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const candleSeries = chart.addSeries({ type: 'candlestick', label: 'AAPL' });
candleSeries.setData(data);

// SMA 20 overlay
chart.addIndicator('sma', {
  source: candleSeries,
  params: { period: 20 },
  color: '#f4c430',
  lineWidth: 2,
  label: 'SMA 20',
});

// EMA 50 overlay
chart.addIndicator('ema', {
  source: candleSeries,
  params: { period: 50 },
  color: '#00e5ff',
  lineWidth: 2,
  label: 'EMA 50',
});

// RSI pane
chart.addIndicator('rsi', {
  source: candleSeries,
  params: { period: 14 },
  color: '#ab47bc',
  label: 'RSI',
});

// MACD pane
chart.addIndicator('macd', {
  source: candleSeries,
  params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  color: '#ff6b6b',
  label: 'MACD',
});`;

    return withDocs(container, { description, code });
  },
};
