import type { Meta, StoryObj } from '@storybook/html';
import { mount, unmount } from 'svelte';
import AdvancedChart from '../../dev/components/AdvancedChart.svelte';
import { withDocs } from '../doc-renderer';

const meta: Meta = {
  title: 'Advanced Chart/Full Application',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-featured charting application built with fin-charter and reusable Svelte components. ' +
          'Features: symbol search, interval switching, chart type selection, 30+ indicators, 16 drawing tools, ' +
          'comparison mode, timezone selector, collapsible watchlist sidebar, and live Yahoo Finance data.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'Advanced Chart',
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100vh';
    container.style.overflow = 'hidden';

    let app: ReturnType<typeof mount> | undefined;
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      observer.disconnect();
      if (app) {
        unmount(app);
        app = undefined;
      }
    };

    const observer = new MutationObserver(() => {
      if (!container.isConnected) {
        cleanup();
      }
    });

    requestAnimationFrame(() => {
      if (cleanedUp || !container.isConnected) {
        cleanup();
        return;
      }
      app = mount(AdvancedChart, { target: container });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return withDocs(container, {
      description:
        'A full-featured <strong>charting application</strong> built with fin-charter and reusable Svelte components. ' +
        'Features include <code>symbol search</code>, <code>interval switching</code>, <code>chart type selection</code>, ' +
        '30+ technical indicators, 16 drawing tools, <code>comparison mode</code>, <code>timezone selection</code>, ' +
        'a collapsible watchlist sidebar, and live Yahoo Finance data.\n' +
        'The <code>AdvancedChart</code> component reads from a reactive <code>chartContext</code> store, making it ' +
        'fully configurable from the outside.',
      code: `
import { mount } from 'svelte';
import AdvancedChart from './components/AdvancedChart.svelte';
import { chartContext } from './data/chart-context';

// Configure the chart before mounting
chartContext.update(ctx => ({
  ...ctx,
  symbol: 'MSFT',
  theme: 'dark',
  enabledFeatures: ['indicators', 'drawings', 'comparison'],
}));

// Mount the advanced chart
const app = mount(AdvancedChart, { target: container });
      `,
      codeExpanded: false,
    });
  },
};
