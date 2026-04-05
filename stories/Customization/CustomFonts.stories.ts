import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Customization/Custom Fonts',
  parameters: {
    docs: {
      description: {
        component:
          'The chart uses the fontFamily and fontSize from layout options for all text elements ' +
          'including axis labels, the OHLC legend, and the tooltip.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Monospace: Story = {
  name: 'Monospace Font',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  layout: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 11,
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
      layout: {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 11,
      },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Custom Fonts</strong> — Customize chart fonts via <code>layout: { fontFamily, fontSize }</code>. ' +
        'Affects all text elements: price scale labels, time scale labels, legend, and tooltips.',
      code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  layout: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 11,
  },
});`,
    });
  },
};

export const SystemSansSerif: Story = {
  name: 'System Sans-Serif',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  layout: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12,
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
      layout: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 12,
      },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>System Sans-Serif</strong> — Uses the platform\'s native sans-serif font stack for a clean, ' +
        'familiar appearance. Set via <code>layout: { fontFamily }</code>.',
      code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  layout: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12,
  },
});`,
    });
  },
};

export const LargeFontSize: Story = {
  name: 'Large Font Size (14px)',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  layout: { fontSize: 14 },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      layout: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 14,
      },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Large Font Size</strong> — Increase <code>layout.fontSize</code> for better readability on ' +
        'large displays or high-density dashboards.',
      code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  layout: { fontSize: 14 },
});`,
    });
  },
};
