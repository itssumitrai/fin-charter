import type { DeepPartial } from './types';
import type { ChartOptions, IndicatorType } from '../api/options';
import type { SeriesType } from './types';
import type { Periodicity } from './periodicity';
import type { MarketSession } from './market-session';
import type { SerializedDrawing } from '../drawings/base';

export const CHART_STATE_VERSION = 1;

export interface ChartState {
  version: number;
  options: DeepPartial<ChartOptions>;
  periodicity?: Periodicity;
  comparisonMode?: boolean;
  timeScale: { barSpacing: number; rightOffset: number };
  series: Array<{ id: string; type: SeriesType; options: Record<string, unknown> }>;
  indicators: Array<{ type: IndicatorType; sourceSeriesId: string; params: Record<string, number>; color?: string }>;
  panes: Array<{ id: string; height: number }>;
  drawings: SerializedDrawing[];
  marketSessions?: MarketSession[];
  sessionFilter?: string;
  visibleRange?: { from: number; to: number };
}

export function validateChartState(state: unknown): state is ChartState {
  if (!state || typeof state !== 'object') return false;
  const s = state as Record<string, unknown>;
  if (s.version !== CHART_STATE_VERSION) return false;
  if (!Array.isArray(s.series)) return false;
  if (!s.timeScale || typeof s.timeScale !== 'object') return false;
  return true;
}
