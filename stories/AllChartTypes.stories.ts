import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV } from './helpers';

const meta: Meta = {
  title: 'Charts/All Chart Types',
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
  render: () => {
    const root = document.createElement('div');
    root.style.display = 'grid';
    root.style.gridTemplateColumns = 'repeat(2, 1fr)';
    root.style.gap = '16px';
    root.style.padding = '16px';
    root.style.background = '#0d0d1a';
    root.style.minHeight = '100vh';

    const bars = generateOHLCV(150);

    const specs: ChartSpec[] = [
      {
        title: 'Candlestick',
        color: '#26a69a',
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
