import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Last Price Line',
  parameters: {
    docs: {
      description: {
        component:
          'The last price line is a horizontal dashed line anchored to the most recent ' +
          "close price. It helps traders quickly see the current price's position on the " +
          'chart. It can be shown or hidden via the lastPriceLine.visible option.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Visible: Story = {
  name: 'Last Price Line Visible',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  lastPriceLine: { visible: true },
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
      lastPriceLine: { visible: true },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const Hidden: Story = {
  name: 'Last Price Line Hidden',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  lastPriceLine: { visible: false },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      lastPriceLine: { visible: false },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const OnLineSeries: Story = {
  name: 'Last Price Line on Line Series',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  lastPriceLine: { visible: true },
});
const series = chart.addLineSeries({ color: '#00e5ff' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      lastPriceLine: { visible: true },
    });
    const series = chart.addLineSeries({ color: '#00e5ff', lineWidth: 2 });
    series.setData(AAPL_DAILY);
    return container;
  },
};
