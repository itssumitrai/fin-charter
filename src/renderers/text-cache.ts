/**
 * TextMetricsCache — precomputes per-character widths for the ~70 characters
 * that appear in financial chart labels so that measuring a string requires
 * only a fast arithmetic sum rather than a `ctx.measureText` call.
 */

/** The set of characters pre-measured during `prepare`. */
const FINANCIAL_CHARS =
  '0123456789.,- $%:/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ';

export class TextMetricsCache {
  private _widths = new Map<string, number>();
  private _lastFont = '';
  private _ctx: CanvasRenderingContext2D | null = null;

  /**
   * Pre-measure all financial characters for the given font.
   * If the font has not changed since the last call, this is a no-op.
   */
  prepare(ctx: CanvasRenderingContext2D, font: string): void {
    if (font === this._lastFont) return;

    this._ctx = ctx;
    this._lastFont = font;
    this._widths.clear();

    const prevFont = ctx.font;
    ctx.font = font;

    for (const ch of FINANCIAL_CHARS) {
      this._widths.set(ch, ctx.measureText(ch).width);
    }

    ctx.font = prevFont;
  }

  /**
   * Return the rendered width (in the same units as `ctx.measureText`) of
   * `text` using the cached per-character widths.
   *
   * For any character not found in the cache the method falls back to a live
   * `ctx.measureText` call and caches that result for future use.
   */
  measureWidth(text: string): number {
    let total = 0;
    for (const ch of text) {
      let w = this._widths.get(ch);
      if (w === undefined) {
        // Fallback: measure live and cache for next time.
        if (this._ctx !== null) {
          const prevFont = this._ctx.font;
          if (this._lastFont) this._ctx.font = this._lastFont;
          w = this._ctx.measureText(ch).width;
          this._ctx.font = prevFont;
        } else {
          w = 0;
        }
        this._widths.set(ch, w);
      }
      total += w;
    }
    return total;
  }
}
