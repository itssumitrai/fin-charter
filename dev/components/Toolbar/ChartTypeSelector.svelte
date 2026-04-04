<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';
  import type { ChartTypeLabel } from '../../data/store.svelte.ts';
  import Icon from '../Icon.svelte';
  import {
    mdiFinance,
    mdiChartLine,
    mdiChartAreaspline,
    mdiChartBar,
    mdiChartBellCurve,
    mdiChartTimelineVariant,
    mdiCandle,
  } from '@mdi/js';

  let open = $state(false);
  let containerEl: HTMLDivElement | undefined;

  const CHART_TYPES: { label: ChartTypeLabel; icon: string }[] = [
    { label: 'Candlestick', icon: mdiFinance },
    { label: 'Line', icon: mdiChartLine },
    { label: 'Area', icon: mdiChartAreaspline },
    { label: 'Bar', icon: mdiChartBar },
    { label: 'Baseline', icon: mdiChartBellCurve },
    { label: 'HollowCandle', icon: mdiCandle },
    { label: 'HeikinAshi', icon: mdiChartTimelineVariant },
  ];

  let currentIcon = $derived(
    CHART_TYPES.find(t => t.label === appStore.chartType)?.icon ?? mdiFinance
  );

  function select(type: ChartTypeLabel) {
    appStore.chartType = type;
    open = false;
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside, true);
    } else {
      document.removeEventListener('click', handleClickOutside, true);
    }
    return () => document.removeEventListener('click', handleClickOutside, true);
  });
</script>

<div class="chart-type-selector" bind:this={containerEl}>
  <button class="trigger" aria-label="Chart type" onclick={() => (open = !open)}>
    <Icon path={currentIcon} size={18} />
  </button>

  {#if open}
    <div class="dropdown">
      {#each CHART_TYPES as ct}
        <button
          class="option"
          class:active={appStore.chartType === ct.label}
          onclick={() => select(ct.label)}
        >
          <span class="icon"><Icon path={ct.icon} size={18} /></span>
          <span class="label">{ct.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .chart-type-selector {
    position: relative;
  }

  .trigger {
    background: transparent;
    border: 1px solid transparent;
    color: #758696;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    display: flex;
    align-items: center;
  }

  .trigger:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #d1d4dc;
  }

  .dropdown {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    left: 0;
    background: #131722;
    border: 1px solid #1a2332;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    min-width: 170px;
    padding: 4px 0;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: #d1d4dc;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    text-align: left;
  }

  .option:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .option.active {
    color: #2962ff;
  }

  .icon {
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
