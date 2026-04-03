import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';

const meta: Meta = {
  title: 'Features/Multiple Series',
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

    const series1 = chart.addLineSeries({ color: '#2962FF', lineWidth: 2 });
    series1.setData(AAPL_DAILY);

    // Shift all prices by a fixed offset to simulate a second instrument
    const shifted = AAPL_DAILY.map((b) => ({
      ...b,
      open: b.open - 10,
      high: b.high - 10,
      low: b.low - 10,
      close: b.close - 10,
    }));
    const series2 = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
    series2.setData(shifted);

    return container;
  },
};

export const CandlestickWithLine: Story = {
  name: 'Candlestick + Line Overlay',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    // SMA-like overlay computed from AAPL_DAILY
    const smaData = AAPL_DAILY.map((bar, i) => {
      const slice = AAPL_DAILY.slice(Math.max(0, i - 19), i + 1);
      const avg = slice.reduce((s, b) => s + b.close, 0) / slice.length;
      return { ...bar, open: avg, high: avg, low: avg, close: avg };
    });

    const lineSeries = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
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

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    return container;
  },
};

export const WithMarkersAndPriceLines: Story = {
  name: 'With Markers & Price Lines',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    series.setMarkers([
      { time: AAPL_DAILY[20].time, position: 'belowBar', shape: 'arrowUp', color: '#26a69a', text: 'Buy', size: 1.5 },
      { time: AAPL_DAILY[50].time, position: 'aboveBar', shape: 'arrowDown', color: '#ef5350', text: 'Sell', size: 1.5 },
      { time: AAPL_DAILY[80].time, position: 'inBar', shape: 'circle', color: '#2962FF', text: 'Info' },
    ]);

    series.createPriceLine({
      price: AAPL_DAILY[20].close, color: '#26a69a', lineWidth: 1, lineStyle: 'dashed',
      title: 'Support', axisLabelVisible: true,
    });
    series.createPriceLine({
      price: AAPL_DAILY[50].close, color: '#ef5350', lineWidth: 1, lineStyle: 'dotted',
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

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    return container;
  },
};
