import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

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
  parameters: {
    docs: {
      source: {
        code: `
import { createChart } from 'fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });

const series1 = chart.addLineSeries({ color: '#2962FF', lineWidth: 2 });
series1.setData(stockA);

const series2 = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
series2.setData(stockB);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series1 = chart.addLineSeries({ color: '#2962FF', lineWidth: 2 });
    series1.setData(AAPL_DAILY);

    const shifted = AAPL_DAILY.map((b) => ({
      ...b,
      open: b.open - 10,
      high: b.high - 10,
      low: b.low - 10,
      close: b.close - 10,
    }));
    const series2 = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
    series2.setData(shifted);

    return withDocs(container, {
      description:
        'Multiple series can be overlaid on the same chart by calling <code>addLineSeries()</code> (or any series type) multiple times. ' +
        'Each series gets its own data and style but shares the time axis and price scale.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

// First series
const series1 = chart.addLineSeries({ color: '#2962FF', lineWidth: 2 });
series1.setData(stockA);

// Second series overlaid on the same chart
const series2 = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
series2.setData(stockB);
      `,
    });
  },
};

export const CandlestickWithLine: Story = {
  name: 'Candlestick + Line Overlay',
  parameters: {
    docs: {
      source: {
        code: `
const candles = chart.addCandlestickSeries();
candles.setData(ohlcData);

const sma = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
sma.setData(smaData);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(AAPL_DAILY);

    const smaData = AAPL_DAILY.map((bar, i) => {
      const slice = AAPL_DAILY.slice(Math.max(0, i - 19), i + 1);
      const avg = slice.reduce((s, b) => s + b.close, 0) / slice.length;
      return { ...bar, open: avg, high: avg, low: avg, close: avg };
    });

    const lineSeries = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
    lineSeries.setData(smaData);

    return withDocs(container, {
      description:
        'Combine different series types on the same chart. Here a <strong>candlestick series</strong> shows OHLC data while a <strong>line series</strong> ' +
        'overlays a simple moving average (SMA). This is a common pattern for adding indicator overlays manually.',
      code: `
const candles = chart.addCandlestickSeries();
candles.setData(ohlcData);

// Overlay a moving average as a line series
const sma = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
sma.setData(smaData);
      `,
    });
  },
};

export const WithVolumeOverlay: Story = {
  name: 'With Volume Overlay',
  parameters: {
    docs: {
      source: {
        code: `
const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: { visible: true },
});
chart.addCandlestickSeries().setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      volume: { visible: true },
    });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    return withDocs(container, {
      description:
        'Enable the built-in <strong>volume overlay</strong> with <code>volume: { visible: true }</code>. ' +
        'Volume bars appear at the bottom of the chart using the same up/down color convention as the candles.',
      code: `
const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  volume: { visible: true },  // Enable volume overlay
});
chart.addCandlestickSeries().setData(data);
      `,
    });
  },
};

export const WithMarkersAndPriceLines: Story = {
  name: 'With Markers & Price Lines',
  parameters: {
    docs: {
      source: {
        code: `
const series = chart.addCandlestickSeries();
series.setData(data);

series.setMarkers([
  { time: '2024-03-15', position: 'belowBar', shape: 'arrowUp', color: '#22AB94', text: 'Buy' },
  { time: '2024-05-10', position: 'aboveBar', shape: 'arrowDown', color: '#F7525F', text: 'Sell' },
]);

series.createPriceLine({
  price: 150, color: '#22AB94', lineWidth: 1, lineStyle: 'dashed', title: 'Support',
});
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    series.setMarkers([
      { time: AAPL_DAILY[20].time, position: 'belowBar', shape: 'arrowUp', color: '#22AB94', text: 'Buy', size: 1.5 },
      { time: AAPL_DAILY[50].time, position: 'aboveBar', shape: 'arrowDown', color: '#F7525F', text: 'Sell', size: 1.5 },
      { time: AAPL_DAILY[80].time, position: 'inBar', shape: 'circle', color: '#2962FF', text: 'Info' },
    ]);

    series.createPriceLine({
      price: AAPL_DAILY[20].close, color: '#22AB94', lineWidth: 1, lineStyle: 'dashed',
      title: 'Support', axisLabelVisible: true,
    });
    series.createPriceLine({
      price: AAPL_DAILY[50].close, color: '#F7525F', lineWidth: 1, lineStyle: 'dotted',
      title: 'Resistance', axisLabelVisible: true,
      axisLabelColor: '#F7525F', axisLabelTextColor: '#ffffff',
    });

    return withDocs(container, {
      description:
        'Annotate charts with <strong>markers</strong> (buy/sell signals, info points) and <strong>price lines</strong> (support/resistance levels).\n' +
        'Use <code>series.setMarkers()</code> with <code>position</code> (belowBar, aboveBar, inBar), <code>shape</code> (arrowUp, arrowDown, circle), ' +
        'and <code>text</code>. Use <code>series.createPriceLine()</code> with <code>price</code>, <code>color</code>, <code>lineStyle</code>, and <code>title</code>.',
      code: `
// Add trading signal markers
series.setMarkers([
  { time: t1, position: 'belowBar', shape: 'arrowUp', color: '#22AB94', text: 'Buy' },
  { time: t2, position: 'aboveBar', shape: 'arrowDown', color: '#F7525F', text: 'Sell' },
  { time: t3, position: 'inBar', shape: 'circle', color: '#2962FF', text: 'Info' },
]);

// Add support / resistance price lines
series.createPriceLine({
  price: 150,
  color: '#22AB94',
  lineWidth: 1,
  lineStyle: 'dashed',
  title: 'Support',
  axisLabelVisible: true,
});
      `,
    });
  },
};

export const WithWatermark: Story = {
  name: 'With Watermark',
  parameters: {
    docs: {
      source: {
        code: `
const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true,
    text: 'AAPL',
    color: 'rgba(255,255,255,0.08)',
    fontSize: 64,
  },
});
chart.addCandlestickSeries().setData(data);
`.trim(),
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
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

    return withDocs(container, {
      description:
        'Add a <strong>watermark</strong> behind the chart content using the <code>watermark</code> option. ' +
        'Configure <code>text</code>, <code>fontSize</code>, <code>color</code> (use semi-transparent), and alignment ' +
        '(<code>horzAlign</code>: center/left/right, <code>vertAlign</code>: center/top/bottom).',
      code: `
const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  watermark: {
    visible: true,
    text: 'AAPL',
    color: 'rgba(255,255,255,0.08)',
    fontSize: 64,
    horzAlign: 'center',
    vertAlign: 'center',
  },
});
chart.addCandlestickSeries().setData(data);
      `,
    });
  },
};
