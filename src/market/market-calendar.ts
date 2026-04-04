import type { MarketDefinition } from './market-definition';
import { timestampToDateParts, getTimezoneOffsetMinutes } from '../timezone/timezone';

export function isMarketDate(dateStr: string, market: MarketDefinition): boolean {
  if (market.sessions.some(s => s.startMinute === 0 && s.endMinute === 1440) && market.holidays.length === 0) {
    return true;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (dow === 0 || dow === 6) return false;
  if (market.holidays.some(h => h.date === dateStr && h.earlyClose === undefined)) return false;
  return true;
}

export function isEarlyClose(dateStr: string, market: MarketDefinition): number | null {
  const holiday = market.holidays.find(h => h.date === dateStr);
  if (holiday && holiday.earlyClose !== undefined) return holiday.earlyClose;
  return null;
}

export function getNextOpen(timestampSec: number, market: MarketDefinition): number {
  if (market.sessions.some(s => s.startMinute === 0 && s.endMinute === 1440) && market.holidays.length === 0) {
    return timestampSec;
  }

  const regularSession = market.sessions.find(s => s.id === 'regular' || s.id === 'morning') ?? market.sessions[0];
  const openMinute = regularSession.startMinute;
  const parts = timestampToDateParts(timestampSec, market.timezone);
  const currentMinute = parts.hour * 60 + parts.minute;

  if (currentMinute < openMinute) {
    const dateStr = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
    if (isMarketDate(dateStr, market)) {
      const offset = getTimezoneOffsetMinutes(timestampSec, market.timezone);
      const midnightUtc = Date.UTC(parts.year, parts.month - 1, parts.day) / 1000;
      return midnightUtc + (openMinute - offset) * 60;
    }
  }

  let searchDate = new Date(parts.year, parts.month - 1, parts.day);
  if (currentMinute >= openMinute) {
    searchDate.setDate(searchDate.getDate() + 1);
  }

  for (let i = 0; i < 10; i++) {
    const dateStr = searchDate.toISOString().slice(0, 10);
    if (isMarketDate(dateStr, market)) {
      const offset = getTimezoneOffsetMinutes(searchDate.getTime() / 1000, market.timezone);
      const midnightUtc = Date.UTC(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate()) / 1000;
      return midnightUtc + (openMinute - offset) * 60;
    }
    searchDate.setDate(searchDate.getDate() + 1);
  }

  return timestampSec;
}
