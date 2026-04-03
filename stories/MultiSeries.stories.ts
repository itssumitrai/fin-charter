import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer, generateOHLCV } from './helpers';

const meta: Meta = {
  title: 'Charts/Multi-Series',
  parameters: {
    docs: {
      description: {
        component: 'Two line series overlaid on the same chart, demonstrating multi-series support.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const TwoLineSeriesOverlaid: Story = {
  name: 'Two Line Series',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const data1 = generateOHLCV(120, 100);
    const data2 = generateOHLCV(120, 95);

    const series1 = chart.addLineSeries({ color: '#2962FF' });
    series1.setData(data1);

    const series2 = chart.addLineSeries({ color: '#FF6D00' });
    series2.setData(data2);

    return container;
  },
};

export const CandlestickWithLine: Story = {
  name: 'Candlestick + Line Overlay',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const data = generateOHLCV(120, 100);

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(data);

    // SMA-like overlay: use same data shifted
    const smaData = data.map((bar, i) => {
      const window = data.slice(Math.max(0, i - 19), i + 1);
      const avg = window.reduce((s, b) => s + b.close, 0) / window.length;
      return { ...bar, open: avg, high: avg, low: avg, close: avg };
    });

    const lineSeries = chart.addLineSeries({ color: '#FF6D00' });
    lineSeries.setData(smaData);

    return container;
  },
};

export const WithVolumeOverlay: Story = {
  name: 'With Volume Overlay',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      volume: { visible: true },
    });

    const data = generateOHLCV(120, 100);
    const series = chart.addCandlestickSeries();
    series.setData(data);

    return container;
  },
};

export const WithMarkersAndPriceLines: Story = {
  name: 'With Markers & Price Lines',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const data = generateOHLCV(120, 100);
    const series = chart.addCandlestickSeries();
    series.setData(data);

    // Add markers at a few points
    series.setMarkers([
      { time: data[20].time, position: 'belowBar', shape: 'arrowUp', color: '#26a69a', text: 'Buy', size: 1.5 },
      { time: data[50].time, position: 'aboveBar', shape: 'arrowDown', color: '#ef5350', text: 'Sell', size: 1.5 },
      { time: data[80].time, position: 'inBar', shape: 'circle', color: '#2962FF', text: 'Info' },
    ]);

    // Add price lines
    series.createPriceLine({
      price: data[20].close, color: '#26a69a', lineWidth: 1, lineStyle: 'dashed',
      title: 'Support', axisLabelVisible: true,
    });
    series.createPriceLine({
      price: data[50].close, color: '#ef5350', lineWidth: 1, lineStyle: 'dotted',
      title: 'Resistance', axisLabelVisible: true,
      axisLabelColor: '#ef5350', axisLabelTextColor: '#ffffff',
    });

    return container;
  },
};

export const WithWatermark: Story = {
  name: 'With Watermark',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      watermark: {
        visible: true,
        text: 'AAPL',
        color: 'rgba(255,255,255,0.08)',
        fontSize: 64,
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });

    const data = generateOHLCV(120, 100);
    const series = chart.addCandlestickSeries();
    series.setData(data);

    return container;
  },
};
