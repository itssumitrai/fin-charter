<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  import type { Snippet } from 'svelte';

  interface Props {
    container: HTMLElement;
    onResize?: (w: number, h: number) => void;
    children?: Snippet<[{ width: number; height: number }]>;
  }

  let { container, onResize, children }: Props = $props();

  let width = $state(0);
  let height = $state(0);
  let ro: ResizeObserver | undefined;

  onMount(() => {
    ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        width = Math.round(w);
        height = Math.round(h);
        onResize?.(width, height);
      }
    });
    ro.observe(container);

    // Read initial size
    const rect = container.getBoundingClientRect();
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    onResize?.(width, height);
  });

  onDestroy(() => {
    ro?.disconnect();
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="chart-widget"
  style:width="{width}px"
  style:height="{height}px"
  role="application"
  tabindex="0"
>
  {@render children?.({ width, height })}
</div>

<style>
  .chart-widget {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    outline: none;
    user-select: none;
  }
</style>
