<script lang="ts">
  interface TimeLabel {
    x: number;
    text: string;
  }

  interface CrosshairLabel {
    x: number;
    text: string;
  }

  interface Props {
    labels: TimeLabel[];
    height?: number;
    crosshairLabel?: CrosshairLabel | null;
  }

  let { labels, height = 28, crosshairLabel = null }: Props = $props();
</script>

<div
  class="time-axis"
  style:height="{height}px"
>
  {#each labels as label (label.x)}
    <span
      class="time-label"
      style:left="{label.x}px"
    >
      {label.text}
    </span>
  {/each}

  {#if crosshairLabel}
    <span
      class="crosshair-label"
      style:left="{crosshairLabel.x}px"
    >
      {crosshairLabel.text}
    </span>
  {/if}
</div>

<style>
  .time-axis {
    position: relative;
    overflow: hidden;
    border-top: 1px solid var(--fc-border-color, #2a2a3e);
    background: transparent;
    pointer-events: none;
  }

  .time-label {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    color: var(--fc-text-color, #999);
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }

  .crosshair-label {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    color: #fff;
    background-color: var(--fc-crosshair-bg, #4c525e);
    white-space: nowrap;
    padding: 1px 4px;
    border-radius: 2px;
    pointer-events: none;
    user-select: none;
  }
</style>
