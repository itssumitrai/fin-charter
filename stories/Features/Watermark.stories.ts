import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Watermark',
  parameters: {
    docs: {
      description: {
        component:
          'A watermark is a semi-transparent text label rendered behind the chart data. ' +
          'It is typically used to display the ticker symbol or chart source.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'AAPL Watermark',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      watermark: {
        visible: true,
        text: 'AAPL',
        fontSize: 48,
        color: 'rgba(255,255,255,0.08)',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const LargeText: Story = {
  name: 'Large Watermark',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      watermark: {
        visible: true,
        text: 'FIN-CHARTER',
        fontSize: 64,
        color: 'rgba(0, 229, 255, 0.06)',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });
    const series = chart.addAreaSeries({
      lineColor: '#00e5ff',
      topColor: 'rgba(0, 229, 255, 0.3)',
      bottomColor: 'rgba(0, 229, 255, 0.0)',
    });
    series.setData(AAPL_DAILY);
    return container;
  },
};

export const CornerWatermark: Story = {
  name: 'Corner Watermark',
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      watermark: {
        visible: true,
        text: 'DEMO',
        fontSize: 32,
        color: 'rgba(255,255,255,0.12)',
        horzAlign: 'right',
        vertAlign: 'bottom',
      },
    });
    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);
    return container;
  },
};
