/**
 * Command pattern undo/redo stack.
 *
 * Each command has an `execute()` and `undo()` method. Commands are pushed
 * onto the undo stack when executed, and moved between undo/redo stacks
 * as the user navigates history.
 */

export interface Command {
  /** Human-readable description for UI. */
  readonly label: string;
  /** Execute (or re-execute) the command. */
  execute(): void;
  /** Reverse the command. */
  undo(): void;
}

export type UndoRedoChangeCallback = () => void;

export class UndoRedoManager {
  private _undoStack: Command[] = [];
  private _redoStack: Command[] = [];
  private _maxDepth: number;
  private _changeCallbacks: UndoRedoChangeCallback[] = [];

  constructor(maxDepth = 50) {
    this._maxDepth = maxDepth;
  }

  /** Push and execute a command. Clears the redo stack. */
  execute(command: Command): void {
    command.execute();
    this._undoStack.push(command);
    this._redoStack.length = 0;

    // Enforce max depth
    if (this._undoStack.length > this._maxDepth) {
      this._undoStack.shift();
    }
    this._notifyChange();
  }

  /** Undo the last command. */
  undo(): boolean {
    const cmd = this._undoStack.pop();
    if (!cmd) return false;
    cmd.undo();
    this._redoStack.push(cmd);
    this._notifyChange();
    return true;
  }

  /** Redo the last undone command. */
  redo(): boolean {
    const cmd = this._redoStack.pop();
    if (!cmd) return false;
    cmd.execute();
    this._undoStack.push(cmd);
    this._notifyChange();
    return true;
  }

  /** Whether undo is available. */
  canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /** Whether redo is available. */
  canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  /** Clear both stacks (e.g., on symbol change). */
  clear(): void {
    this._undoStack.length = 0;
    this._redoStack.length = 0;
    this._notifyChange();
  }

  /** Number of undo-able commands. */
  get undoSize(): number {
    return this._undoStack.length;
  }

  /** Number of redo-able commands. */
  get redoSize(): number {
    return this._redoStack.length;
  }

  /** Get the configured max depth. */
  get maxDepth(): number {
    return this._maxDepth;
  }

  /** Subscribe to changes in undo/redo availability. */
  onChange(callback: UndoRedoChangeCallback): void {
    this._changeCallbacks.push(callback);
  }

  /** Unsubscribe from changes. */
  offChange(callback: UndoRedoChangeCallback): void {
    const idx = this._changeCallbacks.indexOf(callback);
    if (idx >= 0) this._changeCallbacks.splice(idx, 1);
  }

  private _notifyChange(): void {
    for (const cb of this._changeCallbacks) cb();
  }
}
