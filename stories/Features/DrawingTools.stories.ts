import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Drawing Tools',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates the drawing tools API. Users can activate a drawing tool and click on the ' +
          'chart to place drawings. Supports horizontal lines, trendlines, Fibonacci retracements, ' +
          'and rectangles.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function makeButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText =
    'padding: 6px 12px; margin-right: 6px; background: #2a2e39; color: #d1d4dc; ' +
    'border: 1px solid #434651; border-radius: 4px; cursor: pointer; font-size: 13px;';
  btn.addEventListener('click', onClick);
  return btn;
}

export const InteractiveDrawing: Story = {
  name: 'Interactive Drawing',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addCandlestickSeries();
series.setData(data);

// Activate a drawing tool (user clicks chart to place it)
chart.setActiveDrawingTool('trendline');

// Cancel the active tool
chart.setActiveDrawingTool(null);`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display: flex; align-items: center; padding: 8px; background: #1e2235; border-radius: 4px;';

    const status = document.createElement('span');
    status.style.cssText = 'margin-left: 12px; color: #787b86; font-size: 13px; font-family: monospace;';
    status.textContent = 'No tool active — click a tool to start drawing';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    const tools: Array<{ label: string; type: string | null }> = [
      { label: 'Horizontal Line', type: 'horizontal-line' },
      { label: 'Trendline', type: 'trendline' },
      { label: 'Fibonacci', type: 'fibonacci' },
      { label: 'Rectangle', type: 'rectangle' },
      { label: 'Cancel', type: null },
    ];

    tools.forEach(({ label, type }) => {
      const btn = makeButton(label, () => {
        chart.setActiveDrawingTool(type);
        status.textContent =
          type ? `Active tool: ${label} — click on chart to draw` : 'No tool active';
        toolbar.querySelectorAll('button').forEach((b) => {
          (b as HTMLButtonElement).style.background = '#2a2e39';
          (b as HTMLButtonElement).style.borderColor = '#434651';
        });
        if (type) {
          btn.style.background = '#1a4a6b';
          btn.style.borderColor = '#2196F3';
        }
      });
      toolbar.appendChild(btn);
    });

    toolbar.appendChild(status);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    return wrapper;
  },
};

export const PresetDrawings: Story = {
  name: 'Preset Drawings',
  parameters: {
    docs: {
      source: {
        code: `chart.addDrawing('horizontal-line',
  [{ time: t1, price: 190 }],
  { color: '#f4c430', lineWidth: 1, lineDash: [4, 4] },
);
chart.addDrawing('trendline',
  [{ time: t1, price: low1 }, { time: t2, price: high2 }],
  { color: '#22AB94', lineWidth: 2 },
);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    // Add a horizontal line at the approximate midpoint price
    const midPrice = (AAPL_DAILY[0].close + AAPL_DAILY[AAPL_DAILY.length - 1].close) / 2;
    chart.addDrawing(
      'horizontal-line',
      [{ time: AAPL_DAILY[0].time, price: midPrice }],
      { color: '#f4c430', lineWidth: 1, lineDash: [4, 4] },
    );

    // Add a trendline from bar 20 to bar 80
    chart.addDrawing(
      'trendline',
      [
        { time: AAPL_DAILY[20].time, price: AAPL_DAILY[20].low },
        { time: AAPL_DAILY[80].time, price: AAPL_DAILY[80].high },
      ],
      { color: '#22AB94', lineWidth: 2 },
    );

    // Add a rectangle marking a consolidation zone
    chart.addDrawing(
      'rectangle',
      [
        { time: AAPL_DAILY[100].time, price: AAPL_DAILY[100].low - 2 },
        { time: AAPL_DAILY[130].time, price: AAPL_DAILY[130].high + 2 },
      ],
      { color: 'rgba(33, 150, 243, 0.3)', lineWidth: 1 },
    );

    // Add a fibonacci from a swing low to a swing high
    chart.addDrawing(
      'fibonacci',
      [
        { time: AAPL_DAILY[50].time, price: AAPL_DAILY[50].low },
        { time: AAPL_DAILY[90].time, price: AAPL_DAILY[90].high },
      ],
      { color: '#ef9a9a', lineWidth: 1 },
    );

    return container;
  },
};
