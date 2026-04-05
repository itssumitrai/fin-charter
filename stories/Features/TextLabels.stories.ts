import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Text Labels',
  parameters: {
    docs: {
      description: {
        component:
          'Text labels are lightweight annotations anchored to a time/price coordinate. ' +
          'Use them to mark earnings dates, dividends, news events, or any point of interest.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const EarningsAnnotations: Story = {
  name: 'Earnings Annotations',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addTextLabel(30, 194, 'Q1 Earnings', {
  backgroundColor: 'rgba(33, 150, 243, 0.85)',
  textColor: '#ffffff',
  showConnector: true,
  yOffset: -30,
});

chart.addTextLabel(120, 210, 'Q2 Earnings', {
  backgroundColor: 'rgba(76, 175, 80, 0.85)',
  textColor: '#ffffff',
  showConnector: true,
  yOffset: -30,
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.addTextLabel(30, AAPL_DAILY[30].high + 2, 'Q1 Earnings', {
      backgroundColor: 'rgba(33, 150, 243, 0.85)',
      textColor: '#ffffff',
      fontSize: 11,
      showConnector: true,
      yOffset: -30,
      borderRadius: 4,
      padding: 6,
    });

    chart.addTextLabel(120, AAPL_DAILY[120].high + 2, 'Q2 Earnings', {
      backgroundColor: 'rgba(76, 175, 80, 0.85)',
      textColor: '#ffffff',
      fontSize: 11,
      showConnector: true,
      yOffset: -30,
      borderRadius: 4,
      padding: 6,
    });

    chart.addTextLabel(75, AAPL_DAILY[75].low - 2, 'Dividend Ex-Date', {
      backgroundColor: 'rgba(156, 39, 176, 0.85)',
      textColor: '#ffffff',
      fontSize: 11,
      showConnector: true,
      yOffset: 30,
      borderRadius: 4,
      padding: 6,
    });

    const description = '<strong>Text labels</strong> are programmatic annotations anchored to a bar index and price coordinate. Use <code>chart.addTextLabel(barIndex, price, text, options)</code> to place them. They survive zoom/pan and are included in screenshot exports. Options include <code>backgroundColor</code>, <code>textColor</code>, <code>showConnector</code>, <code>yOffset</code>, and <code>boxAnchor</code>.';
    const code = `chart.addTextLabel(30, data[30].high + 2, 'Q1 Earnings', {
  backgroundColor: 'rgba(33, 150, 243, 0.85)',
  textColor: '#ffffff',
  showConnector: true,
  yOffset: -30,
});

chart.addTextLabel(120, data[120].high + 2, 'Q2 Earnings', {
  backgroundColor: 'rgba(76, 175, 80, 0.85)',
  textColor: '#ffffff',
  showConnector: true,
  yOffset: -30,
});

chart.addTextLabel(75, data[75].low - 2, 'Dividend Ex-Date', {
  backgroundColor: 'rgba(156, 39, 176, 0.85)',
  textColor: '#ffffff',
  showConnector: true,
  yOffset: 30,
});`;

    return withDocs(container, { description, code });
  },
};
