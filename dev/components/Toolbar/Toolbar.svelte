<script lang="ts">
  import SymbolSearch from './SymbolSearch.svelte';
  import IntervalSelector from './IntervalSelector.svelte';
  import ChartTypeSelector from './ChartTypeSelector.svelte';
  import IndicatorDialog from './IndicatorDialog.svelte';
  import DrawingToolbar from './DrawingToolbar.svelte';
  import CompareButton from './CompareButton.svelte';
  import SessionFilter from './SessionFilter.svelte';
  import TimezoneSelector from './TimezoneSelector.svelte';
  import UtilityButtons from './UtilityButtons.svelte';

  interface Props {
    onfullscreen?: () => void;
    onscreenshot?: () => void;
    onsettings?: () => void;
  }

  let { onfullscreen, onscreenshot, onsettings }: Props = $props();
</script>

<div class="toolbar">
  <SymbolSearch />
  <IntervalSelector />
  <div class="sep"></div>
  <ChartTypeSelector />
  <IndicatorDialog />
  <DrawingToolbar />
  <CompareButton />
  <SessionFilter />
  <div class="spacer"></div>
  <TimezoneSelector />
  <UtilityButtons {onfullscreen} {onscreenshot} {onsettings} />
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #131722;
    border-bottom: 1px solid #1a2332;
    flex-shrink: 0;
  }

  .sep {
    width: 1px;
    height: 20px;
    background: #1a2332;
  }

  .spacer {
    flex: 1;
  }
</style>
