<script lang="ts">
  import { appStore, TIMEZONE_OPTIONS } from '../../data/store.svelte.ts';
  import Icon from '../Icon.svelte';
  import { mdiEarth } from '@mdi/js';

  let open = $state(false);
  let containerEl: HTMLDivElement | undefined;

  let currentLabel = $derived(
    TIMEZONE_OPTIONS.find(t => t.value === appStore.timezone)?.label ?? 'UTC'
  );

  function select(value: string) {
    appStore.timezone = value;
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

<div class="timezone-selector" bind:this={containerEl}>
  <button class="trigger" onclick={() => (open = !open)}>
    <Icon path={mdiEarth} size={14} />
    {currentLabel}
  </button>

  {#if open}
    <div class="dropdown">
      {#each TIMEZONE_OPTIONS as tz}
        <button
          class="option"
          class:active={appStore.timezone === tz.value}
          onclick={() => select(tz.value)}
        >
          <span class="label">{tz.label}</span>
          <span class="value">{tz.value === 'exchange' ? '' : tz.value}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .timezone-selector {
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

  .dropdown {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    right: 0;
    background: #131722;
    border: 1px solid #1a2332;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    min-width: 200px;
    padding: 4px 0;
  }

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: #d1d4dc;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    text-align: left;
  }

  .option:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .option.active {
    color: #2962ff;
  }

  .value {
    color: #758696;
    font-size: 11px;
  }
</style>
