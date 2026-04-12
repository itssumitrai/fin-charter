import type { Bar } from '../core/types';

export interface SSROptions {
  width: number;
  height: number;
  backgroundColor?: string;
  lineColor?: string;
  type?: 'line' | 'candlestick';
}

/**
 * Render chart data to an SVG string without a DOM.
 * Suitable for server-side rendering in Node.js.
 */
/** Strip potentially unsafe characters from CSS color strings to prevent SVG injection. */
const safeColor = (c: string) => c.replace(/[^a-zA-Z0-9#(),. ]/g, '');

export function renderChartToSVG(bars: Bar[], options: SSROptions): string {
  const { width, height, type = 'line' } = options;
  const backgroundColor = safeColor(options.backgroundColor ?? '#1a1a2e');
  const lineColor = safeColor(options.lineColor ?? '#2196F3');

  if (bars.length === 0) return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${backgroundColor}"/></svg>`;

  let minPrice = Infinity, maxPrice = -Infinity;
  for (const b of bars) {
    if (b.low < minPrice) minPrice = b.low;
    if (b.high > maxPrice) maxPrice = b.high;
  }
  const padding = (maxPrice - minPrice) * 0.1 || 1;
  minPrice -= padding;
  maxPrice += padding;
  const range = maxPrice - minPrice;

  const margin = { top: 10, right: 60, bottom: 30, left: 10 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const barWidth = chartW / bars.length;

  let content = '';

  if (type === 'line') {
    const points = bars.map((b, i) => {
      const x = margin.left + (i + 0.5) * barWidth;
      const y = margin.top + (1 - (b.close - minPrice) / range) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    content = `<polyline points="${points}" fill="none" stroke="${lineColor}" stroke-width="1.5"/>`;
  } else {
    content = bars.map((b, i) => {
      const x = margin.left + i * barWidth;
      const isUp = b.close >= b.open;
      const color = isUp ? '#00E396' : '#FF3B5C';
      const bodyTop = margin.top + (1 - (Math.max(b.open, b.close) - minPrice) / range) * chartH;
      const bodyBottom = margin.top + (1 - (Math.min(b.open, b.close) - minPrice) / range) * chartH;
      const highY = margin.top + (1 - (b.high - minPrice) / range) * chartH;
      const lowY = margin.top + (1 - (b.low - minPrice) / range) * chartH;
      const cx = x + barWidth / 2;
      const bodyH = Math.max(1, bodyBottom - bodyTop);
      const w = Math.max(1, barWidth * 0.7);
      return `<line x1="${cx}" y1="${highY}" x2="${cx}" y2="${lowY}" stroke="${color}" stroke-width="1"/>` +
             `<rect x="${cx - w/2}" y="${bodyTop}" width="${w}" height="${bodyH}" fill="${color}"/>`;
    }).join('\n');
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  ${content}
</svg>`;
}
