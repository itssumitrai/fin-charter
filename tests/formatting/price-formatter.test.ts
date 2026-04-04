import { describe, it, expect } from 'vitest';
import { createPriceFormatter } from '../../src/formatting/price-formatter';

describe('createPriceFormatter', () => {
  it('formats with default locale (en-US) and 2 decimals', () => {
    const fmt = createPriceFormatter();
    expect(fmt(1234.56)).toBe('1,234.56');
  });

  it('formats with 0 decimals', () => {
    const fmt = createPriceFormatter({ decimals: 0 });
    expect(fmt(1234.56)).toBe('1,235');
  });

  it('formats with 4 decimals (forex)', () => {
    const fmt = createPriceFormatter({ decimals: 4 });
    expect(fmt(1.2345)).toBe('1.2345');
  });

  it('formats with German locale', () => {
    const fmt = createPriceFormatter({ locale: 'de-DE' });
    expect(fmt(1234.56)).toMatch(/1\.234,56/);
  });

  it('formats negative numbers', () => {
    const fmt = createPriceFormatter();
    const result = fmt(-42.5);
    expect(result).toContain('42.50');
  });

  it('formats zero', () => {
    const fmt = createPriceFormatter();
    expect(fmt(0)).toBe('0.00');
  });

  it('handles NaN gracefully', () => {
    const fmt = createPriceFormatter();
    expect(fmt(NaN)).toBe('-');
  });

  it('handles Infinity gracefully', () => {
    const fmt = createPriceFormatter();
    expect(fmt(Infinity)).toBe('-');
  });

  it('auto-detects decimals based on price magnitude', () => {
    const fmt = createPriceFormatter({ decimals: 'auto' });
    expect(fmt(1500.12)).toBe('1,500.12');
    expect(fmt(0.001234)).toBe('0.001234');
  });
});
