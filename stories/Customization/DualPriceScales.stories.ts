import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { computeSMA } from 'fin-charter/indicators';
import type { Bar } from '../../src/core/types';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Customization/Dual Price Scales',
  parameters: {
    docs: {
      description: {
        component:
          'Enable both left and right price scales simultaneously. ' +
          'This is useful when overlaying series with different value ranges.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

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

export const Default: Story = {
  name: 'Left & Right Price Scales',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: true },
});

chart.addCandlestickSeries(); // right scale (default)
chart.addLineSeries({ color: '#f4c430', priceScaleId: 'left' });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: true },
    });

    // Primary series on the right scale (default)
    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    // SMA on left scale
    const closes = new Float64Array(AAPL_DAILY.map((b) => b.close));
    const smaValues = computeSMA(closes, AAPL_DAILY.length, 20);
    const smaSeries = chart.addLineSeries({ color: '#f4c430', lineWidth: 2, priceScaleId: 'left' });
    smaSeries.setData(indicatorToLineBars(AAPL_DAILY, smaValues));

    return container;
  },
};

export const RightOnly: Story = {
  name: 'Right Scale Only (Default)',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: false },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: false },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const LeftOnly: Story = {
  name: 'Left Scale Only',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  rightPriceScale: { visible: false },
  leftPriceScale: { visible: true },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: true },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};
