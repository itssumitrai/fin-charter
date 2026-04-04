import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import {
  computeVWAP,
  computeStochastic,
  computeATR,
  computeADX,
  computeOBV,
  computeWilliamsR,
} from 'fin-charter/indicators';
import type { Bar } from '../src/core/types';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Indicators/Extended Indicators',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates the 6 new indicator functions: VWAP, Stochastic, ATR, ADX, OBV, and Williams %R.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/**
 * Convert raw indicator output (times + values Float64Arrays) to Bar[] for setData().
 * Skips NaN values.
 */
function indicatorToLineBars(times: Float64Array, values: Float64Array, length: number): Bar[] {
  const bars: Bar[] = [];
  for (let i = 0; i < length; i++) {
    if (isNaN(values[i])) continue;
    const v = values[i];
    bars.push({ time: times[i], open: v, high: v, low: v, close: v });
  }
  return bars;
}

// ─── VWAP (raw compute — overlay) ────────────────────────────────────────────

export const VWAPOverlay: Story = {
  name: 'VWAP Overlay',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';
import { computeVWAP } from 'fin-charter/indicators';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(bars);

const vwap = computeVWAP(high, low, close, volume, bars.length);
chart.addLineSeries({ color: '#ff9800', lineWidth: 2 }).setData(vwapBars);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    // Access the underlying ColumnStore via the DataLayer
    const store = (candleSeries as any).getDataLayer().store;
    const len: number = store.length;

    const vwapValues = computeVWAP(store.high, store.low, store.close, store.volume, len);

    const vwapSeries = chart.addLineSeries({ color: '#ff9800', lineWidth: 2 });
    vwapSeries.setData(indicatorToLineBars(store.time, vwapValues, len));

    return withDocs(container, {
      description:
        '<strong>VWAP (Volume-Weighted Average Price)</strong> — Measures the average price weighted by volume throughout the session. Computed via <code>computeVWAP(high, low, close, volume, length)</code>. Used as an overlay to identify whether the current price is trading above or below fair value.',
      code: `import { computeVWAP } from 'fin-charter/indicators';

const vwap = computeVWAP(high, low, close, volume, bars.length);
chart.addLineSeries({ color: '#ff9800', lineWidth: 2 }).setData(vwapBars);`,
    });
  },
};

// ─── Stochastic (addIndicator) ───────────────────────────────────────────────

export const StochasticOscillator: Story = {
  name: 'Stochastic Oscillator',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('stochastic', {
  source: candleSeries,
  params: { kPeriod: 14, dPeriod: 3 },
  color: '#22AB94',
  label: 'Stoch 14,3',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    chart.addIndicator('stochastic', {
      source: candleSeries,
      params: { kPeriod: 14, dPeriod: 3 },
      color: '#22AB94',
      label: 'Stoch 14,3',
    });

    return withDocs(container, {
      description:
        '<strong>Stochastic Oscillator</strong> — A momentum indicator comparing a closing price to its price range over a given period. Key parameters: <code>kPeriod</code> (lookback, default 14) and <code>dPeriod</code> (signal smoothing, default 3). Values above 80 indicate overbought; below 20 indicate oversold.',
      code: `chart.addIndicator('stochastic', {
  source: candleSeries,
  params: { kPeriod: 14, dPeriod: 3 },
  color: '#22AB94',
  label: 'Stoch 14,3',
});`,
    });
  },
};

// ─── ATR (addIndicator) ──────────────────────────────────────────────────────

export const ATRIndicator: Story = {
  name: 'ATR Indicator',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('atr', {
  source: candleSeries,
  params: { period: 14 },
  color: '#F7525F',
  label: 'ATR 14',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    chart.addIndicator('atr', {
      source: candleSeries,
      params: { period: 14 },
      color: '#F7525F',
      label: 'ATR 14',
    });

    return withDocs(container, {
      description:
        '<strong>ATR (Average True Range)</strong> — Measures market volatility by computing the average of true ranges over a <code>period</code> (default 14). Higher ATR values indicate greater volatility. Displayed in a separate pane below the chart.',
      code: `chart.addIndicator('atr', {
  source: candleSeries,
  params: { period: 14 },
  color: '#F7525F',
  label: 'ATR 14',
});`,
    });
  },
};

// ─── ADX (addIndicator) ──────────────────────────────────────────────────────

export const ADXIndicator: Story = {
  name: 'ADX Indicator',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('adx', {
  source: candleSeries,
  params: { period: 14 },
  color: '#ffd54f',
  label: 'ADX 14',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    chart.addIndicator('adx', {
      source: candleSeries,
      params: { period: 14 },
      color: '#ffd54f',
      label: 'ADX 14',
    });

    return withDocs(container, {
      description:
        '<strong>ADX (Average Directional Index)</strong> — Measures the <em>strength</em> of a trend regardless of direction. A <code>period</code> of 14 is standard. ADX above 25 signals a strong trend; below 20 suggests a weak or ranging market.',
      code: `chart.addIndicator('adx', {
  source: candleSeries,
  params: { period: 14 },
  color: '#ffd54f',
  label: 'ADX 14',
});`,
    });
  },
};

// ─── OBV (addIndicator) ──────────────────────────────────────────────────────

export const OBVIndicator: Story = {
  name: 'OBV Indicator',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('obv', {
  source: candleSeries,
  color: '#7c4dff',
  label: 'OBV',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    chart.addIndicator('obv', {
      source: candleSeries,
      color: '#7c4dff',
      label: 'OBV',
    });

    return withDocs(container, {
      description:
        '<strong>OBV (On-Balance Volume)</strong> — A cumulative volume-based indicator that adds volume on up-closes and subtracts on down-closes. Rising OBV confirms an uptrend; divergence between OBV and price can signal a reversal. No additional parameters required.',
      code: `chart.addIndicator('obv', {
  source: candleSeries,
  color: '#7c4dff',
  label: 'OBV',
});`,
    });
  },
};

// ─── Williams %R (addIndicator) ──────────────────────────────────────────────

export const WilliamsRIndicator: Story = {
  name: 'Williams %R Indicator',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('williams-r', {
  source: candleSeries,
  params: { period: 14 },
  color: '#00e5ff',
  label: 'W%R 14',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    chart.addIndicator('williams-r', {
      source: candleSeries,
      params: { period: 14 },
      color: '#00e5ff',
      label: 'W%R 14',
    });

    return withDocs(container, {
      description:
        '<strong>Williams %R</strong> — A momentum oscillator ranging from 0 to -100 that measures overbought/oversold levels. Key parameter: <code>period</code> (default 14). Values above -20 indicate overbought; below -80 indicate oversold conditions.',
      code: `chart.addIndicator('williams-r', {
  source: candleSeries,
  params: { period: 14 },
  color: '#00e5ff',
  label: 'W%R 14',
});`,
    });
  },
};
