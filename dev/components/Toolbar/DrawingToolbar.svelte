<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';

  interface DrawingGroup {
    label: string;
    tools: { id: string; name: string }[];
  }

  const DRAWING_GROUPS: DrawingGroup[] = [
    {
      label: 'Lines',
      tools: [
        { id: 'horizontal-line', name: 'Horizontal Line' },
        { id: 'vertical-line', name: 'Vertical Line' },
        { id: 'trendline', name: 'Trendline' },
        { id: 'ray', name: 'Ray' },
        { id: 'arrow', name: 'Arrow' },
        { id: 'crossline', name: 'Crossline' },
      ],
    },
    {
      label: 'Fibonacci',
      tools: [
        { id: 'fibonacci', name: 'Fibonacci Retracement' },
        { id: 'fib-projection', name: 'Fib Projection' },
        { id: 'fib-arc', name: 'Fib Arc' },
        { id: 'fib-fan', name: 'Fib Fan' },
      ],
    },
    {
      label: 'Shapes',
      tools: [
        { id: 'rectangle', name: 'Rectangle' },
        { id: 'ellipse', name: 'Ellipse' },
        { id: 'channel', name: 'Channel' },
        { id: 'pitchfork', name: 'Pitchfork' },
      ],
    },
    {
      label: 'Annotations',
      tools: [
        { id: 'text-annotation', name: 'Text Annotation' },
        { id: 'measurement', name: 'Measurement' },
      ],
    },
  ];

  let open = $state(false);
  let containerEl: HTMLDivElement | undefined;

  let hasActiveTool = $derived(appStore.activeDrawingTool !== null);

  function selectTool(id: string) {
    if (appStore.activeDrawingTool === id) {
      appStore.activeDrawingTool = null;
    } else {
      appStore.activeDrawingTool = id;
    }
    open = false;
  }

  function clearTool() {
    appStore.activeDrawingTool = null;
    open = false;
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside, true);
    } else {
      document.removeEventListener('click', handleClickOutside, true);
    }
    return () => document.removeEventListener('click', handleClickOutside, true);
  });
</script>

<div class="drawing-toolbar" bind:this={containerEl}>
  <button class="trigger" class:active={hasActiveTool} onclick={() => (open = !open)}>
    Draw
  </button>

  {#if open}
    <div class="dropdown">
      <button class="item none" class:active={!hasActiveTool} onclick={clearTool}>
        None
      </button>

      {#each DRAWING_GROUPS as group}
        <div class="group-label">{group.label}</div>
        {#each group.tools as tool}
          <button
            class="item"
            class:active={appStore.activeDrawingTool === tool.id}
            onclick={() => selectTool(tool.id)}
          >
            {tool.name}
          </button>
        {/each}
      {/each}
    </div>
  {/if}
</div>

<style>
  .drawing-toolbar {
    position: relative;
  }

  .trigger {
    background: transparent;
    border: 1px solid transparent;
    color: #758696;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
  }

  .trigger:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #d1d4dc;
  }

  .trigger.active {
    color: #2962ff;
  }

  .dropdown {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    left: 0;
    background: #131722;
    border: 1px solid #1a2332;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    width: 200px;
    max-height: 400px;
    overflow-y: auto;
    padding: 4px 0;
  }

  .group-label {
    padding: 6px 12px 4px;
    font-size: 10px;
    font-weight: 600;
    color: #758696;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .item {
    display: block;
    width: 100%;
    padding: 6px 12px;
    background: transparent;
    border: none;
    color: #d1d4dc;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    text-align: left;
  }

  .item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .item.active {
    color: #2962ff;
  }

  .item.none {
    border-bottom: 1px solid #1a2332;
    margin-bottom: 2px;
  }
</style>
