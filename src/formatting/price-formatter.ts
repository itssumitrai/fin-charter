export interface PriceFormatterOptions {
  locale?: string;
  decimals?: number | 'auto';
  currency?: string;
}

function autoDecimals(price: number): number {
  const abs = Math.abs(price);
  if (abs >= 1 || abs === 0) return 2;
  if (abs >= 0.01) return 4;
  return 6;
}

const _cache = new Map<string, Intl.NumberFormat>();

function getNumberFmt(locale: string, decimals: number, currency?: string): Intl.NumberFormat {
  const key = `${locale}|${decimals}|${currency ?? ''}`;
  let fmt = _cache.get(key);
  if (!fmt) {
    const opts: Intl.NumberFormatOptions = currency
      ? { style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    fmt = new Intl.NumberFormat(locale, opts);
    _cache.set(key, fmt);
  }
  return fmt;
}

export function createPriceFormatter(options?: PriceFormatterOptions): (price: number) => string {
  const locale = options?.locale ?? 'en-US';
  const decSetting = options?.decimals ?? 2;
  const currency = options?.currency;

  return (price: number): string => {
    if (!isFinite(price)) return '-';
    const dec = decSetting === 'auto' ? autoDecimals(price) : decSetting;
    return getNumberFmt(locale, dec, currency).format(price);
  };
}
