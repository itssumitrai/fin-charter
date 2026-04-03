import type { Bar } from '../src/core/types';

export function generateOHLCV(count: number, startPrice = 100, startTime = 1609459200): Bar[] {
  const bars: Bar[] = [];
  let price = startPrice;
  let time = startTime;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 3;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.round(50000 + Math.random() * 100000);
    bars.push({
      time,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });
    price = close;
    time += 86400;
  }
  return bars;
}

export function createChartContainer(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '100%';
  el.style.height = '500px';
  return el;
}
