<script lang="ts">
  import type { SeriesType } from '../core/types';
  import type { IndicatorType } from '../api/options';

  interface ToolbarSection {
    drawingTools?: boolean;
    indicators?: boolean;
    chartType?: boolean;
    undoRedo?: boolean;
    fullscreen?: boolean;
  }

  interface Props {
    /** Which toolbar sections to show (default: all). */
    sections?: ToolbarSection;
    /** Currently active drawing tool type (null if none). */
    activeDrawingTool?: string | null;
    /** Current chart series type. */
    chartType?: SeriesType;
    /** Whether undo is available. */
    canUndo?: boolean;
    /** Whether redo is available. */
    canRedo?: boolean;
    /** Whether the chart is in fullscreen mode. */
    isFullscreen?: boolean;
    /** Custom buttons to append to the toolbar. */
    customButtons?: Array<{ label: string; icon?: string; onclick: () => void }>;
    /** Callbacks */
    onDrawingToolSelect?: (type: string | null) => void;
    onIndicatorAdd?: (type: IndicatorType) => void;
    onChartTypeChange?: (type: SeriesType) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onFullscreenToggle?: () => void;
  }

  let {
    sections = { drawingTools: true, indicators: true, chartType: true, undoRedo: true, fullscreen: true },
    activeDrawingTool = null,
    chartType = 'candlestick' as SeriesType,
    canUndo = false,
    canRedo = false,
    isFullscreen = false,
    customButtons = [],
    onDrawingToolSelect,
    onIndicatorAdd,
    onChartTypeChange,
    onUndo,
    onRedo,
    onFullscreenToggle,
  }: Props = $props();

  const drawingTools = [
    { type: 'trendline', label: 'Trendline', icon: '╱' },
    { type: 'horizontal-line', label: 'Horizontal Line', icon: '─' },
    { type: 'vertical-line', label: 'Vertical Line', icon: '│' },
    { type: 'rectangle', label: 'Rectangle', icon: '▭' },
    { type: 'fibonacci', label: 'Fibonacci', icon: 'Fib' },
    { type: 'channel', label: 'Channel', icon: '⫽' },
    { type: 'ray', label: 'Ray', icon: '→' },
    { type: 'text-annotation', label: 'Text', icon: 'T' },
    { type: 'measurement', label: 'Measure', icon: '📐' },
  ];

  const chartTypes: Array<{ type: SeriesType; label: string }> = [
    { type: 'candlestick', label: 'Candlestick' },
    { type: 'bar', label: 'Bar (OHLC)' },
    { type: 'line', label: 'Line' },
    { type: 'area', label: 'Area' },
    { type: 'hollow-candle', label: 'Hollow Candle' },
    { type: 'heikin-ashi', label: 'Heikin-Ashi' },
    { type: 'baseline', label: 'Baseline' },
  ];

  const indicatorTypes: Array<{ type: IndicatorType; label: string }> = [
    { type: 'sma', label: 'SMA' },
    { type: 'ema', label: 'EMA' },
    { type: 'rsi', label: 'RSI' },
    { type: 'macd', label: 'MACD' },
    { type: 'bollinger', label: 'Bollinger Bands' },
    { type: 'vwap', label: 'VWAP' },
    { type: 'stochastic', label: 'Stochastic' },
    { type: 'atr', label: 'ATR' },
    { type: 'adx', label: 'ADX' },
    { type: 'ichimoku', label: 'Ichimoku' },
    { type: 'supertrend', label: 'Supertrend' },
    { type: 'obv', label: 'OBV' },
  ];

  let showIndicatorDropdown = $state(false);
  let showChartTypeDropdown = $state(false);
  let indicatorFilter = $state('');

  let filteredIndicators = $derived(
    indicatorFilter
      ? indicatorTypes.filter((i) => i.label.toLowerCase().includes(indicatorFilter.toLowerCase()))
      : indicatorTypes,
  );

  function handleDrawingTool(type: string) {
    const newTool = activeDrawingTool === type ? null : type;
    onDrawingToolSelect?.(newTool);
  }

  function handleIndicatorSelect(type: IndicatorType) {
    onIndicatorAdd?.(type);
    showIndicatorDropdown = false;
    indicatorFilter = '';
  }

  function handleChartTypeSelect(type: SeriesType) {
    onChartTypeChange?.(type);
    showChartTypeDropdown = false;
  }
</script>

<div class="fc-toolbar" role="toolbar" aria-label="Chart toolbar">
  {#if sections.chartType}
    <div class="fc-toolbar-section">
      <button
        class="fc-toolbar-btn fc-dropdown-trigger"
        onclick={() => { showChartTypeDropdown = !showChartTypeDropdown; showIndicatorDropdown = false; }}
        aria-expanded={showChartTypeDropdown}
        aria-haspopup="true"
        title="Chart type"
      >
        {chartTypes.find((ct) => ct.type === chartType)?.label ?? 'Chart'}
        <span class="fc-dropdown-arrow">▾</span>
      </button>
      {#if showChartTypeDropdown}
        <div class="fc-dropdown" role="listbox">
          {#each chartTypes as ct}
            <button
              class="fc-dropdown-item"
              class:active={ct.type === chartType}
              onclick={() => handleChartTypeSelect(ct.type)}
              role="option"
              aria-selected={ct.type === chartType}
            >{ct.label}</button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if sections.drawingTools}
    <div class="fc-toolbar-section fc-toolbar-divider">
      {#each drawingTools as tool}
        <button
          class="fc-toolbar-btn"
          class:active={activeDrawingTool === tool.type}
          onclick={() => handleDrawingTool(tool.type)}
          title={tool.label}
        >{tool.icon}</button>
      {/each}
    </div>
  {/if}

  {#if sections.indicators}
    <div class="fc-toolbar-section fc-toolbar-divider">
      <button
        class="fc-toolbar-btn fc-dropdown-trigger"
        onclick={() => { showIndicatorDropdown = !showIndicatorDropdown; showChartTypeDropdown = false; }}
        aria-expanded={showIndicatorDropdown}
        aria-haspopup="true"
        title="Add indicator"
      >
        Indicators
        <span class="fc-dropdown-arrow">▾</span>
      </button>
      {#if showIndicatorDropdown}
        <div class="fc-dropdown fc-indicator-dropdown" role="listbox">
          <input
            type="text"
            class="fc-indicator-search"
            placeholder="Search..."
            bind:value={indicatorFilter}
          />
          {#each filteredIndicators as ind}
            <button
              class="fc-dropdown-item"
              onclick={() => handleIndicatorSelect(ind.type)}
              role="option"
            >{ind.label}</button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if sections.undoRedo}
    <div class="fc-toolbar-section fc-toolbar-divider">
      <button
        class="fc-toolbar-btn"
        disabled={!canUndo}
        onclick={() => onUndo?.()}
        title="Undo (Ctrl+Z)"
      >↩</button>
      <button
        class="fc-toolbar-btn"
        disabled={!canRedo}
        onclick={() => onRedo?.()}
        title="Redo (Ctrl+Y)"
      >↪</button>
    </div>
  {/if}

  {#if sections.fullscreen}
    <div class="fc-toolbar-section fc-toolbar-divider">
      <button
        class="fc-toolbar-btn"
        onclick={() => onFullscreenToggle?.()}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >{isFullscreen ? '⊡' : '⊞'}</button>
    </div>
  {/if}

  {#if customButtons.length > 0}
    <div class="fc-toolbar-section fc-toolbar-divider">
      {#each customButtons as btn}
        <button
          class="fc-toolbar-btn"
          onclick={btn.onclick}
          title={btn.label}
        >{btn.icon ?? btn.label}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fc-toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
    background: var(--fc-toolbar-bg, #1e1e2e);
    border-bottom: 1px solid var(--fc-toolbar-border, rgba(255,255,255,0.1));
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    user-select: none;
    flex-wrap: wrap;
    position: relative;
  }

  .fc-toolbar-section {
    display: flex;
    align-items: center;
    gap: 1px;
    position: relative;
  }

  .fc-toolbar-divider {
    padding-left: 8px;
    margin-left: 6px;
    border-left: 1px solid var(--fc-toolbar-border, rgba(255,255,255,0.1));
  }

  .fc-toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--fc-toolbar-text, #a0a0b0);
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }

  .fc-toolbar-btn:hover:not(:disabled) {
    background: var(--fc-toolbar-hover, rgba(255,255,255,0.08));
    color: var(--fc-toolbar-text-hover, #e0e0f0);
  }

  .fc-toolbar-btn.active {
    background: var(--fc-toolbar-active, rgba(33,150,243,0.2));
    color: var(--fc-toolbar-active-text, #2196F3);
  }

  .fc-toolbar-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .fc-dropdown-trigger {
    gap: 4px;
  }

  .fc-dropdown-arrow {
    font-size: 8px;
    opacity: 0.6;
  }

  .fc-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    min-width: 160px;
    max-height: 300px;
    overflow-y: auto;
    background: var(--fc-dropdown-bg, #252540);
    border: 1px solid var(--fc-toolbar-border, rgba(255,255,255,0.1));
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    padding: 4px;
    margin-top: 2px;
  }

  .fc-dropdown-item {
    display: block;
    width: 100%;
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--fc-toolbar-text, #a0a0b0);
    cursor: pointer;
    text-align: left;
    font-size: 12px;
  }

  .fc-dropdown-item:hover {
    background: var(--fc-toolbar-hover, rgba(255,255,255,0.08));
    color: var(--fc-toolbar-text-hover, #e0e0f0);
  }

  .fc-dropdown-item.active {
    color: var(--fc-toolbar-active-text, #2196F3);
  }

  .fc-indicator-search {
    width: calc(100% - 8px);
    padding: 6px 8px;
    margin: 2px 4px 4px;
    border: 1px solid var(--fc-toolbar-border, rgba(255,255,255,0.15));
    border-radius: 4px;
    background: var(--fc-dropdown-bg, #1e1e2e);
    color: var(--fc-toolbar-text, #a0a0b0);
    font-size: 12px;
    outline: none;
  }

  .fc-indicator-search:focus {
    border-color: var(--fc-toolbar-active-text, #2196F3);
  }

  @media (max-width: 600px) {
    .fc-toolbar {
      overflow-x: auto;
      flex-wrap: nowrap;
    }
  }
</style>
