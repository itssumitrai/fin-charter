<script lang="ts">
  import { chartContext } from '../../data/chart-context.svelte.ts';

  interface Range {
    label: string;
    days: number | 'ytd' | 'all';
  }

  const ranges: Range[] = [
    { label: '1D', days: 1 },
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
    { label: 'YTD', days: 'ytd' },
    { label: 'All', days: 'all' },
  ];

  let activeRange = $state<string>('');

  function selectRange(range: Range) {
    const chart = chartContext.chartApi;
    if (!chart) return;

    activeRange = range.label;

    const now = Math.floor(Date.now() / 1000);

    if (range.days === 'all') {
      chart.fitContent();
      return;
    }

    if (range.days === 'ytd') {
      // YTD: from Jan 1 of current year to now
      const jan1 = new Date(new Date().getFullYear(), 0, 1);
      const from = Math.floor(jan1.getTime() / 1000);
      chart.setVisibleRange(from, now);
      return;
    }

    const from = now - range.days * 86400;
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
