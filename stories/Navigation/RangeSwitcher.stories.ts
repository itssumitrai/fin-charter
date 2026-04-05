import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Navigation/Range Switcher',
  parameters: {
    docs: {
      description: {
        component:
          'Range switcher buttons let users quickly jump to a specific time window. ' +
          'Each button calls chart.setVisibleRange() with the appropriate timestamps. ' +
          'The "Go to Realtime" button calls chart.scrollToRealTime().',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Range Switcher',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(bars);

// Jump to a 3-month window
const DAY = 86400;
chart.setVisibleRange(lastTime - 90 * DAY, lastTime);

// Snap back to the latest bar
chart.scrollToRealTime();`,
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.style.gap = '8px';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display:flex;gap:6px;padding:4px 8px;background:#1a1a2e;border-radius:4px;flex-wrap:wrap;';

    const container = createChartContainer();

    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const lastBar = AAPL_DAILY[AAPL_DAILY.length - 1];
    const lastTime = lastBar.time;

    const DAY = 86400;
    const MONTH = 30 * DAY;

    const ranges: { label: string; from: number; to: number }[] = [
      { label: '1M', from: lastTime - 1 * MONTH, to: lastTime },
      { label: '3M', from: lastTime - 3 * MONTH, to: lastTime },
      { label: '6M', from: lastTime - 6 * MONTH, to: lastTime },
      { label: '1Y', from: lastTime - 365 * DAY, to: lastTime },
      { label: 'ALL', from: AAPL_DAILY[0].time, to: lastTime },
    ];

    let activeBtn: HTMLButtonElement | null = null;

    const btnStyle = (active = false) =>
      `cursor:pointer;padding:4px 12px;border-radius:3px;border:none;font-size:12px;font-family:monospace;` +
      `background:${active ? '#2962FF' : '#2a2a3e'};color:${active ? '#fff' : '#aaa'};transition:background 0.15s;`;

    for (const range of ranges) {
      const btn = document.createElement('button');
      btn.textContent = range.label;
      btn.style.cssText = btnStyle(false);
      btn.addEventListener('click', () => {
        chart.setVisibleRange(range.from, range.to);
        if (activeBtn) activeBtn.style.cssText = btnStyle(false);
        btn.style.cssText = btnStyle(true);
        activeBtn = btn;
      });
      btn.addEventListener('mouseenter', () => {
        if (btn !== activeBtn) btn.style.background = '#3a3a5e';
      });
      btn.addEventListener('mouseleave', () => {
        if (btn !== activeBtn) btn.style.cssText = btnStyle(false);
      });
      toolbar.appendChild(btn);
    }

    // Separator
    const sep = document.createElement('div');
    sep.style.cssText = 'width:1px;background:#444;margin:2px 4px;';
    toolbar.appendChild(sep);

    // Go to Realtime button
    const rtBtn = document.createElement('button');
    rtBtn.textContent = 'Go to Realtime';
    rtBtn.style.cssText = btnStyle(false);
    rtBtn.style.color = '#00E396';
    rtBtn.addEventListener('click', () => {
      chart.scrollToRealTime();
      if (activeBtn) activeBtn.style.cssText = btnStyle(false);
      activeBtn = null;
    });
    rtBtn.addEventListener('mouseenter', () => { rtBtn.style.background = '#1a3a3a'; });
    rtBtn.addEventListener('mouseleave', () => { rtBtn.style.cssText = btnStyle(false); rtBtn.style.color = '#00E396'; });
    toolbar.appendChild(rtBtn);

    root.appendChild(toolbar);
    root.appendChild(container);
    return withDocs(root, {
      description:
        '<strong>Range Switcher</strong> provides quick navigation buttons for predefined time ranges ' +
        '(<code>1M</code>, <code>3M</code>, <code>6M</code>, <code>1Y</code>, <code>ALL</code>). ' +
        'Each button calls <code>chart.setVisibleRange(from, to)</code> to jump to the desired window. ' +
        'The "Go to Realtime" button calls <code>chart.scrollToRealTime()</code> to snap back to the latest bar.',
      code: `const DAY = 86400;
const lastTime = bars[bars.length - 1].time;

// Jump to a 3-month window
chart.setVisibleRange(lastTime - 90 * DAY, lastTime);

// Snap back to the latest bar
chart.scrollToRealTime();`,
    });
  },
};
