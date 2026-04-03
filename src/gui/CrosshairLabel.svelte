<script lang="ts">
  interface Props {
    x: number;
    y: number;
    priceText: string;
    visible: boolean;
  }

  let { x, y, priceText, visible }: Props = $props();
</script>

{#if visible}
  <div
    class="crosshair-label"
    style:left="{x}px"
    style:top="{y}px"
  >
    {priceText}
  </div>
{/if}

<style>
  .crosshair-label {
    position: absolute;
    transform: translateY(-50%);
    z-index: 10;
    background-color: var(--fc-crosshair-bg, #4c525e);
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }
</style>
