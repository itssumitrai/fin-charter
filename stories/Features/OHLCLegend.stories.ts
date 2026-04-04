import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
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
      tooltip: { enabled: true },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const description = 'The <strong>OHLC legend</strong> and <strong>tooltip</strong> update live as you move the crosshair over the chart. The legend shows Open/High/Low/Close values in the top-left corner, while the tooltip follows the cursor as a floating panel. Enable the tooltip with <code>tooltip: { enabled: true }</code> in chart options.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  tooltip: { enabled: true },
});
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);`;

    return withDocs(container, { description, code });
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
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const description = 'Disable the floating tooltip with <code>tooltip: { enabled: false }</code>. The <strong>OHLC legend</strong> in the top-left corner still updates as you hover, providing a cleaner look when the tooltip panel is not needed.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  tooltip: { enabled: false },
});`;

    return withDocs(container, { description, code });
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
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const description = 'Combine the <strong>OHLC legend</strong> with a <strong>volume overlay</strong> for a complete data view. The legend and tooltip include volume information when <code>volume: { visible: true }</code> is set alongside the tooltip.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  tooltip: { enabled: true },
  volume: { visible: true },
});`;

    return withDocs(container, { description, code });
  },
};
