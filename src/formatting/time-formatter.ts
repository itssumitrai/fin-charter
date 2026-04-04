import { timestampToDateParts } from '../timezone/timezone';

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
    const p = timestampToDateParts(timestampSec, tz);
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
