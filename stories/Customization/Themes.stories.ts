import type { Meta, StoryObj } from '@storybook/html';
import { createChart, DARK_THEME, LIGHT_THEME, COLORFUL_THEME } from 'fin-charter';
import { createChartContainer } from '../helpers';
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
    return container;
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
    return container;
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
    return container;
  },
};
