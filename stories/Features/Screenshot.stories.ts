import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from 'fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Screenshot',
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates chart.takeScreenshot(). Clicking the button captures the current chart ' +
          'state as a canvas and displays it below as an image.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const TakeScreenshot: Story = {
  name: 'Take Screenshot',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from 'fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(data);

const canvas = chart.takeScreenshot();
const dataUrl = canvas.toDataURL('image/png');`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '12px';

    const button = document.createElement('button');
    button.textContent = 'Take Screenshot';
    button.style.cssText =
      'padding: 8px 16px; cursor: pointer; background: #2196f3; color: white; border: none; border-radius: 4px; font-size: 14px; width: fit-content;';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });

    const series = chart.addCandlestickSeries();
    series.setData(AAPL_DAILY);

    const img = document.createElement('img');
    img.style.cssText = 'max-width: 100%; border: 1px solid #444; border-radius: 4px; display: none;';
    img.alt = 'Chart screenshot';

    const label = document.createElement('p');
    label.textContent = 'Screenshot will appear here after clicking the button.';
    label.style.cssText = 'margin: 0; color: #888; font-size: 13px;';

    button.addEventListener('click', () => {
      const canvas = chart.takeScreenshot();
      img.src = canvas.toDataURL('image/png');
      img.style.display = 'block';
      label.textContent = 'Screenshot captured:';
    });

    wrapper.appendChild(button);
    wrapper.appendChild(container);
    wrapper.appendChild(label);
    wrapper.appendChild(img);

    const description = 'Export the chart as an image with <code>chart.takeScreenshot()</code>. This returns an HTML <code>&lt;canvas&gt;</code> element that you can convert to a data URL via <code>canvas.toDataURL(\'image/png\')</code> for download or display. Click the button above to try it.';
    const code = `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addCandlestickSeries();
series.setData(data);

// Capture the chart as a canvas
const canvas = chart.takeScreenshot();
const dataUrl = canvas.toDataURL('image/png');

// Use the data URL for download or display
const img = document.createElement('img');
img.src = dataUrl;`;

    return withDocs(wrapper, { description, code });
  },
};
