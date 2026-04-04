<script lang="ts">
  import { appStore, PERIODICITIES } from '../../data/store.svelte.ts';
</script>

<div class="intervals">
  {#each PERIODICITIES as p}
    <button
      class:active={appStore.periodicityLabel === p.label}
      onclick={() => appStore.setPeriodicity(p.label, p.value)}
    >{p.label}</button>
  {/each}
</div>

<style>
  .intervals {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  button {
    background: transparent;
    border: 1px solid transparent;
    color: #758696;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
  }

  button:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #d1d4dc;
  }

  button.active {
    color: #2962ff;
  }
</style>
