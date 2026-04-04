<script lang="ts">
  import { SYMBOLS } from '../../data/symbols';
  import { appStore } from '../../data/store.svelte.ts';
  import WatchlistItem from './WatchlistItem.svelte';
</script>

<div class="watchlist">
  {#each SYMBOLS as sym}
    <WatchlistItem
      symbol={sym.symbol}
      name={sym.name}
      active={appStore.symbol === sym.symbol}
      onclick={() => { appStore.symbol = sym.symbol; }}
    />
  {/each}
</div>

<style>
  .watchlist {
    overflow-y: auto;
    flex: 1;
  }

  .watchlist::-webkit-scrollbar {
    width: 4px;
  }

  .watchlist::-webkit-scrollbar-track {
    background: transparent;
  }

  .watchlist::-webkit-scrollbar-thumb {
    background: #2a2e39;
    border-radius: 2px;
  }

  .watchlist::-webkit-scrollbar-thumb:hover {
    background: #434651;
  }
</style>
