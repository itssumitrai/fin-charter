export interface EventHandler {
  onPointerDown?(x: number, y: number, pointerId: number): void;
  onPointerMove?(x: number, y: number, pointerId: number): void;
  onPointerUp?(pointerId: number): void;
  onWheel?(x: number, y: number, deltaY: number): void;
  onKeyDown?(key: string, shiftKey: boolean): void;
}

export class EventRouter {
  private _element: HTMLElement | null = null;
  private _handlers: EventHandler[] = [];

  // Bound listener references for proper cleanup
  private _boundPointerDown: (e: PointerEvent) => void;
  private _boundPointerMove: (e: PointerEvent) => void;
  private _boundPointerUp: (e: PointerEvent) => void;
  private _boundPointerLeave: (e: PointerEvent) => void;
  private _boundWheel: (e: WheelEvent) => void;
  private _boundKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    this._boundPointerDown = this._handlePointerDown.bind(this);
    this._boundPointerMove = this._handlePointerMove.bind(this);
    this._boundPointerUp = this._handlePointerUp.bind(this);
    this._boundPointerLeave = this._handlePointerLeave.bind(this);
    this._boundWheel = this._handleWheel.bind(this);
    this._boundKeyDown = this._handleKeyDown.bind(this);
  }

  attach(element: HTMLElement): void {
    this._element = element;
    element.style.touchAction = 'none';

    element.addEventListener('pointerdown', this._boundPointerDown);
    element.addEventListener('pointermove', this._boundPointerMove);
    element.addEventListener('pointerup', this._boundPointerUp);
    element.addEventListener('pointerleave', this._boundPointerLeave);
    element.addEventListener('wheel', this._boundWheel, { passive: false });

    // Key events require tabIndex and focus
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
    element.addEventListener('keydown', this._boundKeyDown);
  }

  detach(): void {
    const el = this._element;
    if (!el) return;

    el.removeEventListener('pointerdown', this._boundPointerDown);
    el.removeEventListener('pointermove', this._boundPointerMove);
    el.removeEventListener('pointerup', this._boundPointerUp);
    el.removeEventListener('pointerleave', this._boundPointerLeave);
    el.removeEventListener('wheel', this._boundWheel);
    el.removeEventListener('keydown', this._boundKeyDown);

    this._element = null;
  }

  addHandler(handler: EventHandler): void {
    this._handlers.push(handler);
  }

  removeHandler(handler: EventHandler): void {
    const idx = this._handlers.indexOf(handler);
    if (idx !== -1) {
      this._handlers.splice(idx, 1);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _getLocalCoords(e: PointerEvent): { x: number; y: number } {
    const el = this._element;
    if (!el) return { x: e.clientX, y: e.clientY };
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private _handlePointerDown(e: PointerEvent): void {
    const { x, y } = this._getLocalCoords(e);
    for (const h of this._handlers) {
      h.onPointerDown?.(x, y, e.pointerId);
    }
  }

  private _handlePointerMove(e: PointerEvent): void {
    const { x, y } = this._getLocalCoords(e);
    for (const h of this._handlers) {
      h.onPointerMove?.(x, y, e.pointerId);
    }
  }

  private _handlePointerUp(e: PointerEvent): void {
    for (const h of this._handlers) {
      h.onPointerUp?.(e.pointerId);
    }
  }

  private _handlePointerLeave(e: PointerEvent): void {
    for (const h of this._handlers) {
      h.onPointerUp?.(e.pointerId);
    }
  }

  private _handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const el = this._element;
    let x = e.clientX;
    let y = e.clientY;
    if (el) {
      const rect = el.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    for (const h of this._handlers) {
      h.onWheel?.(x, y, e.deltaY);
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    for (const h of this._handlers) {
      h.onKeyDown?.(e.key, e.shiftKey);
    }
  }
}
