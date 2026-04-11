<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { chartContext } from '../data/chart-context.svelte.ts';

  let canvasEl: HTMLCanvasElement | undefined = $state(undefined);
  let containerEl: HTMLDivElement | undefined = $state(undefined);
  let animFrameId: number | null = null;

  // Drag state for viewport rectangle
  let dragging = $state(false);
  let dragStartX = 0;
  let dragStartFrom = 0;
  let dragStartTo = 0;

  const NAV_HEIGHT = 40;
  const VIEWPORT_COLOR = 'rgba(41,98,255,0.2)';
  const VIEWPORT_BORDER = 'rgba(41,98,255,0.6)';
  const LINE_COLOR = 'rgba(209,212,220,0.4)';
  const BG_COLOR = '#0d0d14';

  function draw() {
    const chart = chartContext.chartApi;
    if (!canvasEl || !chart || !containerEl) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const pr = window.devicePixelRatio || 1;
    const width = containerEl.clientWidth;
    const height = NAV_HEIGHT;

    canvasEl.width = Math.round(width * pr);
    canvasEl.height = Math.round(height * pr);
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;

    // Get data from primary series
    const series = (chart as any)._series;
    if (!series || series.length === 0) return;
    const store = series[0].api.getDataLayer().store;
    if (!store || store.length === 0) return;

    const dataLen = store.length;

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    // Find price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = 0; i < dataLen; i++) {
      const c = store.close[i];
      if (c < minPrice) minPrice = c;
      if (c > maxPrice) maxPrice = c;
    }
    if (minPrice === maxPrice) { minPrice -= 1; maxPrice += 1; }

    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;
    minPrice -= padding;
    maxPrice += padding;

    // Draw line chart of close prices
    ctx.beginPath();
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = pr;

    for (let i = 0; i < dataLen; i++) {
      const x = (i / (dataLen - 1)) * canvasEl.width;
      const y = canvasEl.height - ((store.close[i] - minPrice) / (maxPrice - minPrice)) * canvasEl.height;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill area under the line
    ctx.lineTo(canvasEl.width, canvasEl.height);
    ctx.lineTo(0, canvasEl.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(209,212,220,0.06)';
    ctx.fill();

    // Draw viewport rectangle showing current visible range
    const ts = (chart as any)._timeScale;
    if (!ts) return;
    const visRange = ts.visibleRange();
    const fromIdx = Math.max(0, visRange.fromIdx);
    const toIdx = Math.min(dataLen - 1, visRange.toIdx);

    const vpLeft = (fromIdx / (dataLen - 1)) * canvasEl.width;
    const vpRight = (toIdx / (dataLen - 1)) * canvasEl.width;
    const vpWidth = Math.max(4 * pr, vpRight - vpLeft);

    // Shaded area outside viewport
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, vpLeft, canvasEl.height);
    ctx.fillRect(vpLeft + vpWidth, 0, canvasEl.width - vpLeft - vpWidth, canvasEl.height);

    // Viewport border
    ctx.strokeStyle = VIEWPORT_BORDER;
    ctx.lineWidth = 1.5 * pr;
    ctx.strokeRect(vpLeft, 0, vpWidth, canvasEl.height);

    // Viewport fill
    ctx.fillStyle = VIEWPORT_COLOR;
    ctx.fillRect(vpLeft, 0, vpWidth, canvasEl.height);

    // Schedule next frame
    animFrameId = requestAnimationFrame(draw);
  }

  function handlePointerDown(e: PointerEvent) {
    if (!containerEl || !canvasEl) return;
    const chart = chartContext.chartApi;
    if (!chart) return;

    dragging = true;
    dragStartX = e.clientX;

    const ts = (chart as any)._timeScale;
    const visRange = ts.visibleRange();
    dragStartFrom = visRange.fromIdx;
    dragStartTo = visRange.toIdx;

    canvasEl.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragging || !containerEl || !canvasEl) return;
    const chart = chartContext.chartApi;
    if (!chart) return;

    const series = (chart as any)._series;
    if (!series || series.length === 0) return;
    const store = series[0].api.getDataLayer().store;
    if (!store || store.length === 0) return;

    const width = containerEl.clientWidth;
    const dx = e.clientX - dragStartX;
    const barsPerPixel = store.length / width;
    const barShift = Math.round(dx * barsPerPixel);

    const newFrom = Math.max(0, dragStartFrom + barShift);
    const newTo = Math.min(store.length - 1, dragStartTo + barShift);

    if (newFrom < newTo) {
      chart.setVisibleLogicalRange(newFrom, newTo);
    }
  }

  function handlePointerUp() {
    dragging = false;
  }

  function handleClick(e: MouseEvent) {
    if (!containerEl || !canvasEl) return;
    const chart = chartContext.chartApi;
    if (!chart) return;

    const series = (chart as any)._series;
    if (!series || series.length === 0) return;
    const store = series[0].api.getDataLayer().store;
    if (!store || store.length === 0) return;

    // Click to center the viewport at the clicked position
    const rect = containerEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedIdx = Math.round((x / rect.width) * (store.length - 1));

    const ts = (chart as any)._timeScale;
    const visRange = ts.visibleRange();
    const viewBars = visRange.toIdx - visRange.fromIdx;
    const halfView = Math.floor(viewBars / 2);

    const newFrom = Math.max(0, clickedIdx - halfView);
    const newTo = Math.min(store.length - 1, newFrom + viewBars);
    chart.setVisibleLogicalRange(newFrom, newTo);
  }

  onMount(() => {
    if (canvasEl) {
      animFrameId = requestAnimationFrame(draw);
    }
  });

  onDestroy(() => {
    if (animFrameId !== null) cancelAnimationFrame(animFrameId);
  });
</script>

<div
  class="navigator"
  bind:this={containerEl}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onclick={handleClick}
  role="slider"
  tabindex="0"
  aria-label="Chart navigator"
>
  <canvas bind:this={canvasEl}></canvas>
</div>

<style>
  .navigator {
    width: 100%;
    height: 40px;
    background: #0d0d14;
    border-top: 1px solid #1a2332;
    cursor: grab;
    flex-shrink: 0;
    touch-action: none;
  }

  .navigator:active {
    cursor: grabbing;
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
