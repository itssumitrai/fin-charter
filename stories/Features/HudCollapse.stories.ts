import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Features/HUD Collapse',
  parameters: {
    docs: {
      description: {
        component:
          'TV-style global HUD collapse. The HUD displays OHLC values and real-time indicator readings ' +
          'under the crosshair. Click the chevron (^) in the top-right corner of the HUD to collapse ' +
          'all indicator rows at once. Click again to expand. Individual rows can be toggled independently ' +
          'via the visibility eye icon in the HUD.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const HudCollapseDemo: Story = {
  name: 'HUD Collapse',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

// The HUD renders automatically when indicators are present.
// Use the chevron button in the HUD header to collapse all rows at once.
const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Overlay indicators appear in the main HUD row
chart.addIndicator('sma', { source: series, params: { period: 20 }, color: '#f4c430', label: 'SMA 20' });
chart.addIndicator('ema', { source: series, params: { period: 50 }, color: '#00e5ff', label: 'EMA 50' });
chart.addIndicator('supertrend', { source: series, params: { period: 10, multiplier: 3 }, color: '#4CAF50', label: 'ST(10,3)' });

// Separate-pane indicators get their own collapsible HUD row
chart.addIndicator('rsi', { source: series, params: { period: 14 }, color: '#ab47bc', label: 'RSI 14' });
chart.addIndicator('macd', { source: series, params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }, color: '#ff6b6b', label: 'MACD' });
chart.addIndicator('mfi', { source: series, params: { period: 14 }, color: '#E91E63', label: 'MFI 14' });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '900px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick', label: 'AAPL' });
    series.setData(generateOHLCV(200));

    // Overlay indicators shown in main HUD
    chart.addIndicator('sma', {
      source: series,
      params: { period: 20 },
      color: '#f4c430',
      lineWidth: 2,
      label: 'SMA 20',
    });

    chart.addIndicator('ema', {
      source: series,
      params: { period: 50 },
      color: '#00e5ff',
      lineWidth: 2,
      label: 'EMA 50',
    });

    chart.addIndicator('supertrend', {
      source: series,
      params: { period: 10, multiplier: 3 },
      color: '#4CAF50',
      label: 'ST(10,3)',
    });

    // Separate-pane indicators — each gets its own collapsible HUD row
    chart.addIndicator('rsi', {
      source: series,
      params: { period: 14 },
      color: '#ab47bc',
      label: 'RSI 14',
    });

    chart.addIndicator('macd', {
      source: series,
      params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      color: '#ff6b6b',
      label: 'MACD',
    });

    chart.addIndicator('mfi', {
      source: series,
      params: { period: 14 },
      color: '#E91E63',
      label: 'MFI 14',
    });

    return withDocs(container, {
      description:
        '<strong>Collapse or expand</strong> the HUD indicator rows to save screen space. ' +
        'Click the <strong>chevron (^)</strong> in the top-right corner of the HUD to collapse all indicator rows at once. ' +
        'Individual rows can be toggled independently via the <strong>visibility eye icon</strong> in the HUD.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Overlay indicators appear in the main HUD row
chart.addIndicator('sma', {
  source: series, params: { period: 20 }, color: '#f4c430', label: 'SMA 20',
});

// Separate-pane indicators get their own collapsible HUD row
chart.addIndicator('rsi', {
  source: series, params: { period: 14 }, color: '#ab47bc', label: 'RSI 14',
});
      `,
    });
  },
};
