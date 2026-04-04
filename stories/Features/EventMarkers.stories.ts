import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { ChartEvent } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Event Markers',
  parameters: {
    docs: {
      description: {
        component:
          'Corporate events (dividends, splits, earnings) can be displayed directly on the chart ' +
          'via series.setEvents(). Events appear as markers with a tooltip showing the event details.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const CorporateEvents: Story = {
  name: 'Corporate Events',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addCandlestickSeries();
series.setData(data);

series.setEvents([
  {
    time: dividendDate, position: 'belowBar', shape: 'arrowUp',
    color: '#4caf50', text: 'D', eventType: 'dividend',
    title: 'Quarterly Dividend', value: '$0.24/share',
  },
  {
    time: earningsDate, position: 'aboveBar', shape: 'arrowDown',
    color: '#F7525F', text: 'E', eventType: 'earnings',
    title: 'Q1 Earnings', value: 'Beat estimates',
  },
]);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    const events: ChartEvent[] = [
      {
        time: AAPL_DAILY[15].time,
        position: 'belowBar',
        shape: 'arrowUp',
        color: '#4caf50',
        text: 'D',
        eventType: 'dividend',
        title: 'Quarterly Dividend',
        description: 'AAPL pays quarterly dividend',
        value: '$0.24/share',
      },
      {
        time: AAPL_DAILY[40].time,
        position: 'aboveBar',
        shape: 'arrowDown',
        color: '#F7525F',
        text: 'E',
        eventType: 'earnings',
        title: 'Q1 2024 Earnings',
        description: 'EPS: $2.18, Revenue: $119.6B',
        value: 'Beat estimates',
      },
      {
        time: AAPL_DAILY[70].time,
        position: 'belowBar',
        shape: 'arrowUp',
        color: '#4caf50',
        text: 'D',
        eventType: 'dividend',
        title: 'Quarterly Dividend',
        description: 'AAPL pays quarterly dividend',
        value: '$0.25/share',
      },
      {
        time: AAPL_DAILY[100].time,
        position: 'aboveBar',
        shape: 'square',
        color: '#ff9800',
        text: 'S',
        eventType: 'split',
        title: 'Stock Split Announced',
        description: '4-for-1 stock split',
        value: '4:1',
      },
      {
        time: AAPL_DAILY[130].time,
        position: 'aboveBar',
        shape: 'arrowDown',
        color: '#F7525F',
        text: 'E',
        eventType: 'earnings',
        title: 'Q2 2024 Earnings',
        description: 'EPS: $1.53, Revenue: $85.8B',
        value: 'Missed estimates',
      },
      {
        time: AAPL_DAILY[155].time,
        position: 'belowBar',
        shape: 'arrowUp',
        color: '#4caf50',
        text: 'D',
        eventType: 'dividend',
        title: 'Quarterly Dividend',
        description: 'AAPL pays quarterly dividend',
        value: '$0.25/share',
      },
      {
        time: AAPL_DAILY[180].time,
        position: 'aboveBar',
        shape: 'arrowDown',
        color: '#2196F3',
        text: 'E',
        eventType: 'earnings',
        title: 'Q3 2024 Earnings',
        description: 'EPS: $1.64, Revenue: $94.9B',
        value: 'Beat estimates',
      },
    ];

    series.setEvents(events);

    return container;
  },
};
