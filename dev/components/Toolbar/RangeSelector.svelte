<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';
  import { chartContext } from '../../data/chart-context.svelte.ts';
  import type { Periodicity } from '@itssumitrai/fin-charter';

  interface RangePreset {
    label: string;
    /** Number of days for the range, or special values. */
    days: number | 'ytd' | 'all';
    /** The appropriate data interval for this range. */
    periodLabel: string;
    periodValue: Periodicity;
  }

  const ranges: RangePreset[] = [
    { label: '1D', days: 1, periodLabel: '1m', periodValue: { interval: 1, unit: 'minute' } },
    { label: '1W', days: 7, periodLabel: '5m', periodValue: { interval: 5, unit: 'minute' } },
    { label: '1M', days: 30, periodLabel: '1h', periodValue: { interval: 1, unit: 'hour' } },
    { label: '3M', days: 90, periodLabel: '1D', periodValue: { interval: 1, unit: 'day' } },
    { label: '6M', days: 180, periodLabel: '1D', periodValue: { interval: 1, unit: 'day' } },
    { label: '1Y', days: 365, periodLabel: '1D', periodValue: { interval: 1, unit: 'day' } },
    { label: 'YTD', days: 'ytd', periodLabel: '1D', periodValue: { interval: 1, unit: 'day' } },
    { label: 'All', days: 'all', periodLabel: '1W', periodValue: { interval: 1, unit: 'week' } },
  ];

  let activeRange = $state<string>('');

  function selectRange(range: RangePreset) {
    activeRange = range.label;

    // Step 1: Change the periodicity — this triggers data reload in AdvancedChart
    const currentPeriod = appStore.periodicityLabel;
    const needsReload = currentPeriod !== range.periodLabel;

    if (needsReload) {
      appStore.setPeriodicity(range.periodLabel, range.periodValue);
    }

    // Step 2: After data loads, zoom to the requested range
    // Use a polling approach to wait for loading to finish
    const applyRange = () => {
      const chart = chartContext.chartApi;
      if (!chart) return;

      if (range.days === 'all') {
        chart.fitContent();
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      let from: number;

      if (range.days === 'ytd') {
        const year = new Date().getUTCFullYear();
        from = Date.UTC(year, 0, 1) / 1000;
      } else {
        from = now - (range.days as number) * 86400;
      }

      chart.setVisibleRange(from, now);
    };

    if (needsReload) {
      // Wait for data to load before zooming
      const waitForLoad = () => {
        if (!appStore.loading) {
          // Data loaded — apply range after a brief paint delay
          requestAnimationFrame(() => {
            requestAnimationFrame(applyRange);
          });
        } else {
          setTimeout(waitForLoad, 100);
        }
      };
      // Start checking after a brief delay for the load to begin
      setTimeout(waitForLoad, 200);
    } else {
      // Same periodicity — just zoom immediately
      applyRange();
    }
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
