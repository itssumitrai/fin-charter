<script lang="ts">
  import { chartContext } from '../../data/chart-context.svelte.ts';

  interface RangePreset {
    label: string;
    value: number | 'ytd' | 'all';
  }

  const ranges: RangePreset[] = [
    { label: '1D', value: 1 },
    { label: '1W', value: 7 },
    { label: '1M', value: 30 },
    { label: '3M', value: 90 },
    { label: '6M', value: 180 },
    { label: '1Y', value: 365 },
    { label: 'YTD', value: 'ytd' },
    { label: 'All', value: 'all' },
  ];

  let activeRange = $state<string>('');

  function selectRange(range: RangePreset) {
    const chart = chartContext.chartApi;
    if (!chart) return;

    activeRange = range.label;

    const now = Math.floor(Date.now() / 1000);

    if (range.value === 'all') {
      chart.fitContent();
      return;
    }

    if (range.value === 'ytd') {
      // YTD: from Jan 1 of current year (UTC) to now
      const year = new Date().getUTCFullYear();
      const jan1UTC = Date.UTC(year, 0, 1) / 1000;
      chart.setVisibleRange(jan1UTC, now);
      return;
    }

    const from = now - range.value * 86400;
    chart.setVisibleRange(from, now);
  }
</script>

<div class="range-selector">
  {#each ranges as range}
    <button
      class="range-btn"
      class:active={activeRange === range.label}
      onclick={() => selectRange(range)}
    >
      {range.label}
    </button>
  {/each}
</div>

<style>
  .range-selector {
    display: flex;
    border: 1px solid #434651;
    border-radius: 4px;
    overflow: hidden;
  }

  .range-btn {
    padding: 3px 6px;
    background: #2a2e39;
    color: #d1d4dc;
    border: none;
    border-right: 1px solid #434651;
    cursor: pointer;
    font-size: 10px;
    font-family: inherit;
    transition: background 0.15s;
  }

  .range-btn:last-child {
    border-right: none;
  }

  .range-btn:hover {
    background: #363a45;
  }

  .range-btn.active {
    background: #2962ff;
    color: #ffffff;
  }
</style>
