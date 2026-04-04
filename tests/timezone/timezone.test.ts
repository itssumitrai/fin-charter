import { describe, it, expect } from 'vitest';
import {
  formatInTimezone,
  getTimezoneOffsetMinutes,
  timestampToDateParts,
} from '../../src/timezone';

describe('timestampToDateParts', () => {
  it('converts UTC timestamp to New York time parts', () => {
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const parts = timestampToDateParts(ts, 'America/New_York');
    expect(parts.hour).toBe(10);
    expect(parts.minute).toBe(30);
    expect(parts.month).toBe(1);
    expect(parts.day).toBe(15);
    expect(parts.year).toBe(2024);
  });

  it('converts UTC timestamp to Tokyo time parts', () => {
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const parts = timestampToDateParts(ts, 'Asia/Tokyo');
    expect(parts.hour).toBe(0);
    expect(parts.minute).toBe(30);
    expect(parts.day).toBe(16);
  });

  it('handles DST transition (US spring forward)', () => {
    const ts = Date.UTC(2024, 2, 10, 7, 0, 0) / 1000;
    const parts = timestampToDateParts(ts, 'America/New_York');
    expect(parts.hour).toBe(3);
  });

  it('defaults to UTC when timezone is UTC', () => {
    const ts = Date.UTC(2024, 5, 15, 12, 0, 0) / 1000;
    const parts = timestampToDateParts(ts, 'UTC');
    expect(parts.hour).toBe(12);
    expect(parts.month).toBe(6);
    expect(parts.day).toBe(15);
  });
});

describe('formatInTimezone', () => {
  it('formats time as HH:MM in given timezone', () => {
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const result = formatInTimezone(ts, 'America/New_York', { hour: '2-digit', minute: '2-digit', hour12: false });
    expect(result).toBe('10:30');
  });

  it('formats date as locale string', () => {
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const result = formatInTimezone(ts, 'UTC', { month: 'short', day: 'numeric' });
    expect(result).toBe('Jan 15');
  });
});

describe('getTimezoneOffsetMinutes', () => {
  it('returns negative offset for US Eastern in winter (EST = UTC-5)', () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0) / 1000;
    const offset = getTimezoneOffsetMinutes(ts, 'America/New_York');
    expect(offset).toBe(-300);
  });

  it('returns different offset during DST (EDT = UTC-4)', () => {
    const ts = Date.UTC(2024, 6, 15, 12, 0, 0) / 1000;
    const offset = getTimezoneOffsetMinutes(ts, 'America/New_York');
    expect(offset).toBe(-240);
  });

  it('returns 0 for UTC', () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0) / 1000;
    expect(getTimezoneOffsetMinutes(ts, 'UTC')).toBe(0);
  });

  it('returns +540 for Tokyo (JST = UTC+9)', () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0) / 1000;
    expect(getTimezoneOffsetMinutes(ts, 'Asia/Tokyo')).toBe(540);
  });
});
