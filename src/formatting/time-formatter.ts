export interface TimeFormatterOptions {
  timezone?: string;
  locale?: string;
}

type TickType = 'year' | 'month' | 'day' | 'time';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function createTimeFormatter(options?: TimeFormatterOptions): (
  timestampSec: number,
  tickType: TickType,
  crosshair?: boolean,
) => string {
  const tz = options?.timezone ?? 'UTC';

  return (timestampSec: number, tickType: TickType, crosshair: boolean = false): string => {
    // Use basic UTC date parts for now - will be wired to timezone module later
    const date = new Date(timestampSec * 1000);
    const p = {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };

    // If timezone is not UTC, use Intl to get correct parts
    if (tz !== 'UTC') {
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false,
      });
      const parts = fmt.formatToParts(new Date(timestampSec * 1000));
      for (const part of parts) {
        switch (part.type) {
          case 'year': p.year = +part.value; break;
          case 'month': p.month = +part.value; break;
          case 'day': p.day = +part.value; break;
          case 'hour': p.hour = +part.value === 24 ? 0 : +part.value; break;
          case 'minute': p.minute = +part.value; break;
        }
      }
    }

    const mon = MONTHS_SHORT[p.month - 1];
    const hh = p.hour.toString().padStart(2, '0');
    const mm = p.minute.toString().padStart(2, '0');

    if (crosshair) {
      if (tickType === 'time') return `${mon} ${p.day} ${hh}:${mm}`;
      return `${mon} ${p.day}, ${p.year}`;
    }

    switch (tickType) {
      case 'time': return `${hh}:${mm}`;
      case 'day': return `${mon} ${p.day}`;
      case 'month': return `${mon} ${p.year}`;
      case 'year': return `${p.year}`;
    }
  };
}
