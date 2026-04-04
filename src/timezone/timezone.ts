export interface DateParts {
  year: number;
  month: number;   // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0=Sun, 6=Sat
}

const _partsFmtCache = new Map<string, Intl.DateTimeFormat>();
const _fmtCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFmt(tz: string): Intl.DateTimeFormat {
  let fmt = _partsFmtCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    });
    _partsFmtCache.set(tz, fmt);
  }
  return fmt;
}

export function timestampToDateParts(timestampSec: number, timezone: string): DateParts {
  const date = new Date(timestampSec * 1000);
  const parts = getPartsFmt(timezone).formatToParts(date);

  let year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0;
  for (const p of parts) {
    switch (p.type) {
      case 'year': year = +p.value; break;
      case 'month': month = +p.value; break;
      case 'day': day = +p.value; break;
      case 'hour': hour = +p.value === 24 ? 0 : +p.value; break;
      case 'minute': minute = +p.value; break;
      case 'second': second = +p.value; break;
    }
  }

  const localDate = new Date(year, month - 1, day);
  const weekday = localDate.getDay();

  return { year, month, day, hour, minute, second, weekday };
}

export function formatInTimezone(
  timestampSec: number,
  timezone: string,
  options: Intl.DateTimeFormatOptions,
  locale: string = 'en-US',
): string {
  const key = `${locale}|${timezone}|${JSON.stringify(options)}`;
  let fmt = _fmtCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { ...options, timeZone: timezone });
    _fmtCache.set(key, fmt);
  }
  return fmt.format(new Date(timestampSec * 1000));
}

export function getTimezoneOffsetMinutes(timestampSec: number, timezone: string): number {
  const parts = timestampToDateParts(timestampSec, timezone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const actualUtc = timestampSec * 1000;
  return Math.round((asUtc - actualUtc) / 60000);
}
