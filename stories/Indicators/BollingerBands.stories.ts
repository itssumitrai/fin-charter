import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { computeBollinger } from '@itssumitrai/fin-charter/indicators';
import type { Bar } from '../../src/core/types';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Indicators/Bollinger Bands',
  parameters: {
    docs: {
      description: {
        component:
          'Bollinger Bands — a volatility indicator consisting of a middle SMA band and upper/lower bands ' +
          'at a configurable number of standard deviations. Bands widen during high volatility and contract ' +
          'during low volatility. Default: 20-period SMA with 2 standard deviations.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function indicatorToLineBars(bars: Bar[], values: Float64Array): Bar[] {
  const result: Bar[] = [];
  for (let i = 0; i < bars.length; i++) {
    const v = values[i];
    if (!isNaN(v)) {
      result.push({ time: bars[i].time, open: v, high: v, low: v, close: v, volume: 0 });
    }
  }
  return result;
}

export const ChartManaged: Story = {
  name: 'Bollinger Bands (chart.addIndicator)',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addIndicator('bollinger', {
  source: series,
  params: { period: 20, stdDev: 2 },
  label: 'BB 20,2',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.addIndicator('bollinger', {
      source: series,
      params: { period: 20, stdDev: 2 },
      label: 'BB 20,2',
    });

    return withDocs(container, {
      description:
        '<strong>Bollinger Bands</strong> using the chart-managed <code>addIndicator()</code> API. ' +
        'The chart automatically computes upper, middle (SMA), and lower bands and renders them as overlay lines. ' +
        'Parameters: <code>period: 20</code> (SMA lookback) and <code>stdDev: 2</code> (band width in standard deviations). ' +
        'Prices touching the upper band may indicate overbought conditions; prices near the lower band may indicate oversold.',
      code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Chart-managed Bollinger Bands — auto-computed and rendered
chart.addIndicator('bollinger', {
  source: series,
  params: { period: 20, stdDev: 2 },
  label: 'BB 20,2',
});`,
    });
  },
};

export const ManualCompute: Story = {
  name: 'Bollinger Bands (manual compute)',
  parameters: {
    docs: {
      source: {
        code: `import { computeBollinger } from '@itssumitrai/fin-charter/indicators';

const closes = new Float64Array(bars.map(b => b.close));
const { upper, middle, lower } = computeBollinger(closes, bars.length, 20, 2);

chart.addSeries({ type: 'line', color: '#ab47bc' }).setData(upperBars);
chart.addSeries({ type: 'line', color: '#f4c430' }).setData(middleBars);
chart.addSeries({ type: 'line', color: '#ab47bc' }).setData(lowerBars);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const bars = AAPL_DAILY;
    const closes = new Float64Array(bars.map((b) => b.close));

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(bars);

    const { upper, middle, lower } = computeBollinger(closes, bars.length, 20, 2);

    chart.addSeries({ type: 'line', color: '#ab47bc', lineWidth: 1 }).setData(indicatorToLineBars(bars, upper));
    chart.addSeries({ type: 'line', color: '#f4c430', lineWidth: 2 }).setData(indicatorToLineBars(bars, middle));
    chart.addSeries({ type: 'line', color: '#ab47bc', lineWidth: 1 }).setData(indicatorToLineBars(bars, lower));

    return withDocs(container, {
      description:
        '<strong>Bollinger Bands (manual)</strong> using the low-level <code>computeBollinger()</code> function from ' +
        '<code>@itssumitrai/fin-charter/indicators</code>. Returns <code>{ upper, middle, lower }</code> as Float64Arrays. ' +
        'The <strong>middle band</strong> (yellow) is a 20-period SMA. The <strong>upper</strong> and <strong>lower bands</strong> (purple) ' +
        'are placed 2 standard deviations above and below. This approach gives full control over styling each band independently.',
      code: `import { computeBollinger } from '@itssumitrai/fin-charter/indicators';

const closes = new Float64Array(bars.map(b => b.close));
const { upper, middle, lower } = computeBollinger(closes, bars.length, 20, 2);

// Upper band (purple)
chart.addSeries({ type: 'line', color: '#ab47bc', lineWidth: 1 }).setData(upperBars);
// Middle band / SMA (yellow)
chart.addSeries({ type: 'line', color: '#f4c430', lineWidth: 2 }).setData(middleBars);
// Lower band (purple)
chart.addSeries({ type: 'line', color: '#ab47bc', lineWidth: 1 }).setData(lowerBars);`,
    });
  },
};

export const CustomParams: Story = {
  name: 'Bollinger Bands (custom params)',
  parameters: {
    docs: {
      source: {
        code: `// Tight bands: period 10, 1.5 std dev
chart.addIndicator('bollinger', {
  source: series,
  params: { period: 10, stdDev: 1.5 },
});

// Wide bands: period 30, 2.5 std dev
chart.addIndicator('bollinger', {
  source: series,
  params: { period: 30, stdDev: 2.5 },
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    // Tight bands
    chart.addIndicator('bollinger', {
      source: series,
      params: { period: 10, stdDev: 1.5 },
      colors: { upper: '#00e5ff', middle: '#00e5ff', lower: '#00e5ff' },
      label: 'BB 10,1.5',
    });

    // Wide bands
    chart.addIndicator('bollinger', {
      source: series,
      params: { period: 30, stdDev: 2.5 },
      colors: { upper: '#ff9800', middle: '#ff9800', lower: '#ff9800' },
      label: 'BB 30,2.5',
    });

    return withDocs(container, {
      description:
        'Two sets of <strong>Bollinger Bands</strong> with different parameters overlaid on the same chart. ' +
        'The <span style="color:#00e5ff">tight bands</span> (period 10, 1.5 std dev) react faster to price changes, ' +
        'while the <span style="color:#ff9800">wide bands</span> (period 30, 2.5 std dev) provide a broader envelope. ' +
        'Comparing band widths helps identify volatility regimes and potential breakout opportunities.',
      code: `// Tight bands (cyan): period 10, 1.5 std dev
chart.addIndicator('bollinger', {
  source: series,
  params: { period: 10, stdDev: 1.5 },
  colors: { upper: '#00e5ff', middle: '#00e5ff', lower: '#00e5ff' },
  label: 'BB 10,1.5',
});

// Wide bands (orange): period 30, 2.5 std dev
chart.addIndicator('bollinger', {
  source: series,
  params: { period: 30, stdDev: 2.5 },
  colors: { upper: '#ff9800', middle: '#ff9800', lower: '#ff9800' },
  label: 'BB 30,2.5',
});`,
    });
  },
};
