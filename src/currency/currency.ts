export interface CurrencyInfo {
  code: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', decimals: 0 },
  CHF: { code: 'CHF', symbol: 'CHF', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2 },
  CNY: { code: 'CNY', symbol: '¥', decimals: 2 },
  HKD: { code: 'HKD', symbol: 'HK$', decimals: 2 },
  INR: { code: 'INR', symbol: '₹', decimals: 2 },
  KRW: { code: 'KRW', symbol: '₩', decimals: 0 },
  SGD: { code: 'SGD', symbol: 'S$', decimals: 2 },
  BRL: { code: 'BRL', symbol: 'R$', decimals: 2 },
  BTC: { code: 'BTC', symbol: '₿', decimals: 8 },
  ETH: { code: 'ETH', symbol: 'Ξ', decimals: 8 },
};

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES[code] ?? { code, symbol: code, decimals: 2 };
}

const _fmtCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(
  value: number,
  currencyCode: string,
  locale: string = 'en-US',
): string {
  if (!isFinite(value)) return '-';
  const info = getCurrencyInfo(currencyCode);
  const key = `${locale}|${currencyCode}`;
  let fmt = _fmtCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
      });
    } catch {
      // Fallback for non-ISO currencies like BTC
      fmt = new Intl.NumberFormat(locale, {
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
      });
      _fmtCache.set(key, fmt);
      return `${info.symbol}${fmt.format(value)}`;
    }
    _fmtCache.set(key, fmt);
  }
  return fmt.format(value);
}
