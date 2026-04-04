import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from '../helpers';

const meta: Meta = {
  title: 'Drawings/New Drawing Tools',
  parameters: {
    docs: {
      description: {
        component:
          'New drawing tools: ray, arrow, channel, ellipse, pitchfork, fib projection, fib arc, fib fan, crossline, and measurement.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Ray: Story = {
  name: 'Ray',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('ray', [
  { time: data[20].time, price: data[20].close },
  { time: data[60].time, price: data[60].close },
], { color: '#2196F3', lineWidth: 2 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'ray',
      [
        { time: data[20].time, price: data[20].close },
        { time: data[60].time, price: data[60].close },
      ],
      { color: '#2196F3', lineWidth: 2 },
    );
    return container;
  },
};

export const Arrow: Story = {
  name: 'Arrow',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('arrow', [
  { time: data[20].time, price: data[20].close },
  { time: data[60].time, price: data[60].close },
], { color: '#FF9800', lineWidth: 2 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'arrow',
      [
        { time: data[20].time, price: data[20].close },
        { time: data[60].time, price: data[60].close },
      ],
      { color: '#FF9800', lineWidth: 2 },
    );
    return container;
  },
};

export const Channel: Story = {
  name: 'Channel',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('channel', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
  { time: data[40].time, price: data[40].low },
], { color: '#9C27B0', fillColor: 'rgba(156, 39, 176, 0.1)', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'channel',
      [
        { time: data[20].time, price: data[20].low },
        { time: data[60].time, price: data[60].high },
        { time: data[40].time, price: data[40].low },
      ],
      { color: '#9C27B0', fillColor: 'rgba(156, 39, 176, 0.1)', lineWidth: 1 },
    );
    return container;
  },
};

export const Ellipse: Story = {
  name: 'Ellipse',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('ellipse', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#E91E63', fillColor: 'rgba(233, 30, 99, 0.1)', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'ellipse',
      [
        { time: data[20].time, price: data[20].low },
        { time: data[60].time, price: data[60].high },
      ],
      { color: '#E91E63', fillColor: 'rgba(233, 30, 99, 0.1)', lineWidth: 1 },
    );
    return container;
  },
};

export const Pitchfork: Story = {
  name: 'Pitchfork',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('pitchfork', [
  { time: data[20].time, price: data[20].low },
  { time: data[40].time, price: data[40].high },
  { time: data[60].time, price: data[60].low },
], { color: '#00BCD4', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'pitchfork',
      [
        { time: data[20].time, price: data[20].low },
        { time: data[40].time, price: data[40].high },
        { time: data[60].time, price: data[60].low },
      ],
      { color: '#00BCD4', lineWidth: 1 },
    );
    return container;
  },
};

export const FibProjection: Story = {
  name: 'Fib Projection',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('fib-projection', [
  { time: data[20].time, price: data[20].low },
  { time: data[40].time, price: data[40].high },
  { time: data[60].time, price: data[60].close },
], { color: '#FF9800', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'fib-projection',
      [
        { time: data[20].time, price: data[20].low },
        { time: data[40].time, price: data[40].high },
        { time: data[60].time, price: data[60].close },
      ],
      { color: '#FF9800', lineWidth: 1 },
    );
    return container;
  },
};

export const FibArc: Story = {
  name: 'Fib Arc',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('fib-arc', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#4CAF50', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'fib-arc',
      [
        { time: data[20].time, price: data[20].low },
        { time: data[60].time, price: data[60].high },
      ],
      { color: '#4CAF50', lineWidth: 1 },
    );
    return container;
  },
};

export const FibFan: Story = {
  name: 'Fib Fan',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('fib-fan', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#FF5722', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'fib-fan',
      [
        { time: data[20].time, price: data[20].low },
        { time: data[60].time, price: data[60].high },
      ],
      { color: '#FF5722', lineWidth: 1 },
    );
    return container;
  },
};

export const Crossline: Story = {
  name: 'Crossline',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('crossline', [
  { time: data[50].time, price: data[50].close },
], { color: '#607D8B', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'crossline',
      [{ time: data[50].time, price: data[50].close }],
      { color: '#607D8B', lineWidth: 1 },
    );
    return container;
  },
};

export const Measurement: Story = {
  name: 'Measurement',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('measurement', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#795548', lineWidth: 1 });`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries();
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'measurement',
      [
        { time: data[20].time, price: data[20].low },
        { time: data[60].time, price: data[60].high },
      ],
      { color: '#795548', lineWidth: 1 },
    );
    return container;
  },
};
