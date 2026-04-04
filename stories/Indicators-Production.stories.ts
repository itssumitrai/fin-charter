import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Indicators/Production Indicators',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates the 6 production-ready indicators added in the latest release: ' +
          'Ichimoku Cloud, Parabolic SAR, Keltner Channel, Donchian Channel, CCI, and Pivot Points.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// ─── Ichimoku Cloud ──────────────────────────────────────────────────────────

export const IchimokuCloud: Story = {
  name: 'Ichimoku Cloud',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(bars);

chart.addIndicator('ichimoku', {
  source: series,
  params: { tenkanPeriod: 9, kijunPeriod: 26, senkouPeriod: 52 },
  label: 'Ichimoku',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('ichimoku', {
      source: series,
      params: { tenkanPeriod: 9, kijunPeriod: 26, senkouPeriod: 52 },
      label: 'Ichimoku',
    });

    return withDocs(container, {
      description:
        '<strong>Ichimoku Cloud</strong> — A comprehensive trend-following system that defines support/resistance, trend direction, and momentum at a glance. Key parameters: <code>tenkanPeriod</code> (conversion line, 9), <code>kijunPeriod</code> (base line, 26), and <code>senkouPeriod</code> (leading span B, 52). Price above the cloud is bullish; below is bearish.',
      code: `chart.addIndicator('ichimoku', {
  source: series,
  params: { tenkanPeriod: 9, kijunPeriod: 26, senkouPeriod: 52 },
  label: 'Ichimoku',
});`,
    });
  },
};

// ─── Parabolic SAR ───────────────────────────────────────────────────────────

export const ParabolicSAR: Story = {
  name: 'Parabolic SAR',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('parabolic-sar', {
  source: series,
  params: { afStep: 0.02, afMax: 0.20 },
  color: '#ff9800',
  label: 'PSAR',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('parabolic-sar', {
      source: series,
      params: { afStep: 0.02, afMax: 0.20 },
      color: '#ff9800',
      label: 'PSAR',
    });

    return withDocs(container, {
      description:
        '<strong>Parabolic SAR (Stop and Reverse)</strong> — A trend-following overlay that places dots above or below price to indicate potential stop-loss levels and trend direction. Key parameters: <code>afStep</code> (acceleration factor increment, 0.02) and <code>afMax</code> (maximum acceleration, 0.20).',
      code: `chart.addIndicator('parabolic-sar', {
  source: series,
  params: { afStep: 0.02, afMax: 0.20 },
  color: '#ff9800',
  label: 'PSAR',
});`,
    });
  },
};

// ─── Keltner Channel ─────────────────────────────────────────────────────────

export const KeltnerChannel: Story = {
  name: 'Keltner Channel',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('keltner', {
  source: series,
  params: { emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
  color: '#7c4dff',
  label: 'KC(20,2)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('keltner', {
      source: series,
      params: { emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
      color: '#7c4dff',
      label: 'KC(20,2)',
    });

    return withDocs(container, {
      description:
        '<strong>Keltner Channel</strong> — A volatility-based envelope plotted around an EMA. The upper and lower bands are offset by a multiple of ATR. Key parameters: <code>emaPeriod</code> (20), <code>atrPeriod</code> (10), and <code>multiplier</code> (2). Breakouts beyond the channel suggest strong momentum.',
      code: `chart.addIndicator('keltner', {
  source: series,
  params: { emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
  color: '#7c4dff',
  label: 'KC(20,2)',
});`,
    });
  },
};

// ─── Donchian Channel ────────────────────────────────────────────────────────

export const DonchianChannel: Story = {
  name: 'Donchian Channel',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('donchian', {
  source: series,
  params: { period: 20 },
  color: '#00e5ff',
  label: 'DC(20)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('donchian', {
      source: series,
      params: { period: 20 },
      color: '#00e5ff',
      label: 'DC(20)',
    });

    return withDocs(container, {
      description:
        '<strong>Donchian Channel</strong> — Plots the highest high and lowest low over the last <code>period</code> (default 20) bars, forming a price channel. Breakouts above the upper band or below the lower band signal potential trend starts.',
      code: `chart.addIndicator('donchian', {
  source: series,
  params: { period: 20 },
  color: '#00e5ff',
  label: 'DC(20)',
});`,
    });
  },
};

// ─── CCI ─────────────────────────────────────────────────────────────────────

export const CCIIndicator: Story = {
  name: 'CCI Indicator',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('cci', {
  source: series,
  params: { period: 20 },
  color: '#f06292',
  label: 'CCI(20)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('cci', {
      source: series,
      params: { period: 20 },
      color: '#f06292',
      label: 'CCI(20)',
    });

    return withDocs(container, {
      description:
        '<strong>CCI (Commodity Channel Index)</strong> — Measures how far the current price deviates from its statistical mean. Key parameter: <code>period</code> (default 20). Values above +100 indicate overbought; below -100 indicate oversold. Originally designed for commodities but widely used across all markets.',
      code: `chart.addIndicator('cci', {
  source: series,
  params: { period: 20 },
  color: '#f06292',
  label: 'CCI(20)',
});`,
    });
  },
};

// ─── Pivot Points ─────────────────────────────────────────────────────────────

export const PivotPoints: Story = {
  name: 'Pivot Points',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('pivot-points', {
  source: series,
  color: '#ffd54f',
  label: 'Pivots',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    chart.addIndicator('pivot-points', {
      source: series,
      color: '#ffd54f',
      label: 'Pivots',
    });

    return withDocs(container, {
      description:
        '<strong>Pivot Points</strong> — Calculates support and resistance levels from the previous period\'s high, low, and close. Displays the central pivot (P) along with support (S1, S2) and resistance (R1, R2) lines. No additional parameters required beyond the source series.',
      code: `chart.addIndicator('pivot-points', {
  source: series,
  color: '#ffd54f',
  label: 'Pivots',
});`,
    });
  },
};
