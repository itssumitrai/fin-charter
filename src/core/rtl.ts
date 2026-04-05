/**
 * RTL (Right-to-Left) layout building blocks.
 *
 * These utilities provide the foundation for RTL support. Chart-level
 * integration (price axis flip, time axis mirroring, tooltip/menu layout)
 * uses these helpers when the `direction` option is set.
 */

export type TextDirection = 'ltr' | 'rtl';

/**
 * Languages that use right-to-left script by default.
 * Kurdish (ku) is excluded because it depends on script variant
 * (ku-Arab/Sorani is RTL, ku-Latn is LTR). Use 'ckb' for Sorani.
 */
const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian
  'ur', // Urdu
  'ps', // Pashto
  'sd', // Sindhi
  'yi', // Yiddish
  'dv', // Divehi
  'ckb', // Central Kurdish (Sorani)
  'ug', // Uyghur
]);

/**
 * Detect text direction from a locale string.
 * Returns 'rtl' for Arabic, Hebrew, Persian, Urdu, and other RTL locales.
 */
export function detectDirection(locale: string): TextDirection {
  const lang = locale.split('-')[0].toLowerCase();
  return RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
}

/**
 * Mirror an X coordinate for RTL layout.
 * In RTL mode, x=0 becomes x=width and vice versa.
 */
export function mirrorX(x: number, width: number, isRTL: boolean): number {
  return isRTL ? width - x : x;
}

/**
 * Get the CSS text-align value for the current direction.
 */
export function resolveTextAlign(align: 'start' | 'end', isRTL: boolean): 'left' | 'right' {
  if (align === 'start') return isRTL ? 'right' : 'left';
  return isRTL ? 'left' : 'right';
}
