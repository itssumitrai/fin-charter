import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Alert Lines',
  parameters: {
    docs: {
      description: {
        component:
          'Alert lines are price levels that fire callbacks when the current price crosses them. ' +
          'They support armed/disarmed states, customizable trigger modes (crossing-up, crossing-down, crossing-either), ' +
          'and can be dragged to adjust the price.',
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

export const ArmedAlert: Story = {
  name: 'Armed & Disarmed',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

const alert = chart.addAlertLine(190, {
  color: '#FF9800',
  lineStyle: 'dashed',
  title: 'Alert @ 190',
  triggerMode: 'crossing-either',
  armed: true,
});

alert.onTriggered((a, direction) => {
  console.log(\`Alert triggered: price crossed \${direction}\`);
});

// Disarm the alert
alert.applyOptions({ armed: false });`,
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
    status.textContent = 'Alert is ARMED';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    const alert = chart.addAlertLine(190, {
      color: '#FF9800',
      lineStyle: 'dashed',
      title: 'Alert @ 190',
      triggerMode: 'crossing-either',
      armed: true,
    });

    alert.onTriggered((_a, direction) => {
      status.textContent = `Alert triggered! Price crossed ${direction}`;
    });

    const armBtn = makeButton('Arm', () => {
      alert.applyOptions({ armed: true });
      status.textContent = 'Alert is ARMED';
    });

    const disarmBtn = makeButton('Disarm', () => {
      alert.applyOptions({ armed: false });
      status.textContent = 'Alert is DISARMED';
    });

    toolbar.appendChild(armBtn);
    toolbar.appendChild(disarmBtn);
    toolbar.appendChild(status);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);

    const description = '<strong>Alert lines</strong> are price levels that fire callbacks when the current price crosses them. Use <code>chart.addAlertLine(price, options)</code> to create one. Each alert has an <code>armed</code> state &mdash; when disarmed, it remains visible but will not fire callbacks. Trigger modes include <code>crossing-up</code>, <code>crossing-down</code>, and <code>crossing-either</code>.';
    const code = `const alert = chart.addAlertLine(190, {
  color: '#FF9800',
  lineStyle: 'dashed',
  title: 'Alert @ 190',
  triggerMode: 'crossing-either',
  armed: true,
});

alert.onTriggered((a, direction) => {
  console.log(\`Alert triggered: price crossed \${direction}\`);
});

// Toggle armed state
alert.applyOptions({ armed: false });`;

    return withDocs(wrapper, { description, code });
  },
};

export const MultipleTriggerModes: Story = {
  name: 'Trigger Modes',
  parameters: {
    docs: {
      source: {
        code: `chart.addAlertLine(185, {
  triggerMode: 'crossing-up', color: '#22AB94', title: 'Cross Up',
});
chart.addAlertLine(195, {
  triggerMode: 'crossing-down', color: '#F7525F', title: 'Cross Down',
});
chart.addAlertLine(190, {
  triggerMode: 'crossing-either', color: '#FF9800', title: 'Cross Either',
});`,
      },
    },
  },
  render: () => {
    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    chart.addAlertLine(185, {
      color: '#22AB94',
      lineStyle: 'dashed',
      title: 'Cross Up',
      triggerMode: 'crossing-up',
      armed: true,
    });

    chart.addAlertLine(195, {
      color: '#F7525F',
      lineStyle: 'dashed',
      title: 'Cross Down',
      triggerMode: 'crossing-down',
      armed: true,
    });

    chart.addAlertLine(190, {
      color: '#FF9800',
      lineStyle: 'dotted',
      title: 'Cross Either',
      triggerMode: 'crossing-either',
      armed: true,
    });

    const description = 'Alert lines support three <strong>trigger modes</strong>: <code>crossing-up</code> fires only when price crosses upward, <code>crossing-down</code> fires only on downward crosses, and <code>crossing-either</code> fires in both directions. Combine multiple alert lines at different levels for comprehensive price monitoring.';
    const code = `chart.addAlertLine(185, {
  triggerMode: 'crossing-up', color: '#22AB94', title: 'Cross Up',
});
chart.addAlertLine(195, {
  triggerMode: 'crossing-down', color: '#F7525F', title: 'Cross Down',
});
chart.addAlertLine(190, {
  triggerMode: 'crossing-either', color: '#FF9800', title: 'Cross Either',
});`;

    return withDocs(container, { description, code });
  },
};
