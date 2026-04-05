import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Price Lines',
  parameters: {
    docs: {
      description: {
        component:
          'Price lines are horizontal lines anchored to a fixed price level. ' +
          'Common uses include support/resistance levels, stop-loss, and target prices.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const SupportResistance: Story = {
  name: 'Support & Resistance',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

series.createPriceLine({
  price: 185, color: '#00E396', lineStyle: 'dashed', title: 'Support',
});
series.createPriceLine({
  price: 195, color: '#FF3B5C', lineStyle: 'dashed', title: 'Resistance',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    series.createPriceLine({
      price: 185,
      color: '#00E396',
      lineWidth: 1,
      lineStyle: 'dashed',
      title: 'Support',
      axisLabelVisible: true,
    });

    series.createPriceLine({
      price: 195,
      color: '#FF3B5C',
      lineWidth: 1,
      lineStyle: 'dashed',
      title: 'Resistance',
      axisLabelVisible: true,
    });

    const description = '<strong>Price lines</strong> are horizontal lines anchored to a fixed price level. Use <code>series.createPriceLine(options)</code> to add support/resistance levels, stop-loss markers, or target prices. Each line can be styled with custom colors, line styles (<code>solid</code>, <code>dashed</code>, <code>dotted</code>), and optional axis labels.';
    const code = `series.createPriceLine({
  price: 185,
  color: '#00E396',
  lineWidth: 1,
  lineStyle: 'dashed',
  title: 'Support',
  axisLabelVisible: true,
});

series.createPriceLine({
  price: 195,
  color: '#FF3B5C',
  lineWidth: 1,
  lineStyle: 'dashed',
  title: 'Resistance',
  axisLabelVisible: true,
});`;

    return withDocs(container, { description, code });
  },
};

export const TradeLevels: Story = {
  name: 'Trade Levels',
  parameters: {
    docs: {
      source: {
        code: `series.createPriceLine({
  price: 190, color: '#2196F3', lineStyle: 'solid', title: 'Entry',
});
series.createPriceLine({
  price: 182, color: '#FF3B5C', lineStyle: 'dotted', title: 'Stop Loss',
  axisLabelVisible: true, axisLabelColor: '#FF3B5C',
});
series.createPriceLine({
  price: 210, color: '#00E396', lineStyle: 'dotted', title: 'Target',
  axisLabelVisible: true, axisLabelColor: '#00E396',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'line', color: '#aaaaaa', lineWidth: 1 });
    series.setData(AAPL_DAILY);

    // Entry
    series.createPriceLine({
      price: 190,
      color: '#2196F3',
      lineWidth: 2,
      lineStyle: 'solid',
      title: 'Entry',
      axisLabelVisible: true,
    });

    // Stop loss
    series.createPriceLine({
      price: 182,
      color: '#FF3B5C',
      lineWidth: 1,
      lineStyle: 'dotted',
      title: 'Stop Loss',
      axisLabelVisible: true,
      axisLabelColor: '#FF3B5C',
      axisLabelTextColor: '#ffffff',
    });

    // Target
    series.createPriceLine({
      price: 210,
      color: '#00E396',
      lineWidth: 1,
      lineStyle: 'dotted',
      title: 'Target',
      axisLabelVisible: true,
      axisLabelColor: '#00E396',
      axisLabelTextColor: '#ffffff',
    });

    const description = 'Use price lines to visualize <strong>trade levels</strong> such as entry, stop loss, and target prices. Combine different <code>lineStyle</code> values (<code>solid</code>, <code>dotted</code>, <code>dashed</code>) and custom <code>axisLabelColor</code> / <code>axisLabelTextColor</code> to distinguish each level at a glance.';
    const code = `series.createPriceLine({
  price: 190, color: '#2196F3', lineStyle: 'solid', title: 'Entry',
  axisLabelVisible: true,
});
series.createPriceLine({
  price: 182, color: '#FF3B5C', lineStyle: 'dotted', title: 'Stop Loss',
  axisLabelVisible: true, axisLabelColor: '#FF3B5C',
});
series.createPriceLine({
  price: 210, color: '#00E396', lineStyle: 'dotted', title: 'Target',
  axisLabelVisible: true, axisLabelColor: '#00E396',
});`;

    return withDocs(container, { description, code });
  },
};
