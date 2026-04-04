import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { Bar } from '../../src/core/types';
import { generateOHLCV, createChartContainer } from '../helpers';

const meta: Meta = {
  title: 'Navigation/Go to Realtime',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates chart.scrollToRealTime(). Pan the chart to the left to hide recent ' +
          'bars, then click the button to snap back to the latest bar.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Go to Realtime',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true });
const series = chart.addCandlestickSeries();
series.setData(bars);

// Snap the viewport to the most recent bar
chart.scrollToRealTime();`,
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.style.gap = '8px';

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;gap:6px;padding:4px 8px;background:#1a1a2e;border-radius:4px;';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });
    const series = chart.addCandlestickSeries();

    const seedData = generateOHLCV(100);
    series.setData(seedData);
    let lastBar = seedData[seedData.length - 1];

    // Stream new bars every second
    const intervalId = setInterval(() => {
      const change = (Math.random() - 0.48) * 3;
      const open = lastBar.close;
      const close = +(open + change).toFixed(2);
      const high = +(Math.max(open, close) + Math.random() * 2).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * 2).toFixed(2);
      const newBar: Bar = { time: lastBar.time + 86400, open, high, low, close, volume: 0 };
      series.update(newBar);
      lastBar = newBar;
    }, 1000);

    const rtBtn = document.createElement('button');
    rtBtn.textContent = 'Go to Realtime';
    rtBtn.style.cssText =
      'cursor:pointer;padding:4px 14px;border-radius:3px;border:none;font-size:12px;' +
      'font-family:monospace;background:#26a69a;color:#fff;';
    rtBtn.addEventListener('click', () => chart.scrollToRealTime());

    const hint = document.createElement('span');
    hint.textContent = 'Pan left, then click "Go to Realtime"';
    hint.style.cssText = 'font-size:11px;font-family:monospace;color:#888;display:flex;align-items:center;';

    toolbar.appendChild(rtBtn);
    toolbar.appendChild(hint);
    root.appendChild(toolbar);
    root.appendChild(container);

    const observer = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(intervalId);
        chart.remove();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return root;
  },
};
