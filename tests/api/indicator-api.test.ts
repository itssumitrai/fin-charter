import { describe, it, expect, vi } from 'vitest';
import { IndicatorApi } from '@/api/indicator-api';
import type { IndicatorOptions, IndicatorType } from '@/api/options';

function makeOptions(overrides: Partial<IndicatorOptions> = {}): IndicatorOptions {
  return {
    source: {} as IndicatorOptions['source'],
    ...overrides,
  };
}

describe('IndicatorApi', () => {
  // ── Construction ──────────────────────────────────────────────────────────

  it('stores id, type, paneId from constructor', () => {
    const api = new IndicatorApi('ind-1', 'sma', makeOptions(), 'pane-0', vi.fn());
    expect(api.id).toBe('ind-1');
    expect(api.indicatorType()).toBe('sma');
    expect(api.paneId()).toBe('pane-0');
  });

  it('defaults visible to true when not specified', () => {
    const api = new IndicatorApi('ind-1', 'ema', makeOptions(), 'pane-0', vi.fn());
    expect(api.isVisible()).toBe(true);
  });

  it('respects visible: false in options', () => {
    const api = new IndicatorApi('ind-1', 'rsi', makeOptions({ visible: false }), 'pane-0', vi.fn());
    expect(api.isVisible()).toBe(false);
  });

  it('returns a copy of options (not the original reference)', () => {
    const opts = makeOptions({ color: '#ff0000' });
    const api = new IndicatorApi('ind-1', 'sma', opts, 'pane-0', vi.fn());
    const returned = api.options();
    returned.color = '#00ff00';
    expect(api.options().color).toBe('#ff0000');
  });

  // ── Auto-generated Labels ─────────────────────────────────────────────────

  it('auto-generates SMA label with default period', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('SMA 20');
  });

  it('auto-generates SMA label with custom period', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions({ params: { period: 50 } }), 'p', vi.fn());
    expect(api.label()).toBe('SMA 50');
  });

  it('auto-generates EMA label', () => {
    const api = new IndicatorApi('id', 'ema', makeOptions({ params: { period: 12 } }), 'p', vi.fn());
    expect(api.label()).toBe('EMA 12');
  });

  it('auto-generates RSI label with default period', () => {
    const api = new IndicatorApi('id', 'rsi', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('RSI 14');
  });

  it('auto-generates MACD label with defaults', () => {
    const api = new IndicatorApi('id', 'macd', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('MACD 12,26,9');
  });

  it('auto-generates MACD label with custom params', () => {
    const api = new IndicatorApi('id', 'macd', makeOptions({
      params: { fastPeriod: 8, slowPeriod: 21, signalPeriod: 5 },
    }), 'p', vi.fn());
    expect(api.label()).toBe('MACD 8,21,5');
  });

  it('auto-generates Bollinger Bands label', () => {
    const api = new IndicatorApi('id', 'bollinger', makeOptions({ params: { period: 20, stdDev: 2 } }), 'p', vi.fn());
    expect(api.label()).toBe('BB 20,2');
  });

  it('auto-generates VWAP label (no params)', () => {
    const api = new IndicatorApi('id', 'vwap', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('VWAP');
  });

  it('auto-generates Stochastic label', () => {
    const api = new IndicatorApi('id', 'stochastic', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('Stoch 14,3');
  });

  it('auto-generates ATR label', () => {
    const api = new IndicatorApi('id', 'atr', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('ATR 14');
  });

  it('auto-generates ADX label', () => {
    const api = new IndicatorApi('id', 'adx', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('ADX 14');
  });

  it('auto-generates OBV label (no params)', () => {
    const api = new IndicatorApi('id', 'obv', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('OBV');
  });

  it('auto-generates Williams %R label', () => {
    const api = new IndicatorApi('id', 'williams-r', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('W%R 14');
  });

  it('uses uppercase type name for unknown indicator types', () => {
    const api = new IndicatorApi('id', 'supertrend' as IndicatorType, makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('SUPERTREND');
  });

  it('uses explicit label from options instead of auto-label', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions({ label: 'My Custom SMA' }), 'p', vi.fn());
    expect(api.label()).toBe('My Custom SMA');
  });

  // ── applyOptions ──────────────────────────────────────────────────────────

  it('applyOptions merges new options', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions({ color: '#ff0000' }), 'p', vi.fn());
    api.applyOptions({ lineWidth: 3 });
    expect(api.options().lineWidth).toBe(3);
    expect(api.options().color).toBe('#ff0000');
  });

  it('applyOptions updates visibility', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions(), 'p', vi.fn());
    expect(api.isVisible()).toBe(true);
    api.applyOptions({ visible: false });
    expect(api.isVisible()).toBe(false);
    api.applyOptions({ visible: true });
    expect(api.isVisible()).toBe(true);
  });

  it('applyOptions updates label', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions(), 'p', vi.fn());
    expect(api.label()).toBe('SMA 20');
    api.applyOptions({ label: 'Custom' });
    expect(api.label()).toBe('Custom');
  });

  it('applyOptions with label: undefined does not change label (key not recognized as set)', () => {
    const api = new IndicatorApi('id', 'rsi', makeOptions({ label: 'Custom' }), 'p', vi.fn());
    expect(api.label()).toBe('Custom');
    // Passing label: undefined means options.label !== undefined is false,
    // so the label branch is not entered.
    api.applyOptions({ label: undefined });
    expect(api.label()).toBe('Custom');
  });

  it('applyOptions with label: null reverts to auto-label', () => {
    const api = new IndicatorApi('id', 'rsi', makeOptions({ label: 'Custom' }), 'p', vi.fn());
    expect(api.label()).toBe('Custom');
    api.applyOptions({ label: null as unknown as string });
    // label is not undefined, so the branch runs; label ?? autoLabel => autoLabel
    expect(api.label()).toBe('RSI 14');
  });

  // ── remove() ──────────────────────────────────────────────────────────────

  it('remove() calls the removeCallback', () => {
    const removeCb = vi.fn();
    const api = new IndicatorApi('id', 'sma', makeOptions(), 'p', removeCb);
    api.remove();
    expect(removeCb).toHaveBeenCalledOnce();
  });

  // ── Public fields ─────────────────────────────────────────────────────────

  it('internalSeries defaults to empty array', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions(), 'p', vi.fn());
    expect(api.internalSeries).toEqual([]);
  });

  it('autoCreatedPaneId defaults to null', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions(), 'p', vi.fn());
    expect(api.autoCreatedPaneId).toBeNull();
  });

  it('_dataChangedCallback defaults to null', () => {
    const api = new IndicatorApi('id', 'sma', makeOptions(), 'p', vi.fn());
    expect(api._dataChangedCallback).toBeNull();
  });
});
