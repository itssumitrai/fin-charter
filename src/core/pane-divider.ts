const MIN_PANE_HEIGHT = 50;
export const DIVIDER_HEIGHT = 4;

/**
 * A draggable divider between two adjacent panes.
 * On drag, redistributes height between the panes above and below.
 */
export class PaneDivider {
  public readonly el: HTMLDivElement;

  private _getAboveHeight: () => number;
  private _setAboveHeight: (h: number) => void;
  private _getBelowHeight: () => number;
  private _setBelowHeight: (h: number) => void;
  private _onResize: () => void;

  private _dragging = false;
  private _startY = 0;
  private _startAboveH = 0;
  private _startBelowH = 0;

  constructor(
    getAboveHeight: () => number,
    setAboveHeight: (h: number) => void,
    getBelowHeight: () => number,
    setBelowHeight: (h: number) => void,
    onResize: () => void,
  ) {
    this._getAboveHeight = getAboveHeight;
    this._setAboveHeight = setAboveHeight;
    this._getBelowHeight = getBelowHeight;
    this._setBelowHeight = setBelowHeight;
    this._onResize = onResize;

    this.el = document.createElement('div');
    this.el.style.width = '100%';
    this.el.style.height = `${DIVIDER_HEIGHT}px`;
    this.el.style.cursor = 'row-resize';
    this.el.style.backgroundColor = 'rgba(255,255,255,0.06)';
    this.el.style.flexShrink = '0';

    this.el.addEventListener('pointerdown', this._onPointerDown);
  }

  destroy(): void {
    this.el.removeEventListener('pointerdown', this._onPointerDown);
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  }

  private _onPointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    this._dragging = true;
    this._startY = e.clientY;
    this._startAboveH = this._getAboveHeight();
    this._startBelowH = this._getBelowHeight();

    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragging) return;

    const delta = e.clientY - this._startY;
    const total = this._startAboveH + this._startBelowH;

    let newAbove = this._startAboveH + delta;
    let newBelow = this._startBelowH - delta;

    // Enforce minimums
    if (newAbove < MIN_PANE_HEIGHT) {
      newAbove = MIN_PANE_HEIGHT;
      newBelow = total - MIN_PANE_HEIGHT;
    }
    if (newBelow < MIN_PANE_HEIGHT) {
      newBelow = MIN_PANE_HEIGHT;
      newAbove = total - MIN_PANE_HEIGHT;
    }

    this._setAboveHeight(newAbove);
    this._setBelowHeight(newBelow);
    this._onResize();
  };

  private _onPointerUp = (): void => {
    this._dragging = false;
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  };
}
