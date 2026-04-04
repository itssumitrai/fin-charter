import { describe, it, expect } from 'vitest';
import { validateChartState, CHART_STATE_VERSION, type ChartState } from '@/core/chart-state';

function makeValidState(overrides: Partial<Record<string, unknown>> = {}): unknown {
  return {
    version: CHART_STATE_VERSION,
    options: {},
    timeScale: { barSpacing: 6, rightOffset: 0 },
    series: [],
    indicators: [],
    panes: [],
    drawings: [],
    ...overrides,
  };
}

describe('CHART_STATE_VERSION', () => {
  it('is a number', () => {
    expect(typeof CHART_STATE_VERSION).toBe('number');
  });

  it('is 1', () => {
    expect(CHART_STATE_VERSION).toBe(1);
  });
});

describe('validateChartState', () => {
  it('accepts a valid state', () => {
    const state = makeValidState();
    expect(validateChartState(state)).toBe(true);
  });

  it('accepts a valid state with optional fields', () => {
    const state = makeValidState({
      comparisonMode: false,
      visibleRange: { from: 1000, to: 2000 },
      sessionFilter: 'regular',
    });
    expect(validateChartState(state)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateChartState(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateChartState(undefined)).toBe(false);
  });

  it('rejects a non-object (string)', () => {
    expect(validateChartState('not an object')).toBe(false);
  });

  it('rejects a non-object (number)', () => {
    expect(validateChartState(42)).toBe(false);
  });

  it('rejects wrong version (0)', () => {
    const state = makeValidState({ version: 0 });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects wrong version (2)', () => {
    const state = makeValidState({ version: 2 });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects wrong version (string)', () => {
    const state = makeValidState({ version: '1' });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects missing series array', () => {
    const state = makeValidState({ series: undefined });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects series as non-array object', () => {
    const state = makeValidState({ series: {} });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects series as string', () => {
    const state = makeValidState({ series: 'not an array' });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects missing timeScale', () => {
    const state = makeValidState({ timeScale: undefined });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects timeScale as non-object (string)', () => {
    const state = makeValidState({ timeScale: 'invalid' });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects timeScale as null', () => {
    const state = makeValidState({ timeScale: null });
    expect(validateChartState(state)).toBe(false);
  });

  it('rejects empty object (no version)', () => {
    expect(validateChartState({})).toBe(false);
  });

  it('narrows the type to ChartState when valid', () => {
    const state = makeValidState({
      series: [{ id: 'series-0', type: 'candlestick', options: {} }],
      panes: [{ id: 'main', height: 300 }],
    });
    if (validateChartState(state)) {
      // TypeScript narrows to ChartState — access typed fields
      const typed: ChartState = state;
      expect(typed.version).toBe(CHART_STATE_VERSION);
      expect(typed.series).toHaveLength(1);
      expect(typed.panes).toHaveLength(1);
    } else {
      throw new Error('Expected state to be valid');
    }
  });
});
