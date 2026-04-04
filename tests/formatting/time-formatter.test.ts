import { describe, it, expect } from 'vitest';
import { createTimeFormatter } from '../../src/formatting/time-formatter';

describe('createTimeFormatter', () => {
  const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;

  describe('intraday tick marks', () => {
    it('formats time as HH:MM in UTC', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'time')).toBe('15:30');
    });

    it('formats time in New York timezone', () => {
      const fmt = createTimeFormatter({ timezone: 'America/New_York' });
      expect(fmt(ts, 'time')).toBe('10:30');
    });

    it('formats time in Tokyo timezone', () => {
      const fmt = createTimeFormatter({ timezone: 'Asia/Tokyo' });
      expect(fmt(ts, 'time')).toBe('00:30');
    });
  });

  describe('daily tick marks', () => {
    it('formats day as "Jan 15" in en-US', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'day')).toBe('Jan 15');
    });
  });

  describe('month tick marks', () => {
    it('formats as "Jan 2024"', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'month')).toBe('Jan 2024');
    });
  });

  describe('year tick marks', () => {
    it('formats as "2024"', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'year')).toBe('2024');
    });
  });

  describe('crosshair (full datetime)', () => {
    it('formats full datetime for intraday', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      const result = fmt(ts, 'time', true);
      expect(result).toMatch(/Jan 15/);
      expect(result).toMatch(/15:30/);
    });

    it('formats full date for daily', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      const result = fmt(ts, 'day', true);
      expect(result).toMatch(/Jan 15, 2024/);
    });
  });
});
