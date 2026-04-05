import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Chart Types/Line',
  parameters: {
    docs: {
      description: {
        component: 'Line chart connecting close prices across bars.',
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
const series = chart.addSeries({ type: 'line' });
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'line' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'A <strong>line chart</strong> connects the close price of each bar with a smooth polyline. ' +
        'It is the simplest chart type and is ideal for showing price trends at a glance.\n' +
        'The chart uses the <code>close</code> field from each data point for the Y value.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'line' });
series.setData(data); // Uses the 'close' field from each bar
      `,
    });
  },
};

export const CustomStyle: Story = {
  name: 'Custom Style',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addSeries({
  type: 'line',
  color: '#00e5ff',
  lineWidth: 2,
});
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'line',
      color: '#00e5ff',
      lineWidth: 2,
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'Customize the line appearance with <code>color</code> and <code>lineWidth</code>. ' +
        'Any valid CSS color value is accepted.',
      code: `
const series = chart.addSeries({
  type: 'line',
  color: '#00e5ff',   // Cyan line
  lineWidth: 2,       // 2px width
});
series.setData(data);
      `,
    });
  },
};

export const HighVolatility: Story = {
  name: 'High Volatility',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addSeries({ type: 'line', color: '#ff6b6b' });
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'line', color: '#ff6b6b' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'Line charts are effective for visualizing volatile price action. ' +
        'The red line color here is commonly used to indicate bearish or high-risk instruments.',
      code: `
const series = chart.addSeries({ type: 'line', color: '#ff6b6b' });
series.setData(data);
      `,
    });
  },
};
