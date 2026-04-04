import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Time Formatter',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates a custom tickMarkFormatter on the time scale. Day ticks are formatted ' +
          'as MM/DD instead of the default date format.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const CustomTimeFormatter: Story = {
  name: 'Custom MM/DD Formatter',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      timeScale: {
        tickMarkFormatter: (time: number, tickType: 'year' | 'month' | 'day' | 'time') => {
          if (tickType === 'day') {
            const date = new Date(time * 1000);
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${month}/${day}`;
          }
          // Fall back to default for year/month/time ticks
          return '';
        },
      },
    });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    return container;
  },
};
