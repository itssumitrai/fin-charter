<script lang="ts">
  import { searchSymbols } from '../../data/symbols';
  import { appStore } from '../../data/store.svelte.ts';

  let open = $state(false);
  let query = $state('');
  let filtered = $derived(searchSymbols(query));
  let inputEl: HTMLInputElement | undefined = $state(undefined);
  let containerEl: HTMLDivElement | undefined;

  function select(sym: string) {
    appStore.symbol = sym;
    open = false;
    query = '';
  }

  function toggle() {
    open = !open;
    if (open) setTimeout(() => inputEl?.focus(), 0);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
      query = '';
    }
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

<div class="symbol-search" bind:this={containerEl}>
  <button class="trigger" onclick={toggle}>
    {appStore.symbol}
  </button>

  {#if open}
    <div class="dropdown" onkeydown={handleKeydown}>
      <div class="search-box">
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Search symbol..."
          class="search-input"
        />
      </div>
      <div class="results">
        {#each filtered as item}
          <button class="result-item" onclick={() => select(item.symbol)}>
            <span class="sym">{item.symbol}</span>
            <span class="name">{item.name}</span>
            <span class="exchange">{item.exchange}</span>
          </button>
        {/each}
        {#if filtered.length === 0}
          <div class="no-results">No symbols found</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .symbol-search {
    position: relative;
  }

  .trigger {
    padding: 4px 10px;
    background: #1a2332;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #fff;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
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
    width: 260px;
    max-height: 320px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
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

  .results {
    overflow-y: auto;
    flex: 1;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
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

  .sym {
    font-weight: 600;
    color: #fff;
    min-width: 60px;
  }

  .name {
    color: #758696;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exchange {
    color: #758696;
    font-size: 11px;
  }

  .no-results {
    padding: 12px;
    color: #758696;
    font-size: 12px;
    text-align: center;
  }
</style>
