import type { Meta, StoryObj } from '@storybook/html';
import { createChart, DARK_THEME, LIGHT_THEME, COLORFUL_THEME } from '@itssumitrai/fin-charter';
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
        code: `import { createChart, DARK_THEME } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'dark' });
chart.applyOptions(DARK_THEME);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'dark' });
    chart.applyOptions(DARK_THEME);
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Dark Theme</strong> — Built-in dark theme with dark backgrounds and contrasting candle colors. ' +
        'Apply with <code>chart.applyOptions(DARK_THEME)</code> or pass <code>theme: \'dark\'</code> to <code>createChart()</code>.',
      code: `import { createChart, DARK_THEME } from '@itssumitrai/fin-charter';

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
chart.addSeries({ type: 'candlestick',
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
    const series = chart.addSeries({ type: 'candlestick',
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
      code: `import { createChart, LIGHT_THEME } from '@itssumitrai/fin-charter';

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
chart.addSeries({ type: 'candlestick',
  upColor: '#00c176', downColor: '#ff4a68',
  wickUpColor: '#00c176', wickDownColor: '#ff4a68',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'colorful' });
    const series = chart.addSeries({ type: 'candlestick',
      upColor: '#e53170',
      downColor: '#2cb67d',
      wickUpColor: '#e53170',
      wickDownColor: '#2cb67d',
      borderUpColor: '#e53170',
      borderDownColor: '#2cb67d',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        '<strong>Colorful Theme</strong> — A vibrant, high-contrast theme with warm accent colors, ideal for dashboards and presentations. ' +
        'The theme uses a deep dark background with orange crosshair accents. Pair with custom candle colors for a distinctive look.\n' +
        'Apply with <code>chart.applyOptions(COLORFUL_THEME)</code> or pass <code>theme: &quot;colorful&quot;</code> to <code>createChart()</code>.',
      code: `
import { createChart, COLORFUL_THEME } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL', theme: 'colorful' });
const series = chart.addSeries({ type: 'candlestick',
  upColor: '#e53170',
  downColor: '#2cb67d',
  wickUpColor: '#e53170',
  wickDownColor: '#2cb67d',
});
series.setData(data);
      `,
    });
  },
};
