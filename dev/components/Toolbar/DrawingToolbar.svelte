<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';
  import Icon from '../Icon.svelte';
  import {
    mdiPencilRuler,
    mdiMinus,
    mdiArrowTopRight,
    mdiVectorLine,
    mdiRayStartArrow,
    mdiArrowRight,
    mdiCrosshairsGps,
    mdiWaves,
    mdiChartSankey,
    mdiCircleOutline,
    mdiSetCenter,
    mdiRectangleOutline,
    mdiEllipseOutline,
    mdiViewParallel,
    mdiPitchfork,
    mdiTextBox,
    mdiRuler,
    mdiClose,
  } from '@mdi/js';

  interface DrawingGroup {
    label: string;
    tools: { id: string; name: string; icon: string }[];
  }

  const DRAWING_GROUPS: DrawingGroup[] = [
    {
      label: 'Lines',
      tools: [
        { id: 'horizontal-line', name: 'Horizontal Line', icon: mdiMinus },
        { id: 'vertical-line', name: 'Vertical Line', icon: mdiArrowTopRight },
        { id: 'trendline', name: 'Trendline', icon: mdiVectorLine },
        { id: 'ray', name: 'Ray', icon: mdiRayStartArrow },
        { id: 'arrow', name: 'Arrow', icon: mdiArrowRight },
        { id: 'crossline', name: 'Crossline', icon: mdiCrosshairsGps },
      ],
    },
    {
      label: 'Fibonacci',
      tools: [
        { id: 'fibonacci', name: 'Fibonacci Retracement', icon: mdiWaves },
        { id: 'fib-projection', name: 'Fib Projection', icon: mdiChartSankey },
        { id: 'fib-arc', name: 'Fib Arc', icon: mdiCircleOutline },
        { id: 'fib-fan', name: 'Fib Fan', icon: mdiSetCenter },
      ],
    },
    {
      label: 'Shapes',
      tools: [
        { id: 'rectangle', name: 'Rectangle', icon: mdiRectangleOutline },
        { id: 'ellipse', name: 'Ellipse', icon: mdiEllipseOutline },
        { id: 'channel', name: 'Channel', icon: mdiViewParallel },
        { id: 'pitchfork', name: 'Pitchfork', icon: mdiPitchfork },
      ],
    },
    {
      label: 'Annotations',
      tools: [
        { id: 'text-annotation', name: 'Text Annotation', icon: mdiTextBox },
        { id: 'measurement', name: 'Measurement', icon: mdiRuler },
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
    <Icon path={mdiPencilRuler} size={16} />
    Draw
  </button>

  {#if open}
    <div class="dropdown">
      <button class="item none" class:active={!hasActiveTool} onclick={clearTool}>
        <span class="tool-icon"><Icon path={mdiClose} size={16} /></span>
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
            <span class="tool-icon"><Icon path={tool.icon} size={16} /></span>
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
    display: flex;
    align-items: center;
    gap: 4px;
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
    width: 220px;
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
    display: flex;
    align-items: center;
    gap: 8px;
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

  .tool-icon {
    width: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
</style>
