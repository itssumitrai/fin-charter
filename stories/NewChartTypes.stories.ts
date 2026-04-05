import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from './helpers';
import { AAPL_DAILY } from './sample-data';
import { withDocs } from './doc-renderer';

const meta: Meta = {
  title: 'Chart Types/Extended',
  parameters: {
    docs: {
      description: {
        component: 'Extended chart types: step-line, colored line, colored mountain, HLC area, high-low, column, volume candles, baseline delta mountain, renko, kagi, line break, and point & figure.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const StepLine: Story = {
  name: 'Step Line',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(document.getElementById('chart'), { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'step-line', color: '#00e5ff' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'step-line', color: '#00e5ff' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>step line</strong> chart connects close prices with horizontal-then-vertical segments, ideal for discrete or rate data. ' +
        'Unlike a standard line chart that draws diagonal segments between points, the step line emphasizes that the value remains constant until the next change.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'step-line', color: '#00e5ff' });
series.setData(data);
      `,
    });
  },
};

export const ColoredLine: Story = {
  name: 'Colored Line',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'colored-line', upColor: '#00E396', downColor: '#FF3B5C' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'colored-line', upColor: '#00E396', downColor: '#FF3B5C' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>colored line</strong> chart changes color per segment based on price direction. ' +
        'Green segments indicate rising prices and red segments indicate falling prices, making trend direction immediately visible.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({
  type: 'colored-line',
  upColor: '#00E396',
  downColor: '#FF3B5C',
});
series.setData(data);
      `,
    });
  },
};

export const ColoredMountain: Story = {
  name: 'Colored Mountain',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({
  type: 'colored-mountain',
  upColor: '#00E396',
  downColor: '#FF3B5C',
  upFillColor: 'rgba(0,227,150,0.3)',
  downFillColor: 'rgba(255,59,92,0.3)',
});
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({
      type: 'colored-mountain',
      upColor: '#00E396',
      downColor: '#FF3B5C',
      upFillColor: 'rgba(0,227,150,0.3)',
      downFillColor: 'rgba(255,59,92,0.3)',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>colored mountain</strong> (area) chart combines per-segment coloring with gradient fills. ' +
        'Rising segments use <code>upColor</code> / <code>upFillColor</code> and falling segments use <code>downColor</code> / <code>downFillColor</code>.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({
  type: 'colored-mountain',
  upColor: '#00E396',
  downColor: '#FF3B5C',
  upFillColor: 'rgba(0,227,150,0.3)',
  downFillColor: 'rgba(255,59,92,0.3)',
});
series.setData(data);
      `,
    });
  },
};

export const HLCArea: Story = {
  name: 'HLC Area',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({
  type: 'hlc-area',
  highLineColor: '#00E396',
  lowLineColor: '#FF3B5C',
  fillColor: 'rgba(41,98,255,0.15)',
});
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({
      type: 'hlc-area',
      highLineColor: '#00E396',
      lowLineColor: '#FF3B5C',
      fillColor: 'rgba(41,98,255,0.15)',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>HLC Area</strong> chart draws the high-low range as a filled band with separate high and low lines. ' +
        'The area between the high line and low line is filled with a translucent color, clearly showing the price range for each period.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({
  type: 'hlc-area',
  highLineColor: '#00E396',
  lowLineColor: '#FF3B5C',
  fillColor: 'rgba(41,98,255,0.15)',
});
series.setData(data);
      `,
    });
  },
};

export const HighLow: Story = {
  name: 'High-Low',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'high-low', color: '#2962ff' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'high-low', color: '#2962ff' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>high-low</strong> bar chart shows only the price range per period without open/close marks. ' +
        'Each vertical bar spans from the low to the high price, providing a clean view of volatility and range.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'high-low', color: '#2962ff' });
series.setData(data);
      `,
    });
  },
};

export const Column: Story = {
  name: 'Column',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'column', upColor: '#00E396', downColor: '#FF3B5C' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'column', upColor: '#00E396', downColor: '#FF3B5C' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>column</strong> chart draws vertical bars from the chart bottom to the close price. ' +
        'Bars are colored green when the close is at or above the open and red when the close is below the open, giving an instant read on intrabar direction.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({
  type: 'column',
  upColor: '#00E396',
  downColor: '#FF3B5C',
});
series.setData(data);
      `,
    });
  },
};

export const VolumeCandle: Story = {
  name: 'Volume Candle',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'volume-candle' });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'volume-candle' });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>volume candle</strong> chart varies the candle body width based on trading volume. ' +
        'Higher-volume periods produce wider candles, letting you see at a glance which price moves were backed by significant trading activity.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'volume-candle' });
series.setData(data); // { time, open, high, low, close, volume }
      `,
    });
  },
};

export const BaselineDeltaMountain: Story = {
  name: 'Baseline Delta Mountain',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({
  type: 'baseline-delta-mountain',
  basePrice: 110,
  topFillColor: 'rgba(0,229,255,0.3)',
  bottomFillColor: 'rgba(255,107,107,0.3)',
});
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({
      type: 'baseline-delta-mountain',
      basePrice: 110,
      topFillColor: 'rgba(0,229,255,0.3)',
      bottomFillColor: 'rgba(255,107,107,0.3)',
    });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>baseline delta mountain</strong> chart fills the area between the price line and a reference price (<code>basePrice</code>). ' +
        'Areas above the baseline use <code>topFillColor</code> and areas below use <code>bottomFillColor</code>, clearly showing deviation from the reference.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({
  type: 'baseline-delta-mountain',
  basePrice: 110,
  topFillColor: 'rgba(0,229,255,0.3)',
  bottomFillColor: 'rgba(255,107,107,0.3)',
});
series.setData(data);
      `,
    });
  },
};

export const Renko: Story = {
  name: 'Renko',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'renko', boxSize: 2 });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'renko', boxSize: 2 });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>Renko</strong> chart builds uniform bricks of a fixed <code>boxSize</code>, filtering out noise to show pure price trends. ' +
        'A new brick is drawn only when the price moves by the box size amount, ignoring time entirely.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'renko', boxSize: 2 });
series.setData(data);
      `,
    });
  },
};

export const Kagi: Story = {
  name: 'Kagi',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'kagi', reversalAmount: 2 });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'kagi', reversalAmount: 2 });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>Kagi</strong> chart draws thick (yang) and thin (yin) vertical lines based on price reversals. ' +
        'A reversal occurs when price moves by the <code>reversalAmount</code> in the opposite direction. Thick lines indicate demand, thin lines indicate supply.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'kagi', reversalAmount: 2 });
series.setData(data);
      `,
    });
  },
};

export const LineBreak: Story = {
  name: 'Line Break',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'line-break', breakCount: 3 });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'line-break', breakCount: 3 });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>line break</strong> chart draws boxes only when price breaks above or below the last N boxes (controlled by <code>breakCount</code>). ' +
        'With a break count of 3, a new reversal box appears only when price exceeds the high or low of the previous 3 boxes, filtering minor fluctuations.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({ type: 'line-break', breakCount: 3 });
series.setData(data);
      `,
    });
  },
};

export const PointFigure: Story = {
  name: 'Point & Figure',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'point-figure', boxSize: 2, reversalBoxes: 3 });
series.setData(data);`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'point-figure', boxSize: 2, reversalBoxes: 3 });
    series.setData(AAPL_DAILY);
    return withDocs(container, {
      description:
        'The <strong>Point & Figure</strong> chart uses X columns (rising prices) and O columns (falling prices) to show price movement. ' +
        'Each X or O represents a <code>boxSize</code> price movement. A new column starts when price reverses by <code>reversalBoxes</code> boxes in the opposite direction.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
});
const series = chart.addSeries({
  type: 'point-figure',
  boxSize: 2,
  reversalBoxes: 3,
});
series.setData(data);
      `,
    });
  },
};
