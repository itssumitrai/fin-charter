<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';
  import Watchlist from './Watchlist.svelte';
</script>

{#if appStore.sidebarOpen}
  <div class="sidebar">
    <div class="sidebar-header">
      <span class="title">Watchlist</span>
      <button class="collapse-btn" onclick={() => { appStore.sidebarOpen = false; }}>◀</button>
    </div>
    <Watchlist />
  </div>
{/if}

<style>
  .sidebar {
    width: 220px;
    background: #0d1117;
    border-left: 1px solid #1a2332;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 8px 12px;
    border-bottom: 1px solid #1a2332;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .title {
    font-size: 12px;
    font-weight: 600;
    color: #d1d4dc;
    font-family: inherit;
  }

  .collapse-btn {
    background: transparent;
    border: none;
    color: #758696;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
    line-height: 1;
    border-radius: 2px;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .collapse-btn:hover {
    color: #d1d4dc;
    background: rgba(255, 255, 255, 0.06);
  }
</style>
