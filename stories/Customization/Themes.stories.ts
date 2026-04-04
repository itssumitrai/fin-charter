import type { Meta, StoryObj } from '@storybook/html';
import { createChart, DARK_THEME, LIGHT_THEME, COLORFUL_THEME } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Customization/Themes',
  parameters: {
    docs: {
      description: {
        component:
          'fin-charter ships three built-in themes: Dark (default), Light, and Colorful. ' +
          'Pass the theme preset object via applyOptions() or spread it into createChart().',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Dark: Story = {
  name: 'Dark Theme',
  parameters: {
    docs: {
      source: {
        code: `import { createChart, DARK_THEME } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'dark' });
chart.applyOptions(DARK_THEME);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'dark' });
    chart.applyOptions(DARK_THEME);
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Dark Theme</strong> — Built-in dark theme with dark backgrounds and contrasting candle colors. ' +
        'Apply with <code>chart.applyOptions(DARK_THEME)</code> or pass <code>theme: \'dark\'</code> to <code>createChart()</code>.',
      code: `import { createChart, DARK_THEME } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'dark' });
chart.applyOptions(DARK_THEME);`,
    });
  },
};

export const Light: Story = {
  name: 'Light Theme',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'light' });
chart.applyOptions(LIGHT_THEME);
chart.addCandlestickSeries({
  upColor: '#22AB94', downColor: '#F7525F',
  wickUpColor: '#22AB94', wickDownColor: '#F7525F',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'light' });
    chart.applyOptions(LIGHT_THEME);
    const series = chart.addCandlestickSeries({
      upColor: '#22AB94',
      downColor: '#F7525F',
      wickUpColor: '#22AB94',
      wickDownColor: '#F7525F',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Light Theme</strong> — Light theme with white backgrounds and clean styling. ' +
        'Apply with <code>chart.applyOptions(LIGHT_THEME)</code> or pass <code>theme: \'light\'</code> to <code>createChart()</code>.',
      code: `import { createChart, LIGHT_THEME } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'light' });
chart.applyOptions(LIGHT_THEME);`,
    });
  },
};

export const Colorful: Story = {
  name: 'Colorful Theme',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'colorful' });
chart.applyOptions(COLORFUL_THEME);
chart.addCandlestickSeries({
  upColor: '#00c176', downColor: '#ff4a68',
  wickUpColor: '#00c176', wickDownColor: '#ff4a68',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'colorful' });
    chart.applyOptions(COLORFUL_THEME);
    const series = chart.addCandlestickSeries({
      upColor: '#00c176',
      downColor: '#ff4a68',
      wickUpColor: '#00c176',
      wickDownColor: '#ff4a68',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Colorful Theme</strong> — Vibrant colorful theme ideal for dashboards. ' +
        'Apply with <code>chart.applyOptions(COLORFUL_THEME)</code> or pass <code>theme: \'colorful\'</code> to <code>createChart()</code>.',
      code: `import { createChart, COLORFUL_THEME } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'colorful' });
chart.applyOptions(COLORFUL_THEME);`,
    });
  },
};
