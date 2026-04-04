export interface Periodicity {
  interval: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export function periodicityToSeconds(p: Periodicity): number {
  switch (p.unit) {
    case 'second': return p.interval;
    case 'minute': return p.interval * 60;
    case 'hour': return p.interval * 3600;
    case 'day': return p.interval * 86400;
    case 'week': return p.interval * 604800;
    case 'month': return p.interval * 2592000;
  }
}

const UNIT_LABELS: Record<string, string> = {
  second: 's', minute: 'm', hour: 'h', day: 'D', week: 'W', month: 'M',
};

export function periodicityToLabel(p: Periodicity): string {
  return `${p.interval}${UNIT_LABELS[p.unit]}`;
}
