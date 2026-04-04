import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { ISeriesApi } from 'fin-charter';
import { createChartContainer, generateOHLCV } from '../helpers';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Comparison Mode',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates comparison mode where multiple symbols are overlaid on the same chart. ' +
          'The Y-axis shows percentage change from the first visible bar when comparison mode is active.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const CompareSymbols: Story = {
  name: 'Compare Symbols',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true });
const mainSeries = chart.addCandlestickSeries();
mainSeries.setData(aaplData);

// Enable comparison mode (Y-axis shows % change)
chart.setComparisonMode(true);

const compSeries = chart.addLineSeries({ color: '#2196F3' });
compSeries.setData(msftData);`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display: flex; align-items: center; gap: 10px; padding: 8px 12px; ' +
      'background: #1e2235; border-radius: 4px;';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Enable Comparison';
    toggleBtn.style.cssText =
      'padding: 6px 14px; background: #1a4a6b; color: #d1d4dc; border: 1px solid #2196F3; ' +
      'border-radius: 4px; cursor: pointer; font-size: 13px;';

    const legendEl = document.createElement('div');
    legendEl.style.cssText = 'display: flex; gap: 16px; font-size: 13px; font-family: monospace;';

    const makeLegendItem = (label: string, color: string): HTMLElement => {
      const item = document.createElement('span');
      item.style.color = color;
      item.textContent = `■ ${label}`;
      return item;
    };

    legendEl.appendChild(makeLegendItem('AAPL', '#22AB94'));

    toolbar.appendChild(toggleBtn);
    toolbar.appendChild(legendEl);

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true });

    const mainSeries = chart.addCandlestickSeries({
      upColor: '#22AB94',
      downColor: '#F7525F',
      borderUpColor: '#22AB94',
      borderDownColor: '#F7525F',
      wickUpColor: '#22AB94',
      wickDownColor: '#F7525F',
    });
    mainSeries.setData(AAPL_DAILY);

    let compSeries1: ISeriesApi<'line'> | null = null;
    let compSeries2: ISeriesApi<'line'> | null = null;
    let compEnabled = false;

    toggleBtn.addEventListener('click', () => {
      compEnabled = !compEnabled;
      chart.setComparisonMode(compEnabled);

      if (compEnabled) {
        toggleBtn.textContent = 'Disable Comparison';
        toggleBtn.style.background = '#4a1a1a';
        toggleBtn.style.borderColor = '#F7525F';

        // Add two comparison series with different price seeds
        const comp1Data = generateOHLCV(AAPL_DAILY.length, 150, AAPL_DAILY[0].time);
        compSeries1 = chart.addLineSeries({ color: '#2196F3', lineWidth: 2 });
        compSeries1.setData(comp1Data);
        legendEl.appendChild(makeLegendItem('MSFT', '#2196F3'));

        const comp2Data = generateOHLCV(AAPL_DAILY.length, 80, AAPL_DAILY[0].time);
        compSeries2 = chart.addLineSeries({ color: '#ff9800', lineWidth: 2 });
        compSeries2.setData(comp2Data);
        legendEl.appendChild(makeLegendItem('GOOGL', '#ff9800'));
      } else {
        toggleBtn.textContent = 'Enable Comparison';
        toggleBtn.style.background = '#1a4a6b';
        toggleBtn.style.borderColor = '#2196F3';

        if (compSeries1) { chart.removeSeries(compSeries1); compSeries1 = null; }
        if (compSeries2) { chart.removeSeries(compSeries2); compSeries2 = null; }

        // Remove extra legend items
        while (legendEl.children.length > 1) {
          legendEl.removeChild(legendEl.lastChild!);
        }
      }
    });

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    return wrapper;
  },
};
