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
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    series.setMarkers([
      {
        time: AAPL_DAILY[50].time,
        position: 'belowBar',
        shape: 'arrowUp',
        color: '#26a69a',
        text: 'Buy',
      },
      {
        time: AAPL_DAILY[100].time,
        position: 'aboveBar',
        shape: 'arrowDown',
        color: '#ef5350',
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
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    series.setMarkers([
      { time: AAPL_DAILY[10].time, position: 'belowBar', shape: 'arrowUp', color: '#26a69a', text: 'Buy 1' },
      { time: AAPL_DAILY[30].time, position: 'aboveBar', shape: 'arrowDown', color: '#ef5350', text: 'Sell 1' },
      { time: AAPL_DAILY[60].time, position: 'belowBar', shape: 'arrowUp', color: '#26a69a', text: 'Buy 2' },
      { time: AAPL_DAILY[90].time, position: 'inBar', shape: 'circle', color: '#FF9800', text: 'Alert' },
      { time: AAPL_DAILY[120].time, position: 'aboveBar', shape: 'arrowDown', color: '#ef5350', text: 'Sell 2' },
      { time: AAPL_DAILY[160].time, position: 'belowBar', shape: 'circle', color: '#2196F3', text: 'Signal' },
    ]);

    return container;
  },
};
