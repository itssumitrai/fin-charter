export interface DepthChartData {
  bids: Array<{ price: number; cumVolume: number }>;
  asks: Array<{ price: number; cumVolume: number }>;
}

export interface DepthChartOptions {
  bidColor?: string;
  askColor?: string;
  bidFillColor?: string;
  askFillColor?: string;
  midPrice?: number;
}

const DEFAULTS: Required<DepthChartOptions> = {
  bidColor: '#00E396',
  askColor: '#FF3B5C',
  bidFillColor: 'rgba(0,227,150,0.15)',
  askFillColor: 'rgba(255,59,92,0.15)',
  midPrice: 0,
};

/**
 * Render a depth chart (order book visualization) on a canvas.
 * This is a standalone renderer — not integrated into the chart's
 * series system. Use it separately or as a companion widget.
 */
export function renderDepthChart(
  ctx: CanvasRenderingContext2D,
  data: DepthChartData,
  width: number,
  height: number,
  options?: DepthChartOptions,
): void {
  const opts = { ...DEFAULTS, ...options };
  const { bids, asks } = data;

  if (bids.length === 0 && asks.length === 0) return;

  // Find ranges
  let maxVol = 0;
  for (const b of bids) if (b.cumVolume > maxVol) maxVol = b.cumVolume;
  for (const a of asks) if (a.cumVolume > maxVol) maxVol = a.cumVolume;
  if (maxVol === 0) return;

  const allPrices = [...bids.map(b => b.price), ...asks.map(a => a.price)];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  const priceToX = (p: number) => ((p - minPrice) / priceRange) * width;
  const volToY = (v: number) => height - (v / maxVol) * height;

  // Draw bids (left side, green, cumulative going left)
  if (bids.length > 0) {
    ctx.beginPath();
    ctx.moveTo(priceToX(bids[0].price), height);
    for (const b of bids) {
      ctx.lineTo(priceToX(b.price), volToY(b.cumVolume));
    }
    ctx.lineTo(priceToX(bids[bids.length - 1].price), height);
    ctx.closePath();
    ctx.fillStyle = opts.bidFillColor;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < bids.length; i++) {
      const x = priceToX(bids[i].price);
      const y = volToY(bids[i].cumVolume);
      if (i === 0) ctx.moveTo(x, y);
      else { ctx.lineTo(x, y); }
    }
    ctx.strokeStyle = opts.bidColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw asks (right side, red, cumulative going right)
  if (asks.length > 0) {
    ctx.beginPath();
    ctx.moveTo(priceToX(asks[0].price), height);
    for (const a of asks) {
      ctx.lineTo(priceToX(a.price), volToY(a.cumVolume));
    }
    ctx.lineTo(priceToX(asks[asks.length - 1].price), height);
    ctx.closePath();
    ctx.fillStyle = opts.askFillColor;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < asks.length; i++) {
      const x = priceToX(asks[i].price);
      const y = volToY(asks[i].cumVolume);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = opts.askColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
