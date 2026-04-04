const SUFFIXES: [number, string][] = [
  [1e12, 'T'],
  [1e9,  'B'],
  [1e6,  'M'],
  [1e3,  'K'],
];

export function formatVolume(value: number, locale?: string): string {
  if (!isFinite(value)) return '-';
  if (value === 0) return '0';

  const abs = Math.abs(value);

  for (const [threshold, suffix] of SUFFIXES) {
    if (abs >= threshold) {
      const scaled = value / threshold;
      const formatted = locale
        ? new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(scaled)
        : scaled.toFixed(2);
      return `${formatted}${suffix}`;
    }
  }

  return locale
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
    : Math.round(value).toString();
}
