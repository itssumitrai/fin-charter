import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { generateOHLCV, createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Chart Types/Candlestick',
  parameters: {
    docs: {
      description: {
        component: 'Classic OHLC candlestick chart. Green candles for bullish bars, red for bearish.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Default',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data); // Array of { time, open, high, low, close, volume }`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>candlestick chart</strong> is the most common financial chart type, showing open, high, low, and close (OHLC) prices for each time period. ' +
        'Green (bullish) candles indicate the close was higher than the open; red (bearish) candles indicate the close was lower.\n' +
        'Pass an array of <code>{ time, open, high, low, close, volume }</code> objects to <code>series.setData()</code>.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data); // Array of { time, open, high, low, close, volume }
      `,
    });
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({
  type: 'candlestick',
  upColor: '#00e5ff',
  downColor: '#ff4081',
  wickUpColor: '#00e5ff',
  wickDownColor: '#ff4081',
});
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick',
      upColor: '#00e5ff',
      downColor: '#ff4081',
      wickUpColor: '#00e5ff',
      wickDownColor: '#ff4081',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'Customize candle colors by passing <code>upColor</code>, <code>downColor</code>, <code>wickUpColor</code>, and <code>wickDownColor</code> to <code>addSeries({ type: \'candlestick\', ... })</code>. ' +
        'You can also set <code>borderUpColor</code> and <code>borderDownColor</code> for the candle body border.',
      code: `
const series = chart.addSeries({
  type: 'candlestick',
  upColor: '#00e5ff',       // Bullish candle body
  downColor: '#ff4081',     // Bearish candle body
  wickUpColor: '#00e5ff',   // Bullish wick color
  wickDownColor: '#ff4081', // Bearish wick color
});
series.setData(data);
      `,
    });
  },
};

export const FewBars: Story = {
  name: 'Few Bars (20)',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'candlestick' });
series.setData(data.slice(0, 20)); // Only 20 bars`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(20));
    return withDocs(container, {
      description:
        'The chart automatically adjusts its scale to fit any number of bars. Here only 20 bars are rendered, demonstrating that the chart handles small datasets gracefully.',
      code: `
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data.slice(0, 20)); // Only 20 bars
      `,
    });
  },
};

export const WithoutLastPriceLine: Story = {
  name: 'Without Last Price Line',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: false },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL', lastPriceLine: { visible: false } });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'By default, a horizontal dashed line is drawn at the latest close price. ' +
        'Disable it by setting <code>lastPriceLine: { visible: false }</code> in chart options.',
      code: `
const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: false },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);
      `,
    });
  },
};
