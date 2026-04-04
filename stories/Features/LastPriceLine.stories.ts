import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
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
  symbol: 'AAPL',
  lastPriceLine: { visible: true },
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
      lastPriceLine: { visible: true },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const description = 'The <strong>last price line</strong> is a horizontal dashed line anchored to the most recent close price. It helps traders quickly see where the current price sits on the chart. Enable it with <code>lastPriceLine: { visible: true }</code>.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: true },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);`;

    return withDocs(container, { description, code });
  },
};

export const Hidden: Story = {
  name: 'Last Price Line Hidden',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: false },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      lastPriceLine: { visible: false },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const description = 'Hide the last price line by setting <code>lastPriceLine: { visible: false }</code>. This gives a cleaner chart when the current price indicator is not needed.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: false },
});`;

    return withDocs(container, { description, code });
  },
};

export const OnLineSeries: Story = {
  name: 'Last Price Line on Line Series',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: true },
});
const series = chart.addSeries({ type: 'line', color: '#00e5ff' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      lastPriceLine: { visible: true },
    });
    const series = chart.addSeries({ type: 'line', color: '#00e5ff', lineWidth: 2 });
    series.setData(AAPL_DAILY);

    const description = 'The <strong>last price line</strong> works with any series type, including line series. The dashed line matches the series color and tracks the final data point.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  lastPriceLine: { visible: true },
});
const series = chart.addSeries({ type: 'line', color: '#00e5ff' });
series.setData(data);`;

    return withDocs(container, { description, code });
  },
};
