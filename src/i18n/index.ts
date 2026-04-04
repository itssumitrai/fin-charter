export { t, setLocale, getLocale, registerLocale, loadLocale } from './i18n';
export type { Translations } from './i18n';
export { default as enLocale } from './locales/en';

// Auto-register English locale so t() works without manual setup
import { registerLocale } from './i18n';
import en from './locales/en';
registerLocale('en', en);
