import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from '../helpers';

const meta: Meta = {
  title: 'Features/Context Menu',
  parameters: {
    docs: {
      description: {
        component:
          'Right-click context menu with context-sensitive actions. ' +
          'Right-click on a drawing to get Edit, Duplicate, Remove, Bring to Front, and Send to Back. ' +
          'Right-click on empty chart area for Reset Zoom and Scroll to Latest. ' +
          'Right-click on an indicator pane header for Settings, Hide, and Remove.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const ContextMenuDemo: Story = {
  name: 'Context Menu',
  parameters: {
    docs: {
      source: {
        code: `// Right-click on a drawing for: Edit, Duplicate, Remove, Bring to Front, Send to Back
// Right-click on empty chart for: Reset Zoom, Scroll to Latest
// Right-click on indicator pane for: Settings, Hide, Remove

import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Add a drawing — right-click it to see the drawing context menu
chart.addDrawing(
  'trendline',
  [
    { time: data[20].time, price: data[20].close },
    { time: data[60].time, price: data[60].close },
  ],
  { color: '#2196F3', lineWidth: 2 },
);

// Add an indicator pane — right-click the pane header to see indicator options
chart.addIndicator('rsi', {
  source: series,
  params: { period: 14 },
  color: '#ab47bc',
  label: 'RSI 14',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '650px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(120);
    series.setData(data);

    // Trendline — right-click to see drawing context menu
    chart.addDrawing(
      'trendline',
      [
        { time: data[20].time, price: data[20].close },
        { time: data[60].time, price: data[60].close },
      ],
      { color: '#2196F3', lineWidth: 2 },
    );

    // Fibonacci retracement — right-click to see drawing context menu
    chart.addDrawing(
      'fibonacci',
      [
        { time: data[30].time, price: data[30].low },
        { time: data[80].time, price: data[80].high },
      ],
      { color: '#9c27b0', lineWidth: 1 },
    );

    // Horizontal support line — right-click to see drawing context menu
    chart.addDrawing(
      'horizontal-line',
      [{ time: data[50].time, price: data[50].close }],
      { color: '#26a69a', lineWidth: 1, lineStyle: 'dashed' },
    );

    // RSI pane — right-click the pane header for indicator options
    chart.addIndicator('rsi', {
      source: series,
      params: { period: 14 },
      color: '#ab47bc',
      label: 'RSI 14',
    });

    return container;
  },
};
