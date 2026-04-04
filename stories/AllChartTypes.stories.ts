import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Chart Types/All Chart Types',
  parameters: {
    docs: {
      description: {
        component:
          'Overview gallery showing all supported chart types side by side.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

interface ChartSpec {
  title: string;
  color: string;
  create: (container: HTMLElement) => void;
}

function makePanel(spec: ChartSpec): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '4px';

  const label = document.createElement('div');
  label.textContent = spec.title;
  label.style.color = spec.color;
  label.style.fontFamily = 'monospace';
  label.style.fontSize = '12px';
  label.style.paddingLeft = '8px';

  const chartContainer = document.createElement('div');
  chartContainer.style.width = '100%';
  chartContainer.style.height = '220px';
  chartContainer.style.background = '#0d0d1a';

  wrapper.appendChild(label);
  wrapper.appendChild(chartContainer);
  spec.create(chartContainer);

  return wrapper;
}

export const Overview: Story = {
  name: 'All Types Overview',
  parameters: {
    docs: {
      source: {
        code: `
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true });

// Candlestick
chart.addCandlestickSeries().setData(data);

// Hollow Candle
chart.addHollowCandleSeries().setData(data);

// OHLC Bar
chart.addBarSeries().setData(data);

// Line
chart.addLineSeries({ color: '#9c27b0', lineWidth: 2 }).setData(data);

// Area
chart.addAreaSeries({
  lineColor: '#ff9800',
  topColor: 'rgba(255, 152, 0, 0.4)',
  bottomColor: 'rgba(255, 152, 0, 0.0)',
}).setData(data);

// Baseline
chart.addBaselineSeries().setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.style.display = 'grid';
    root.style.gridTemplateColumns = 'repeat(2, 1fr)';
    root.style.gap = '16px';
    root.style.padding = '16px';
    root.style.background = '#0d0d1a';
    root.style.minHeight = '100vh';

    const bars = AAPL_DAILY;

    const specs: ChartSpec[] = [
      {
        title: 'Candlestick',
        color: '#22AB94',
        create: (el) => {
          const chart = createChart(el, { autoSize: true });
          chart.addCandlestickSeries().setData(bars);
        },
      },
      {
        title: 'Hollow Candle',
        color: '#00e5ff',
        create: (el) => {
          const chart = createChart(el, { autoSize: true });
          chart.addHollowCandleSeries().setData(bars);
        },
      },
      {
        title: 'OHLC Bar',
        color: '#f4c430',
        create: (el) => {
          const chart = createChart(el, { autoSize: true });
          chart.addBarSeries().setData(bars);
        },
      },
      {
        title: 'Line',
        color: '#9c27b0',
        create: (el) => {
          const chart = createChart(el, { autoSize: true });
          chart.addLineSeries({ color: '#9c27b0', lineWidth: 2 }).setData(bars);
        },
      },
      {
        title: 'Area',
        color: '#ff9800',
        create: (el) => {
          const chart = createChart(el, { autoSize: true });
          chart.addAreaSeries({
            lineColor: '#ff9800',
            topColor: 'rgba(255, 152, 0, 0.4)',
            bottomColor: 'rgba(255, 152, 0, 0.0)',
          }).setData(bars);
        },
      },
      {
        title: 'Baseline',
        color: '#e91e63',
        create: (el) => {
          const chart = createChart(el, { autoSize: true });
          chart.addBaselineSeries().setData(bars);
        },
      },
    ];

    for (const spec of specs) {
      root.appendChild(makePanel(spec));
    }

    return root;
  },
};
