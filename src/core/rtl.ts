/**
 * RTL (Right-to-Left) layout utilities.
 *
 * When RTL mode is active:
 * - Price scale flips to the opposite side
 * - Time axis labels flow right-to-left
 * - Tooltips, legends, and context menus mirror horizontally
 * - CSS logical properties used throughout Svelte components
 */

export type TextDirection = 'ltr' | 'rtl';

/**
 * Detect text direction from a locale string.
 * Returns 'rtl' for Arabic, Hebrew, Persian, Urdu, and other RTL locales.
 */
export function detectDirection(locale: string): TextDirection {
  const lang = locale.split('-')[0].toLowerCase();
  const rtlLanguages = new Set([
    'ar', // Arabic
    'he', // Hebrew
    'fa', // Persian
    'ur', // Urdu
    'ps', // Pashto
    'sd', // Sindhi
    'yi', // Yiddish
    'dv', // Divehi
    'ku', // Kurdish (Sorani)
    'ug', // Uyghur
  ]);
  return rtlLanguages.has(lang) ? 'rtl' : 'ltr';
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
export function textAlign(align: 'start' | 'end', isRTL: boolean): 'left' | 'right' {
  if (align === 'start') return isRTL ? 'right' : 'left';
  return isRTL ? 'left' : 'right';
}
