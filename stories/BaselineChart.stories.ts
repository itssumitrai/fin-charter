import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Chart Types/Baseline',
  parameters: {
    docs: {
      description: {
        component:
          'Baseline chart that splits into two color zones above and below a reference price level.',
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
const series = chart.addSeries({ type: 'baseline' });
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'baseline' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'A <strong>baseline chart</strong> splits the price area into two color zones around a reference price. ' +
        'Areas above the baseline are filled with one color and areas below with another, making it easy to see when an instrument is trading above or below a key level.\n' +
        'By default the baseline is set to the first data point\'s close price.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'baseline' });
series.setData(data);
      `,
    });
  },
};

export const CustomBaseline: Story = {
  name: 'Custom Baseline Value',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addSeries({
  type: 'baseline',
  basePrice: 110,
  topLineColor: '#00e5ff',
  bottomLineColor: '#ff6b6b',
  topFillColor: 'rgba(0, 229, 255, 0.28)',
  bottomFillColor: 'rgba(255, 107, 107, 0.28)',
});
series.setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'baseline',
      basePrice: 110,
      topLineColor: '#00e5ff',
      bottomLineColor: '#ff6b6b',
      topFillColor: 'rgba(0, 229, 255, 0.28)',
      bottomFillColor: 'rgba(255, 107, 107, 0.28)',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'Set a custom <code>basePrice</code> to define the split point. Configure the colors for each zone independently: ' +
        '<code>topLineColor</code> / <code>topFillColor</code> for above the baseline, and <code>bottomLineColor</code> / <code>bottomFillColor</code> for below.',
      code: `
const series = chart.addSeries({
  type: 'baseline',
  basePrice: 110,                                   // Split at $110
  topLineColor: '#00e5ff',                          // Line above baseline
  bottomLineColor: '#ff6b6b',                       // Line below baseline
  topFillColor: 'rgba(0, 229, 255, 0.28)',          // Fill above baseline
  bottomFillColor: 'rgba(255, 107, 107, 0.28)',     // Fill below baseline
});
series.setData(data);
      `,
    });
  },
};
