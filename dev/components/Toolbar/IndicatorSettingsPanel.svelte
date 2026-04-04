<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';
  import { INDICATOR_SETTINGS, type IndicatorSettingsDef } from '../../data/indicator-settings';
  import Icon from '../Icon.svelte';
  import { mdiClose } from '@mdi/js';

  interface Props {
    indicatorId: string;
    onclose: () => void;
  }

  let { indicatorId, onclose }: Props = $props();

  let def: IndicatorSettingsDef | undefined = $derived(INDICATOR_SETTINGS[indicatorId]);

  // Local editable copies of params and styles
  let localParams = $state<Record<string, number>>({});
  let localStyles = $state<Record<string, string | number>>({});

  // Init from store or defaults
  $effect(() => {
    if (!def) return;
    const saved = appStore.indicatorSettings[indicatorId];
    const p: Record<string, number> = {};
    for (const pd of def.params) {
      p[pd.key] = saved?.params[pd.key] ?? pd.default;
    }
    localParams = p;

    const s: Record<string, string | number> = {};
    for (const sd of def.styles) {
      s[sd.key] = saved?.styles[sd.key] ?? sd.default;
    }
    localStyles = s;
  });

  function apply() {
    appStore.setIndicatorSettings(indicatorId, { ...localParams }, { ...localStyles });
    onclose();
  }

  function reset() {
    if (!def) return;
    const p: Record<string, number> = {};
    for (const pd of def.params) p[pd.key] = pd.default;
    localParams = p;

    const s: Record<string, string | number> = {};
    for (const sd of def.styles) s[sd.key] = sd.default;
    localStyles = s;
  }
</script>

{#if def}
  <div class="settings-panel">
    <div class="header">
      <span class="title">{def.name}</span>
      <button class="close-btn" onclick={onclose} aria-label="Close">
        <Icon path={mdiClose} size={16} />
      </button>
    </div>

    {#if def.params.length > 0}
      <div class="section">
        <div class="section-label">Parameters</div>
        {#each def.params as p}
          <div class="field">
            <label for="param-{p.key}">{p.label}</label>
            <input
              id="param-{p.key}"
              type="number"
              min={p.min}
              max={p.max}
              step={p.step ?? 1}
              bind:value={localParams[p.key]}
              class="num-input"
            />
          </div>
        {/each}
      </div>
    {/if}

    <div class="section">
      <div class="section-label">Style</div>
      {#each def.styles as s}
        <div class="field">
          <label for="style-{s.key}">{s.label}</label>
          {#if s.type === 'color'}
            <div class="color-field">
              <input
                id="style-{s.key}"
                type="color"
                value={String(localStyles[s.key]).startsWith('rgba') ? '#42a5f5' : String(localStyles[s.key])}
                oninput={(e: Event) => { localStyles[s.key] = (e.target as HTMLInputElement).value; }}
                class="color-input"
              />
              <span class="color-preview" style="background:{localStyles[s.key]}"></span>
            </div>
          {:else}
            <select
              id="style-{s.key}"
              bind:value={localStyles[s.key]}
              class="select-input"
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={3}>3px</option>
              <option value={4}>4px</option>
            </select>
          {/if}
        </div>
      {/each}
    </div>

    <div class="actions">
      <button class="btn reset" onclick={reset}>Reset</button>
      <button class="btn apply" onclick={apply}>Apply</button>
    </div>
  </div>
{/if}

<style>
  .settings-panel {
    position: absolute;
    z-index: 30;
    top: calc(100% + 4px);
    left: 0;
    background: #131722;
    border: 1px solid #1a2332;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    width: 280px;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid #1a2332;
  }

  .title {
    font-size: 12px;
    font-weight: 600;
    color: #d1d4dc;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #758696;
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    display: flex;
    align-items: center;
  }

  .close-btn:hover {
    color: #d1d4dc;
    background: rgba(255, 255, 255, 0.06);
  }

  .section {
    padding: 8px 12px;
    border-bottom: 1px solid #1a2332;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #758696;
    margin-bottom: 8px;
  }

  .field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .field:last-child {
    margin-bottom: 0;
  }

  .field label {
    font-size: 11px;
    color: #9ca3af;
  }

  .num-input {
    width: 64px;
    background: #0d0d1a;
    border: 1px solid #1a2332;
    color: #d1d4dc;
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 11px;
    text-align: right;
    font-family: inherit;
    outline: none;
  }

  .num-input:focus {
    border-color: #2962ff;
  }

  .color-field {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .color-input {
    width: 24px;
    height: 20px;
    padding: 0;
    border: 1px solid #1a2332;
    border-radius: 3px;
    cursor: pointer;
    background: transparent;
  }

  .color-preview {
    width: 28px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .select-input {
    background: #0d0d1a;
    border: 1px solid #1a2332;
    color: #d1d4dc;
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-family: inherit;
    outline: none;
    cursor: pointer;
  }

  .select-input:focus {
    border-color: #2962ff;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding: 8px 12px;
  }

  .btn {
    padding: 4px 12px;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }

  .btn.reset {
    background: transparent;
    color: #758696;
    border: 1px solid #1a2332;
  }

  .btn.reset:hover {
    color: #d1d4dc;
    background: rgba(255, 255, 255, 0.04);
  }

  .btn.apply {
    background: #2962ff;
    color: #fff;
  }

  .btn.apply:hover {
    background: #1e50d9;
  }
</style>
