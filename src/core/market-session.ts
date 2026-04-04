export interface MarketSession {
  id: string;
  label: string;
  startMinute: number;  // minutes from midnight in exchange timezone
  endMinute: number;
  bgColor: string;
}

export const US_EQUITY_SESSIONS: MarketSession[] = [
  { id: 'premarket', label: 'PRE', startMinute: 240, endMinute: 570, bgColor: 'rgba(255,235,59,0.05)' },
  { id: 'regular', label: '', startMinute: 570, endMinute: 960, bgColor: 'transparent' },
  { id: 'postmarket', label: 'POST', startMinute: 960, endMinute: 1200, bgColor: 'rgba(255,235,59,0.05)' },
];

export function isInSession(minuteOfDay: number, session: MarketSession): boolean {
  return minuteOfDay >= session.startMinute && minuteOfDay < session.endMinute;
}

export function getSessionForTime(minuteOfDay: number, sessions: MarketSession[]): MarketSession | null {
  for (const s of sessions) {
    if (isInSession(minuteOfDay, s)) return s;
  }
  return null;
}

export function timestampToMinuteOfDay(timestamp: number, utcOffsetMinutes: number = -300): number {
  const totalMinutes = Math.floor(timestamp / 60) + utcOffsetMinutes;
  return ((totalMinutes % 1440) + 1440) % 1440;
}
