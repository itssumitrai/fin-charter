import type { Meta, StoryObj } from '@storybook/html';
import { mount, unmount } from 'svelte';
import ChartToolbar from '../../src/gui/ChartToolbar.svelte';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Features/Chart Toolbar',
  parameters: {
    docs: {
      description: {
        component:
          'Reusable Svelte toolbar component with chart type selector, drawing tools, indicator picker ' +
          'with search, undo/redo, and fullscreen toggle. Fully configurable via sections prop.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Full Toolbar',
  parameters: {
    docs: {
      source: {
        code: `import { mount } from 'svelte';
import ChartToolbar from '@itssumitrai/fin-charter/gui/ChartToolbar.svelte';

const toolbar = mount(ChartToolbar, {
  target: document.getElementById('toolbar'),
  props: {
    chartType: 'candlestick',
    canUndo: true,
    canRedo: false,
    onDrawingToolSelect: (type) => console.log('Drawing tool:', type),
    onIndicatorAdd: (type) => console.log('Add indicator:', type),
    onChartTypeChange: (type) => console.log('Chart type:', type),
    onUndo: () => console.log('Undo'),
    onRedo: () => console.log('Redo'),
    onFullscreenToggle: () => console.log('Fullscreen'),
  },
});`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; background: #1a1a2e; padding: 8px; border-radius: 8px;';

    const target = document.createElement('div');
    wrapper.appendChild(target);

    const log = document.createElement('pre');
    log.style.cssText =
      'margin-top: 12px; padding: 12px; background: #131320; color: #a0a0b0; ' +
      'font-size: 12px; border-radius: 4px; max-height: 200px; overflow-y: auto;';
    log.textContent = '// Interactions will appear here...\n';
    wrapper.appendChild(log);

    function appendLog(msg: string) {
      log.textContent += msg + '\n';
      log.scrollTop = log.scrollHeight;
    }

    let app: ReturnType<typeof mount> | undefined;

    requestAnimationFrame(() => {
      if (!wrapper.isConnected) return;
      app = mount(ChartToolbar, {
        target,
        props: {
          chartType: 'candlestick',
          canUndo: true,
          canRedo: false,
          onDrawingToolSelect: (type: string | null) => appendLog(`Drawing tool: ${type}`),
          onIndicatorAdd: (type: string) => appendLog(`Add indicator: ${type}`),
          onChartTypeChange: (type: string) => appendLog(`Chart type changed: ${type}`),
          onUndo: () => appendLog('Undo'),
          onRedo: () => appendLog('Redo'),
          onFullscreenToggle: () => appendLog('Fullscreen toggled'),
        },
      });
    });

    const observer = new MutationObserver(() => {
      if (!wrapper.isConnected && app) {
        observer.disconnect();
        unmount(app);
        app = undefined;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return withDocs(wrapper, {
      description:
        'The <code>ChartToolbar</code> component provides a TradingView-style toolbar with sections for ' +
        'chart type selection, drawing tools, indicator picker (with search), undo/redo, and fullscreen toggle. ' +
        'Each section can be individually enabled or disabled via the <code>sections</code> prop.',
      code: `import ChartToolbar from '@itssumitrai/fin-charter/gui/ChartToolbar.svelte';

mount(ChartToolbar, {
  target: container,
  props: {
    chartType: 'candlestick',
    canUndo: true,
    canRedo: false,
    onDrawingToolSelect: (type) => chart.setActiveDrawingTool(type),
    onIndicatorAdd: (type) => chart.addIndicator(type, { source: series }),
    onChartTypeChange: (type) => { /* recreate series */ },
    onUndo: () => chart.undo(),
    onRedo: () => chart.redo(),
    onFullscreenToggle: () => { /* toggle fullscreen */ },
  },
});`,
    });
  },
};

export const CustomSections: Story = {
  name: 'Custom Sections',
  parameters: {
    docs: {
      source: {
        code: `mount(ChartToolbar, {
  target: container,
  props: {
    sections: {
      chartType: true,
      drawingTools: false,
      indicators: true,
      undoRedo: false,
      fullscreen: false,
    },
    chartType: 'line',
    onChartTypeChange: (type) => console.log('Chart type:', type),
    onIndicatorAdd: (type) => console.log('Indicator:', type),
  },
});`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; background: #1a1a2e; padding: 8px; border-radius: 8px;';

    const target = document.createElement('div');
    wrapper.appendChild(target);

    let app: ReturnType<typeof mount> | undefined;

    requestAnimationFrame(() => {
      if (!wrapper.isConnected) return;
      app = mount(ChartToolbar, {
        target,
        props: {
          sections: {
            chartType: true,
            drawingTools: false,
            indicators: true,
            undoRedo: false,
            fullscreen: false,
          },
          chartType: 'line',
          onChartTypeChange: (type: string) => console.log('Chart type:', type),
          onIndicatorAdd: (type: string) => console.log('Indicator:', type),
        },
      });
    });

    const observer = new MutationObserver(() => {
      if (!wrapper.isConnected && app) {
        observer.disconnect();
        unmount(app);
        app = undefined;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return withDocs(wrapper, {
      description:
        'Use the <code>sections</code> prop to show only the toolbar sections you need. ' +
        'This example shows only chart type and indicator selectors.',
      code: `mount(ChartToolbar, {
  target: container,
  props: {
    sections: {
      chartType: true,
      drawingTools: false,
      indicators: true,
      undoRedo: false,
      fullscreen: false,
    },
  },
});`,
    });
  },
};

export const CustomButtons: Story = {
  name: 'Custom Buttons',
  parameters: {
    docs: {
      source: {
        code: `mount(ChartToolbar, {
  target: container,
  props: {
    customButtons: [
      { label: 'Screenshot', icon: '📸', onclick: () => chart.takeScreenshot() },
      { label: 'Export CSV', icon: '📄', onclick: () => chart.exportCSV() },
      { label: 'Settings', icon: '⚙', onclick: () => openSettings() },
    ],
  },
});`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; background: #1a1a2e; padding: 8px; border-radius: 8px;';

    const target = document.createElement('div');
    wrapper.appendChild(target);

    const log = document.createElement('pre');
    log.style.cssText =
      'margin-top: 12px; padding: 12px; background: #131320; color: #a0a0b0; ' +
      'font-size: 12px; border-radius: 4px;';
    log.textContent = '// Click custom buttons...\n';
    wrapper.appendChild(log);

    function appendLog(msg: string) {
      log.textContent += msg + '\n';
    }

    let app: ReturnType<typeof mount> | undefined;

    requestAnimationFrame(() => {
      if (!wrapper.isConnected) return;
      app = mount(ChartToolbar, {
        target,
        props: {
          chartType: 'candlestick',
          customButtons: [
            { label: 'Screenshot', icon: '📸', onclick: () => appendLog('Screenshot taken') },
            { label: 'Export CSV', icon: '📄', onclick: () => appendLog('CSV exported') },
            { label: 'Settings', icon: '⚙', onclick: () => appendLog('Settings opened') },
          ],
        },
      });
    });

    const observer = new MutationObserver(() => {
      if (!wrapper.isConnected && app) {
        observer.disconnect();
        unmount(app);
        app = undefined;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return withDocs(wrapper, {
      description:
        'Add custom buttons to the toolbar using the <code>customButtons</code> prop. ' +
        'Each button takes a label, optional icon, and onclick handler.',
      code: `mount(ChartToolbar, {
  target: container,
  props: {
    customButtons: [
      { label: 'Screenshot', icon: '📸', onclick: () => chart.takeScreenshot() },
      { label: 'Export CSV', icon: '📄', onclick: () => chart.exportCSV() },
    ],
  },
});`,
    });
  },
};
