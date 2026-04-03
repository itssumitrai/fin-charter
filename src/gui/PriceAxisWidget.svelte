<script lang="ts">
  interface PriceLabel {
    price: number;
    y: number;
    text: string;
  }

  interface CurrentPrice {
    y: number;
    text: string;
    color: string;
  }

  interface Props {
    labels: PriceLabel[];
    width?: number;
    height: number;
    currentPrice?: CurrentPrice | null;
  }

  let { labels, width = 60, height, currentPrice = null }: Props = $props();
</script>

<div
  class="price-axis"
  style:width="{width}px"
  style:height="{height}px"
>
  {#each labels as label (label.price)}
    <span
      class="price-label"
      style:top="{label.y}px"
    >
      {label.text}
    </span>
  {/each}

  {#if currentPrice}
    <span
      class="current-price"
      style:top="{currentPrice.y}px"
      style:background-color={currentPrice.color}
    >
      {currentPrice.text}
    </span>
  {/if}
</div>

<style>
  .price-axis {
    position: relative;
    overflow: hidden;
    border-left: 1px solid var(--fc-border-color, #2a2a3e);
    background: transparent;
    pointer-events: none;
  }

  .price-label {
    position: absolute;
    right: 4px;
    transform: translateY(-50%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    color: var(--fc-text-color, #999);
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }

  .current-price {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    color: #fff;
    white-space: nowrap;
    padding: 1px 4px;
    border-radius: 2px;
    pointer-events: none;
    user-select: none;
  }
</style>
