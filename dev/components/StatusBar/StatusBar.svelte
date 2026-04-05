<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';
  import { getMarketForExchange } from '@itssumitrai/fin-charter/market';
  import { getSymbolInfo } from '../../data/symbols';
  import { VERSION } from '@itssumitrai/fin-charter';
  import Icon from '../Icon.svelte';
  import { mdiChevronRight } from '@mdi/js';

  let info = $derived(getSymbolInfo(appStore.symbol));
  let market = $derived(info ? getMarketForExchange(info.exchange) : undefined);
</script>

<div class="status-bar">
  <span class="status-item">
    <span class="dot"></span>
    {market?.name ?? appStore.meta?.exchange ?? '—'}
  </span>
  <span class="sep">·</span>
  <span class="status-item">{appStore.meta?.currency ?? '—'}</span>
  <span class="sep">·</span>
  <span class="status-item">{appStore.resolvedTimezone}</span>
  <span class="spacer"></span>
  {#if !appStore.sidebarOpen}
    <button class="sidebar-toggle" onclick={() => { appStore.sidebarOpen = true; }}>
      Watchlist <Icon path={mdiChevronRight} size={12} />
    </button>
  {/if}
  <span class="version">fin-charter v{VERSION}</span>
</div>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 12px;
    background: #131722;
    border-top: 1px solid #1a2332;
    font-size: 11px;
    color: #758696;
    flex-shrink: 0;
    font-family: inherit;
  }

  .status-item {
    display: flex;
    align-items: center;
    white-space: nowrap;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #758696;
    display: inline-block;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .sep {
    color: #1a2332;
    user-select: none;
  }

  .spacer {
    flex: 1;
  }

  .sidebar-toggle {
    display: flex;
    align-items: center;
    gap: 2px;
    background: transparent;
    border: none;
    color: #758696;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 6px;
    font-family: inherit;
    border-radius: 2px;
    white-space: nowrap;
  }

  .sidebar-toggle:hover {
    color: #d1d4dc;
    background: rgba(255, 255, 255, 0.06);
  }

  .version {
    color: #434651;
    white-space: nowrap;
    font-size: 10px;
  }
</style>
