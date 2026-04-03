<script lang="ts">
  interface OhlcvData {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }

  interface Props {
    seriesName: string;
    ohlcv?: OhlcvData | null;
    isUp?: boolean;
  }

  let { seriesName, ohlcv = null, isUp = true }: Props = $props();

  const upColor = '#26a69a';
  const downColor = '#ef5350';

  let valueColor = $derived(isUp ? upColor : downColor);

  function fmt(v: number): string {
    return v.toFixed(2);
  }
</script>

<div class="legend">
  <span class="series-name">{seriesName}</span>
  {#if ohlcv}
    <span class="ohlcv" style:color={valueColor}>
      <span class="ohlcv-item"><span class="ohlcv-key">O</span> {fmt(ohlcv.open)}</span>
      <span class="ohlcv-item"><span class="ohlcv-key">H</span> {fmt(ohlcv.high)}</span>
      <span class="ohlcv-item"><span class="ohlcv-key">L</span> {fmt(ohlcv.low)}</span>
      <span class="ohlcv-item"><span class="ohlcv-key">C</span> {fmt(ohlcv.close)}</span>
      <span class="ohlcv-item"><span class="ohlcv-key">V</span> {fmt(ohlcv.volume)}</span>
    </span>
  {/if}
</div>

<style>
  .legend {
    position: absolute;
    top: 4px;
    left: 8px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    pointer-events: none;
    user-select: none;
  }

  .series-name {
    color: var(--fc-text-color, #999);
    font-weight: 500;
  }

  .ohlcv {
    display: flex;
    gap: 6px;
  }

  .ohlcv-item {
    white-space: nowrap;
  }

  .ohlcv-key {
    opacity: 0.7;
  }
</style>
