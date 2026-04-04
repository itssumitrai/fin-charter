import type { Meta, StoryObj } from '@storybook/html';
import { mount, unmount } from 'svelte';
import TradingViewApp from '../../dev/components/TradingViewApp.svelte';

const meta: Meta = {
  title: 'TradingView/Full Application',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full TradingView-like charting application built with fin-charter and reusable Svelte components. ' +
          'Features: symbol search, interval switching, chart type selection, 30 indicators, 16 drawing tools, ' +
          'comparison mode, timezone selector, collapsible watchlist sidebar, and live Yahoo Finance data.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  name: 'TradingView Clone',
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
      app = mount(TradingViewApp, { target: container });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return container;
  },
};
