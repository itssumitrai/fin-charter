import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Watermark',
  parameters: {
    docs: {
      description: {
        component:
          'A watermark is a semi-transparent text label rendered behind the chart data. ' +
          'It is typically used to display the ticker symbol or chart source.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'AAPL Watermark',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true,
    text: 'AAPL',
    fontSize: 48,
    color: 'rgba(255,255,255,0.08)',
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
      watermark: {
        visible: true,
        text: 'AAPL',
        fontSize: 48,
        color: 'rgba(255,255,255,0.08)',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    const description = 'A <strong>watermark</strong> is a semi-transparent text label rendered behind the chart data. Use it to display the ticker symbol, data source, or branding. Configure with <code>watermark: { visible, text, fontSize, color, horzAlign, vertAlign }</code>.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true,
    text: 'AAPL',
    fontSize: 48,
    color: 'rgba(255,255,255,0.08)',
    horzAlign: 'center',
    vertAlign: 'center',
  },
});`;

    return withDocs(container, { description, code });
  },
};

export const LargeText: Story = {
  name: 'Large Watermark',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true,
    text: 'FIN-CHARTER',
    fontSize: 64,
    color: 'rgba(0, 229, 255, 0.06)',
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
      watermark: {
        visible: true,
        text: 'FIN-CHARTER',
        fontSize: 64,
        color: 'rgba(0, 229, 255, 0.06)',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });
    const series = chart.addAreaSeries({
      lineColor: '#00e5ff',
      topColor: 'rgba(0, 229, 255, 0.3)',
      bottomColor: 'rgba(0, 229, 255, 0.0)',
    });
    series.setData(AAPL_DAILY);

    const description = 'Use a <strong>large watermark</strong> with custom colors for prominent branding. Combine with area series or other chart types for a distinctive look. Adjust <code>fontSize</code> and <code>color</code> opacity to control visibility.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true,
    text: 'FIN-CHARTER',
    fontSize: 64,
    color: 'rgba(0, 229, 255, 0.06)',
  },
});`;

    return withDocs(container, { description, code });
  },
};

export const CornerWatermark: Story = {
  name: 'Corner Watermark',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true, text: 'DEMO', fontSize: 32,
    horzAlign: 'right', vertAlign: 'bottom',
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
      watermark: {
        visible: true,
        text: 'DEMO',
        fontSize: 32,
        color: 'rgba(255,255,255,0.12)',
        horzAlign: 'right',
        vertAlign: 'bottom',
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    const description = 'Position the watermark in any corner using <code>horzAlign</code> (<code>left</code>, <code>center</code>, <code>right</code>) and <code>vertAlign</code> (<code>top</code>, <code>center</code>, <code>bottom</code>). A smaller <code>fontSize</code> works well for corner placements.';
    const code = `const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true,
    text: 'DEMO',
    fontSize: 32,
    horzAlign: 'right',
    vertAlign: 'bottom',
  },
});`;

    return withDocs(container, { description, code });
  },
};
