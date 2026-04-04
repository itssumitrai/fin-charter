import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Series Markers',
  parameters: {
    docs: {
      description: {
        component:
          'Series markers let you annotate specific bars with shapes and labels. ' +
          'Supports arrowUp, arrowDown, and circle shapes at belowBar, aboveBar, or inBar positions.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const BuySellSignals: Story = {
  name: 'Buy / Sell Signals',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(data);

series.setMarkers([
  { time: buyTime, position: 'belowBar', shape: 'arrowUp', color: '#22AB94', text: 'Buy' },
  { time: sellTime, position: 'aboveBar', shape: 'arrowDown', color: '#F7525F', text: 'Sell' },
]);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    series.setMarkers([
      {
        time: AAPL_DAILY[50].time,
        position: 'belowBar',
        shape: 'arrowUp',
        color: '#22AB94',
        text: 'Buy',
      },
      {
        time: AAPL_DAILY[100].time,
        position: 'aboveBar',
        shape: 'arrowDown',
        color: '#F7525F',
        text: 'Sell',
      },
      {
        time: AAPL_DAILY[150].time,
        position: 'belowBar',
        shape: 'circle',
        color: '#2196F3',
        text: 'Signal',
      },
    ]);

    return container;
  },
};

export const MultipleMarkers: Story = {
  name: 'Multiple Markers',
  parameters: {
    docs: {
      source: {
        code: `series.setMarkers([
  { time: t1, position: 'belowBar', shape: 'arrowUp', color: '#22AB94', text: 'Buy 1' },
  { time: t2, position: 'aboveBar', shape: 'arrowDown', color: '#F7525F', text: 'Sell 1' },
  { time: t3, position: 'inBar', shape: 'circle', color: '#FF9800', text: 'Alert' },
]);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    series.setMarkers([
      { time: AAPL_DAILY[10].time, position: 'belowBar', shape: 'arrowUp', color: '#22AB94', text: 'Buy 1' },
      { time: AAPL_DAILY[30].time, position: 'aboveBar', shape: 'arrowDown', color: '#F7525F', text: 'Sell 1' },
      { time: AAPL_DAILY[60].time, position: 'belowBar', shape: 'arrowUp', color: '#22AB94', text: 'Buy 2' },
      { time: AAPL_DAILY[90].time, position: 'inBar', shape: 'circle', color: '#FF9800', text: 'Alert' },
      { time: AAPL_DAILY[120].time, position: 'aboveBar', shape: 'arrowDown', color: '#F7525F', text: 'Sell 2' },
      { time: AAPL_DAILY[160].time, position: 'belowBar', shape: 'circle', color: '#2196F3', text: 'Signal' },
    ]);

    return container;
  },
};
