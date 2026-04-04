import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { generateOHLCV, createChartContainer } from '../helpers';

const meta: Meta = {
  title: 'Indicators/New Indicators',
  parameters: {
    docs: {
      description: {
        component:
          '12 new technical indicators: Aroon, Awesome Oscillator, Chaikin MF, Coppock, Elder Force, TRIX, Supertrend, VWMA, Choppiness, MFI, ROC, Linear Regression.',
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
        code: `import { createChart } from 'fin-charter';

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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('aroon', {
      source: series,
      params: { period: 25 },
      color: '#22AB94',
      label: 'Aroon(25)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('awesome-oscillator', {
      source: series,
      params: { fastPeriod: 5, slowPeriod: 34 },
      color: '#2196F3',
      label: 'AO(5,34)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('chaikin-mf', {
      source: series,
      params: { period: 20 },
      color: '#FF9800',
      label: 'CMF(20)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('coppock', {
      source: series,
      params: { wmaPeriod: 10, longROC: 14, shortROC: 11 },
      color: '#9C27B0',
      label: 'Coppock',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('elder-force', {
      source: series,
      params: { period: 13 },
      color: '#F44336',
      label: 'EFI(13)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('trix', {
      source: series,
      params: { period: 15, signalPeriod: 9 },
      color: '#00E5FF',
      label: 'TRIX(15,9)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('supertrend', {
      source: series,
      params: { period: 10, multiplier: 3 },
      color: '#4CAF50',
      label: 'ST(10,3)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('vwma', {
      source: series,
      params: { period: 20 },
      color: '#FF5722',
      label: 'VWMA(20)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('choppiness', {
      source: series,
      params: { period: 14 },
      color: '#FFC107',
      label: 'CHOP(14)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('mfi', {
      source: series,
      params: { period: 14 },
      color: '#E91E63',
      label: 'MFI(14)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('roc', {
      source: series,
      params: { period: 12 },
      color: '#607D8B',
      label: 'ROC(12)',
    });

    return container;
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

    const series = chart.addCandlestickSeries();
    series.setData(generateOHLCV(200));

    chart.addIndicator('linear-regression', {
      source: series,
      params: { period: 25 },
      color: '#3F51B5',
      label: 'LinReg(25)',
    });

    return container;
  },
};
