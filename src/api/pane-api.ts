import type { IPanePrimitive, AttachedParams } from '../core/types';
import type { Pane } from '../core/pane';

// ─── IPaneApi ───────────────────────────────────────────────────────────────

export interface IPaneApi {
  /** Unique pane identifier. */
  readonly id: string;
  /** Set the pane height in CSS pixels. */
  setHeight(height: number): void;
  /** Get the pane height in CSS pixels. */
  getHeight(): number;
  /** Attach a pane primitive (plugin). */
  attachPrimitive(primitive: IPanePrimitive): void;
  /** Detach a pane primitive. */
  detachPrimitive(primitive: IPanePrimitive): void;
}

// ─── PaneApi ────────────────────────────────────────────────────────────────

export class PaneApi implements IPaneApi {
  public readonly id: string;
  private _pane: Pane;
  private _primitives: IPanePrimitive[] = [];
  private _requestRepaint: () => void;

  constructor(id: string, pane: Pane, requestRepaint: () => void) {
    this.id = id;
    this._pane = pane;
    this._requestRepaint = requestRepaint;
  }

  setHeight(height: number): void {
    this._pane.height = height;
    this._requestRepaint();
  }

  getHeight(): number {
    return this._pane.height;
  }

  /** Get the internal Pane instance. */
  getPane(): Pane {
    return this._pane;
  }

  attachPrimitive(primitive: IPanePrimitive): void {
    this._primitives.push(primitive);
    const params: AttachedParams = {
      requestUpdate: () => this._requestRepaint(),
    };
    primitive.attached?.(params);
  }

  detachPrimitive(primitive: IPanePrimitive): void {
    const idx = this._primitives.indexOf(primitive);
    if (idx !== -1) {
      this._primitives.splice(idx, 1);
      primitive.detached?.();
    }
  }

  getPrimitives(): readonly IPanePrimitive[] {
    return this._primitives;
  }
}
