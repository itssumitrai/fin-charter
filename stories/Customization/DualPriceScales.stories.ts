import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { computeSMA } from 'fin-charter/indicators';
import type { Bar } from '../../src/core/types';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
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
  symbol: 'AAPL',
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: true },
});

chart.addSeries({ type: 'candlestick' }); // right scale (default)
chart.addSeries({ type: 'line', color: '#f4c430', priceScaleId: 'left' });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: true },
    });

    // Primary series on the right scale (default)
    const candleSeries = chart.addSeries({ type: 'candlestick' });
    candleSeries.setData(AAPL_DAILY);

    // SMA on left scale
    const closes = new Float64Array(AAPL_DAILY.map((b) => b.close));
    const smaValues = computeSMA(closes, AAPL_DAILY.length, 20);
    const smaSeries = chart.addSeries({ type: 'line', color: '#f4c430', lineWidth: 2, priceScaleId: 'left' });
    smaSeries.setData(indicatorToLineBars(AAPL_DAILY, smaValues));

    return withDocs(container, {
      description:
        '<strong>Dual Price Scales</strong> — Enable both left and right price scales simultaneously. ' +
        'Assign a series to a specific scale with <code>priceScaleId: \'left\'</code>. ' +
        'Useful for overlaying instruments with different price ranges.',
      code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: true },
});

// Candlesticks on right scale (default)
chart.addSeries({ type: 'candlestick' });

// SMA line on left scale
chart.addSeries({ type: 'line', color: '#f4c430', priceScaleId: 'left' });`,
    });
  },
};

export const RightOnly: Story = {
  name: 'Right Scale Only (Default)',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
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
      symbol: 'AAPL',
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: false },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Right Scale Only</strong> — The default configuration with only the right price scale visible. ' +
        'Set <code>leftPriceScale: { visible: false }</code> to explicitly disable the left scale.',
      code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: false },
});`,
    });
  },
};

export const LeftOnly: Story = {
  name: 'Left Scale Only',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
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
      symbol: 'AAPL',
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: true },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Left Scale Only</strong> — Show only the left price scale by disabling the right. ' +
        'Set <code>rightPriceScale: { visible: false }</code> and <code>leftPriceScale: { visible: true }</code>.',
      code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  rightPriceScale: { visible: false },
  leftPriceScale: { visible: true },
});`,
    });
  },
};
