import { describe, it, expect } from 'vitest';
import '@/full';
import { getRegisteredSeriesTypes, getRegisteredIndicatorTypes } from '@/core/registry';

describe('full import', () => {
  it('registers all series and indicators', () => {
    expect(getRegisteredSeriesTypes().length).toBeGreaterThanOrEqual(20);
    expect(getRegisteredIndicatorTypes().length).toBeGreaterThanOrEqual(29);
  });

  it('registers candlestick series', () => {
    expect(getRegisteredSeriesTypes()).toContain('candlestick');
  });

  it('registers line series', () => {
    expect(getRegisteredSeriesTypes()).toContain('line');
  });

  it('registers area series', () => {
    expect(getRegisteredSeriesTypes()).toContain('area');
  });

  it('registers bar series', () => {
    expect(getRegisteredSeriesTypes()).toContain('bar');
  });

  it('registers sma indicator', () => {
    expect(getRegisteredIndicatorTypes()).toContain('sma');
  });

  it('registers ema indicator', () => {
    expect(getRegisteredIndicatorTypes()).toContain('ema');
  });

  it('registers rsi indicator', () => {
    expect(getRegisteredIndicatorTypes()).toContain('rsi');
  });

  it('registers macd indicator', () => {
    expect(getRegisteredIndicatorTypes()).toContain('macd');
  });

  it('registers bollinger indicator', () => {
    expect(getRegisteredIndicatorTypes()).toContain('bollinger');
  });

  it('registers vwap indicator', () => {
    expect(getRegisteredIndicatorTypes()).toContain('vwap');
  });

  it('registers all 29 unique indicator types', () => {
    const types = getRegisteredIndicatorTypes();
    const unique = new Set(types);
    expect(unique.size).toBeGreaterThanOrEqual(29);
  });
});
