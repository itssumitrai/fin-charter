import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { generateOHLCV, createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Indicators/Momentum & Volume',
  parameters: {
    docs: {
      description: {
        component:
          'Momentum and volume indicators: Aroon, Awesome Oscillator, Chaikin MF, Coppock, Elder Force, TRIX, Supertrend, VWMA, Choppiness, MFI, ROC, Linear Regression.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// ─── Aroon (separate-pane) ───────────────────────────────────────────────────

export const AroonIndicator: Story = {
  name: 'Aroon',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addIndicator('aroon', {
  source: series,
  params: { period: 25 },
  color: '#22AB94',
  label: 'Aroon(25)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('aroon', {
      source: series,
      params: { period: 25 },
      color: '#22AB94',
      label: 'Aroon(25)',
    });

    return withDocs(container, {
      description:
        '<strong>Aroon</strong> — Identifies trend changes and trend strength by measuring how long since the highest high and lowest low within a <code>period</code> (default 25). Aroon Up near 100 signals a strong uptrend; Aroon Down near 100 signals a strong downtrend.',
      code: `chart.addIndicator('aroon', {
  source: series,
  params: { period: 25 },
  color: '#22AB94',
  label: 'Aroon(25)',
});`,
    });
  },
};

// ─── Awesome Oscillator (separate-pane) ──────────────────────────────────────

export const AwesomeOscillator: Story = {
  name: 'Awesome Oscillator',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('awesome-oscillator', {
  source: series,
  params: { fastPeriod: 5, slowPeriod: 34 },
  color: '#2196F3',
  label: 'AO(5,34)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('awesome-oscillator', {
      source: series,
      params: { fastPeriod: 5, slowPeriod: 34 },
      color: '#2196F3',
      label: 'AO(5,34)',
    });

    return withDocs(container, {
      description:
        '<strong>Awesome Oscillator</strong> — Measures market momentum by comparing a <code>fastPeriod</code> (5) SMA of median prices to a <code>slowPeriod</code> (34) SMA. Positive values indicate bullish momentum; negative values indicate bearish momentum. Zero-line crossovers generate trade signals.',
      code: `chart.addIndicator('awesome-oscillator', {
  source: series,
  params: { fastPeriod: 5, slowPeriod: 34 },
  color: '#2196F3',
  label: 'AO(5,34)',
});`,
    });
  },
};

// ─── Chaikin Money Flow (separate-pane) ──────────────────────────────────────

export const ChaikinMF: Story = {
  name: 'Chaikin Money Flow',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('chaikin-mf', {
  source: series,
  params: { period: 20 },
  color: '#FF9800',
  label: 'CMF(20)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('chaikin-mf', {
      source: series,
      params: { period: 20 },
      color: '#FF9800',
      label: 'CMF(20)',
    });

    return withDocs(container, {
      description:
        '<strong>Chaikin Money Flow</strong> — Measures the accumulation/distribution of money flow volume over a <code>period</code> (default 20). Values above 0 indicate buying pressure; below 0 indicate selling pressure. Sustained readings above/below zero confirm trend strength.',
      code: `chart.addIndicator('chaikin-mf', {
  source: series,
  params: { period: 20 },
  color: '#FF9800',
  label: 'CMF(20)',
});`,
    });
  },
};

// ─── Coppock Curve (separate-pane) ───────────────────────────────────────────

export const CoppockCurve: Story = {
  name: 'Coppock Curve',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('coppock', {
  source: series,
  params: { wmaPeriod: 10, longROC: 14, shortROC: 11 },
  color: '#9C27B0',
  label: 'Coppock',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('coppock', {
      source: series,
      params: { wmaPeriod: 10, longROC: 14, shortROC: 11 },
      color: '#9C27B0',
      label: 'Coppock',
    });

    return withDocs(container, {
      description:
        '<strong>Coppock Curve</strong> — A long-term momentum indicator originally designed to identify buying opportunities in stock indices. Computed as a weighted moving average (<code>wmaPeriod</code>: 10) of the sum of two rates of change (<code>longROC</code>: 14, <code>shortROC</code>: 11). A zero-line crossover from below signals a potential buy.',
      code: `chart.addIndicator('coppock', {
  source: series,
  params: { wmaPeriod: 10, longROC: 14, shortROC: 11 },
  color: '#9C27B0',
  label: 'Coppock',
});`,
    });
  },
};

// ─── Elder Force Index (separate-pane) ───────────────────────────────────────

export const ElderForce: Story = {
  name: 'Elder Force Index',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('elder-force', {
  source: series,
  params: { period: 13 },
  color: '#F44336',
  label: 'EFI(13)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('elder-force', {
      source: series,
      params: { period: 13 },
      color: '#F44336',
      label: 'EFI(13)',
    });

    return withDocs(container, {
      description:
        '<strong>Elder Force Index</strong> — Combines price change and volume to measure the power behind a price move. Smoothed with an EMA of <code>period</code> (default 13). Positive values indicate bulls are in control; negative values indicate bears dominate.',
      code: `chart.addIndicator('elder-force', {
  source: series,
  params: { period: 13 },
  color: '#F44336',
  label: 'EFI(13)',
});`,
    });
  },
};

// ─── TRIX (separate-pane) ────────────────────────────────────────────────────

export const TRIXIndicator: Story = {
  name: 'TRIX',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('trix', {
  source: series,
  params: { period: 15, signalPeriod: 9 },
  color: '#00E5FF',
  label: 'TRIX(15,9)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('trix', {
      source: series,
      params: { period: 15, signalPeriod: 9 },
      color: '#00E5FF',
      label: 'TRIX(15,9)',
    });

    return withDocs(container, {
      description:
        '<strong>TRIX</strong> — A triple-smoothed EMA oscillator that filters out insignificant price movements. Key parameters: <code>period</code> (15) for the triple EMA and <code>signalPeriod</code> (9) for the signal line. Crossovers between TRIX and its signal line generate trade signals.',
      code: `chart.addIndicator('trix', {
  source: series,
  params: { period: 15, signalPeriod: 9 },
  color: '#00E5FF',
  label: 'TRIX(15,9)',
});`,
    });
  },
};

// ─── Supertrend (overlay) ────────────────────────────────────────────────────

export const SupertrendIndicator: Story = {
  name: 'Supertrend',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('supertrend', {
  source: series,
  params: { period: 10, multiplier: 3 },
  color: '#4CAF50',
  label: 'ST(10,3)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '500px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('supertrend', {
      source: series,
      params: { period: 10, multiplier: 3 },
      color: '#4CAF50',
      label: 'ST(10,3)',
    });

    return withDocs(container, {
      description:
        '<strong>Supertrend</strong> — A trend-following overlay based on ATR that flips between support and resistance. Key parameters: <code>period</code> (10) for ATR calculation and <code>multiplier</code> (3) for band offset. Green line below price indicates uptrend; red line above indicates downtrend.',
      code: `chart.addIndicator('supertrend', {
  source: series,
  params: { period: 10, multiplier: 3 },
  color: '#4CAF50',
  label: 'ST(10,3)',
});`,
    });
  },
};

// ─── VWMA (overlay) ──────────────────────────────────────────────────────────

export const VWMAIndicator: Story = {
  name: 'VWMA',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('vwma', {
  source: series,
  params: { period: 20 },
  color: '#FF5722',
  label: 'VWMA(20)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '500px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('vwma', {
      source: series,
      params: { period: 20 },
      color: '#FF5722',
      label: 'VWMA(20)',
    });

    return withDocs(container, {
      description:
        '<strong>VWMA (Volume-Weighted Moving Average)</strong> — A moving average that weights each bar\'s price by its volume over a <code>period</code> (default 20). Unlike a simple SMA, VWMA gives more influence to high-volume bars. Displayed as a price overlay.',
      code: `chart.addIndicator('vwma', {
  source: series,
  params: { period: 20 },
  color: '#FF5722',
  label: 'VWMA(20)',
});`,
    });
  },
};

// ─── Choppiness Index (separate-pane) ────────────────────────────────────────

export const ChoppinessIndex: Story = {
  name: 'Choppiness Index',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('choppiness', {
  source: series,
  params: { period: 14 },
  color: '#FFC107',
  label: 'CHOP(14)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('choppiness', {
      source: series,
      params: { period: 14 },
      color: '#FFC107',
      label: 'CHOP(14)',
    });

    return withDocs(container, {
      description:
        '<strong>Choppiness Index</strong> — Determines whether the market is trending or trading sideways. Ranges from 0 to 100 over the given <code>period</code> (default 14). Values above 61.8 suggest a choppy, range-bound market; below 38.2 suggest a strong trend.',
      code: `chart.addIndicator('choppiness', {
  source: series,
  params: { period: 14 },
  color: '#FFC107',
  label: 'CHOP(14)',
});`,
    });
  },
};

// ─── Money Flow Index (separate-pane) ────────────────────────────────────────

export const MFIIndicator: Story = {
  name: 'Money Flow Index',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('mfi', {
  source: series,
  params: { period: 14 },
  color: '#E91E63',
  label: 'MFI(14)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('mfi', {
      source: series,
      params: { period: 14 },
      color: '#E91E63',
      label: 'MFI(14)',
    });

    return withDocs(container, {
      description:
        '<strong>MFI (Money Flow Index)</strong> — A volume-weighted RSI that oscillates between 0 and 100 over a <code>period</code> (default 14). Values above 80 indicate overbought conditions; below 20 indicate oversold. Incorporates both price and volume to gauge buying/selling pressure.',
      code: `chart.addIndicator('mfi', {
  source: series,
  params: { period: 14 },
  color: '#E91E63',
  label: 'MFI(14)',
});`,
    });
  },
};

// ─── Rate of Change (separate-pane) ──────────────────────────────────────────

export const ROCIndicator: Story = {
  name: 'Rate of Change',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('roc', {
  source: series,
  params: { period: 12 },
  color: '#607D8B',
  label: 'ROC(12)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '600px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('roc', {
      source: series,
      params: { period: 12 },
      color: '#607D8B',
      label: 'ROC(12)',
    });

    return withDocs(container, {
      description:
        '<strong>ROC (Rate of Change)</strong> — Measures the percentage change in price over a <code>period</code> (default 12). Positive values indicate upward momentum; negative values indicate downward momentum. Zero-line crossovers can signal trend shifts.',
      code: `chart.addIndicator('roc', {
  source: series,
  params: { period: 12 },
  color: '#607D8B',
  label: 'ROC(12)',
});`,
    });
  },
};

// ─── Linear Regression (overlay) ─────────────────────────────────────────────

export const LinearRegressionIndicator: Story = {
  name: 'Linear Regression',
  parameters: {
    docs: {
      source: {
        code: `chart.addIndicator('linear-regression', {
  source: series,
  params: { period: 25 },
  color: '#3F51B5',
  label: 'LinReg(25)',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    container.style.height = '500px';
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(generateOHLCV(200));

    chart.addIndicator('linear-regression', {
      source: series,
      params: { period: 25 },
      color: '#3F51B5',
      label: 'LinReg(25)',
    });

    return withDocs(container, {
      description:
        '<strong>Linear Regression</strong> — Fits a least-squares regression line to the last <code>period</code> (default 25) closing prices. The overlay shows where price "should" be based on the trend, helping identify deviations and mean-reversion opportunities.',
      code: `chart.addIndicator('linear-regression', {
  source: series,
  params: { period: 25 },
  color: '#3F51B5',
  label: 'LinReg(25)',
});`,
    });
  },
};
