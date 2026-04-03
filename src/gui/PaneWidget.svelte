<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    width: number;
    height: number;
    pixelRatio?: number;
    children?: Snippet;
  }

  let { width, height, pixelRatio = devicePixelRatio, children }: Props = $props();

  let bgCanvas: HTMLCanvasElement | undefined = $state();
  let mainCanvas: HTMLCanvasElement | undefined = $state();
  let overlayCanvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    const pw = Math.round(width * pixelRatio);
    const ph = Math.round(height * pixelRatio);

    if (bgCanvas) {
      bgCanvas.width = pw;
      bgCanvas.height = ph;
    }
    if (mainCanvas) {
      mainCanvas.width = pw;
      mainCanvas.height = ph;
    }
    if (overlayCanvas) {
      overlayCanvas.width = pw;
      overlayCanvas.height = ph;
    }
  });

  export function getContexts(): { bg: CanvasRenderingContext2D; main: CanvasRenderingContext2D; overlay: CanvasRenderingContext2D } {
    if (!bgCanvas || !mainCanvas || !overlayCanvas) {
      throw new Error('PaneWidget: canvases not yet mounted');
    }
    const bg = bgCanvas.getContext('2d');
    const main = mainCanvas.getContext('2d');
    const overlay = overlayCanvas.getContext('2d');
    if (!bg || !main || !overlay) {
      throw new Error('PaneWidget: failed to get 2d context');
    }
    return { bg, main, overlay };
  }
</script>

<div
  class="pane-widget"
  style:width="{width}px"
  style:height="{height}px"
>
  <canvas
    bind:this={bgCanvas}
    class="pane-canvas"
    style:z-index="1"
    style:width="{width}px"
    style:height="{height}px"
  ></canvas>
  <canvas
    bind:this={mainCanvas}
    class="pane-canvas"
    style:z-index="2"
    style:width="{width}px"
    style:height="{height}px"
  ></canvas>
  <canvas
    bind:this={overlayCanvas}
    class="pane-canvas"
    style:z-index="3"
    style:width="{width}px"
    style:height="{height}px"
  ></canvas>
  {@render children?.()}
</div>

<style>
  .pane-widget {
    position: relative;
    overflow: hidden;
  }

  .pane-canvas {
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
