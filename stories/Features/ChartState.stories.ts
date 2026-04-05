import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import type { Bar } from '../../src/core/types';
import { createChartContainer } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Features/Chart State',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates chart state save and restore via chart.exportState() and chart.importState(). ' +
          'State captures the chart configuration (layout, series options, indicators) but not bar data — ' +
          'bar data is reloaded via the provided dataLoader callback.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const SaveRestore: Story = {
  name: 'Save & Restore State',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Save state
const state = chart.exportState();
const json = JSON.stringify(state);

// Restore state (dataLoader fetches bar data for each series)
await chart.importState(JSON.parse(json), async (seriesId) => {
  return await fetchData(seriesId);
});`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display: flex; align-items: center; gap: 10px; padding: 8px 12px; ' +
      'background: #1e2235; border-radius: 4px;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save State';
    saveBtn.style.cssText =
      'padding: 6px 14px; background: #1a4a6b; color: #d1d4dc; border: 1px solid #2196F3; ' +
      'border-radius: 4px; cursor: pointer; font-size: 13px;';

    const restoreBtn = document.createElement('button');
    restoreBtn.textContent = 'Restore State';
    restoreBtn.style.cssText =
      'padding: 6px 14px; background: #2a2e39; color: #787b86; border: 1px solid #434651; ' +
      'border-radius: 4px; cursor: pointer; font-size: 13px;';
    restoreBtn.disabled = true;

    const statusEl = document.createElement('span');
    statusEl.style.cssText = 'color: #787b86; font-size: 13px; font-family: monospace;';
    statusEl.textContent = 'Pan/zoom the chart, then save state';

    toolbar.appendChild(saveBtn);
    toolbar.appendChild(restoreBtn);
    toolbar.appendChild(statusEl);

    // Chart
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    // JSON preview area
    const pre = document.createElement('pre');
    pre.style.cssText =
      'max-height: 200px; overflow: auto; padding: 10px 14px; background: #131722; ' +
      'color: #9598a1; border-radius: 4px; font-size: 11px; font-family: monospace; ' +
      'border: 1px solid #2a2e39; margin: 0;';
    pre.textContent = '// State will appear here after saving';

    let savedState: string | null = null;

    saveBtn.addEventListener('click', () => {
      const state = chart.exportState();
      savedState = JSON.stringify(state, null, 2);
      pre.textContent = savedState;
      statusEl.textContent = 'State saved — pan/zoom then restore';

      restoreBtn.disabled = false;
      restoreBtn.style.background = '#1a4a6b';
      restoreBtn.style.color = '#d1d4dc';
      restoreBtn.style.borderColor = '#2196F3';
    });

    restoreBtn.addEventListener('click', async () => {
      if (!savedState) return;
      const state = JSON.parse(savedState);
      const dataStore: Map<string, Bar[]> = new Map();

      await chart.importState(state, async (seriesId: string) => {
        // Return AAPL data for any series id in this demo
        return dataStore.get(seriesId) ?? AAPL_DAILY;
      });
      statusEl.textContent = 'State restored successfully';
    });

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(pre);
    return withDocs(wrapper, {
      description:
        '<strong>Save and restore</strong> the full chart state including layout, series configuration, and indicators. ' +
        'Use <code>chart.exportState()</code> to serialize the current state to JSON, and ' +
        '<code>chart.importState()</code> to restore it. Bar data is reloaded via a <code>dataLoader</code> callback.',
      code: `
import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Save state
const state = chart.exportState();
const json = JSON.stringify(state);

// Restore state (dataLoader fetches bar data for each series)
await chart.importState(JSON.parse(json), async (seriesId) => {
  return await fetchData(seriesId);
});
      `,
    });
  },
};
