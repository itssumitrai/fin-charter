<script lang="ts">
  import { searchSymbols } from '../../data/symbols';
  import { appStore } from '../../data/store.svelte.ts';

  let open = $state(false);
  let query = $state('');
  let containerEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined = $state(undefined);

  let filtered = $derived(searchSymbols(query).filter(s => s.symbol !== appStore.symbol));

  function addComparison(sym: string) {
    if (!appStore.comparisonSymbols.includes(sym)) {
      appStore.addComparison(sym);
      appStore.comparisonMode = true;
    }
    query = '';
  }

  function removeComparison(sym: string) {
    appStore.removeComparison(sym);
    if (appStore.comparisonSymbols.length === 0) {
      appStore.comparisonMode = false;
    }
  }

  function toggle() {
    open = !open;
    if (open) setTimeout(() => inputEl?.focus(), 0);
    if (!open) query = '';
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
      query = '';
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

<div class="compare-button" bind:this={containerEl}>
  <button class="trigger" class:active={appStore.comparisonMode} onclick={toggle}>
    Compare
  </button>

  {#if open}
    <div class="dropdown">
      <div class="search-box">
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Add symbol to compare..."
          class="search-input"
        />
      </div>

      {#if appStore.comparisonSymbols.length > 0}
        <div class="active-list">
          {#each appStore.comparisonSymbols as sym}
            <div class="active-item">
              <span class="sym">{sym}</span>
              <button class="remove" onclick={() => removeComparison(sym)}>&#10005;</button>
            </div>
          {/each}
        </div>
      {/if}

      {#if query}
        <div class="results">
          {#each filtered as item}
            <button class="result-item" onclick={() => addComparison(item.symbol)}>
              <span class="sym">{item.symbol}</span>
              <span class="name">{item.name}</span>
            </button>
          {/each}
          {#if filtered.length === 0}
            <div class="no-results">No symbols found</div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .compare-button {
    position: relative;
  }

  .trigger {
    background: transparent;
    border: 1px solid transparent;
    color: #758696;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
  }

  .trigger:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #d1d4dc;
  }

  .trigger.active {
    color: #2962ff;
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
    width: 240px;
    max-height: 320px;
    display: flex;
    flex-direction: column;
  }

  .search-box {
    padding: 8px;
    border-bottom: 1px solid #1a2332;
  }

  .search-input {
    background: #0d0d1a;
    border: 1px solid #1a2332;
    color: #d1d4dc;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
  }

  .search-input:focus {
    border-color: #2962ff;
  }

  .active-list {
    padding: 4px 0;
    border-bottom: 1px solid #1a2332;
  }

  .active-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 12px;
  }

  .active-item .sym {
    color: #2962ff;
    font-weight: 600;
  }

  .remove {
    background: transparent;
    border: none;
    color: #758696;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: inherit;
  }

  .remove:hover {
    color: #ef5350;
    background: rgba(239, 83, 80, 0.1);
  }

  .results {
    overflow-y: auto;
    flex: 1;
  }

  .result-item {
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

  .result-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .result-item .sym {
    font-weight: 600;
    color: #fff;
    min-width: 60px;
  }

  .result-item .name {
    color: #758696;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .no-results {
    padding: 12px;
    color: #758696;
    font-size: 12px;
    text-align: center;
  }
</style>
