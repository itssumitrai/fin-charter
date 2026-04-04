import { describe, it, expect } from 'vitest';
import { getCurrencyInfo, formatCurrency, CURRENCIES } from '../../src/currency';

describe('getCurrencyInfo', () => {
  it('returns info for USD', () => {
    const info = getCurrencyInfo('USD');
    expect(info.code).toBe('USD');
    expect(info.symbol).toBe('$');
    expect(info.decimals).toBe(2);
  });

  it('returns info for JPY (0 decimals)', () => {
    const info = getCurrencyInfo('JPY');
    expect(info.code).toBe('JPY');
    expect(info.symbol).toBe('¥');
    expect(info.decimals).toBe(0);
  });

  it('returns info for EUR', () => {
    const info = getCurrencyInfo('EUR');
    expect(info.code).toBe('EUR');
    expect(info.symbol).toBe('€');
    expect(info.decimals).toBe(2);
  });

  it('returns info for GBP', () => {
    const info = getCurrencyInfo('GBP');
    expect(info.symbol).toBe('£');
  });

  it('returns info for BTC (8 decimals)', () => {
    const info = getCurrencyInfo('BTC');
    expect(info.decimals).toBe(8);
  });

  it('falls back to code as symbol for unknown currency', () => {
    const info = getCurrencyInfo('XYZ');
    expect(info.code).toBe('XYZ');
    expect(info.symbol).toBe('XYZ');
    expect(info.decimals).toBe(2);
  });
});

describe('formatCurrency', () => {
  it('formats USD price', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats JPY price (0 decimals)', () => {
    const result = formatCurrency(1234, 'JPY');
    expect(result).toMatch(/¥|JPY/);
    expect(result).toMatch(/1,234/);
  });

  it('formats EUR with German locale', () => {
    const result = formatCurrency(1234.56, 'EUR', 'de-DE');
    expect(result).toMatch(/1\.234,56/);
    expect(result).toMatch(/€/);
  });

  it('handles NaN', () => {
    expect(formatCurrency(NaN, 'USD')).toBe('-');
  });
});

describe('CURRENCIES', () => {
  it('has at least 10 currencies defined', () => {
    expect(Object.keys(CURRENCIES).length).toBeGreaterThanOrEqual(10);
  });
});
