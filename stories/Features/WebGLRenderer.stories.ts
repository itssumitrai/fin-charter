import type { Meta, StoryObj } from '@storybook/html';
import { createChart, isWebGLAvailable } from 'fin-charter';
import { createChartContainer, generateOHLCV } from '../helpers';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Features/WebGL Renderer',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates WebGL rendering mode for high-performance charting. ' +
          'When available, WebGL accelerates rendering of candlestick, line, and area series. ' +
          'Falls back to Canvas2D automatically if WebGL is not supported.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const WebGLMode: Story = {
  name: 'WebGL Rendering',
  parameters: {
    docs: {
      source: {
        code: `import { createChart, isWebGLAvailable } from 'fin-charter';

console.log('WebGL available:', isWebGLAvailable());

const chart = createChart(container, {
  autoSize: true,
  symbol: 'AAPL',
  renderer: 'webgl', // falls back to 'canvas2d' if unavailable
});

const series = chart.addSeries({ type: 'candlestick' });
series.setData(largeDataset); // 5000 bars`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const infoBar = document.createElement('div');
    infoBar.style.cssText = 'padding: 8px 12px; background: #1e2235; border-radius: 4px; color: #d1d4dc; font-size: 13px; font-family: monospace;';
    infoBar.textContent = `WebGL available: ${isWebGLAvailable()} | Rendering 5,000 bars`;

    const container = createChartContainer();
    const chart = createChart(container, {
      autoSize: true,
      symbol: 'PERF',
      renderer: 'webgl',
    });

    const data = generateOHLCV(5000, 100, 1609459200);
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(data);

    wrapper.appendChild(infoBar);
    wrapper.appendChild(container);

    const description = '<strong>WebGL rendering</strong> uses GPU-accelerated drawing for supported series types (candlestick, line, area). Set <code>renderer: \'webgl\'</code> in chart options. Use <code>isWebGLAvailable()</code> to check browser support. The chart falls back to <code>canvas2d</code> automatically if WebGL is unavailable. WebGL excels with large datasets (5,000+ bars).';
    const code = `import { createChart, isWebGLAvailable } from 'fin-charter';

// Check availability
console.log('WebGL available:', isWebGLAvailable());

// Create chart with WebGL renderer
const chart = createChart(container, {
  autoSize: true,
  renderer: 'webgl',
});

const series = chart.addSeries({ type: 'candlestick' });
series.setData(largeDataset);`;

    return withDocs(wrapper, { description, code });
  },
};
