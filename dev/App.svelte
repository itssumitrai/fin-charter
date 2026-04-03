<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createChart } from 'fin-charter';
  import type { IChartApi, ISeriesApi } from 'fin-charter';
  import type { Bar, SeriesType } from 'fin-charter';
  import { generateOHLCV } from './data.ts';

  type ChartTypeLabel =
    | 'Candlestick'
    | 'Line'
    | 'Area'
    | 'Bar'
    | 'Baseline'
    | 'HollowCandle';

  const CHART_TYPES: ChartTypeLabel[] = [
    'Candlestick',
    'Line',
    'Area',
    'Bar',
    'Baseline',
    'HollowCandle',
  ];

  let activeType = $state<ChartTypeLabel>('Candlestick');
  let isStreaming = $state(false);

  let containerEl = $state<HTMLDivElement | undefined>(undefined);
  let chart = $state<IChartApi | undefined>(undefined);
  let series = $state<ISeriesApi<SeriesType> | undefined>(undefined);
  let streamInterval: ReturnType<typeof setInterval> | undefined;

  // The last bar used during streaming so we can append to it
  let streamBars: Bar[] = [];
  let streamIdx = 0;

  function buildSeries(type: ChartTypeLabel, c: IChartApi): ISeriesApi<SeriesType> {
    switch (type) {
      case 'Candlestick':
        return c.addCandlestickSeries();
      case 'Line':
        return c.addLineSeries();
      case 'Area':
        return c.addAreaSeries();
      case 'Bar':
        return c.addBarSeries();
      case 'Baseline':
        return c.addBaselineSeries();
      case 'HollowCandle':
        return c.addHollowCandleSeries();
    }
  }

  function initChart() {
    if (!containerEl) return;

    // Tear down existing chart
    stopStreaming();
    chart?.remove();

    const c = createChart(containerEl, {
      autoSize: true,
      layout: {
        backgroundColor: '#0d0d1a',
        textColor: '#c9d1d9',
      },
      grid: {
        vertLinesColor: 'rgba(255,255,255,0.05)',
        horzLinesColor: 'rgba(255,255,255,0.05)',
        vertLinesVisible: true,
        horzLinesVisible: true,
      },
      crosshair: {
        vertLineColor: 'rgba(150,160,180,0.6)',
        horzLineColor: 'rgba(150,160,180,0.6)',
        vertLineWidth: 1,
        horzLineWidth: 1,
        vertLineDash: [4, 4],
        horzLineDash: [4, 4],
      },
    });

    chart = c;

    const s = buildSeries(activeType, c);
    series = s;

    streamBars = generateOHLCV(500);
    streamIdx = streamBars.length;

    s.setData(streamBars);
  }

  function switchType(type: ChartTypeLabel) {
    if (type === activeType) return;
    activeType = type;
    stopStreaming();
    initChart();
  }

  function startStreaming() {
    if (isStreaming || !series) return;
    isStreaming = true;

    const DAY = 86400;
    const lastBar = streamBars[streamBars.length - 1];
    let lastTime = lastBar.time;
    let lastClose = lastBar.close;

    streamInterval = setInterval(() => {
      if (!series) return;

      lastTime += DAY;
      const change = lastClose * (Math.random() * 0.04 - 0.02);
      const open = lastClose;
      const close = Math.max(0.01, lastClose + change);
      const volatility = lastClose * 0.015;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.max(0.01, Math.min(open, close) - Math.random() * volatility);
      const volume = Math.round(100_000 + Math.random() * 900_000);

      const bar: Bar = { time: lastTime, open, high, low, close, volume };
      series.update(bar);
      lastClose = close;
    }, 500);
  }

  function stopStreaming() {
    if (streamInterval !== undefined) {
      clearInterval(streamInterval);
      streamInterval = undefined;
    }
    isStreaming = false;
  }

  function toggleStreaming() {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  }

  onMount(() => {
    initChart();
  });

  onDestroy(() => {
    stopStreaming();
    chart?.remove();
  });
</script>

<div class="app">
  <div class="controls">
    <span class="label">Chart type:</span>
    {#each CHART_TYPES as type}
      <button
        class="type-btn"
        class:active={activeType === type}
        onclick={() => switchType(type)}
      >
        {type}
      </button>
    {/each}

    <div class="spacer"></div>

    <button
      class="stream-btn"
      class:streaming={isStreaming}
      onclick={toggleStreaming}
    >
      {isStreaming ? 'Stop Real-Time' : 'Start Real-Time'}
    </button>
  </div>

  <div class="chart-container" bind:this={containerEl}></div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #0d0d1a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #12122a;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .label {
    color: #7d8590;
    font-size: 12px;
    margin-right: 4px;
  }

  .type-btn {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: transparent;
    color: #c9d1d9;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .type-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .type-btn.active {
    background: #1f6feb;
    border-color: #1f6feb;
    color: #fff;
  }

  .spacer {
    flex: 1;
  }

  .stream-btn {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid #238636;
    background: #238636;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .stream-btn:hover {
    background: #2ea043;
    border-color: #2ea043;
  }

  .stream-btn.streaming {
    background: #b62324;
    border-color: #b62324;
  }

  .stream-btn.streaming:hover {
    background: #d1242f;
    border-color: #d1242f;
  }

  .chart-container {
    flex: 1;
    min-height: 0;
  }
</style>
