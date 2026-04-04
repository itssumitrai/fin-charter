import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Volume Overlay',
  parameters: {
    docs: {
      description: {
        component:
          'Candlestick chart with the built-in volume overlay enabled. Volume bars are rendered ' +
          'at the bottom of the chart using the same up/down color conventions as the candles.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Volume Enabled',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: { visible: true },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      volume: { visible: true },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const description = 'Enable the built-in <strong>volume overlay</strong> with <code>volume: { visible: true }</code>. Volume bars render at the bottom of the chart using the same up/down color conventions as the candlesticks, providing a quick visual read on trading activity.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: { visible: true },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);`;

    return withDocs(container, { description, code });
  },
};

export const CustomVolumeColors: Story = {
  name: 'Custom Volume Colors',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: {
    visible: true,
    upColor: 'rgba(0, 229, 255, 0.5)',
    downColor: 'rgba(255, 64, 129, 0.5)',
  },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      volume: {
        visible: true,
        upColor: 'rgba(0, 229, 255, 0.5)',
        downColor: 'rgba(255, 64, 129, 0.5)',
      },
    });
    const series = chart.addSeries({ type: 'candlestick',
      upColor: '#00e5ff',
      downColor: '#ff4081',
      wickUpColor: '#00e5ff',
      wickDownColor: '#ff4081',
    });
    series.setData(AAPL_DAILY);

    const description = 'Customize volume bar colors with <code>upColor</code> and <code>downColor</code> in the <code>volume</code> options. Use rgba values for semi-transparent overlays that blend with the chart background. Pair with matching candlestick colors for a cohesive look.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: {
    visible: true,
    upColor: 'rgba(0, 229, 255, 0.5)',
    downColor: 'rgba(255, 64, 129, 0.5)',
  },
});`;

    return withDocs(container, { description, code });
  },
};
