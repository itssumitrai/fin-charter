import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';

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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Ray</strong> draws a line that starts at the first point and extends infinitely through the second point. ' +
        'Use rays to project <code>support</code> and <code>resistance</code> levels into the future.',
      code: `chart.addDrawing('ray', [
  { time: data[20].time, price: data[20].close },
  { time: data[60].time, price: data[60].close },
], { color: '#2196F3', lineWidth: 2 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Arrow</strong> draws a directional line with an arrowhead at the endpoint. ' +
        'Useful for annotating <code>trend direction</code> or highlighting specific price moves on the chart.',
      code: `chart.addDrawing('arrow', [
  { time: data[20].time, price: data[20].close },
  { time: data[60].time, price: data[60].close },
], { color: '#FF9800', lineWidth: 2 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Channel</strong> draws two parallel trend lines defined by three anchor points. ' +
        'Channels help identify <code>price consolidation zones</code> and potential breakout areas in technical analysis.',
      code: `chart.addDrawing('channel', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
  { time: data[40].time, price: data[40].low },
], { color: '#9C27B0', fillColor: 'rgba(156, 39, 176, 0.1)', lineWidth: 1 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Ellipse</strong> draws an oval shape between two anchor points. ' +
        'Use it to circle <code>chart patterns</code> like double tops, cup-and-handle formations, or areas of interest.',
      code: `chart.addDrawing('ellipse', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#E91E63', fillColor: 'rgba(233, 30, 99, 0.1)', lineWidth: 1 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Pitchfork</strong> (Andrews\' Pitchfork) uses three points to define a median line and two parallel channel boundaries. ' +
        'It identifies potential <code>support</code>, <code>resistance</code>, and <code>median reversion</code> levels.',
      code: `chart.addDrawing('pitchfork', [
  { time: data[20].time, price: data[20].low },
  { time: data[40].time, price: data[40].high },
  { time: data[60].time, price: data[60].low },
], { color: '#00BCD4', lineWidth: 1 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Fibonacci Projection</strong> uses three points (swing low, swing high, pullback) to project ' +
        'potential <code>price targets</code> based on Fibonacci ratios like 1.618 and 2.618.',
      code: `chart.addDrawing('fib-projection', [
  { time: data[20].time, price: data[20].low },
  { time: data[40].time, price: data[40].high },
  { time: data[60].time, price: data[60].close },
], { color: '#FF9800', lineWidth: 1 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Fibonacci Arc</strong> draws curved lines at key Fibonacci levels (38.2%, 50%, 61.8%) radiating from ' +
        'the second anchor point. Arcs combine <code>price</code> and <code>time</code> dimensions for retracement analysis.',
      code: `chart.addDrawing('fib-arc', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#4CAF50', lineWidth: 1 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Fibonacci Fan</strong> draws diagonal lines from the first anchor through Fibonacci retracement levels ' +
        'of the second anchor. The fan lines act as dynamic <code>support</code> and <code>resistance</code> over time.',
      code: `chart.addDrawing('fib-fan', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#FF5722', lineWidth: 1 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
    const data = generateOHLCV(100);
    series.setData(data);
    chart.addDrawing(
      'crossline',
      [{ time: data[50].time, price: data[50].close }],
      { color: '#607D8B', lineWidth: 1 },
    );
    return withDocs(container, {
      description:
        '<strong>Crossline</strong> places a full-width horizontal and vertical line intersecting at a single point. ' +
        'Ideal for marking a specific <code>price</code> and <code>time</code> coordinate on the chart.',
      code: `chart.addDrawing('crossline', [
  { time: data[50].time, price: data[50].close },
], { color: '#607D8B', lineWidth: 1 });`,
    });
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
    const series = chart.addSeries({ type: 'candlestick' });
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
    return withDocs(container, {
      description:
        '<strong>Measurement</strong> draws a rectangle between two points and displays the <code>price change</code>, ' +
        '<code>percentage change</code>, and <code>bar count</code> within the selected range.',
      code: `chart.addDrawing('measurement', [
  { time: data[20].time, price: data[20].low },
  { time: data[60].time, price: data[60].high },
], { color: '#795548', lineWidth: 1 });`,
    });
  },
};
