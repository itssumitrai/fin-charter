import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

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
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  timeScale: {
    tickMarkFormatter: (time, tickType) => {
      if (tickType === 'day') {
        const d = new Date(time * 1000);
        return \`\${d.getUTCMonth() + 1}/\${d.getUTCDate()}\`;
      }
      return '';
    },
  },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
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

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    return withDocs(container, {
      description:
        'Customize <strong>time axis labels</strong> with a <code>tickMarkFormatter</code> callback. ' +
        'The formatter receives the Unix timestamp and tick type (<code>"year"</code>, <code>"month"</code>, ' +
        '<code>"day"</code>, <code>"time"</code>) and returns a formatted string. ' +
        'This demo formats day ticks as <code>MM/DD</code>.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  timeScale: {
    tickMarkFormatter: (time: number, tickType: string) => {
      if (tickType === 'day') {
        const d = new Date(time * 1000);
        return \`\${d.getUTCMonth() + 1}/\${d.getUTCDate()}\`;
      }
      return '';
    },
  },
});
      `,
    });
  },
};
