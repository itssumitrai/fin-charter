import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Log Scale',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates switching between linear and logarithmic price scale modes. ' +
          'Logarithmic scale is useful for long-term charts where percentage moves matter more than absolute moves.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function makeButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText =
    'padding: 6px 12px; margin-right: 6px; background: #2a2e39; color: #d1d4dc; ' +
    'border: 1px solid #434651; border-radius: 4px; cursor: pointer; font-size: 13px;';
  btn.addEventListener('click', onClick);
  return btn;
}

export const LinearVsLog: Story = {
  name: 'Linear vs Logarithmic',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

// Linear scale (default)
const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  rightPriceScale: { mode: 'linear' },
});

// Switch to logarithmic
chart.applyOptions({
  rightPriceScale: { mode: 'logarithmic' },
});`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display: flex; align-items: center; padding: 8px; background: #1e2235; border-radius: 4px;';

    const status = document.createElement('span');
    status.style.cssText = 'margin-left: 12px; color: #787b86; font-size: 13px; font-family: monospace;';
    status.textContent = 'Scale: linear';

    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'AAPL',
      rightPriceScale: { mode: 'linear' },
    });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const linearBtn = makeButton('Linear', () => {
      chart.applyOptions({ rightPriceScale: { mode: 'linear' } });
      status.textContent = 'Scale: linear';
      linearBtn.style.background = '#1a4a6b';
      linearBtn.style.borderColor = '#2196F3';
      logBtn.style.background = '#2a2e39';
      logBtn.style.borderColor = '#434651';
    });
    linearBtn.style.background = '#1a4a6b';
    linearBtn.style.borderColor = '#2196F3';

    const logBtn = makeButton('Logarithmic', () => {
      chart.applyOptions({ rightPriceScale: { mode: 'logarithmic' } });
      status.textContent = 'Scale: logarithmic';
      logBtn.style.background = '#1a4a6b';
      logBtn.style.borderColor = '#2196F3';
      linearBtn.style.background = '#2a2e39';
      linearBtn.style.borderColor = '#434651';
    });

    toolbar.appendChild(linearBtn);
    toolbar.appendChild(logBtn);
    toolbar.appendChild(status);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);

    const description = 'Toggle between <strong>linear</strong> and <strong>logarithmic</strong> price scales using <code>chart.applyOptions({ rightPriceScale: { mode } })</code>. In logarithmic mode, equal vertical distances represent equal percentage changes rather than equal absolute price differences. This is particularly useful for assets with large price ranges or long time horizons.';
    const code = `// Create with linear scale (default)
const chart = createChart(container, {
  autoSize: true,
  rightPriceScale: { mode: 'linear' },
});

// Switch to logarithmic at runtime
chart.applyOptions({
  rightPriceScale: { mode: 'logarithmic' },
});

// Switch back to linear
chart.applyOptions({
  rightPriceScale: { mode: 'linear' },
});`;

    return withDocs(wrapper, { description, code });
  },
};
