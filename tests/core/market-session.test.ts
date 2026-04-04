import { describe, it, expect } from 'vitest';
import {
  US_EQUITY_SESSIONS,
  isInSession,
  getSessionForTime,
  timestampToMinuteOfDay,
} from '../../src/core/market-session';

describe('US_EQUITY_SESSIONS', () => {
  it('has 3 sessions', () => {
    expect(US_EQUITY_SESSIONS).toHaveLength(3);
  });

  it('has correct ids', () => {
    const ids = US_EQUITY_SESSIONS.map(s => s.id);
    expect(ids).toContain('premarket');
    expect(ids).toContain('regular');
    expect(ids).toContain('postmarket');
  });

  it('sessions have correct start/end minutes', () => {
    const pre = US_EQUITY_SESSIONS.find(s => s.id === 'premarket')!;
    expect(pre.startMinute).toBe(240);
    expect(pre.endMinute).toBe(570);

    const regular = US_EQUITY_SESSIONS.find(s => s.id === 'regular')!;
    expect(regular.startMinute).toBe(570);
    expect(regular.endMinute).toBe(960);

    const post = US_EQUITY_SESSIONS.find(s => s.id === 'postmarket')!;
    expect(post.startMinute).toBe(960);
    expect(post.endMinute).toBe(1200);
  });
});

describe('isInSession', () => {
  const regular = US_EQUITY_SESSIONS.find(s => s.id === 'regular')!;

  it('returns true for 600 minutes (10:00 AM) which is in regular session', () => {
    expect(isInSession(600, regular)).toBe(true);
  });

  it('returns true for exact start of regular session (570)', () => {
    expect(isInSession(570, regular)).toBe(true);
  });

  it('returns false for 180 minutes (3:00 AM) which is not in regular session', () => {
    expect(isInSession(180, regular)).toBe(false);
  });

  it('returns false for exact end of regular session (960) — exclusive end', () => {
    expect(isInSession(960, regular)).toBe(false);
  });

  it('returns false for time before premarket', () => {
    const pre = US_EQUITY_SESSIONS.find(s => s.id === 'premarket')!;
    expect(isInSession(100, pre)).toBe(false);
  });

  it('returns true for time in premarket', () => {
    const pre = US_EQUITY_SESSIONS.find(s => s.id === 'premarket')!;
    expect(isInSession(300, pre)).toBe(true);
  });
});

describe('getSessionForTime', () => {
  it('returns premarket session for 300 minutes', () => {
    const session = getSessionForTime(300, US_EQUITY_SESSIONS);
    expect(session).not.toBeNull();
    expect(session!.id).toBe('premarket');
  });

  it('returns regular session for 600 minutes', () => {
    const session = getSessionForTime(600, US_EQUITY_SESSIONS);
    expect(session).not.toBeNull();
    expect(session!.id).toBe('regular');
  });

  it('returns postmarket session for 1000 minutes', () => {
    const session = getSessionForTime(1000, US_EQUITY_SESSIONS);
    expect(session).not.toBeNull();
    expect(session!.id).toBe('postmarket');
  });

  it('returns null for out-of-session time (e.g. 180 minutes, 3:00 AM)', () => {
    const session = getSessionForTime(180, US_EQUITY_SESSIONS);
    expect(session).toBeNull();
  });

  it('returns null for midnight (0 minutes)', () => {
    const session = getSessionForTime(0, US_EQUITY_SESSIONS);
    expect(session).toBeNull();
  });

  it('returns null after post-market ends (1200)', () => {
    const session = getSessionForTime(1200, US_EQUITY_SESSIONS);
    expect(session).toBeNull();
  });
});

describe('timestampToMinuteOfDay', () => {
  it('converts a known timestamp to correct minute of day (ET, UTC-5)', () => {
    // 2024-01-02 15:30:00 UTC = 2024-01-02 10:30:00 ET = 630 minutes
    const ts = Date.UTC(2024, 0, 2, 15, 30, 0) / 1000;
    expect(timestampToMinuteOfDay(ts, -300)).toBe(630);
  });

  it('converts market open time (9:30 AM ET)', () => {
    // 9:30 AM ET = 14:30 UTC
    const ts = Date.UTC(2024, 0, 2, 14, 30, 0) / 1000;
    expect(timestampToMinuteOfDay(ts, -300)).toBe(570);
  });

  it('uses default offset of -300 (ET)', () => {
    const ts = Date.UTC(2024, 0, 2, 14, 30, 0) / 1000;
    expect(timestampToMinuteOfDay(ts)).toBe(570);
  });

  it('handles midnight wrap-around correctly (result stays in [0, 1440))', () => {
    const result = timestampToMinuteOfDay(0, -300);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1440);
  });
});
