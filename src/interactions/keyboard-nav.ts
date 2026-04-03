import type { EventHandler } from './event-router';
import type { TimeScale } from '../core/time-scale';

export class KeyboardNavHandler implements EventHandler {
  private _timeScale: TimeScale;
  private _requestInvalidation: () => void;

  constructor(timeScale: TimeScale, requestInvalidation: () => void) {
    this._timeScale = timeScale;
    this._requestInvalidation = requestInvalidation;
  }

  onKeyDown(key: string, shiftKey: boolean): void {
    switch (key) {
      case 'ArrowLeft': {
        const bars = shiftKey ? 10 : 1;
        // Scroll left means showing older bars: positive scrollByPixels moves right
        this._timeScale.scrollByPixels(bars * this._timeScale.barSpacing);
        this._requestInvalidation();
        break;
      }

      case 'ArrowRight': {
        const bars = shiftKey ? 10 : 1;
        this._timeScale.scrollByPixels(-bars * this._timeScale.barSpacing);
        this._requestInvalidation();
        break;
      }

      case 'ArrowUp':
      case '+':
        // Zoom in
        this._timeScale.zoomAt(this._getCenterX(), 1.2);
        this._requestInvalidation();
        break;

      case 'ArrowDown':
      case '-':
        // Zoom out
        this._timeScale.zoomAt(this._getCenterX(), 1 / 1.2);
        this._requestInvalidation();
        break;

      case 'Home':
        // Scroll to start (oldest data)
        this._scrollToStart();
        this._requestInvalidation();
        break;

      case 'End':
        this._timeScale.scrollToEnd();
        this._requestInvalidation();
        break;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Best-effort center x — 0 means zoom around left edge if width unknown. */
  private _getCenterX(): number {
    // TimeScale doesn't expose width publicly, so we use 0 as a safe fallback.
    // Callers that want precise center zoom should override or pass width separately.
    return 0;
  }

  private _scrollToStart(): void {
    // scrollToPosition sets scrollOffset in bars.
    // A very large positive offset pushes to the leftmost available data.
    this._timeScale.scrollToPosition(Number.MAX_SAFE_INTEGER);
  }
}
