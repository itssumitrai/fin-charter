<script lang="ts">
  import { appStore } from '../../data/store.svelte.ts';
  import Icon from '../Icon.svelte';
  import { mdiChartBellCurveCumulative, mdiCog, mdiCheck } from '@mdi/js';
  import IndicatorSettingsPanel from './IndicatorSettingsPanel.svelte';

  const INDICATOR_LIST = [
    { id: 'sma', name: 'SMA', category: 'Overlay' },
    { id: 'ema', name: 'EMA', category: 'Overlay' },
    { id: 'bollinger', name: 'Bollinger Bands', category: 'Overlay' },
    { id: 'vwap', name: 'VWAP', category: 'Overlay' },
    { id: 'ichimoku', name: 'Ichimoku Cloud', category: 'Overlay' },
    { id: 'parabolic-sar', name: 'Parabolic SAR', category: 'Overlay' },
    { id: 'keltner', name: 'Keltner Channel', category: 'Overlay' },
    { id: 'donchian', name: 'Donchian Channel', category: 'Overlay' },
    { id: 'supertrend', name: 'Supertrend', category: 'Overlay' },
    { id: 'vwma', name: 'VWMA', category: 'Overlay' },
    { id: 'linear-regression', name: 'Linear Regression', category: 'Overlay' },
    { id: 'rsi', name: 'RSI', category: 'Oscillator' },
    { id: 'macd', name: 'MACD', category: 'Oscillator' },
    { id: 'stochastic', name: 'Stochastic', category: 'Oscillator' },
    { id: 'atr', name: 'ATR', category: 'Volatility' },
    { id: 'adx', name: 'ADX', category: 'Trend' },
    { id: 'obv', name: 'OBV', category: 'Volume' },
    { id: 'williams-r', name: 'Williams %R', category: 'Oscillator' },
    { id: 'cci', name: 'CCI', category: 'Oscillator' },
    { id: 'aroon', name: 'Aroon', category: 'Trend' },
    { id: 'awesome-oscillator', name: 'Awesome Oscillator', category: 'Oscillator' },
    { id: 'chaikin-mf', name: 'Chaikin MF', category: 'Volume' },
    { id: 'coppock', name: 'Coppock', category: 'Oscillator' },
    { id: 'elder-force', name: 'Elder Force', category: 'Volume' },
    { id: 'trix', name: 'TRIX', category: 'Oscillator' },
    { id: 'choppiness', name: 'Choppiness', category: 'Volatility' },
    { id: 'mfi', name: 'MFI', category: 'Volume' },
    { id: 'roc', name: 'ROC', category: 'Oscillator' },
    { id: 'pivot-points', name: 'Pivot Points', category: 'Overlay' },
  ] as const;

  let open = $state(false);
  let query = $state('');
  let settingsFor = $state<string | null>(null);
  let containerEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined = $state(undefined);

  let filtered = $derived(() => {
    if (!query) return INDICATOR_LIST;
    const q = query.toLowerCase();
    return INDICATOR_LIST.filter(
      i => i.name.toLowerCase().includes(q) || i.id.includes(q) || i.category.toLowerCase().includes(q)
    );
  });

  let indicatorCount = $derived(appStore.activeIndicators.length);

  function toggleIndicator(id: string) {
    if (appStore.activeIndicators.includes(id)) {
      appStore.removeIndicator(id);
      if (settingsFor === id) settingsFor = null;
    } else {
      appStore.addIndicator(id);
    }
  }

  function openSettings(e: MouseEvent, id: string) {
    e.stopPropagation();
    settingsFor = settingsFor === id ? null : id;
  }

  function toggle() {
    open = !open;
    if (open) setTimeout(() => inputEl?.focus(), 0);
    if (!open) {
      query = '';
      settingsFor = null;
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
      query = '';
      settingsFor = null;
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

<div class="indicator-dialog" bind:this={containerEl}>
  <button class="trigger" onclick={toggle}>
    <Icon path={mdiChartBellCurveCumulative} size={16} />
    Indicators
    {#if indicatorCount > 0}
      <span class="badge">{indicatorCount}</span>
    {/if}
  </button>

  {#if open}
    <div class="dropdown">
      <div class="search-box">
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Search indicators..."
          class="search-input"
        />
      </div>
      <div class="list">
        {#each filtered() as ind}
          <div class="item-row" class:active={appStore.activeIndicators.includes(ind.id)}>
            <button
              class="item"
              class:active={appStore.activeIndicators.includes(ind.id)}
              onclick={() => toggleIndicator(ind.id)}
            >
              <span class="name">{ind.name}</span>
              <span class="category">{ind.category}</span>
              {#if appStore.activeIndicators.includes(ind.id)}
                <span class="check"><Icon path={mdiCheck} size={14} /></span>
              {/if}
            </button>
            {#if appStore.activeIndicators.includes(ind.id)}
              <button
                class="gear-btn"
                title="Settings"
                onclick={(e: MouseEvent) => openSettings(e, ind.id)}
              >
                <Icon path={mdiCog} size={14} />
              </button>
            {/if}
          </div>
        {/each}
        {#if filtered().length === 0}
          <div class="no-results">No indicators found</div>
        {/if}
      </div>
    </div>
  {/if}

  {#if settingsFor}
    <IndicatorSettingsPanel
      indicatorId={settingsFor}
      onclose={() => { settingsFor = null; }}
    />
  {/if}
</div>

<style>
  .indicator-dialog {
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

  .badge {
    background: #2962ff;
    color: #fff;
    font-size: 10px;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
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
    width: 300px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .search-box {
    padding: 8px;
    border-bottom: 1px solid #1a2332;
  }

  .search-input {
    background: #0d0d1a;
    border: 1px solid #1a2332;
    color: #d1d4dc;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
  }

  .search-input:focus {
    border-color: #2962ff;
  }

  .list {
    overflow-y: auto;
    flex: 1;
    padding: 4px 0;
  }

  .item-row {
    display: flex;
    align-items: center;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    padding: 8px 12px;
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

  .name {
    flex: 1;
  }

  .category {
    color: #758696;
    font-size: 11px;
  }

  .check {
    color: #2962ff;
    display: flex;
    align-items: center;
  }

  .gear-btn {
    background: transparent;
    border: none;
    color: #758696;
    cursor: pointer;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    border-radius: 3px;
  }

  .gear-btn:hover {
    color: #d1d4dc;
    background: rgba(255, 255, 255, 0.06);
  }

  .no-results {
    padding: 12px;
    color: #758696;
    font-size: 12px;
    text-align: center;
  }
</style>
