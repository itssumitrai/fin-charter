import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

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

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });

// Classic types
chart.addSeries({ type: 'candlestick' }).setData(data);
chart.addSeries({ type: 'hollow-candle' }).setData(data);
chart.addSeries({ type: 'bar' }).setData(data);
chart.addSeries({ type: 'line', color: '#9c27b0' }).setData(data);
chart.addSeries({ type: 'area', lineColor: '#ff9800' }).setData(data);
chart.addSeries({ type: 'baseline' }).setData(data);

// New chart types
chart.addSeries({ type: 'step-line', color: '#00e5ff' }).setData(data);
chart.addSeries({ type: 'colored-line', upColor: '#22AB94', downColor: '#F7525F' }).setData(data);
chart.addSeries({ type: 'colored-mountain' }).setData(data);
chart.addSeries({ type: 'hlc-area' }).setData(data);
chart.addSeries({ type: 'high-low', color: '#2962ff' }).setData(data);
chart.addSeries({ type: 'column', upColor: '#22AB94', downColor: '#F7525F' }).setData(data);
chart.addSeries({ type: 'volume-candle' }).setData(data);
chart.addSeries({ type: 'baseline-delta-mountain', basePrice: 110 }).setData(data);
chart.addSeries({ type: 'renko', boxSize: 2 }).setData(data);
chart.addSeries({ type: 'kagi', reversalAmount: 2 }).setData(data);
chart.addSeries({ type: 'line-break', breakCount: 3 }).setData(data);
chart.addSeries({ type: 'point-figure', boxSize: 2, reversalBoxes: 3 }).setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.style.display = 'grid';
    root.style.gridTemplateColumns = 'repeat(3, 1fr)';
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
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'candlestick' }).setData(bars);
        },
      },
      {
        title: 'Hollow Candle',
        color: '#00e5ff',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'hollow-candle' }).setData(bars);
        },
      },
      {
        title: 'OHLC Bar',
        color: '#f4c430',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'bar' }).setData(bars);
        },
      },
      {
        title: 'Line',
        color: '#9c27b0',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'line', color: '#9c27b0', lineWidth: 2 }).setData(bars);
        },
      },
      {
        title: 'Area',
        color: '#ff9800',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'area',
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
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'baseline' }).setData(bars);
        },
      },
      {
        title: 'Step Line',
        color: '#00e5ff',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'step-line', color: '#00e5ff' }).setData(bars);
        },
      },
      {
        title: 'Colored Line',
        color: '#22AB94',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'colored-line', upColor: '#22AB94', downColor: '#F7525F' }).setData(bars);
        },
      },
      {
        title: 'Colored Mountain',
        color: '#22AB94',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'colored-mountain', upColor: '#22AB94', downColor: '#F7525F', upFillColor: 'rgba(34,171,148,0.3)', downFillColor: 'rgba(247,82,95,0.3)' }).setData(bars);
        },
      },
      {
        title: 'HLC Area',
        color: '#2962ff',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'hlc-area', highLineColor: '#22AB94', lowLineColor: '#F7525F', fillColor: 'rgba(41,98,255,0.15)' }).setData(bars);
        },
      },
      {
        title: 'High-Low',
        color: '#2962ff',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'high-low', color: '#2962ff' }).setData(bars);
        },
      },
      {
        title: 'Column',
        color: '#22AB94',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'column', upColor: '#22AB94', downColor: '#F7525F' }).setData(bars);
        },
      },
      {
        title: 'Volume Candle',
        color: '#f4c430',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'volume-candle' }).setData(bars);
        },
      },
      {
        title: 'Baseline Delta Mountain',
        color: '#00e5ff',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'baseline-delta-mountain', basePrice: 110, topFillColor: 'rgba(0,229,255,0.3)', bottomFillColor: 'rgba(255,107,107,0.3)' }).setData(bars);
        },
      },
      {
        title: 'Renko',
        color: '#ff9800',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'renko', boxSize: 2 }).setData(bars);
        },
      },
      {
        title: 'Kagi',
        color: '#9c27b0',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'kagi', reversalAmount: 2 }).setData(bars);
        },
      },
      {
        title: 'Line Break',
        color: '#e91e63',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'line-break', breakCount: 3 }).setData(bars);
        },
      },
      {
        title: 'Point & Figure',
        color: '#f4c430',
        create: (el) => {
          const chart = createChart(el, { autoSize: true, symbol: 'AAPL' });
          chart.addSeries({ type: 'point-figure', boxSize: 2, reversalBoxes: 3 }).setData(bars);
        },
      },
    ];

    for (const spec of specs) {
      root.appendChild(makePanel(spec));
    }

    return withDocs(root, {
      description:
        'fin-charter supports <strong>18 chart types</strong> out of the box. Each type uses the same OHLCV data format ' +
        'but renders it differently. Classic types include candlestick, hollow candle, OHLC bar, line, area, and baseline. ' +
        'Additional types include step-line, colored-line, colored-mountain, hlc-area, high-low, column, volume-candle, ' +
        'baseline-delta-mountain, renko, kagi, line-break, and point-figure.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

// Classic types
chart.addSeries({ type: 'candlestick' }).setData(data);
chart.addSeries({ type: 'hollow-candle' }).setData(data);
chart.addSeries({ type: 'bar' }).setData(data);
chart.addSeries({ type: 'line' }).setData(data);
chart.addSeries({ type: 'area' }).setData(data);
chart.addSeries({ type: 'baseline' }).setData(data);

// New chart types
chart.addSeries({ type: 'step-line', color: '#00e5ff' }).setData(data);
chart.addSeries({ type: 'colored-line', upColor: '#22AB94', downColor: '#F7525F' }).setData(data);
chart.addSeries({ type: 'colored-mountain', upColor: '#22AB94', downColor: '#F7525F' }).setData(data);
chart.addSeries({ type: 'hlc-area', highLineColor: '#22AB94', lowLineColor: '#F7525F' }).setData(data);
chart.addSeries({ type: 'high-low', color: '#2962ff' }).setData(data);
chart.addSeries({ type: 'column', upColor: '#22AB94', downColor: '#F7525F' }).setData(data);
chart.addSeries({ type: 'volume-candle' }).setData(data);
chart.addSeries({ type: 'baseline-delta-mountain', basePrice: 110 }).setData(data);
chart.addSeries({ type: 'renko', boxSize: 2 }).setData(data);
chart.addSeries({ type: 'kagi', reversalAmount: 2 }).setData(data);
chart.addSeries({ type: 'line-break', breakCount: 3 }).setData(data);
chart.addSeries({ type: 'point-figure', boxSize: 2, reversalBoxes: 3 }).setData(data);
      `,
    });
  },
};
