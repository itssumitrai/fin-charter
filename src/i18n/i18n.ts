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
