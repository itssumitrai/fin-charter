<script lang="ts">
  interface Props {
    symbol: string;
    name: string;
    active: boolean;
    onclick: () => void;
  }

  let { symbol, name, active, onclick }: Props = $props();
</script>

<div
  class="watchlist-item"
  class:active
  role="button"
  tabindex="0"
  {onclick}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onclick(); }}
>
  <div class="left">
    <span class="symbol">{symbol}</span>
    <span class="name">{name}</span>
  </div>
</div>

<style>
  .watchlist-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-left: 2px solid transparent;
    font-family: inherit;
    user-select: none;
  }

  .watchlist-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .watchlist-item.active {
    border-left-color: #2962ff;
    background: #131722;
  }

  .left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .symbol {
    font-size: 12px;
    font-weight: 600;
    color: #d1d4dc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name {
    font-size: 10px;
    color: #758696;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
