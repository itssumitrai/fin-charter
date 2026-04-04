import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { computeSMA, computeEMA } from 'fin-charter/indicators';
import type { Bar } from '../src/core/types';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Indicators/Moving Averages',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates built-in indicator functions: computeSMA and computeEMA. ' +
          'Indicators are computed on close prices and overlaid as line series.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/** Convert close values from an indicator Float64Array back to Bar[] for setData(). */
function indicatorToLineBars(bars: Bar[], values: Float64Array): Bar[] {
  const result: Bar[] = [];
  for (let i = 0; i < bars.length; i++) {
    const v = values[i];
    if (!isNaN(v)) {
      result.push({ time: bars[i].time, open: v, high: v, low: v, close: v, volume: 0 });
    }
  }
  return result;
}

export const SMAandEMA: Story = {
  name: 'SMA 20 + EMA 20',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';
import { computeSMA, computeEMA } from 'fin-charter/indicators';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(bars);

const closes = new Float64Array(bars.map(b => b.close));
const sma = computeSMA(closes, bars.length, 20);
const ema = computeEMA(closes, bars.length, 20);

chart.addLineSeries({ color: '#f4c430', lineWidth: 2 }).setData(smaLineBars);
chart.addLineSeries({ color: '#00e5ff', lineWidth: 2 }).setData(emaLineBars);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const bars = AAPL_DAILY;
    const closes = new Float64Array(bars.map((b) => b.close));

    // Main candlestick chart
    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(bars);

    // SMA 20 overlay
    const smaValues = computeSMA(closes, bars.length, 20);
    const smaSeries = chart.addLineSeries({ color: '#f4c430', lineWidth: 2 });
    smaSeries.setData(indicatorToLineBars(bars, smaValues));

    // EMA 20 overlay
    const emaValues = computeEMA(closes, bars.length, 20);
    const emaSeries = chart.addLineSeries({ color: '#00e5ff', lineWidth: 2 });
    emaSeries.setData(indicatorToLineBars(bars, emaValues));

    return container;
  },
};

export const SMAOnly: Story = {
  name: 'SMA 50 Overlay',
  parameters: {
    docs: {
      source: {
        code: `const closes = new Float64Array(bars.map(b => b.close));
const sma50 = computeSMA(closes, bars.length, 50);
const smaSeries = chart.addLineSeries({ color: '#ff9800', lineWidth: 2 });
smaSeries.setData(smaLineBars);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const bars = AAPL_DAILY;
    const closes = new Float64Array(bars.map((b) => b.close));

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(bars);

    const smaValues = computeSMA(closes, bars.length, 50);
    const smaSeries = chart.addLineSeries({ color: '#ff9800', lineWidth: 2 });
    smaSeries.setData(indicatorToLineBars(bars, smaValues));

    return container;
  },
};

export const EMAOnly: Story = {
  name: 'EMA 12 + EMA 26',
  parameters: {
    docs: {
      source: {
        code: `const closes = new Float64Array(bars.map(b => b.close));
const ema12 = computeEMA(closes, bars.length, 12);
const ema26 = computeEMA(closes, bars.length, 26);

chart.addLineSeries({ color: '#ff6b6b', lineWidth: 2 }).setData(ema12Bars);
chart.addLineSeries({ color: '#00e5ff', lineWidth: 2 }).setData(ema26Bars);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const bars = AAPL_DAILY;
    const closes = new Float64Array(bars.map((b) => b.close));

    const lineSeries = chart.addLineSeries({ color: '#aaaaaa', lineWidth: 1 });
    lineSeries.setData(bars);

    const ema12 = computeEMA(closes, bars.length, 12);
    const ema12Series = chart.addLineSeries({ color: '#ff6b6b', lineWidth: 2 });
    ema12Series.setData(indicatorToLineBars(bars, ema12));

    const ema26 = computeEMA(closes, bars.length, 26);
    const ema26Series = chart.addLineSeries({ color: '#00e5ff', lineWidth: 2 });
    ema26Series.setData(indicatorToLineBars(bars, ema26));

    return container;
  },
};
