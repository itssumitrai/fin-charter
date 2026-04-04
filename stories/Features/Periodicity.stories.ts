import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { Periodicity } from 'fin-charter';
import type { Bar } from '../../src/core/types';
import { createChartContainer, generateOHLCV } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Features/Periodicity',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates periodicity switching. Clicking an interval button calls chart.setPeriodicity() ' +
          'and reloads appropriate data for that interval. The chart re-renders with the correct time labels.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

interface IntervalDef {
  label: string;
  periodicity: Periodicity;
  intervalSeconds: number;
  barCount: number;
}

const INTERVALS: IntervalDef[] = [
  { label: '1m',  periodicity: { interval: 1,  unit: 'minute' }, intervalSeconds: 60,    barCount: 390  },
  { label: '5m',  periodicity: { interval: 5,  unit: 'minute' }, intervalSeconds: 300,   barCount: 200  },
  { label: '1h',  periodicity: { interval: 1,  unit: 'hour'   }, intervalSeconds: 3600,  barCount: 200  },
  { label: '1D',  periodicity: { interval: 1,  unit: 'day'    }, intervalSeconds: 86400, barCount: 0    }, // uses AAPL_DAILY
];

/** Generate intraday bars ending at a fixed recent timestamp. */
function generateIntradayData(intervalSeconds: number, barCount: number): Bar[] {
  // Anchor end to market close on 2024-12-31 (approx)
  const END_TIME = 1735660800; // 2024-12-31 16:00 ET
  const startTime = END_TIME - intervalSeconds * barCount;
  return generateOHLCV(barCount, 185, startTime).map((b, i) => ({
    ...b,
    time: startTime + i * intervalSeconds,
  }));
}

export const IntervalSwitcher: Story = {
  name: 'Interval Switcher',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(dailyData);

// Switch to 5-minute bars
chart.setPeriodicity({ interval: 5, unit: 'minute' });
series.setData(fiveMinData);
chart.fitContent();`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display: flex; align-items: center; gap: 6px; padding: 8px 12px; ' +
      'background: #1e2235; border-radius: 4px;';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addCandlestickSeries({
      upColor: '#22AB94',
      downColor: '#F7525F',
      borderUpColor: '#22AB94',
      borderDownColor: '#F7525F',
      wickUpColor: '#22AB94',
      wickDownColor: '#F7525F',
    });

    // Start with daily data
    series.setData(AAPL_DAILY);
    chart.setPeriodicity({ interval: 1, unit: 'day' });

    let activeLabel = '1D';

    const buttons: HTMLButtonElement[] = [];

    INTERVALS.forEach(({ label, periodicity, intervalSeconds, barCount }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText =
        'padding: 5px 12px; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; ' +
        'border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;';

      if (label === '1D') {
        btn.style.background = '#1a4a6b';
        btn.style.borderColor = '#2196F3';
      }

      btn.addEventListener('click', () => {
        if (activeLabel === label) return;
        activeLabel = label;

        chart.setPeriodicity(periodicity);

        // Load appropriate data for the interval
        const data: Bar[] =
          label === '1D'
            ? AAPL_DAILY
            : generateIntradayData(intervalSeconds, barCount);

        series.setData(data);
        chart.fitContent();

        buttons.forEach((b) => {
          b.style.background = '#2a2e39';
          b.style.borderColor = '#434651';
        });
        btn.style.background = '#1a4a6b';
        btn.style.borderColor = '#2196F3';
      });

      buttons.push(btn);
      toolbar.appendChild(btn);
    });

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    return withDocs(wrapper, {
      description:
        'Switch between different chart <strong>timeframes / periodicities</strong> such as ' +
        '<code>1m</code>, <code>5m</code>, <code>1h</code>, and <code>1D</code>. ' +
        'Call <code>chart.setPeriodicity({ interval, unit })</code> to change the interval, then reload data for that timeframe.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(dailyData);

// Switch to 5-minute bars
chart.setPeriodicity({ interval: 5, unit: 'minute' });
series.setData(fiveMinData);
chart.fitContent();
      `,
    });
  },
};
