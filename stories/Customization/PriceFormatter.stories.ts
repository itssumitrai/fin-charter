import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Customization/Price Formatter',
  parameters: {
    docs: {
      description: {
        component:
          'Custom price formatters let you control how price values are displayed on the Y-axis ' +
          'and in the OHLC legend. Pass a priceFormatter function to createChart().',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const CurrencyFormat: Story = {
  name: 'Currency Format ($XXX.XX)',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  priceFormatter: (price) => \`$\${price.toFixed(2)}\`,
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      priceFormatter: (price: number) => `$${price.toFixed(2)}`,
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Currency Format</strong> — Format prices as currency (<code>$XXX.XX</code>) using a custom ' +
        '<code>priceFormatter</code> function passed to <code>createChart()</code>.',
      code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  priceFormatter: (price: number) => \`$\${price.toFixed(2)}\`,
});`,
    });
  },
};

export const CompactFormat: Story = {
  name: 'Compact Format (1.5K, 2.3M)',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  priceFormatter: (price) => {
    if (price >= 1_000_000) return \`\${(price / 1_000_000).toFixed(2)}M\`;
    if (price >= 1_000) return \`\${(price / 1_000).toFixed(1)}K\`;
    return price.toFixed(2);
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
      priceFormatter: (price: number) => {
        if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`;
        if (price >= 1_000) return `${(price / 1_000).toFixed(1)}K`;
        return price.toFixed(2);
      },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Compact Format</strong> — Shorten large numbers to human-readable abbreviations like ' +
        '<code>1.5K</code> and <code>2.3M</code> using a custom <code>priceFormatter</code>.',
      code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  priceFormatter: (price: number) => {
    if (price >= 1_000_000) return \`\${(price / 1_000_000).toFixed(2)}M\`;
    if (price >= 1_000) return \`\${(price / 1_000).toFixed(1)}K\`;
    return price.toFixed(2);
  },
});`,
    });
  },
};

export const BasisPoints: Story = {
  name: 'Basis Points (×100)',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  priceFormatter: (price) => \`\${(price * 100).toFixed(0)} bps\`,
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      priceFormatter: (price: number) => `${(price * 100).toFixed(0)} bps`,
    });
    const series = chart.addSeries({ type: 'line', color: '#9c27b0', lineWidth: 2 });
    // Normalize data to a 0-1 scale for demonstration
    const base = AAPL_DAILY[0].close;
    const normalized = AAPL_DAILY.map((b) => ({
      ...b,
      open: b.open / base,
      high: b.high / base,
      low: b.low / base,
      close: b.close / base,
    }));
    series.setData(normalized);
    return withDocs(container, {
      description:
        '<strong>Basis Points</strong> — Convert prices to basis points by multiplying by 100. ' +
        'Useful for displaying yields, spreads, or normalized values with a <code>priceFormatter</code>.',
      code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  priceFormatter: (price: number) => \`\${(price * 100).toFixed(0)} bps\`,
});`,
    });
  },
};
