import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/OHLC Legend & Tooltip',
  parameters: {
    docs: {
      description: {
        component:
          'The OHLC legend and tooltip update live as you move the crosshair over the chart. ' +
          'The legend shows open/high/low/close values in the top-left corner, and the ' +
          'tooltip follows the cursor to display the same data in a floating panel.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const LegendAndTooltip: Story = {
  name: 'OHLC Legend & Tooltip',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  tooltip: { enabled: true },
});
const series = chart.addCandlestickSeries();
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      tooltip: { enabled: true },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const TooltipDisabled: Story = {
  name: 'Legend Only (No Tooltip)',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  tooltip: { enabled: false },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      tooltip: { enabled: false },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const WithVolume: Story = {
  name: 'Legend + Volume Overlay',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  tooltip: { enabled: true },
  volume: { visible: true },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      tooltip: { enabled: true },
      volume: { visible: true },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};
