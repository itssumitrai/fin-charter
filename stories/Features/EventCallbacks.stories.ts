import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import type { Bar } from '../../src/core/types';
import { createChartContainer, generateOHLCV } from '../helpers';
import { AAPL_DAILY } from '../sample-data';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Features/Event Callbacks',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates all event subscriptions available on the chart API. These callbacks let you ' +
          'react to user interactions, data changes, and configuration updates — essential for building responsive applications.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// ── Shared helpers ──────────────────────────────────────────────────────────

const LOG_STYLE =
  'background: #1a1b2e; border: 1px solid #262840; border-radius: 4px; ' +
  'padding: 8px 12px; font-family: monospace; font-size: 12px; color: #98c379; ' +
  'max-height: 120px; overflow-y: auto;';

const BUTTON_STYLE =
  'padding: 6px 14px; border: 1px solid #363a54; border-radius: 4px; ' +
  'background: #1e2235; color: #d1d4dc; font-size: 12px; cursor: pointer; font-family: inherit;';

const STATUS_STYLE =
  'padding: 8px 14px; background: #1e2235; color: #d1d4dc; border-radius: 4px; ' +
  'font-size: 13px; font-family: monospace; width: fit-content;';

function createEventLog(): HTMLDivElement {
  const log = document.createElement('div');
  log.style.cssText = LOG_STYLE;
  log.innerHTML = '<span style="color:#5c6370">Waiting for events...</span>';
  return log;
}

function appendLogEntry(log: HTMLDivElement, message: string): void {
  if (log.querySelector('span[style*="5c6370"]')) {
    log.innerHTML = '';
  }
  const entry = document.createElement('div');
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span style="color:#5c6370">[${time}]</span> ${message}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function createButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = BUTTON_STYLE;
  btn.addEventListener('click', onClick);
  btn.addEventListener('mouseenter', () => { btn.style.background = '#2a2e45'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#1e2235'; });
  return btn;
}

function createToolbar(): HTMLDivElement {
  const bar = document.createElement('div');
  bar.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
  return bar;
}

function createWrapper(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '12px';
  return wrapper;
}

// ── 1. CrosshairMove ────────────────────────────────────────────────────────

export const CrosshairMove: Story = {
  name: 'Crosshair Move',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeCrosshairMove((state) => {
  if (state) {
    console.log(\`price: \${state.price}, time: \${state.time}\`);
  }
});`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();

    const status = document.createElement('div');
    status.style.cssText = STATUS_STYLE;
    status.textContent = 'Move your mouse over the chart...';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribeCrosshairMove((state) => {
      if (state) {
        const date = new Date(state.time * 1000).toLocaleDateString();
        status.textContent =
          `Price: ${state.price.toFixed(2)} | Time: ${date} | X: ${state.x} | Y: ${state.y}`;
      } else {
        status.textContent = 'Move your mouse over the chart...';
      }
    });

    wrapper.appendChild(status);
    wrapper.appendChild(container);

    return withDocs(wrapper, {
      description:
        'Subscribe to <strong>crosshair move events</strong> with <code>chart.subscribeCrosshairMove()</code>. ' +
        'The callback receives a <code>CrosshairState</code> object with <code>x</code>, <code>y</code>, ' +
        '<code>price</code>, <code>time</code>, and <code>barIndex</code> — or <code>null</code> when the cursor leaves the chart.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeCrosshairMove((state) => {
  if (state) {
    console.log(\`price: \${state.price}, time: \${state.time}\`);
  }
});
      `,
    });
  },
};

// ── 2. Click & DblClick ─────────────────────────────────────────────────────

export const ClickAndDblClick: Story = {
  name: 'Click & Double-Click',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribeClick((e) => {
  console.log('click', e.x, e.y, e.time, e.price);
});
chart.subscribeDblClick((e) => {
  console.log('dblclick', e.x, e.y, e.time, e.price);
});`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribeClick((e) => {
      const date = new Date(e.time * 1000).toLocaleDateString();
      appendLogEntry(log,
        `<span style="color:#61afef">click</span> x:${e.x} y:${e.y} time:${date} price:${e.price.toFixed(2)}`);
    });

    chart.subscribeDblClick((e) => {
      const date = new Date(e.time * 1000).toLocaleDateString();
      appendLogEntry(log,
        `<span style="color:#e5c07b">dblclick</span> x:${e.x} y:${e.y} time:${date} price:${e.price.toFixed(2)}`);
    });

    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Subscribe to <code>click</code> and <code>dblclick</code> events for user interaction handling. ' +
        'Both receive the same payload: <code>{ x, y, time, price }</code>.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeClick((e) => {
  console.log('click', e.x, e.y, e.time, e.price);
});

chart.subscribeDblClick((e) => {
  console.log('dblclick', e.x, e.y, e.time, e.price);
});
      `,
    });
  },
};

// ── 3. Drawing Events ───────────────────────────────────────────────────────

export const DrawingEvents: Story = {
  name: 'Drawing Events',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribeDrawingEvent((event) => {
  console.log(event.type, event.drawingId, event.drawingType);
});`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribeDrawingEvent((event) => {
      const typeColor = event.type === 'created' ? '#98c379'
        : event.type === 'removed' ? '#e06c75' : '#e5c07b';
      appendLogEntry(log,
        `<span style="color:${typeColor}">${event.type}</span> ` +
        `id:<span style="color:#d19a66">${event.drawingId || 'N/A'}</span> ` +
        `type:<span style="color:#61afef">${event.drawingType || 'N/A'}</span>`);
    });

    // Use data points for drawing anchors
    const midIdx = Math.floor(AAPL_DAILY.length / 2);
    const startBar = AAPL_DAILY[midIdx];
    const endBar = AAPL_DAILY[midIdx + 20];

    const drawings: ReturnType<typeof chart.addDrawing>[] = [];

    toolbar.appendChild(createButton('Add Trendline', () => {
      const d = chart.addDrawing('trendline', [
        { time: startBar.time, price: startBar.low },
        { time: endBar.time, price: endBar.high },
      ]);
      drawings.push(d);
    }));

    toolbar.appendChild(createButton('Add Horizontal Line', () => {
      const d = chart.addDrawing('horizontal-line', [
        { time: startBar.time, price: startBar.close },
      ]);
      drawings.push(d);
    }));

    toolbar.appendChild(createButton('Remove Last Drawing', () => {
      const d = drawings.pop();
      if (d) chart.removeDrawing(d);
    }));

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Track drawing lifecycle with <code>subscribeDrawingEvent()</code>. ' +
        'Receives <code>{ type, drawingId, drawingType }</code> where type is ' +
        '<code>"created"</code>, <code>"modified"</code>, or <code>"removed"</code>.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeDrawingEvent((event) => {
  // event.type: 'created' | 'modified' | 'removed'
  console.log(event.type, event.drawingId, event.drawingType);
});

chart.addDrawing('trendline', [
  { time: t1, price: p1 },
  { time: t2, price: p2 },
]);
      `,
    });
  },
};

// ── 4. Indicator Events ─────────────────────────────────────────────────────

export const IndicatorEvents: Story = {
  name: 'Indicator Events',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribeIndicatorEvent((event) => {
  console.log(event.type, event.indicatorId, event.indicatorType, event.paneId);
});`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribeIndicatorEvent((event) => {
      const typeColor = event.type === 'added' ? '#98c379' : '#e06c75';
      appendLogEntry(log,
        `<span style="color:${typeColor}">${event.type}</span> ` +
        `id:<span style="color:#d19a66">${event.indicatorId}</span> ` +
        `type:<span style="color:#61afef">${event.indicatorType}</span> ` +
        `pane:<span style="color:#c678dd">${event.paneId}</span>`);
    });

    let smaIndicator: ReturnType<typeof chart.addIndicator> | null = null;

    toolbar.appendChild(createButton('Add SMA', () => {
      if (smaIndicator) return;
      smaIndicator = chart.addIndicator('sma', {
        source: series,
        params: { period: 20 },
        color: '#2962ff',
      });
    }));

    toolbar.appendChild(createButton('Remove SMA', () => {
      if (!smaIndicator) return;
      chart.removeIndicator(smaIndicator);
      smaIndicator = null;
    }));

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Monitor indicator lifecycle with <code>subscribeIndicatorEvent()</code>. ' +
        'Receives <code>{ type, indicatorId, indicatorType, paneId }</code> where type is ' +
        '<code>"added"</code>, <code>"removed"</code>, or <code>"updated"</code>.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeIndicatorEvent((event) => {
  // event.type: 'added' | 'removed' | 'updated'
  console.log(event.type, event.indicatorId, event.indicatorType, event.paneId);
});

const sma = chart.addIndicator('sma', {
  source: series,
  params: { period: 20 },
  color: '#2962ff',
});
      `,
    });
  },
};

// ── 5. Resize Event ─────────────────────────────────────────────────────────

export const ResizeEvent: Story = {
  name: 'Resize Event',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribeResize((size) => {
  console.log(\`\${size.width} x \${size.height}\`);
});`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();

    const status = document.createElement('div');
    status.style.cssText = STATUS_STYLE;
    status.textContent = 'Resize the chart using the buttons below...';

    const toolbar = createToolbar();

    const resizableContainer = document.createElement('div');
    resizableContainer.style.cssText = 'width: 100%; height: 400px; transition: height 0.3s ease;';

    const chart = createChart(resizableContainer, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribeResize((size) => {
      status.textContent = `Chart dimensions: ${size.width} x ${size.height}`;
    });

    toolbar.appendChild(createButton('Height 300px', () => {
      resizableContainer.style.height = '300px';
      chart.resize(resizableContainer.clientWidth, 300);
    }));
    toolbar.appendChild(createButton('Height 400px', () => {
      resizableContainer.style.height = '400px';
      chart.resize(resizableContainer.clientWidth, 400);
    }));
    toolbar.appendChild(createButton('Height 500px', () => {
      resizableContainer.style.height = '500px';
      chart.resize(resizableContainer.clientWidth, 500);
    }));

    wrapper.appendChild(status);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(resizableContainer);

    return withDocs(wrapper, {
      description:
        'React to chart size changes with <code>subscribeResize()</code>. ' +
        'Receives <code>{ width, height }</code>.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeResize((size) => {
  console.log(\`\${size.width} x \${size.height}\`);
});

// Trigger a resize
chart.resize(800, 400);
      `,
    });
  },
};

// ── 6. Symbol Change ────────────────────────────────────────────────────────

export const SymbolChange: Story = {
  name: 'Symbol Change',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribeSymbolChange((symbol) => {
  console.log(symbol.previous, '->', symbol.current);
});

chart.applyOptions({ symbol: 'MSFT' });`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribeSymbolChange((symbol) => {
      appendLogEntry(log,
        `<span style="color:#e06c75">${symbol.previous}</span> ` +
        `<span style="color:#5c6370">-></span> ` +
        `<span style="color:#98c379">${symbol.current}</span>`);
    });

    const symbols = ['AAPL', 'MSFT', 'GOOGL'];
    for (const sym of symbols) {
      toolbar.appendChild(createButton(sym, () => {
        // Generate different data for different symbols to simulate switching
        const data = sym === 'AAPL' ? AAPL_DAILY : generateOHLCV(200, sym === 'MSFT' ? 380 : 140, AAPL_DAILY[0].time);
        series.setData(data);
        chart.applyOptions({ symbol: sym });
      }));
    }

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Detect symbol changes with <code>subscribeSymbolChange()</code>. ' +
        'Receives <code>{ previous, current }</code>. The event fires when you call ' +
        '<code>chart.applyOptions({ symbol })</code> with a new symbol.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeSymbolChange((symbol) => {
  console.log(symbol.previous, '->', symbol.current);
});

// Switch symbol
chart.applyOptions({ symbol: 'MSFT' });
      `,
    });
  },
};

// ── 7. Chart Type Change ────────────────────────────────────────────────────

export const ChartTypeChange: Story = {
  name: 'Chart Type Change',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribeChartTypeChange((chartType) => {
  console.log('New series type:', chartType.seriesType);
});`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    let currentSeries = chart.addSeries({ type: 'candlestick' });
    currentSeries.setData(AAPL_DAILY);

    chart.subscribeChartTypeChange((chartType) => {
      appendLogEntry(log,
        `Series type: <span style="color:#61afef">${chartType.seriesType}</span>`);
    });

    const lineData = AAPL_DAILY.map((b) => ({ time: b.time, value: b.close }));

    toolbar.appendChild(createButton('Candlestick', () => {
      chart.removeSeries(currentSeries);
      currentSeries = chart.addSeries({ type: 'candlestick' });
      currentSeries.setData(AAPL_DAILY);
    }));

    toolbar.appendChild(createButton('Line', () => {
      chart.removeSeries(currentSeries);
      currentSeries = chart.addSeries({ type: 'line', color: '#2962ff' });
      currentSeries.setData(lineData as any);
    }));

    toolbar.appendChild(createButton('Area', () => {
      chart.removeSeries(currentSeries);
      currentSeries = chart.addSeries({ type: 'area',
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: '#2962ff',
      });
      currentSeries.setData(lineData as any);
    }));

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Track chart type switches with <code>subscribeChartTypeChange()</code>. ' +
        'Receives <code>{ seriesType }</code>. The event fires when a new series is added via ' +
        '<code>addSeries({ type: \'candlestick\' })</code>, <code>addSeries({ type: \'line\' })</code>, etc.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
let series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeChartTypeChange((chartType) => {
  console.log('New series type:', chartType.seriesType);
});

// Switch to line chart
chart.removeSeries(series);
series = chart.addSeries({ type: 'line', color: '#2962ff' });
series.setData(lineData);
      `,
    });
  },
};

// ── 8. Preferences Change ───────────────────────────────────────────────────

export const PreferencesChange: Story = {
  name: 'Preferences Change',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribePreferencesChange((options) => {
  console.log('Changed options:', options);
});

chart.applyOptions({ layout: { backgroundColor: '#1a1a2e' } });`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribePreferencesChange((options) => {
      const keys = Object.keys(options);
      appendLogEntry(log,
        `Changed: <span style="color:#e5c07b">${keys.join(', ')}</span> ` +
        `<span style="color:#5c6370">=> ${JSON.stringify(options)}</span>`);
    });

    toolbar.appendChild(createButton('Dark Theme', () => {
      chart.applyOptions({
        layout: { backgroundColor: '#131722', textColor: '#d1d4dc' },
      });
    }));

    toolbar.appendChild(createButton('Light Theme', () => {
      chart.applyOptions({
        layout: { backgroundColor: '#ffffff', textColor: '#131722' },
      });
    }));

    toolbar.appendChild(createButton('Toggle Grid', () => {
      const current = chart.options();
      const visible = !(current.grid?.vertLines?.visible ?? true);
      chart.applyOptions({
        grid: {
          vertLines: { visible },
          horzLines: { visible },
        },
      });
    }));

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'React to chart configuration changes with <code>subscribePreferencesChange()</code>. ' +
        'Receives the changed options object (a <code>DeepPartial&lt;ChartOptions&gt;</code>). ' +
        'Fires on every <code>chart.applyOptions()</code> call.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribePreferencesChange((options) => {
  console.log('Changed options:', options);
});

// Toggle theme
chart.applyOptions({
  layout: { backgroundColor: '#ffffff', textColor: '#131722' },
});
      `,
    });
  },
};

// ── 9. Layout Change ────────────────────────────────────────────────────────

export const LayoutChange: Story = {
  name: 'Layout Change',
  parameters: {
    docs: {
      source: {
        code: `chart.subscribeLayoutChange((event) => {
  console.log(event.action, event.paneId);
});`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.subscribeLayoutChange((event) => {
      const actionColor = event.action === 'pane-added' ? '#98c379' : '#e06c75';
      appendLogEntry(log,
        `<span style="color:${actionColor}">${event.action}</span> ` +
        `pane:<span style="color:#d19a66">${event.paneId ?? 'N/A'}</span>`);
    });

    const panes: ReturnType<typeof chart.addPane>[] = [];

    toolbar.appendChild(createButton('Add Pane', () => {
      const pane = chart.addPane({ height: 100 });
      panes.push(pane);
    }));

    toolbar.appendChild(createButton('Remove Last Pane', () => {
      const pane = panes.pop();
      if (pane) chart.removePane(pane);
    }));

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Track structural changes with <code>subscribeLayoutChange()</code>. ' +
        'Receives <code>{ action, paneId }</code> where action is <code>"pane-added"</code> or ' +
        '<code>"pane-removed"</code>.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.subscribeLayoutChange((event) => {
  // event.action: 'pane-added' | 'pane-removed'
  console.log(event.action, event.paneId);
});

const pane = chart.addPane({ height: 100 });
chart.removePane(pane);
      `,
    });
  },
};

// ── 10. Visibility Change ───────────────────────────────────────────────────

export const VisibilityChange: Story = {
  name: 'Visibility Change',
  parameters: {
    docs: {
      source: {
        code: `series.subscribeVisibilityChange((visible) => {
  console.log('Series visible:', visible);
});

series.applyOptions({ visible: false });`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    series.subscribeVisibilityChange((visible: boolean) => {
      const color = visible ? '#98c379' : '#e06c75';
      const label = visible ? 'visible' : 'hidden';
      appendLogEntry(log,
        `Series is now <span style="color:${color}">${label}</span>`);
    });

    let isVisible = true;

    toolbar.appendChild(createButton('Toggle Visibility', () => {
      isVisible = !isVisible;
      series.applyOptions({ visible: isVisible } as any);
    }));

    toolbar.appendChild(createButton('Show', () => {
      isVisible = true;
      series.applyOptions({ visible: true } as any);
    }));

    toolbar.appendChild(createButton('Hide', () => {
      isVisible = false;
      series.applyOptions({ visible: false } as any);
    }));

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Series-level event via <code>series.subscribeVisibilityChange()</code>. ' +
        'Receives <code>boolean</code> (<code>true</code> = visible, <code>false</code> = hidden).',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

series.subscribeVisibilityChange((visible) => {
  console.log('Series visible:', visible);
});

// Hide the series
series.applyOptions({ visible: false });
      `,
    });
  },
};

// ── 11. All Events Demo ─────────────────────────────────────────────────────

export const AllEventsDemo: Story = {
  name: 'All Events Demo',
  parameters: {
    docs: {
      source: {
        code: `// Subscribe to every event type
chart.subscribeCrosshairMove(cb);
chart.subscribeClick(cb);
chart.subscribeDblClick(cb);
chart.subscribeDrawingEvent(cb);
chart.subscribeIndicatorEvent(cb);
chart.subscribeResize(cb);
chart.subscribeSymbolChange(cb);
chart.subscribeChartTypeChange(cb);
chart.subscribePreferencesChange(cb);
chart.subscribeLayoutChange(cb);
series.subscribeDataChanged(cb);
series.subscribeVisibilityChange(cb);`,
      },
    },
  },
  render: () => {
    const wrapper = createWrapper();
    const toolbar = createToolbar();
    const log = createEventLog();
    log.style.maxHeight = '180px';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const tag = (name: string, color: string) =>
      `<span style="color:${color};font-weight:bold">[${name}]</span>`;

    // Crosshair — throttled to avoid flooding
    let lastCrosshairLog = 0;
    chart.subscribeCrosshairMove((state) => {
      const now = Date.now();
      if (now - lastCrosshairLog < 500) return;
      lastCrosshairLog = now;
      if (state) {
        appendLogEntry(log, `${tag('crosshair', '#61afef')} price:${state.price.toFixed(2)}`);
      }
    });

    chart.subscribeClick((e) => {
      appendLogEntry(log, `${tag('click', '#c678dd')} x:${e.x} y:${e.y} price:${e.price.toFixed(2)}`);
    });

    chart.subscribeDblClick((e) => {
      appendLogEntry(log, `${tag('dblclick', '#e5c07b')} x:${e.x} y:${e.y} price:${e.price.toFixed(2)}`);
    });

    chart.subscribeDrawingEvent((event) => {
      appendLogEntry(log, `${tag('drawing', '#d19a66')} ${event.type} ${event.drawingType}`);
    });

    chart.subscribeIndicatorEvent((event) => {
      appendLogEntry(log, `${tag('indicator', '#56b6c2')} ${event.type} ${event.indicatorType}`);
    });

    chart.subscribeResize((size) => {
      appendLogEntry(log, `${tag('resize', '#e06c75')} ${size.width}x${size.height}`);
    });

    chart.subscribeSymbolChange((sym) => {
      appendLogEntry(log, `${tag('symbol', '#98c379')} ${sym.previous} -> ${sym.current}`);
    });

    chart.subscribeChartTypeChange((ct) => {
      appendLogEntry(log, `${tag('chartType', '#61afef')} ${ct.seriesType}`);
    });

    chart.subscribePreferencesChange((opts) => {
      appendLogEntry(log, `${tag('prefs', '#c678dd')} ${JSON.stringify(opts).slice(0, 80)}`);
    });

    chart.subscribeLayoutChange((event) => {
      appendLogEntry(log, `${tag('layout', '#e5c07b')} ${event.action} pane:${event.paneId ?? 'N/A'}`);
    });

    series.subscribeDataChanged(() => {
      appendLogEntry(log, `${tag('dataChanged', '#d19a66')} series data updated`);
    });

    series.subscribeVisibilityChange((visible: boolean) => {
      appendLogEntry(log, `${tag('visibility', '#56b6c2')} ${visible ? 'visible' : 'hidden'}`);
    });

    // Action buttons
    let smaInd: ReturnType<typeof chart.addIndicator> | null = null;
    let isVisible = true;
    const panes: ReturnType<typeof chart.addPane>[] = [];

    toolbar.appendChild(createButton('Switch to MSFT', () => {
      series.setData(generateOHLCV(200, 380, AAPL_DAILY[0].time));
      chart.applyOptions({ symbol: 'MSFT' });
    }));

    toolbar.appendChild(createButton('Switch to AAPL', () => {
      series.setData(AAPL_DAILY);
      chart.applyOptions({ symbol: 'AAPL' });
    }));

    toolbar.appendChild(createButton('Add SMA', () => {
      if (smaInd) return;
      smaInd = chart.addIndicator('sma', { source: series, params: { period: 20 }, color: '#2962ff' });
    }));

    toolbar.appendChild(createButton('Remove SMA', () => {
      if (!smaInd) return;
      chart.removeIndicator(smaInd);
      smaInd = null;
    }));

    toolbar.appendChild(createButton('Toggle Visibility', () => {
      isVisible = !isVisible;
      series.applyOptions({ visible: isVisible } as any);
    }));

    toolbar.appendChild(createButton('Add Pane', () => {
      panes.push(chart.addPane({ height: 80 }));
    }));

    toolbar.appendChild(createButton('Remove Pane', () => {
      const p = panes.pop();
      if (p) chart.removePane(p);
    }));

    toolbar.appendChild(createButton('Dark Theme', () => {
      chart.applyOptions({ layout: { backgroundColor: '#131722', textColor: '#d1d4dc' } });
    }));

    toolbar.appendChild(createButton('Add Trendline', () => {
      const midIdx = Math.floor(AAPL_DAILY.length / 2);
      chart.addDrawing('trendline', [
        { time: AAPL_DAILY[midIdx].time, price: AAPL_DAILY[midIdx].low },
        { time: AAPL_DAILY[midIdx + 20].time, price: AAPL_DAILY[midIdx + 20].high },
      ]);
    }));

    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(log);

    return withDocs(wrapper, {
      description:
        'Comprehensive demo showing <strong>all event subscriptions</strong> active simultaneously. ' +
        'Use the buttons to trigger different events and watch them appear in the unified log. ' +
        'Crosshair events are throttled to avoid flooding the log.',
      code: `
import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Chart-level events
chart.subscribeCrosshairMove((state) => { /* ... */ });
chart.subscribeClick((e) => { /* ... */ });
chart.subscribeDblClick((e) => { /* ... */ });
chart.subscribeDrawingEvent((event) => { /* ... */ });
chart.subscribeIndicatorEvent((event) => { /* ... */ });
chart.subscribeResize((size) => { /* ... */ });
chart.subscribeSymbolChange((sym) => { /* ... */ });
chart.subscribeChartTypeChange((ct) => { /* ... */ });
chart.subscribePreferencesChange((opts) => { /* ... */ });
chart.subscribeLayoutChange((event) => { /* ... */ });

// Series-level events
series.subscribeDataChanged(() => { /* ... */ });
series.subscribeVisibilityChange((visible) => { /* ... */ });
      `,
    });
  },
};
