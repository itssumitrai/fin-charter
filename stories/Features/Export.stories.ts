import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from '@itssumitrai/fin-charter';
import { createChartContainer } from '../helpers';
import { withDocs } from '../doc-renderer';
import { AAPL_DAILY } from '../sample-data';

const meta: Meta = {
  title: 'Features/Export',
  parameters: {
    docs: {
      description: {
        component:
          'Export chart data and visuals in multiple formats: CSV for data, SVG for vector graphics, ' +
          'and PDF for print-ready output.',
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

export const ExportFormats: Story = {
  name: 'CSV, SVG & PDF Export',
  parameters: {
    docs: {
      source: {
        code: `import { createChart } from '@itssumitrai/fin-charter';

const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

// Export visible data as CSV
const csv = chart.exportCSV({ separator: ',' });

// Export chart as SVG string
const svg = chart.exportSVG();

// Export chart as PDF Blob
const pdfBlob = chart.exportPDF({ title: 'AAPL Chart' });`,
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display: flex; align-items: center; padding: 8px; background: #1e2235; border-radius: 4px;';

    const output = document.createElement('pre');
    output.style.cssText =
      'max-height: 120px; overflow: auto; padding: 8px; background: #1a1b2e; ' +
      'border: 1px solid #262840; border-radius: 4px; color: #d1d4dc; font-size: 12px; ' +
      'font-family: monospace; display: none; white-space: pre-wrap;';

    const container = createChartContainer();
    const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
    const series = chart.addSeries({ type: 'candlestick' });
    series.setData(AAPL_DAILY);

    function triggerDownload(blob: Blob, filename: string): void {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    const csvBtn = makeButton('Export CSV', () => {
      const csv = chart.exportCSV({ separator: ',' });
      triggerDownload(new Blob([csv], { type: 'text/csv' }), 'AAPL-chart.csv');
      output.textContent = `CSV downloaded: ${csv.length} characters`;
      output.style.display = 'block';
    });

    const svgBtn = makeButton('Export SVG', () => {
      const svg = chart.exportSVG();
      triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), 'AAPL-chart.svg');
      output.textContent = `SVG downloaded: ${svg.length} characters`;
      output.style.display = 'block';
    });

    const pdfBtn = makeButton('Export PDF', () => {
      const blob = chart.exportPDF({ title: 'AAPL Daily Chart' });
      triggerDownload(blob, 'AAPL-chart.pdf');
      output.textContent = `PDF downloaded: ${blob.size} bytes`;
      output.style.display = 'block';
    });

    toolbar.appendChild(csvBtn);
    toolbar.appendChild(svgBtn);
    toolbar.appendChild(pdfBtn);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(container);
    wrapper.appendChild(output);

    const description = 'Export chart content in three formats: <code>chart.exportCSV(options)</code> returns OHLCV data as a CSV string (with optional date range filtering and indicator columns), <code>chart.exportSVG()</code> returns a scalable vector graphics string, and <code>chart.exportPDF(options)</code> returns a PDF <code>Blob</code> for download or display.';
    const code = `// CSV export with options
const csv = chart.exportCSV({
  separator: ',',
  includeIndicators: true,
  from: 1704067200,
  to: 1709078400,
});

// SVG export
const svg = chart.exportSVG();

// PDF export
const blob = chart.exportPDF({ title: 'AAPL Daily Chart' });
const url = URL.createObjectURL(blob);
window.open(url);`;

    return withDocs(wrapper, { description, code });
  },
};
