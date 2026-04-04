import type { Meta, StoryObj } from '@storybook/html';
import { createChart, US_EQUITY_SESSIONS } from 'fin-charter';
import type { Bar } from '../../src/core/types';
import { createChartContainer } from '../helpers';

const meta: Meta = {
  title: 'Features/Extended Hours',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates market session support. Sessions (pre-market, regular, post-market) can be ' +
          'highlighted with background shading. Use setSessionFilter() to show only regular or ' +
          'all extended hours data.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/** Generate intraday bars at a given interval (seconds) for a number of trading days. */
function generateIntradayBars(days: number, intervalSeconds: number): Bar[] {
  const bars: Bar[] = [];
  // Start at 2024-01-02 04:00 ET (pre-market open, UTC = 09:00)
  // ET is UTC-5 in winter → 04:00 ET = 09:00 UTC
  const DAY_START_UTC = 1704067200 + 4 * 3600; // 2024-01-02 04:00 ET
  const DAY_SECONDS = 86400;
  // Pre-market: 04:00–09:30 ET, Regular: 09:30–16:00 ET, Post-market: 16:00–20:00 ET
  const SESSION_END_ET_SECONDS = 20 * 3600; // 20:00 ET → end of post-market

  let price = 185;

  for (let d = 0; d < days; d++) {
    const dayBase = DAY_START_UTC + d * DAY_SECONDS;
    // Skip weekends (Mon=1..Fri=5 in JS, 0=Sun, 6=Sat)
    const dayOfWeek = new Date(dayBase * 1000).getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (let s = 0; s < SESSION_END_ET_SECONDS; s += intervalSeconds) {
      const t = dayBase + s;
      const change = (Math.random() - 0.48) * 0.5;
      const open = price;
      const close = +(price + change).toFixed(2);
      const high = +(Math.max(open, close) + Math.random() * 0.3).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * 0.3).toFixed(2);
      const volume = Math.round(2000 + Math.random() * 8000);
      bars.push({ time: t, open, high, low, close, volume });
      price = close;
    }
  }

  return bars;
}

export const MarketSessions: Story = {
  name: 'Market Sessions',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display: flex; align-items: center; gap: 10px; padding: 8px 12px; ' +
      'background: #1e2235; border-radius: 4px;';

    const label = document.createElement('span');
    label.style.cssText = 'color: #d1d4dc; font-size: 13px; font-family: monospace;';
    label.textContent = 'Session filter: all';

    const makeBtn = (text: string, filter: 'regular' | 'extended' | 'all'): HTMLButtonElement => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText =
        'padding: 5px 11px; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; ' +
        'border-radius: 4px; cursor: pointer; font-size: 13px;';
      btn.addEventListener('click', () => {
        chart.setSessionFilter(filter);
        label.textContent = `Session filter: ${filter}`;
        toolbar.querySelectorAll('button').forEach((b) => {
          (b as HTMLButtonElement).style.background = '#2a2e39';
          (b as HTMLButtonElement).style.borderColor = '#434651';
        });
        btn.style.background = '#1a4a6b';
        btn.style.borderColor = '#2196F3';
      });
      return btn;
    };

    toolbar.appendChild(makeBtn('All Sessions', 'all'));
    toolbar.appendChild(makeBtn('Regular Only', 'regular'));
    toolbar.appendChild(makeBtn('Extended', 'extended'));
    toolbar.appendChild(label);

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    // Apply US equity sessions
    chart.setMarketSessions(US_EQUITY_SESSIONS);
    chart.setPeriodicity({ interval: 5, unit: 'minute' });

    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const intradayBars = generateIntradayBars(5, 300); // 5 days of 5-min bars
    series.setData(intradayBars);

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    return wrapper;
  },
};
