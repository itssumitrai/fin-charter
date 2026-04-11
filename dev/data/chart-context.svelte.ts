/**
 * Chart context — a reactive configuration store for the AdvancedChart component.
 *
 * External consumers can import `chartContext` and update it to configure the
 * chart before or after mounting. The AdvancedChart component reads from this
 * context and reacts to changes.
 *
 * Usage:
 *   import { chartContext, updateChartContext } from './data/chart-context';
 *
 *   // Set initial config before mounting
 *   updateChartContext({ symbol: 'MSFT', theme: 'light' });
 *
 *   // Update at runtime — chart reacts automatically
 *   updateChartContext({ symbol: 'GOOGL' });
 */

import type { Periodicity } from '@itssumitrai/fin-charter';
import type { ChartTypeLabel } from './store.svelte.ts';

// ─── Context shape ─────────────────────────────────────────────────────

export interface ChartContextConfig {
  /** Initial symbol to display. */
  symbol: string;

  /** Chart type to render. */
  chartType: ChartTypeLabel;

  /** Initial periodicity/interval. */
  periodicity: Periodicity;

  /** Timezone identifier or 'exchange' to use the exchange's native timezone. */
  timezone: string;

  /** Color theme. */
  theme: 'dark' | 'light';

  /** Whether the sidebar (watchlist) is open by default. */
  sidebarOpen: boolean;

  /** Features to enable/disable. */
  enabledFeatures: {
    indicators: boolean;
    drawings: boolean;
    comparison: boolean;
    fullscreen: boolean;
    screenshot: boolean;
  };

  /** Layout background and text colors (overrides theme defaults when set). */
  layout: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
  };

  /** Grid line colors. */
  grid: {
    vertLinesColor?: string;
    horzLinesColor?: string;
  };
}

// ─── Defaults ──────────────────────────────────────────────────────────

const DARK_LAYOUT = {
  backgroundColor: '#0d0d1a',
  textColor: '#d1d4dc',
  fontSize: 11,
};

const LIGHT_LAYOUT = {
  backgroundColor: '#ffffff',
  textColor: '#191919',
  fontSize: 11,
};

export const DEFAULT_CHART_CONTEXT: ChartContextConfig = {
  symbol: 'AAPL',
  chartType: 'Candlestick',
  periodicity: { interval: 1, unit: 'day' },
  timezone: 'exchange',
  theme: 'dark',
  sidebarOpen: true,
  enabledFeatures: {
    indicators: true,
    drawings: true,
    comparison: true,
    fullscreen: true,
    screenshot: true,
  },
  layout: { ...DARK_LAYOUT },
  grid: {
    vertLinesColor: 'rgba(255,255,255,0.04)',
    horzLinesColor: 'rgba(255,255,255,0.04)',
  },
};

// ─── Reactive state (Svelte 5 runes) ──────────────────────────────────

let _context = $state<ChartContextConfig>({ ...DEFAULT_CHART_CONTEXT });

/**
 * Reactive chart context. Read properties directly; the AdvancedChart
 * component uses `$effect` to react to changes.
 */
let _chartApi: import('@itssumitrai/fin-charter').IChartApi | null = $state(null);

export const chartContext = {
  get config() { return _context; },

  /** The active chart API instance (set by AdvancedChart after creation). */
  get chartApi() { return _chartApi; },
  set chartApi(api: import('@itssumitrai/fin-charter').IChartApi | null) { _chartApi = api; },

  get symbol() { return _context.symbol; },
  get chartType() { return _context.chartType; },
  get periodicity() { return _context.periodicity; },
  get timezone() { return _context.timezone; },
  get theme() { return _context.theme; },
  get sidebarOpen() { return _context.sidebarOpen; },
  get enabledFeatures() { return _context.enabledFeatures; },
  get layout() { return _context.layout; },
  get grid() { return _context.grid; },

  /** Derived layout colors based on theme + overrides. */
  get resolvedLayout() {
    const base = _context.theme === 'dark' ? DARK_LAYOUT : LIGHT_LAYOUT;
    return {
      ...base,
      ..._context.layout,
    };
  },

  /** Derived grid colors based on theme + overrides. */
  get resolvedGrid() {
    const darkGrid = { vertLinesColor: 'rgba(255,255,255,0.04)', horzLinesColor: 'rgba(255,255,255,0.04)' };
    const lightGrid = { vertLinesColor: 'rgba(0,0,0,0.06)', horzLinesColor: 'rgba(0,0,0,0.06)' };
    const base = _context.theme === 'dark' ? darkGrid : lightGrid;
    return {
      ...base,
      ..._context.grid,
    };
  },
};

/**
 * Update the chart context with a partial config. Merges shallowly at
 * the top level; nested objects (layout, grid, enabledFeatures) are
 * merged one level deep.
 */
export function updateChartContext(partial: Partial<ChartContextConfig>): void {
  _context = {
    ..._context,
    ...partial,
    enabledFeatures: {
      ..._context.enabledFeatures,
      ...(partial.enabledFeatures ?? {}),
    },
    layout: {
      ..._context.layout,
      ...(partial.layout ?? {}),
    },
    grid: {
      ..._context.grid,
      ...(partial.grid ?? {}),
    },
  };
}

/**
 * Reset the chart context to defaults.
 */
export function resetChartContext(): void {
  _context = { ...DEFAULT_CHART_CONTEXT };
}
