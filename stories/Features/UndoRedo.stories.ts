import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Undo Redo',
  parameters: {
    docs: {
      description: {
        component:
          'Built-in undo/redo support for drawing operations. ' +
          'Uses a command pattern with configurable stack depth. ' +
          'Keyboard shortcuts Ctrl+Z / Ctrl+Shift+Z are supported by default.',
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

export const UndoRedoDrawings: Story = {
  name: 'Undo & Redo Drawings',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Draw something
chart.addDrawing('horizontal-line',
  [{ time: data[50].time, price: 190 }],
  { color: '#2196F3', lineWidth: 1 },
);

// Undo last drawing
chart.undo();

// Redo
chart.redo();`,
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
    status.textContent = 'Add drawings, then use Undo/Redo';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    let drawingCount = 0;

    const addDrawingBtn = makeButton('Add Horizontal Line', () => {
      const price = 180 + Math.random() * 30;
      chart.addDrawing(
        'horizontal-line',
        [{ time: AAPL_DAILY[50].time, price }],
        { color: '#2196F3', lineWidth: 1, lineDash: [4, 4] },
      );
      drawingCount++;
      status.textContent = `Added line at ${price.toFixed(2)} (${drawingCount} drawing${drawingCount !== 1 ? 's' : ''})`;
    });

    const addTrendBtn = makeButton('Add Trendline', () => {
      const startIdx = Math.floor(Math.random() * 100);
      const endIdx = startIdx + 30 + Math.floor(Math.random() * 50);
      chart.addDrawing(
        'trendline',
        [
          { time: AAPL_DAILY[startIdx].time, price: AAPL_DAILY[startIdx].low },
          { time: AAPL_DAILY[Math.min(endIdx, AAPL_DAILY.length - 1)].time, price: AAPL_DAILY[Math.min(endIdx, AAPL_DAILY.length - 1)].high },
        ],
        { color: '#22AB94', lineWidth: 2 },
      );
      drawingCount++;
      status.textContent = `Added trendline (${drawingCount} drawing${drawingCount !== 1 ? 's' : ''})`;
    });

    const undoBtn = makeButton('Undo (Ctrl+Z)', () => {
      const ok = chart.undo();
      if (ok) {
        drawingCount = Math.max(0, drawingCount - 1);
        status.textContent = `Undo performed (${drawingCount} drawing${drawingCount !== 1 ? 's' : ''})`;
      } else {
        status.textContent = 'Nothing to undo';
      }
    });

    const redoBtn = makeButton('Redo (Ctrl+Shift+Z)', () => {
      const ok = chart.redo();
      if (ok) {
        drawingCount++;
        status.textContent = `Redo performed (${drawingCount} drawing${drawingCount !== 1 ? 's' : ''})`;
      } else {
        status.textContent = 'Nothing to redo';
      }
    });

    toolbar.appendChild(addDrawingBtn);
    toolbar.appendChild(addTrendBtn);
    toolbar.appendChild(undoBtn);
    toolbar.appendChild(redoBtn);
    toolbar.appendChild(status);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);

    const description = '<strong>Undo/Redo</strong> is built into the chart for all drawing operations. Use <code>chart.undo()</code> and <code>chart.redo()</code> programmatically, or press <code>Ctrl+Z</code> / <code>Ctrl+Shift+Z</code>. The internal <code>UndoRedoManager</code> implements a command pattern with a configurable max depth (default 50).';
    const code = `// Add a drawing
chart.addDrawing('horizontal-line',
  [{ time: data[50].time, price: 190 }],
  { color: '#2196F3', lineWidth: 1 },
);

// Undo last operation
chart.undo(); // returns true if successful

// Redo last undone operation
chart.redo(); // returns true if successful`;

    return withDocs(wrapper, { description, code });
  },
};
