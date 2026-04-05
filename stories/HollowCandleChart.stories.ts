import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Chart Types/Hollow Candle',
  parameters: {
    docs: {
      description: {
        component:
          'Hollow candle chart: bullish candles are drawn hollow (border only), bearish candles are filled.',
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
        code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'hollow-candle' });
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'hollow-candle' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Hollow candle</strong> charts use the same OHLC data as regular candlesticks but render bullish bars as hollow (outline only) ' +
        'and bearish bars as filled. This provides an additional visual dimension: the fill state indicates bullish vs bearish direction, ' +
        'while the color can encode a separate dimension such as trend continuation.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'hollow-candle' });
series.setData(data);
      `,
    });
  },
};

export const CustomColors: Story = {
  name: 'Custom Colors',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addSeries({
  type: 'hollow-candle',
  upColor: '#00e5ff',
  downColor: '#ff4081',
  wickColor: '#aaaaaa',
});
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'hollow-candle',
      upColor: '#00e5ff',
      downColor: '#ff4081',
      wickColor: '#aaaaaa',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'Customize hollow candle colors with <code>upColor</code>, <code>downColor</code>, and <code>wickColor</code>. ' +
        'The <code>wickColor</code> option sets a uniform wick color for both directions.',
      code: `
const series = chart.addSeries({
  type: 'hollow-candle',
  upColor: '#00e5ff',    // Bullish candle border/fill
  downColor: '#ff4081',  // Bearish candle fill
  wickColor: '#aaaaaa',  // Wick color for both directions
});
series.setData(data);
      `,
    });
  },
};
