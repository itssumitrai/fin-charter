# Market Rules, Timezone, Locale, Currency & i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive market definitions, timezone support, locale-aware formatting, currency display, and i18n to fin-charter while keeping the library modular and under the 20KB full-bundle gzip budget.

**Architecture:** Five new modules (`i18n/`, `timezone/`, `formatting/`, `currency/`, `market/`) each with their own entry point so they tree-shake to zero if unused. All modules use browser `Intl` APIs for timezone/formatting instead of shipping data. The existing `ChartOptions` gets three new optional fields: `locale`, `timezone`, `currency`. Chart-api.ts formatting code is refactored to delegate to the new formatting module.

**Tech Stack:** TypeScript, Vitest, browser Intl API (DateTimeFormat, NumberFormat)

---

## File Map

### New files to create:
- `src/i18n/i18n.ts` — Core i18n engine (~40 lines)
- `src/i18n/locales/en.ts` — English default translations
- `src/i18n/index.ts` — Re-exports
- `src/timezone/timezone.ts` — Intl-based timezone conversion
- `src/timezone/index.ts` — Re-exports
- `src/formatting/price-formatter.ts` — Locale-aware price formatting
- `src/formatting/time-formatter.ts` — Locale/timezone-aware time formatting
- `src/formatting/volume-formatter.ts` — Short volume formatting (1.2B, 345K)
- `src/formatting/index.ts` — Re-exports
- `src/currency/currency.ts` — Currency metadata and formatting
- `src/currency/index.ts` — Re-exports
- `src/market/market-definition.ts` — MarketDefinition interface + built-in markets
- `src/market/market-calendar.ts` — Holiday calendar + isMarketDate + getNextOpen
- `src/market/exchange-map.ts` — Exchange code to market lookup
- `src/market/index.ts` — Re-exports
- `tests/i18n/i18n.test.ts`
- `tests/timezone/timezone.test.ts`
- `tests/formatting/price-formatter.test.ts`
- `tests/formatting/time-formatter.test.ts`
- `tests/formatting/volume-formatter.test.ts`
- `tests/currency/currency.test.ts`
- `tests/market/market-definition.test.ts`
- `tests/market/market-calendar.test.ts`
- `tests/market/exchange-map.test.ts`

### Files to modify:
- `src/api/options.ts` — Add `locale`, `timezone`, `currency` to ChartOptions
- `src/api/chart-api.ts` — Refactor formatting to use new modules
- `src/index.ts` — Add exports for new modules
- `src/core/market-session.ts` — Update timestampToMinuteOfDay to use timezone module
- `package.json` — Add new entry points for tree-shaking

---

## Task 1: i18n Core Module

**Files:**
- Create: `src/i18n/i18n.ts`
- Create: `src/i18n/locales/en.ts`
- Create: `src/i18n/index.ts`
- Test: `tests/i18n/i18n.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/i18n/i18n.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale, registerLocale, loadLocale } from '../../src/i18n';

describe('i18n', () => {
  beforeEach(() => {
    setLocale('en');
  });

  describe('getLocale / setLocale', () => {
    it('defaults to en', () => {
      expect(getLocale()).toBe('en');
    });

    it('switches locale', () => {
      setLocale('fr');
      expect(getLocale()).toBe('fr');
    });
  });

  describe('t() translation', () => {
    it('returns key as fallback when no translation exists', () => {
      expect(t('unknown.key')).toBe('unknown.key');
    });

    it('returns English translation for registered key', () => {
      registerLocale('en', { 'greeting': 'Hello' });
      expect(t('greeting')).toBe('Hello');
    });

    it('returns translated string for active locale', () => {
      registerLocale('fr', { 'greeting': 'Bonjour' });
      setLocale('fr');
      expect(t('greeting')).toBe('Bonjour');
    });

    it('falls back to English when key missing in active locale', () => {
      registerLocale('en', { 'farewell': 'Goodbye' });
      registerLocale('fr', {});
      setLocale('fr');
      expect(t('farewell')).toBe('Goodbye');
    });

    it('interpolates {{param}} placeholders', () => {
      registerLocale('en', { 'welcome': 'Hello, {{name}}!' });
      expect(t('welcome', { name: 'World' })).toBe('Hello, World!');
    });

    it('interpolates multiple params', () => {
      registerLocale('en', { 'range': '{{from}} to {{to}}' });
      expect(t('range', { from: '10', to: '20' })).toBe('10 to 20');
    });

    it('interpolates numeric params', () => {
      registerLocale('en', { 'count': '{{n}} items' });
      expect(t('count', { n: 42 })).toBe('42 items');
    });

    it('leaves unmatched placeholders as-is', () => {
      registerLocale('en', { 'tpl': 'Hi {{name}}, {{missing}}' });
      expect(t('tpl', { name: 'Ada' })).toBe('Hi Ada, {{missing}}');
    });
  });

  describe('loadLocale (async)', () => {
    it('loads a locale asynchronously and makes it usable', async () => {
      await loadLocale('de', async () => ({ 'greeting': 'Hallo' }));
      setLocale('de');
      expect(t('greeting')).toBe('Hallo');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/i18n/i18n.test.ts`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Implement i18n core**

Create `src/i18n/i18n.ts`:

```typescript
export type Translations = Record<string, string>;

let _locale = 'en';
const _registry: Record<string, Translations> = {};

export function setLocale(lang: string): void {
  _locale = lang;
}

export function getLocale(): string {
  return _locale;
}

export function registerLocale(lang: string, translations: Translations): void {
  _registry[lang] = { ..._registry[lang], ...translations };
}

export function t(key: string, params?: Record<string, string | number>): string {
  const val = _registry[_locale]?.[key] ?? _registry['en']?.[key] ?? key;
  if (!params) return val;
  return val.replace(/\{\{(\w+)\}\}/g, (match, k) => {
    const v = params[k];
    return v !== undefined ? String(v) : match;
  });
}

export async function loadLocale(
  lang: string,
  loader: () => Promise<Translations>,
): Promise<void> {
  registerLocale(lang, await loader());
}
```

Create `src/i18n/locales/en.ts`:

```typescript
import type { Translations } from '../i18n';

const en: Translations = {
  // Month abbreviations
  'month.jan': 'Jan', 'month.feb': 'Feb', 'month.mar': 'Mar',
  'month.apr': 'Apr', 'month.may': 'May', 'month.jun': 'Jun',
  'month.jul': 'Jul', 'month.aug': 'Aug', 'month.sep': 'Sep',
  'month.oct': 'Oct', 'month.nov': 'Nov', 'month.dec': 'Dec',
  // Day abbreviations
  'day.sun': 'Sun', 'day.mon': 'Mon', 'day.tue': 'Tue',
  'day.wed': 'Wed', 'day.thu': 'Thu', 'day.fri': 'Fri', 'day.sat': 'Sat',
  // UI labels
  'session.pre': 'Pre-Market', 'session.regular': 'Regular',
  'session.post': 'Post-Market', 'session.closed': 'Closed',
  'label.open': 'O', 'label.high': 'H', 'label.low': 'L',
  'label.close': 'C', 'label.volume': 'V',
  // Volume suffixes
  'volume.K': 'K', 'volume.M': 'M', 'volume.B': 'B', 'volume.T': 'T',
};

export default en;
```

Create `src/i18n/index.ts`:

```typescript
export { t, setLocale, getLocale, registerLocale, loadLocale } from './i18n';
export type { Translations } from './i18n';
export { default as enLocale } from './locales/en';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/i18n/i18n.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ tests/i18n/
git commit -m "feat: add i18n module with key-value translations and lazy loading"
```

---

## Task 2: Timezone Module

**Files:**
- Create: `src/timezone/timezone.ts`
- Create: `src/timezone/index.ts`
- Test: `tests/timezone/timezone.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/timezone/timezone.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  toTimezone,
  formatInTimezone,
  getTimezoneOffsetMinutes,
  timestampToDateParts,
} from '../../src/timezone';

describe('toTimezone', () => {
  it('converts UTC timestamp to New York time parts', () => {
    // 2024-01-15 15:30:00 UTC = 2024-01-15 10:30:00 EST
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const parts = timestampToDateParts(ts, 'America/New_York');
    expect(parts.hour).toBe(10);
    expect(parts.minute).toBe(30);
    expect(parts.month).toBe(1); // January
    expect(parts.day).toBe(15);
    expect(parts.year).toBe(2024);
  });

  it('converts UTC timestamp to Tokyo time parts', () => {
    // 2024-01-15 15:30:00 UTC = 2024-01-16 00:30:00 JST
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const parts = timestampToDateParts(ts, 'Asia/Tokyo');
    expect(parts.hour).toBe(0);
    expect(parts.minute).toBe(30);
    expect(parts.day).toBe(16);
  });

  it('handles DST transition (US spring forward)', () => {
    // 2024-03-10 is spring-forward day in US
    // 2024-03-10 07:00:00 UTC = 2024-03-10 03:00:00 EDT (skipped 2am)
    const ts = Date.UTC(2024, 2, 10, 7, 0, 0) / 1000;
    const parts = timestampToDateParts(ts, 'America/New_York');
    expect(parts.hour).toBe(3);
  });

  it('defaults to UTC when timezone is UTC', () => {
    const ts = Date.UTC(2024, 5, 15, 12, 0, 0) / 1000;
    const parts = timestampToDateParts(ts, 'UTC');
    expect(parts.hour).toBe(12);
    expect(parts.month).toBe(6);
    expect(parts.day).toBe(15);
  });
});

describe('formatInTimezone', () => {
  it('formats time as HH:MM in given timezone', () => {
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const result = formatInTimezone(ts, 'America/New_York', { hour: '2-digit', minute: '2-digit', hour12: false });
    expect(result).toBe('10:30');
  });

  it('formats date as locale string', () => {
    const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;
    const result = formatInTimezone(ts, 'UTC', { month: 'short', day: 'numeric' });
    expect(result).toBe('Jan 15');
  });
});

describe('getTimezoneOffsetMinutes', () => {
  it('returns negative offset for US Eastern in winter (EST = UTC-5)', () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0) / 1000;
    const offset = getTimezoneOffsetMinutes(ts, 'America/New_York');
    expect(offset).toBe(-300);
  });

  it('returns different offset during DST (EDT = UTC-4)', () => {
    const ts = Date.UTC(2024, 6, 15, 12, 0, 0) / 1000;
    const offset = getTimezoneOffsetMinutes(ts, 'America/New_York');
    expect(offset).toBe(-240);
  });

  it('returns 0 for UTC', () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0) / 1000;
    expect(getTimezoneOffsetMinutes(ts, 'UTC')).toBe(0);
  });

  it('returns +540 for Tokyo (JST = UTC+9)', () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0) / 1000;
    expect(getTimezoneOffsetMinutes(ts, 'Asia/Tokyo')).toBe(540);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/timezone/timezone.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement timezone module**

Create `src/timezone/timezone.ts`:

```typescript
export interface DateParts {
  year: number;
  month: number;   // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0=Sun, 6=Sat
}

// Cache formatters — Intl.DateTimeFormat construction is expensive
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

  // Compute weekday from the timezone-local date
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
  // Reconstruct what the UTC time would be if parts were UTC
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const actualUtc = timestampSec * 1000;
  return Math.round((asUtc - actualUtc) / 60000);
}
```

Create `src/timezone/index.ts`:

```typescript
export {
  timestampToDateParts,
  formatInTimezone,
  getTimezoneOffsetMinutes,
} from './timezone';
export type { DateParts } from './timezone';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/timezone/timezone.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/timezone/ tests/timezone/
git commit -m "feat: add timezone module using Intl.DateTimeFormat"
```

---

## Task 3: Formatting Module — Price Formatter

**Files:**
- Create: `src/formatting/price-formatter.ts`
- Test: `tests/formatting/price-formatter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/formatting/price-formatter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createPriceFormatter } from '../../src/formatting/price-formatter';

describe('createPriceFormatter', () => {
  it('formats with default locale (en-US) and 2 decimals', () => {
    const fmt = createPriceFormatter();
    expect(fmt(1234.56)).toBe('1,234.56');
  });

  it('formats with 0 decimals', () => {
    const fmt = createPriceFormatter({ decimals: 0 });
    expect(fmt(1234.56)).toBe('1,235');
  });

  it('formats with 4 decimals (forex)', () => {
    const fmt = createPriceFormatter({ decimals: 4 });
    expect(fmt(1.2345)).toBe('1.2345');
  });

  it('formats with German locale', () => {
    const fmt = createPriceFormatter({ locale: 'de-DE' });
    expect(fmt(1234.56)).toMatch(/1\.234,56/);
  });

  it('formats negative numbers', () => {
    const fmt = createPriceFormatter();
    const result = fmt(-42.5);
    expect(result).toContain('42.50');
  });

  it('formats zero', () => {
    const fmt = createPriceFormatter();
    expect(fmt(0)).toBe('0.00');
  });

  it('handles NaN gracefully', () => {
    const fmt = createPriceFormatter();
    expect(fmt(NaN)).toBe('-');
  });

  it('handles Infinity gracefully', () => {
    const fmt = createPriceFormatter();
    expect(fmt(Infinity)).toBe('-');
  });

  it('auto-detects decimals based on price magnitude', () => {
    const fmt = createPriceFormatter({ decimals: 'auto' });
    // Large price — 2 decimals
    expect(fmt(1500.12)).toBe('1,500.12');
    // Small price — up to 6 decimals
    expect(fmt(0.001234)).toBe('0.001234');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/formatting/price-formatter.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement price formatter**

Create `src/formatting/price-formatter.ts`:

```typescript
export interface PriceFormatterOptions {
  locale?: string;
  decimals?: number | 'auto';
  currency?: string;
}

function autoDecimals(price: number): number {
  const abs = Math.abs(price);
  if (abs === 0) return 2;
  if (abs >= 1000) return 2;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  // Sub-penny: show enough decimals
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/formatting/price-formatter.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/formatting/price-formatter.ts tests/formatting/
git commit -m "feat: add locale-aware price formatter using Intl.NumberFormat"
```

---

## Task 4: Formatting Module — Time Formatter

**Files:**
- Create: `src/formatting/time-formatter.ts`
- Test: `tests/formatting/time-formatter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/formatting/time-formatter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createTimeFormatter } from '../../src/formatting/time-formatter';

describe('createTimeFormatter', () => {
  // 2024-01-15 15:30:00 UTC
  const ts = Date.UTC(2024, 0, 15, 15, 30, 0) / 1000;

  describe('intraday tick marks', () => {
    it('formats time as HH:MM in UTC', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'time')).toBe('15:30');
    });

    it('formats time in New York timezone', () => {
      const fmt = createTimeFormatter({ timezone: 'America/New_York' });
      expect(fmt(ts, 'time')).toBe('10:30');
    });

    it('formats time in Tokyo timezone', () => {
      const fmt = createTimeFormatter({ timezone: 'Asia/Tokyo' });
      expect(fmt(ts, 'time')).toBe('00:30');
    });
  });

  describe('daily tick marks', () => {
    it('formats day as "Jan 15" in en-US', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'day')).toBe('Jan 15');
    });

    it('formats day in German locale', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC', locale: 'de-DE' });
      const result = fmt(ts, 'day');
      expect(result).toMatch(/Jan/i);
      expect(result).toMatch(/15/);
    });
  });

  describe('month tick marks', () => {
    it('formats as "Jan 2024"', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'month')).toBe('Jan 2024');
    });
  });

  describe('year tick marks', () => {
    it('formats as "2024"', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      expect(fmt(ts, 'year')).toBe('2024');
    });
  });

  describe('crosshair (full datetime)', () => {
    it('formats full datetime for intraday', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      const result = fmt(ts, 'time', true);
      // Should include date + time
      expect(result).toMatch(/Jan 15/);
      expect(result).toMatch(/15:30/);
    });

    it('formats full date for daily', () => {
      const fmt = createTimeFormatter({ timezone: 'UTC' });
      const result = fmt(ts, 'day', true);
      expect(result).toMatch(/Jan 15, 2024/);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/formatting/time-formatter.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement time formatter**

Create `src/formatting/time-formatter.ts`:

```typescript
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
  const _locale = options?.locale ?? 'en-US';

  return (timestampSec: number, tickType: TickType, crosshair: boolean = false): string => {
    const p = timestampToDateParts(timestampSec, tz);
    const mon = MONTHS_SHORT[p.month - 1];
    const hh = p.hour.toString().padStart(2, '0');
    const mm = p.minute.toString().padStart(2, '0');

    if (crosshair) {
      if (tickType === 'time') {
        return `${mon} ${p.day} ${hh}:${mm}`;
      }
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/formatting/time-formatter.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/formatting/time-formatter.ts tests/formatting/time-formatter.test.ts
git commit -m "feat: add timezone-aware time formatter"
```

---

## Task 5: Formatting Module — Volume Formatter

**Files:**
- Create: `src/formatting/volume-formatter.ts`
- Test: `tests/formatting/volume-formatter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/formatting/volume-formatter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatVolume } from '../../src/formatting/volume-formatter';

describe('formatVolume', () => {
  it('formats trillions', () => {
    expect(formatVolume(1_500_000_000_000)).toBe('1.50T');
  });

  it('formats billions', () => {
    expect(formatVolume(2_340_000_000)).toBe('2.34B');
  });

  it('formats millions', () => {
    expect(formatVolume(5_670_000)).toBe('5.67M');
  });

  it('formats thousands', () => {
    expect(formatVolume(12_345)).toBe('12.35K');
  });

  it('formats small numbers without suffix', () => {
    expect(formatVolume(999)).toBe('999');
  });

  it('formats zero', () => {
    expect(formatVolume(0)).toBe('0');
  });

  it('formats negative numbers', () => {
    expect(formatVolume(-5_000_000)).toBe('-5.00M');
  });

  it('handles NaN', () => {
    expect(formatVolume(NaN)).toBe('-');
  });

  it('handles Infinity', () => {
    expect(formatVolume(Infinity)).toBe('-');
  });

  it('formats with locale-specific number formatting', () => {
    expect(formatVolume(1_234_567, 'de-DE')).toMatch(/1,23M|1\.23M/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/formatting/volume-formatter.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement volume formatter**

Create `src/formatting/volume-formatter.ts`:

```typescript
const SUFFIXES: [number, string][] = [
  [1e12, 'T'],
  [1e9,  'B'],
  [1e6,  'M'],
  [1e3,  'K'],
];

export function formatVolume(value: number, locale?: string): string {
  if (!isFinite(value)) return '-';
  if (value === 0) return '0';

  const neg = value < 0;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/formatting/volume-formatter.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Create formatting index and commit**

Create `src/formatting/index.ts`:

```typescript
export { createPriceFormatter } from './price-formatter';
export type { PriceFormatterOptions } from './price-formatter';
export { createTimeFormatter } from './time-formatter';
export type { TimeFormatterOptions } from './time-formatter';
export { formatVolume } from './volume-formatter';
```

```bash
git add src/formatting/ tests/formatting/
git commit -m "feat: add volume formatter and formatting module index"
```

---

## Task 6: Currency Module

**Files:**
- Create: `src/currency/currency.ts`
- Create: `src/currency/index.ts`
- Test: `tests/currency/currency.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/currency/currency.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getCurrencyInfo, formatCurrency, CURRENCIES } from '../../src/currency';

describe('getCurrencyInfo', () => {
  it('returns info for USD', () => {
    const info = getCurrencyInfo('USD');
    expect(info.code).toBe('USD');
    expect(info.symbol).toBe('$');
    expect(info.decimals).toBe(2);
  });

  it('returns info for JPY (0 decimals)', () => {
    const info = getCurrencyInfo('JPY');
    expect(info.code).toBe('JPY');
    expect(info.symbol).toBe('¥');
    expect(info.decimals).toBe(0);
  });

  it('returns info for EUR', () => {
    const info = getCurrencyInfo('EUR');
    expect(info.code).toBe('EUR');
    expect(info.symbol).toBe('€');
    expect(info.decimals).toBe(2);
  });

  it('returns info for GBP', () => {
    const info = getCurrencyInfo('GBP');
    expect(info.symbol).toBe('£');
  });

  it('returns info for BTC (8 decimals)', () => {
    const info = getCurrencyInfo('BTC');
    expect(info.decimals).toBe(8);
  });

  it('falls back to code as symbol for unknown currency', () => {
    const info = getCurrencyInfo('XYZ');
    expect(info.code).toBe('XYZ');
    expect(info.symbol).toBe('XYZ');
    expect(info.decimals).toBe(2);
  });
});

describe('formatCurrency', () => {
  it('formats USD price', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats JPY price (0 decimals)', () => {
    const result = formatCurrency(1234, 'JPY');
    expect(result).toMatch(/¥|JPY/);
    expect(result).toMatch(/1,234/);
  });

  it('formats EUR with German locale', () => {
    const result = formatCurrency(1234.56, 'EUR', 'de-DE');
    expect(result).toMatch(/1\.234,56/);
    expect(result).toMatch(/€/);
  });

  it('handles NaN', () => {
    expect(formatCurrency(NaN, 'USD')).toBe('-');
  });
});

describe('CURRENCIES', () => {
  it('has at least 10 currencies defined', () => {
    expect(Object.keys(CURRENCIES).length).toBeGreaterThanOrEqual(10);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/currency/currency.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement currency module**

Create `src/currency/currency.ts`:

```typescript
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
```

Create `src/currency/index.ts`:

```typescript
export { getCurrencyInfo, formatCurrency, CURRENCIES } from './currency';
export type { CurrencyInfo } from './currency';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/currency/currency.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/currency/ tests/currency/
git commit -m "feat: add currency module with 15 built-in currencies"
```

---

## Task 7: Market Definition Module

**Files:**
- Create: `src/market/market-definition.ts`
- Test: `tests/market/market-definition.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/market/market-definition.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getMarket,
  registerMarket,
  US_MARKET,
  UK_MARKET,
  JP_MARKET,
  DE_MARKET,
  AU_MARKET,
  CRYPTO_MARKET,
} from '../../src/market/market-definition';
import type { MarketDefinition } from '../../src/market/market-definition';

describe('built-in markets', () => {
  it('US market has correct timezone', () => {
    expect(US_MARKET.timezone).toBe('America/New_York');
  });

  it('US market has 3 sessions', () => {
    expect(US_MARKET.sessions).toHaveLength(3);
    const ids = US_MARKET.sessions.map(s => s.id);
    expect(ids).toContain('premarket');
    expect(ids).toContain('regular');
    expect(ids).toContain('postmarket');
  });

  it('US market regular session is 9:30-16:00', () => {
    const regular = US_MARKET.sessions.find(s => s.id === 'regular')!;
    expect(regular.startMinute).toBe(570);
    expect(regular.endMinute).toBe(960);
  });

  it('UK market has London timezone', () => {
    expect(UK_MARKET.timezone).toBe('Europe/London');
  });

  it('UK market regular session is 8:00-16:30', () => {
    const regular = UK_MARKET.sessions.find(s => s.id === 'regular')!;
    expect(regular.startMinute).toBe(480);
    expect(regular.endMinute).toBe(990);
  });

  it('JP market has Tokyo timezone', () => {
    expect(JP_MARKET.timezone).toBe('Asia/Tokyo');
  });

  it('JP market has morning and afternoon sessions', () => {
    expect(JP_MARKET.sessions.length).toBeGreaterThanOrEqual(2);
  });

  it('DE market has Frankfurt timezone', () => {
    expect(DE_MARKET.timezone).toBe('Europe/Berlin');
  });

  it('AU market has Sydney timezone', () => {
    expect(AU_MARKET.timezone).toBe('Australia/Sydney');
  });

  it('Crypto market is 24/7 UTC', () => {
    expect(CRYPTO_MARKET.timezone).toBe('UTC');
    const regular = CRYPTO_MARKET.sessions.find(s => s.id === 'regular')!;
    expect(regular.startMinute).toBe(0);
    expect(regular.endMinute).toBe(1440);
  });
});

describe('getMarket', () => {
  it('returns US market by id', () => {
    expect(getMarket('us')).toBe(US_MARKET);
  });

  it('returns JP market by id', () => {
    expect(getMarket('jp')).toBe(JP_MARKET);
  });

  it('returns undefined for unknown market', () => {
    expect(getMarket('unknown')).toBeUndefined();
  });
});

describe('registerMarket', () => {
  it('registers and retrieves a custom market', () => {
    const custom: MarketDefinition = {
      id: 'custom',
      name: 'Custom Exchange',
      timezone: 'Asia/Singapore',
      currency: 'SGD',
      sessions: [
        { id: 'regular', label: '', startMinute: 540, endMinute: 1020, bgColor: 'transparent' },
      ],
      holidays: [],
    };
    registerMarket(custom);
    expect(getMarket('custom')).toEqual(custom);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/market/market-definition.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement market definition module**

Create `src/market/market-definition.ts`:

```typescript
import type { MarketSession } from '../core/market-session';

export interface MarketHoliday {
  date: string;      // 'YYYY-MM-DD'
  name?: string;
  earlyClose?: number;  // minute of day for early close, or omit for full day
}

export interface MarketDefinition {
  id: string;
  name: string;
  timezone: string;       // IANA timezone
  currency: string;       // ISO 4217
  sessions: MarketSession[];
  holidays: MarketHoliday[];
}

const _markets = new Map<string, MarketDefinition>();

export const US_MARKET: MarketDefinition = {
  id: 'us',
  name: 'US Equities',
  timezone: 'America/New_York',
  currency: 'USD',
  sessions: [
    { id: 'premarket', label: 'PRE', startMinute: 240, endMinute: 570, bgColor: 'rgba(255,235,59,0.05)' },
    { id: 'regular', label: '', startMinute: 570, endMinute: 960, bgColor: 'transparent' },
    { id: 'postmarket', label: 'POST', startMinute: 960, endMinute: 1200, bgColor: 'rgba(255,235,59,0.05)' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-01-20', name: 'MLK Day' },
    { date: '2025-02-17', name: "Presidents' Day" },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-05-26', name: 'Memorial Day' },
    { date: '2025-06-19', name: 'Juneteenth' },
    { date: '2025-07-04', name: 'Independence Day' },
    { date: '2025-09-01', name: 'Labor Day' },
    { date: '2025-11-27', name: 'Thanksgiving' },
    { date: '2025-12-25', name: 'Christmas' },
  ],
};

export const UK_MARKET: MarketDefinition = {
  id: 'uk',
  name: 'London Stock Exchange',
  timezone: 'Europe/London',
  currency: 'GBP',
  sessions: [
    { id: 'regular', label: '', startMinute: 480, endMinute: 990, bgColor: 'transparent' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Easter Monday' },
    { date: '2025-05-05', name: 'Early May Bank Holiday' },
    { date: '2025-05-26', name: 'Spring Bank Holiday' },
    { date: '2025-08-25', name: 'Summer Bank Holiday' },
    { date: '2025-12-25', name: 'Christmas' },
    { date: '2025-12-26', name: 'Boxing Day' },
  ],
};

export const JP_MARKET: MarketDefinition = {
  id: 'jp',
  name: 'Japan Exchange',
  timezone: 'Asia/Tokyo',
  currency: 'JPY',
  sessions: [
    { id: 'morning', label: 'AM', startMinute: 540, endMinute: 690, bgColor: 'transparent' },
    { id: 'afternoon', label: 'PM', startMinute: 750, endMinute: 900, bgColor: 'transparent' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-01-02', name: 'Bank Holiday' },
    { date: '2025-01-03', name: 'Bank Holiday' },
    { date: '2025-01-13', name: 'Coming of Age Day' },
    { date: '2025-02-11', name: 'National Foundation Day' },
    { date: '2025-02-23', name: "Emperor's Birthday" },
    { date: '2025-03-20', name: 'Vernal Equinox' },
    { date: '2025-04-29', name: 'Showa Day' },
    { date: '2025-05-03', name: 'Constitution Memorial Day' },
    { date: '2025-05-05', name: "Children's Day" },
    { date: '2025-05-06', name: 'Substitute Holiday' },
  ],
};

export const DE_MARKET: MarketDefinition = {
  id: 'de',
  name: 'Deutsche Boerse',
  timezone: 'Europe/Berlin',
  currency: 'EUR',
  sessions: [
    { id: 'regular', label: '', startMinute: 540, endMinute: 1050, bgColor: 'transparent' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Easter Monday' },
    { date: '2025-05-01', name: 'Labour Day' },
    { date: '2025-12-24', name: 'Christmas Eve' },
    { date: '2025-12-25', name: 'Christmas' },
    { date: '2025-12-26', name: "St Stephen's Day" },
    { date: '2025-12-31', name: "New Year's Eve" },
  ],
};

export const AU_MARKET: MarketDefinition = {
  id: 'au',
  name: 'Australian Securities Exchange',
  timezone: 'Australia/Sydney',
  currency: 'AUD',
  sessions: [
    { id: 'preopen', label: 'PRE', startMinute: 420, endMinute: 600, bgColor: 'rgba(255,235,59,0.05)' },
    { id: 'regular', label: '', startMinute: 600, endMinute: 960, bgColor: 'transparent' },
  ],
  holidays: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-01-27', name: 'Australia Day' },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Easter Monday' },
    { date: '2025-04-25', name: 'ANZAC Day' },
    { date: '2025-06-09', name: "Queen's Birthday" },
    { date: '2025-12-25', name: 'Christmas' },
    { date: '2025-12-26', name: 'Boxing Day' },
  ],
};

export const CRYPTO_MARKET: MarketDefinition = {
  id: 'crypto',
  name: 'Cryptocurrency',
  timezone: 'UTC',
  currency: 'USD',
  sessions: [
    { id: 'regular', label: '', startMinute: 0, endMinute: 1440, bgColor: 'transparent' },
  ],
  holidays: [],
};

// Register built-in markets
for (const m of [US_MARKET, UK_MARKET, JP_MARKET, DE_MARKET, AU_MARKET, CRYPTO_MARKET]) {
  _markets.set(m.id, m);
}

export function getMarket(id: string): MarketDefinition | undefined {
  return _markets.get(id);
}

export function registerMarket(market: MarketDefinition): void {
  _markets.set(market.id, market);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/market/market-definition.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/market/market-definition.ts tests/market/
git commit -m "feat: add market definition module with 6 built-in markets"
```

---

## Task 8: Market Calendar Module

**Files:**
- Create: `src/market/market-calendar.ts`
- Test: `tests/market/market-calendar.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/market/market-calendar.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isMarketDate, getNextOpen, isEarlyClose } from '../../src/market/market-calendar';
import { US_MARKET, CRYPTO_MARKET } from '../../src/market/market-definition';

describe('isMarketDate', () => {
  it('returns true for a regular trading day (Tue Jan 14 2025)', () => {
    expect(isMarketDate('2025-01-14', US_MARKET)).toBe(true);
  });

  it('returns false for a Saturday', () => {
    expect(isMarketDate('2025-01-18', US_MARKET)).toBe(false);
  });

  it('returns false for a Sunday', () => {
    expect(isMarketDate('2025-01-19', US_MARKET)).toBe(false);
  });

  it('returns false for a US holiday (New Years)', () => {
    expect(isMarketDate('2025-01-01', US_MARKET)).toBe(false);
  });

  it('returns false for Thanksgiving', () => {
    expect(isMarketDate('2025-11-27', US_MARKET)).toBe(false);
  });

  it('returns true for crypto on any day', () => {
    expect(isMarketDate('2025-01-18', CRYPTO_MARKET)).toBe(true); // Saturday
    expect(isMarketDate('2025-12-25', CRYPTO_MARKET)).toBe(true); // Christmas
  });
});

describe('getNextOpen', () => {
  it('returns next Monday for a Friday after close', () => {
    // Friday Jan 17 2025, after market close at 17:00 UTC (12:00 ET)
    const fridayClose = Date.UTC(2025, 0, 17, 17, 0, 0) / 1000;
    const nextOpen = getNextOpen(fridayClose, US_MARKET);
    // Next open should be Monday Jan 20... but that's MLK day
    // So it should be Tuesday Jan 21, 14:30 UTC (9:30 ET)
    const date = new Date(nextOpen * 1000);
    expect(date.getUTCDate()).toBe(21);
    expect(date.getUTCMonth()).toBe(0); // January
  });

  it('returns same day regular open for pre-market time', () => {
    // Tuesday Jan 14 2025, 10:00 UTC (5:00 AM ET = before 9:30 open)
    const preMarket = Date.UTC(2025, 0, 14, 10, 0, 0) / 1000;
    const nextOpen = getNextOpen(preMarket, US_MARKET);
    const date = new Date(nextOpen * 1000);
    expect(date.getUTCDate()).toBe(14);
    // Should be 14:30 UTC (9:30 ET)
    expect(date.getUTCHours()).toBe(14);
    expect(date.getUTCMinutes()).toBe(30);
  });

  it('returns current time for crypto (always open)', () => {
    const now = Date.UTC(2025, 0, 18, 3, 0, 0) / 1000;
    const nextOpen = getNextOpen(now, CRYPTO_MARKET);
    expect(nextOpen).toBe(now);
  });
});

describe('isEarlyClose', () => {
  it('returns null for regular trading day', () => {
    expect(isEarlyClose('2025-01-14', US_MARKET)).toBeNull();
  });

  it('returns early close minute if defined', () => {
    const market = {
      ...US_MARKET,
      holidays: [
        ...US_MARKET.holidays,
        { date: '2025-11-28', name: 'Day after Thanksgiving', earlyClose: 780 },
      ],
    };
    expect(isEarlyClose('2025-11-28', market)).toBe(780);
  });

  it('returns null for full holiday', () => {
    expect(isEarlyClose('2025-12-25', US_MARKET)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/market/market-calendar.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement market calendar**

Create `src/market/market-calendar.ts`:

```typescript
import type { MarketDefinition } from './market-definition';
import { timestampToDateParts, getTimezoneOffsetMinutes } from '../timezone/timezone';

export function isMarketDate(dateStr: string, market: MarketDefinition): boolean {
  // Crypto is always open
  if (market.sessions.some(s => s.startMinute === 0 && s.endMinute === 1440) && market.holidays.length === 0) {
    return true;
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  // Weekends
  if (dow === 0 || dow === 6) return false;
  // Holidays
  if (market.holidays.some(h => h.date === dateStr && h.earlyClose === undefined)) return false;
  return true;
}

export function isEarlyClose(dateStr: string, market: MarketDefinition): number | null {
  const holiday = market.holidays.find(h => h.date === dateStr);
  if (holiday && holiday.earlyClose !== undefined) return holiday.earlyClose;
  return null;
}

export function getNextOpen(timestampSec: number, market: MarketDefinition): number {
  // Crypto: always open
  if (market.sessions.some(s => s.startMinute === 0 && s.endMinute === 1440) && market.holidays.length === 0) {
    return timestampSec;
  }

  // Find the "regular" session (first session without 'pre' in the id, or first session)
  const regularSession = market.sessions.find(s => s.id === 'regular' || s.id === 'morning')
    ?? market.sessions[0];
  const openMinute = regularSession.startMinute;

  // Get current time in market timezone
  const parts = timestampToDateParts(timestampSec, market.timezone);
  const currentMinute = parts.hour * 60 + parts.minute;

  // If before open today, check if today is a market date
  if (currentMinute < openMinute) {
    const dateStr = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
    if (isMarketDate(dateStr, market)) {
      // Return open time today
      const offset = getTimezoneOffsetMinutes(timestampSec, market.timezone);
      const openUtcMinutes = openMinute - offset;
      const midnightUtc = Date.UTC(parts.year, parts.month - 1, parts.day) / 1000;
      return midnightUtc + openUtcMinutes * 60;
    }
  }

  // Search forward up to 10 days
  let searchDate = new Date(parts.year, parts.month - 1, parts.day);
  // If already past open, start from tomorrow
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

  // Fallback: shouldn't happen unless market has >10 consecutive holidays
  return timestampSec;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/market/market-calendar.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/market/market-calendar.ts tests/market/market-calendar.test.ts
git commit -m "feat: add market calendar with holiday and early close support"
```

---

## Task 9: Exchange Map Module

**Files:**
- Create: `src/market/exchange-map.ts`
- Create: `src/market/index.ts`
- Test: `tests/market/exchange-map.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/market/exchange-map.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getMarketForExchange, registerExchange } from '../../src/market/exchange-map';

describe('getMarketForExchange', () => {
  it('maps NYSE to us market', () => {
    const market = getMarketForExchange('NYSE');
    expect(market).toBeDefined();
    expect(market!.id).toBe('us');
  });

  it('maps NAS to us market', () => {
    const market = getMarketForExchange('NAS');
    expect(market).toBeDefined();
    expect(market!.id).toBe('us');
  });

  it('maps LSE to uk market', () => {
    const market = getMarketForExchange('LSE');
    expect(market).toBeDefined();
    expect(market!.id).toBe('uk');
  });

  it('maps JPX to jp market', () => {
    const market = getMarketForExchange('JPX');
    expect(market).toBeDefined();
    expect(market!.id).toBe('jp');
  });

  it('maps FRA to de market', () => {
    const market = getMarketForExchange('FRA');
    expect(market).toBeDefined();
    expect(market!.id).toBe('de');
  });

  it('maps ASX to au market', () => {
    const market = getMarketForExchange('ASX');
    expect(market).toBeDefined();
    expect(market!.id).toBe('au');
  });

  it('returns undefined for unknown exchange', () => {
    expect(getMarketForExchange('UNKNOWN')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    const market = getMarketForExchange('nyse');
    expect(market).toBeDefined();
    expect(market!.id).toBe('us');
  });
});

describe('registerExchange', () => {
  it('registers a custom exchange mapping', () => {
    registerExchange('SGX', 'custom');
    // won't find a market since 'custom' isn't registered, but mapping is stored
    expect(getMarketForExchange('SGX')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/market/exchange-map.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement exchange map**

Create `src/market/exchange-map.ts`:

```typescript
import type { MarketDefinition } from './market-definition';
import { getMarket } from './market-definition';

const _exchangeToMarket = new Map<string, string>();

// US exchanges
for (const code of ['NYSE', 'NAS', 'NASDAQ', 'AMEX', 'ARCA', 'BATS', 'IEX', 'OTC', 'PNK', 'NYSEARCA']) {
  _exchangeToMarket.set(code, 'us');
}

// UK exchanges
for (const code of ['LSE', 'LON', 'AIM']) {
  _exchangeToMarket.set(code, 'uk');
}

// Japan exchanges
for (const code of ['JPX', 'TSE', 'TYO']) {
  _exchangeToMarket.set(code, 'jp');
}

// Germany exchanges
for (const code of ['FRA', 'ETR', 'BER', 'STU', 'XETRA']) {
  _exchangeToMarket.set(code, 'de');
}

// Australia exchanges
for (const code of ['ASX', 'AX']) {
  _exchangeToMarket.set(code, 'au');
}

// Crypto exchanges
for (const code of ['CRYPTO', 'BINANCE', 'COINBASE', 'KRAKEN']) {
  _exchangeToMarket.set(code, 'crypto');
}

export function getMarketForExchange(exchangeCode: string): MarketDefinition | undefined {
  const marketId = _exchangeToMarket.get(exchangeCode.toUpperCase());
  if (!marketId) return undefined;
  return getMarket(marketId);
}

export function registerExchange(exchangeCode: string, marketId: string): void {
  _exchangeToMarket.set(exchangeCode.toUpperCase(), marketId);
}
```

Create `src/market/index.ts`:

```typescript
export {
  getMarket, registerMarket,
  US_MARKET, UK_MARKET, JP_MARKET, DE_MARKET, AU_MARKET, CRYPTO_MARKET,
} from './market-definition';
export type { MarketDefinition, MarketHoliday } from './market-definition';
export { isMarketDate, getNextOpen, isEarlyClose } from './market-calendar';
export { getMarketForExchange, registerExchange } from './exchange-map';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/market/exchange-map.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/market/ tests/market/exchange-map.test.ts
git commit -m "feat: add exchange map and market module index"
```

---

## Task 10: Wire into ChartOptions and chart-api.ts

**Files:**
- Modify: `src/api/options.ts` — Add locale, timezone, currency fields
- Modify: `src/api/chart-api.ts` — Use new formatters
- Modify: `src/core/market-session.ts` — Use timezone module

- [ ] **Step 1: Add new fields to ChartOptions in `src/api/options.ts`**

Add three new optional fields to `ChartOptions` interface (after `theme`):

```typescript
  locale?: string;       // BCP 47 locale tag, e.g. 'en-US', 'de-DE'
  timezone?: string;     // IANA timezone, e.g. 'America/New_York', 'UTC'
  currency?: string;     // ISO 4217 currency code, e.g. 'USD', 'EUR'
```

- [ ] **Step 2: Update `timestampToMinuteOfDay` in `src/core/market-session.ts`**

Add a new overload that accepts an IANA timezone string:

```typescript
import { getTimezoneOffsetMinutes } from '../timezone/timezone';

export function timestampToMinuteOfDay(timestamp: number, utcOffsetOrTimezone: number | string = -300): number {
  const offset = typeof utcOffsetOrTimezone === 'string'
    ? getTimezoneOffsetMinutes(timestamp, utcOffsetOrTimezone)
    : utcOffsetOrTimezone;
  const totalMinutes = Math.floor(timestamp / 60) + offset;
  return ((totalMinutes % 1440) + 1440) % 1440;
}
```

- [ ] **Step 3: Refactor chart-api.ts formatting to use new modules**

In `chart-api.ts`, add imports at the top:

```typescript
import { createPriceFormatter } from '../formatting/price-formatter';
import { createTimeFormatter } from '../formatting/time-formatter';
import { formatVolume } from '../formatting/volume-formatter';
```

In the constructor or `_applyOptionsInternal`, create cached formatters:

```typescript
private _priceFormat: (price: number) => string;
private _timeFormat: (ts: number, tick: 'year' | 'month' | 'day' | 'time', crosshair?: boolean) => string;

// In constructor or options application:
this._priceFormat = this._options.priceFormatter
  ?? createPriceFormatter({
    locale: this._options.locale,
    decimals: 2,
    currency: this._options.currency,
  });

this._timeFormat = this._options.timeScale.tickMarkFormatter
  ? (ts, tick) => this._options.timeScale.tickMarkFormatter!(ts, tick)
  : createTimeFormatter({
    timezone: this._options.timezone,
    locale: this._options.locale,
  });
```

Then replace all occurrences of:
- `this._formatPrice(x)` → `this._priceFormat(x)` (but keep `_formatPrice` as a wrapper for backward compat)
- The inline `months` array + `getUTCHours/getUTCMinutes` blocks → `this._timeFormat(timestamp, tickType)` calls
- The crosshair time formatting → `this._timeFormat(timestamp, tickType, true)`
- The `_volumeFormatter.format(v)` → `formatVolume(v, this._options.locale)`

- [ ] **Step 4: Run full test suite to verify nothing is broken**

Run: `npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/options.ts src/api/chart-api.ts src/core/market-session.ts
git commit -m "feat: wire locale/timezone/currency options into chart API"
```

---

## Task 11: Update exports and package.json entry points

**Files:**
- Modify: `src/index.ts`
- Modify: `package.json`

- [ ] **Step 1: Add exports to `src/index.ts`**

Add these export blocks:

```typescript
// ─── i18n ────────────────────────────────────────────────────────────
export { t, setLocale, getLocale, registerLocale, loadLocale, enLocale } from './i18n';
export type { Translations } from './i18n';

// ─── Timezone ────────────────────────────────────────────────────────
export { timestampToDateParts, formatInTimezone, getTimezoneOffsetMinutes } from './timezone';
export type { DateParts } from './timezone';

// ─── Formatting ──────────────────────────────────────────────────────
export { createPriceFormatter, createTimeFormatter, formatVolume } from './formatting';
export type { PriceFormatterOptions, TimeFormatterOptions } from './formatting';

// ─── Currency ────────────────────────────────────────────────────────
export { getCurrencyInfo, formatCurrency, CURRENCIES } from './currency';
export type { CurrencyInfo } from './currency';

// ─── Market Definitions ─────────────────────────────────────────────
export {
  getMarket, registerMarket, getMarketForExchange, registerExchange,
  isMarketDate, getNextOpen, isEarlyClose,
  US_MARKET, UK_MARKET, JP_MARKET, DE_MARKET, AU_MARKET, CRYPTO_MARKET,
} from './market';
export type { MarketDefinition, MarketHoliday } from './market';
```

- [ ] **Step 2: Add separate entry points in `package.json` exports**

Add to the `exports` field:

```json
"./i18n": {
  "types": "./dist/i18n/index.d.ts",
  "import": "./dist/i18n/index.js"
},
"./timezone": {
  "types": "./dist/timezone/index.d.ts",
  "import": "./dist/timezone/index.js"
},
"./formatting": {
  "types": "./dist/formatting/index.d.ts",
  "import": "./dist/formatting/index.js"
},
"./currency": {
  "types": "./dist/currency/index.d.ts",
  "import": "./dist/currency/index.js"
},
"./market": {
  "types": "./dist/market/index.d.ts",
  "import": "./dist/market/index.js"
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds, new modules appear in `dist/`

Run: `npm run size`
Expected: Core bundle still under 15KB, full bundle under 20KB

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.ts package.json
git commit -m "feat: export all new modules and add package.json entry points"
```

---

## Task 12: Update Storybook documentation

**Files:**
- Modify: `stories/Docs/GettingStarted.mdx` — Add locale/timezone section
- Modify: `stories/Docs/ApiReference.mdx` — Add new types/APIs

- [ ] **Step 1: Add locale/timezone section to Getting Started**

Add after the "Chart Options" section in `stories/Docs/GettingStarted.mdx`:

```markdown
## Locale, Timezone & Currency

```ts
const chart = createChart(container, {
  locale: 'de-DE',
  timezone: 'Europe/Berlin',
  currency: 'EUR',
});
```

Price labels will use German number formatting (1.234,56), time axis will show times in Berlin timezone, and the Y-axis will include the EUR currency symbol.

### Market Definitions

```ts
import { US_MARKET, getMarketForExchange } from 'fin-charter/market';

const chart = createChart(container, {
  timezone: US_MARKET.timezone,
  currency: US_MARKET.currency,
});
```
```

- [ ] **Step 2: Add new types to API Reference doc**

Add `MarketDefinition`, `CurrencyInfo`, `DateParts`, formatting APIs to the API Reference MDX.

- [ ] **Step 3: Build Storybook to verify**

Run: `npx storybook build -o storybook-static`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add stories/Docs/
git commit -m "docs: add locale, timezone, currency and market docs to Storybook"
```

---

## Summary

| Task | Module | Tests |
|------|--------|-------|
| 1 | i18n core | 10 tests |
| 2 | Timezone | 10 tests |
| 3 | Price formatter | 9 tests |
| 4 | Time formatter | 9 tests |
| 5 | Volume formatter | 10 tests |
| 6 | Currency | 10 tests |
| 7 | Market definitions | 14 tests |
| 8 | Market calendar | 8 tests |
| 9 | Exchange map | 8 tests |
| 10 | Wire into chart-api | Existing tests |
| 11 | Exports + package.json | Build verification |
| 12 | Storybook docs | Build verification |

**Total: ~88 new unit tests across 9 test files**
