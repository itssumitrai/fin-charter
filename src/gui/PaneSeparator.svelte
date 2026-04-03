<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ resize: { deltaY: number } }>();

  let isDragging = $state(false);
  let isHovered = $state(false);
  let lastY = $state(0);
  let el: HTMLDivElement | undefined = $state();

  function onPointerDown(e: PointerEvent) {
    if (!el) return;
    isDragging = true;
    lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const deltaY = e.clientY - lastY;
    lastY = e.clientY;
    dispatch('resize', { deltaY });
  }

  function onPointerUp(e: PointerEvent) {
    if (!el) return;
    isDragging = false;
    el.releasePointerCapture(e.pointerId);
  }

  function onPointerEnter() {
    isHovered = true;
  }

  function onPointerLeave() {
    isHovered = false;
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={el}
  class="pane-separator"
  class:hovered={isHovered || isDragging}
  role="separator"
  aria-orientation="horizontal"
  tabindex="0"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointerenter={onPointerEnter}
  onpointerleave={onPointerLeave}
></div>

<style>
  .pane-separator {
    width: 100%;
    height: 4px;
    cursor: row-resize;
    background-color: var(--fc-border-color, #2a2a3e);
    transition: background-color 0.1s ease;
    flex-shrink: 0;
    user-select: none;
    touch-action: none;
  }

  .pane-separator.hovered {
    background-color: var(--fc-accent-color, #4c8bf5);
  }
</style>
