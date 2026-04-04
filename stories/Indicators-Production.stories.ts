import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

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

    return container;
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

    return container;
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

    return container;
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

    return container;
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

    return container;
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

    return container;
  },
};
