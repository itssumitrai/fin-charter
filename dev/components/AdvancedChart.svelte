<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createChart, US_EQUITY_SESSIONS } from '@itssumitrai/fin-charter';
  import type { IChartApi, ISeriesApi, SeriesType, IndicatorType } from '@itssumitrai/fin-charter';
  import { fetchBars, fetchMoreBars, clearFetchCache } from '../data/yahoo-finance';
  import { appStore, CHART_TYPE_TO_SERIES } from '../data/store.svelte.ts';
  import type { ChartTypeLabel } from '../data/store.svelte.ts';
  import { chartContext } from '../data/chart-context.svelte.ts';
  import { stylesToColorMap } from '../data/indicator-settings';
  import Toolbar from './Toolbar/Toolbar.svelte';
  import Sidebar from './Sidebar/Sidebar.svelte';
  import StatusBar from './StatusBar/StatusBar.svelte';

  let containerEl: HTMLDivElement | undefined = $state(undefined);
  let chart: IChartApi | undefined = $state(undefined);
  let mainSeries: ISeriesApi<SeriesType> | undefined = $state(undefined);
  let comparisonSeries: Map<string, ISeriesApi<SeriesType>> = new Map();
  let comparisonBars: Map<string, import('@itssumitrai/fin-charter').Bar[]> = new Map();
  let comparisonExhausted: Set<string> = new Set();
  let indicatorApis: Map<string, ReturnType<IChartApi['addIndicator']>> = new Map();

  // Track previous values to detect changes
  let prevSymbol = '';
  let prevPeriodicity = '';
  let prevChartType: ChartTypeLabel = 'Candlestick';
  let loadRequestId = 0;
  let isFetchingHistory = false;
  let historyExhausted = false;
  let firstTradeDate = 0;
  let allBars: import('@itssumitrai/fin-charter').Bar[] = [];

  function createSeries(c: IChartApi, type: ChartTypeLabel): ISeriesApi<SeriesType> {
    const seriesType: SeriesType = CHART_TYPE_TO_SERIES[type] ?? 'candlestick';
    return c.addSeries({
      type: seriesType,
      ...(seriesType === 'line' ? { color: '#2962ff' } : {}),
    });
  }

  async function loadData() {
    if (!chart || !mainSeries) return;
    const reqId = ++loadRequestId;
    appStore.loading = true;
    historyExhausted = false;
    clearFetchCache();
    try {
      const { bars, meta } = await fetchBars(appStore.symbol, appStore.periodicity);
      // Guard against stale responses from concurrent requests
      if (reqId !== loadRequestId) return;
      appStore.meta = meta;
      firstTradeDate = meta.firstTradeDate;

      chart.applyOptions({
        timezone: appStore.resolvedTimezone,
        currency: meta.currency,
        symbol: appStore.symbol,
      });

      allBars = bars;
      mainSeries.setData(bars);
      chart.timeScale().scrollToEnd();
      // Comparisons are loaded by the comparison $effect — no need to duplicate here
    } catch (err) {
      if (reqId !== loadRequestId) return;
      console.error('Failed to load data:', err);
    } finally {
      if (reqId === loadRequestId) appStore.loading = false;
    }
  }

  async function loadComparison(sym: string) {
    if (!chart || comparisonSeries.has(sym)) return;
    const reqId = loadRequestId;
    try {
      const { bars } = await fetchBars(sym, appStore.periodicity);
      // Guard: skip if symbol changed, or comparison was removed, or duplicate arrived
      if (reqId !== loadRequestId || !appStore.comparisonSymbols.includes(sym) || comparisonSeries.has(sym)) return;
      const colors = ['#2196F3', '#ff9800', '#e91e63', '#4caf50', '#9c27b0'];
      const colorIdx = comparisonSeries.size % colors.length;
      const s = chart!.addSeries({ type: 'line', color: colors[colorIdx], lineWidth: 2, label: sym });
      s.setData(bars);
      comparisonSeries.set(sym, s);
      comparisonBars.set(sym, bars);
      chart!.setComparisonMode(true);
    } catch (err) {
      console.error(`Failed to load comparison ${sym}:`, err);
    }
  }

  function removeComparison(sym: string) {
    const s = comparisonSeries.get(sym);
    if (s && chart) {
      chart.removeSeries(s);
      comparisonSeries.delete(sym);
      comparisonBars.delete(sym);
      comparisonExhausted.delete(sym);
      if (comparisonSeries.size === 0) {
        chart.setComparisonMode(false);
      }
    }
  }

  function syncIndicators() {
    if (!chart || !mainSeries) return;
    const desired = new Set(appStore.activeIndicators);

    // Remove indicators no longer active
    for (const [id, api] of indicatorApis) {
      if (!desired.has(id)) {
        chart.removeIndicator(api);
        indicatorApis.delete(id);
      }
    }

    // Add new indicators
    for (const id of desired) {
      if (!indicatorApis.has(id)) {
        try {
          const settings = appStore.indicatorSettings[id];
          const colors = settings ? stylesToColorMap(id, settings.styles) : undefined;
          const api = chart.addIndicator(id as IndicatorType, {
            source: mainSeries,
            ...(settings?.params && Object.keys(settings.params).length > 0 ? { params: settings.params } : {}),
            ...(colors ? { colors } : {}),
            ...(settings?.styles.lineWidth ? { lineWidth: Number(settings.styles.lineWidth) } : {}),
            ...(settings?.styles.histUpColor ? { histogramUpColor: String(settings.styles.histUpColor) } : {}),
            ...(settings?.styles.histDownColor ? { histogramDownColor: String(settings.styles.histDownColor) } : {}),
            ...(settings?.styles.color ? { color: String(settings.styles.color) } : {}),
          });
          indicatorApis.set(id, api);
        } catch (err) {
          console.warn(`Failed to add indicator ${id}:`, err);
        }
      }
    }
  }

  function initChart() {
    if (!containerEl) return;
    chart?.remove();
    comparisonSeries.clear();
    comparisonBars.clear();
    comparisonExhausted.clear();
    indicatorApis.clear();

    // Sync chartContext into appStore on init
    appStore.symbol = chartContext.symbol;
    appStore.chartType = chartContext.chartType;
    appStore.sidebarOpen = chartContext.sidebarOpen;
    appStore.timezone = chartContext.timezone;

    const layout = chartContext.resolvedLayout;
    const grid = chartContext.resolvedGrid;

    const c = createChart(containerEl, {
      autoSize: true,
      symbol: chartContext.symbol,
      layout: {
        backgroundColor: layout.backgroundColor,
        textColor: layout.textColor,
        fontSize: layout.fontSize,
      },
      grid: {
        vertLinesColor: grid.vertLinesColor,
        horzLinesColor: grid.horzLinesColor,
      },
      crosshair: {
        vertLineColor: 'rgba(150,160,180,0.5)',
        horzLineColor: 'rgba(150,160,180,0.5)',
        vertLineDash: [4, 4],
        horzLineDash: [4, 4],
        vertLineWidth: 1,
        horzLineWidth: 1,
      },
    });

    chart = c;
    chartContext.chartApi = c;
    mainSeries = createSeries(c, appStore.chartType);
    prevChartType = appStore.chartType;
    prevSymbol = appStore.symbol;
    prevPeriodicity = appStore.periodicityLabel;

    // Set market sessions for intraday periodicities
    const isIntraday = appStore.periodicity.unit === 'minute' || appStore.periodicity.unit === 'hour';
    if (isIntraday) {
      c.setMarketSessions(US_EQUITY_SESSIONS);
    }

    // Auto-load historical data when scrolling to the left edge
    c.subscribeVisibleRangeChange(async (range) => {
      if (!range || isFetchingHistory || historyExhausted || allBars.length === 0 || !mainSeries) return;
      const firstBarTime = allBars[0].time;
      if (range.from <= firstBarTime) {
        isFetchingHistory = true;
        try {
          const firstBarPrice = allBars[0].open;
          const result = await fetchMoreBars(appStore.symbol, appStore.periodicity, firstBarTime, firstTradeDate, firstBarPrice);
          // Guard: only apply if symbol/periodicity haven't changed while fetching
          if (result.bars.length > 0 && mainSeries && allBars.length > 0 && allBars[0].time === firstBarTime) {
            allBars = [...result.bars, ...allBars];
            mainSeries.setData(allBars);
          }
          if (!result.moreAvailable) {
            // Only mark exhausted when we actually know there's no more history
            // (API returned empty, or we've reached firstTradeDate / interval limit)
            const reachedStart = firstTradeDate > 0 && (
              allBars[0].time <= firstTradeDate ||
              (result.bars.length > 0 && result.bars[0].time <= firstTradeDate)
            );
            if (reachedStart || result.bars.length === 0) {
              historyExhausted = true;
            }
          }
          // Also fetch more data for comparison symbols in parallel to keep them in sync
          const compReqId = loadRequestId;
          if (comparisonSeries.size > 0) {
            await Promise.all(
              Array.from(comparisonSeries.entries()).map(async ([sym, series]) => {
                if (comparisonExhausted.has(sym)) return;
                const symBars = comparisonBars.get(sym);
                if (!symBars || symBars.length === 0) return;
                const symFirstTime = symBars[0].time;
                if (range.from <= symFirstTime) {
                  try {
                    const symResult = await fetchMoreBars(sym, appStore.periodicity, symFirstTime, 0, symBars[0].open);
                    // Guard: skip if symbol/periodicity changed or comparison was removed
                    if (compReqId !== loadRequestId || !comparisonSeries.has(sym)) return;
                    if (symResult.bars.length > 0) {
                      const updatedBars = [...symResult.bars, ...symBars];
                      comparisonBars.set(sym, updatedBars);
                      series.setData(updatedBars);
                    }
                    if (!symResult.moreAvailable) {
                      comparisonExhausted.add(sym);
                    }
                  } catch (err) {
                    console.warn(`Failed to load historical comparison data for ${sym}:`, err);
                  }
                }
              })
            );
          }
        } catch (err) {
          console.error('Failed to load historical data:', err);
        } finally {
          isFetchingHistory = false;
        }
      }
    });

    loadData();
  }

  // React to symbol changes
  $effect(() => {
    const sym = appStore.symbol;
    if (sym !== prevSymbol && chart) {
      prevSymbol = sym;
      // Clear comparisons on symbol change (both local map and store)
      for (const [, api] of comparisonSeries) {
        chart.removeSeries(api);
      }
      comparisonSeries.clear();
      comparisonBars.clear();
      comparisonExhausted.clear();
      appStore.comparisonMode = false;
      // Clear store comparison symbols
      for (const s of [...appStore.comparisonSymbols]) {
        appStore.removeComparison(s);
      }
      loadData();
    }
  });

  // React to periodicity changes
  $effect(() => {
    const label = appStore.periodicityLabel;
    if (label !== prevPeriodicity && chart) {
      prevPeriodicity = label;
      // Update market sessions based on periodicity type
      const isIntraday = appStore.periodicity.unit === 'minute' || appStore.periodicity.unit === 'hour';
      if (isIntraday) {
        chart.setMarketSessions(US_EQUITY_SESSIONS);
      } else {
        chart.setMarketSessions([]);
        appStore.sessionFilter = 'all';
      }
      // Need to reload data at new periodicity
      // Also reload comparisons
      for (const [s, api] of comparisonSeries) {
        chart!.removeSeries(api);
      }
      comparisonSeries.clear();
      comparisonBars.clear();
      comparisonExhausted.clear();
      loadData();
    }
  });

  // React to chart type changes
  $effect(() => {
    const type = appStore.chartType;
    if (type !== prevChartType && chart) {
      prevChartType = type;
      // Remove old series and indicators, recreate
      for (const [, api] of indicatorApis) {
        chart.removeIndicator(api);
      }
      indicatorApis.clear();
      if (mainSeries) chart.removeSeries(mainSeries);
      mainSeries = createSeries(chart, type);
      loadData();
    }
  });

  // React to indicator changes (including settings updates)
  $effect(() => {
    // Access both to track changes
    const _indicators = appStore.activeIndicators;
    const _settings = appStore.indicatorSettings;

    // Remove all existing indicators and re-add with current settings
    if (chart) {
      for (const [id, api] of indicatorApis) {
        chart.removeIndicator(api);
      }
      indicatorApis.clear();
    }
    syncIndicators();
  });

  // React to drawing tool changes
  $effect(() => {
    const tool = appStore.activeDrawingTool;
    chart?.setActiveDrawingTool(tool);
  });

  // React to timezone changes
  $effect(() => {
    const tz = appStore.resolvedTimezone;
    chart?.applyOptions({ timezone: tz });
  });

  // React to chartContext theme/layout changes at runtime
  $effect(() => {
    const layout = chartContext.resolvedLayout;
    const grid = chartContext.resolvedGrid;
    chart?.applyOptions({
      layout: {
        backgroundColor: layout.backgroundColor,
        textColor: layout.textColor,
        fontSize: layout.fontSize,
      },
      grid: {
        vertLinesColor: grid.vertLinesColor,
        horzLinesColor: grid.horzLinesColor,
      },
    });
  });

  // React to comparison additions
  $effect(() => {
    const syms = appStore.comparisonSymbols;
    // Add new comparisons
    for (const sym of syms) {
      if (!comparisonSeries.has(sym)) {
        loadComparison(sym);
      }
    }
    // Remove stale comparisons
    for (const [sym] of comparisonSeries) {
      if (!syms.includes(sym)) {
        removeComparison(sym);
      }
    }
  });

  // React to session filter changes
  $effect(() => {
    const filter = appStore.sessionFilter;
    chart?.setSessionFilter(filter);
  });

  function handleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function handleScreenshot() {
    if (!chart) return;
    const canvas = chart.takeScreenshot();
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${appStore.symbol}-chart.png`;
    link.click();
  }

  onMount(() => {
    initChart();
  });

  onDestroy(() => {
    // Invalidate in-flight requests so they don't touch removed chart
    ++loadRequestId;
    chart?.remove();
    chartContext.chartApi = null;
    chart = undefined;
    mainSeries = undefined;
  });
</script>

<div class="advanced-chart">
  <Toolbar onfullscreen={handleFullscreen} onscreenshot={handleScreenshot} onsettings={() => {}} />

  <div class="main-area">
    <div class="chart-area" bind:this={containerEl}>
      {#if appStore.loading}
        <div class="loading-overlay">
          <div class="spinner"></div>
        </div>
      {/if}
    </div>
    <Sidebar />
  </div>

  <StatusBar />
</div>

<style>
  .advanced-chart {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #0d0d1a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #d1d4dc;
    overflow: hidden;
  }

  .main-area {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .chart-area {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(13, 13, 26, 0.7);
    z-index: 10;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #1a2332;
    border-top-color: #2962ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
