<script lang="ts">
  import { appStore, CHART_TYPE_TO_SERIES } from '../../data/store.svelte.ts';
  import type { ChartTypeLabel } from '../../data/store.svelte.ts';

  let open = $state(false);
  let containerEl: HTMLDivElement | undefined;

  const CHART_TYPES: { label: ChartTypeLabel; icon: string }[] = [
    { label: 'Candlestick', icon: '🕯' },
    { label: 'Line', icon: '📈' },
    { label: 'Area', icon: '▤' },
    { label: 'Bar', icon: '┃' },
    { label: 'Baseline', icon: '⎯' },
    { label: 'HollowCandle', icon: '◇' },
    { label: 'HeikinAshi', icon: '⊞' },
  ];

  let currentIcon = $derived(
    CHART_TYPES.find(t => t.label === appStore.chartType)?.icon ?? '🕯'
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
  <button class="trigger" onclick={() => (open = !open)}>
    {currentIcon}
  </button>

  {#if open}
    <div class="dropdown">
      {#each CHART_TYPES as ct}
        <button
          class="option"
          class:active={appStore.chartType === ct.label}
          onclick={() => select(ct.label)}
        >
          <span class="icon">{ct.icon}</span>
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
    min-width: 160px;
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
    text-align: center;
    font-size: 14px;
  }
</style>
