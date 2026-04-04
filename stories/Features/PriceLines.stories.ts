import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
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
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addCandlestickSeries();
series.setData(data);

series.createPriceLine({
  price: 185, color: '#22AB94', lineStyle: 'dashed', title: 'Support',
});
series.createPriceLine({
  price: 195, color: '#F7525F', lineStyle: 'dashed', title: 'Resistance',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    series.createPriceLine({
      price: 185,
      color: '#22AB94',
      lineWidth: 1,
      lineStyle: 'dashed',
      title: 'Support',
      axisLabelVisible: true,
    });

    series.createPriceLine({
      price: 195,
      color: '#F7525F',
      lineWidth: 1,
      lineStyle: 'dashed',
      title: 'Resistance',
      axisLabelVisible: true,
    });

    return container;
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
  price: 182, color: '#F7525F', lineStyle: 'dotted', title: 'Stop Loss',
  axisLabelVisible: true, axisLabelColor: '#F7525F',
});
series.createPriceLine({
  price: 210, color: '#22AB94', lineStyle: 'dotted', title: 'Target',
  axisLabelVisible: true, axisLabelColor: '#22AB94',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addLineSeries({ color: '#aaaaaa', lineWidth: 1 });
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
      color: '#F7525F',
      lineWidth: 1,
      lineStyle: 'dotted',
      title: 'Stop Loss',
      axisLabelVisible: true,
      axisLabelColor: '#F7525F',
      axisLabelTextColor: '#ffffff',
    });

    // Target
    series.createPriceLine({
      price: 210,
      color: '#22AB94',
      lineWidth: 1,
      lineStyle: 'dotted',
      title: 'Target',
      axisLabelVisible: true,
      axisLabelColor: '#22AB94',
      axisLabelTextColor: '#ffffff',
    });

    return container;
  },
};
