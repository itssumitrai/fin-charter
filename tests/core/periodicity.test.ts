import { describe, it, expect } from 'vitest';
import { periodicityToSeconds, periodicityToLabel, Periodicity } from '../../src/core/periodicity';

describe('periodicityToSeconds', () => {
  it('converts seconds', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'second' })).toBe(1);
    expect(periodicityToSeconds({ interval: 30, unit: 'second' })).toBe(30);
  });

  it('converts minutes', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'minute' })).toBe(60);
    expect(periodicityToSeconds({ interval: 5, unit: 'minute' })).toBe(300);
  });

  it('converts hours', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'hour' })).toBe(3600);
    expect(periodicityToSeconds({ interval: 4, unit: 'hour' })).toBe(14400);
  });

  it('converts days', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'day' })).toBe(86400);
    expect(periodicityToSeconds({ interval: 3, unit: 'day' })).toBe(259200);
  });

  it('converts weeks', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'week' })).toBe(604800);
    expect(periodicityToSeconds({ interval: 2, unit: 'week' })).toBe(1209600);
  });

  it('converts months', () => {
    expect(periodicityToSeconds({ interval: 1, unit: 'month' })).toBe(2592000);
    expect(periodicityToSeconds({ interval: 3, unit: 'month' })).toBe(7776000);
  });
});

describe('periodicityToLabel', () => {
  it('produces correct label for 1m', () => {
    expect(periodicityToLabel({ interval: 1, unit: 'minute' })).toBe('1m');
  });

  it('produces correct label for 5m', () => {
    expect(periodicityToLabel({ interval: 5, unit: 'minute' })).toBe('5m');
  });

  it('produces correct label for 1h', () => {
    expect(periodicityToLabel({ interval: 1, unit: 'hour' })).toBe('1h');
  });

  it('produces correct label for 1D', () => {
    expect(periodicityToLabel({ interval: 1, unit: 'day' })).toBe('1D');
  });

  it('produces correct label for 1W', () => {
    expect(periodicityToLabel({ interval: 1, unit: 'week' })).toBe('1W');
  });

  it('produces correct label for 1M', () => {
    expect(periodicityToLabel({ interval: 1, unit: 'month' })).toBe('1M');
  });

  it('produces correct label for seconds', () => {
    expect(periodicityToLabel({ interval: 30, unit: 'second' })).toBe('30s');
  });
});
