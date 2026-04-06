<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';

  const filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Regular', value: 'regular' as const },
    { label: 'Extended', value: 'extended' as const },
  ];

  let isIntraday = $derived(
    appStore.periodicity.unit === 'minute' || appStore.periodicity.unit === 'hour'
  );
</script>

{#if isIntraday}
  <div class="session-filter">
    {#each filters as f}
      <button
        class="filter-btn"
        class:active={appStore.sessionFilter === f.value}
        onclick={() => { appStore.sessionFilter = f.value; }}
      >
        {f.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .session-filter {
    display: flex;
    border: 1px solid #434651;
    border-radius: 4px;
    overflow: hidden;
  }

  .filter-btn {
    padding: 3px 8px;
    background: #2a2e39;
    color: #d1d4dc;
    border: none;
    border-right: 1px solid #434651;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    transition: background 0.15s;
  }

  .filter-btn:last-child {
    border-right: none;
  }

  .filter-btn:hover {
    background: #363a45;
  }

  .filter-btn.active {
    background: #2962ff;
    color: #ffffff;
  }
</style>
