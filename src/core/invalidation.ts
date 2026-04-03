import { InvalidationLevel, type InvalidationLevelValue } from './types';

export class InvalidateMask {
  /** Map from pane id → highest invalidation level for that pane. */
  private _levels = new Map<string, InvalidationLevelValue>();

  /** Register a pane (starts at None). */
  addPane(id: string): void {
    if (!this._levels.has(id)) {
      this._levels.set(id, InvalidationLevel.None);
    }
  }

  /** Remove a pane from tracking. */
  removePane(id: string): void {
    this._levels.delete(id);
  }

  /**
   * Set the invalidation level for a pane.
   * Keeps whichever value is higher (existing vs. requested).
   */
  invalidate(paneId: string, level: InvalidationLevelValue): void {
    const current = this._levels.get(paneId) ?? InvalidationLevel.None;
    this._levels.set(paneId, Math.max(current, level) as InvalidationLevelValue);
  }

  /** Apply `level` to every tracked pane. */
  invalidateAll(level: InvalidationLevelValue): void {
    for (const id of this._levels.keys()) {
      this.invalidate(id, level);
    }
  }

  /** Return the current invalidation level for a pane. */
  level(paneId: string): InvalidationLevelValue {
    return this._levels.get(paneId) ?? InvalidationLevel.None;
  }

  /** True if at least one pane has a level above None. */
  needsRepaint(): boolean {
    for (const lvl of this._levels.values()) {
      if (lvl > InvalidationLevel.None) return true;
    }
    return false;
  }

  /** Return all tracked pane ids. */
  paneIds(): string[] {
    return Array.from(this._levels.keys());
  }

  /** Reset all pane levels back to None. */
  reset(): void {
    for (const id of this._levels.keys()) {
      this._levels.set(id, InvalidationLevel.None);
    }
  }
}
