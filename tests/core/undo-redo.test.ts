import { describe, it, expect, vi } from 'vitest';
import { UndoRedoManager } from '@/core/undo-redo';
import type { Command } from '@/core/undo-redo';

function makeCommand(label: string): Command & { executeCalls: number; undoCalls: number } {
  const cmd = {
    label,
    executeCalls: 0,
    undoCalls: 0,
    execute: vi.fn(() => { cmd.executeCalls++; }),
    undo: vi.fn(() => { cmd.undoCalls++; }),
  };
  return cmd;
}

describe('UndoRedoManager', () => {
  describe('execute', () => {
    it('executes a command', () => {
      const mgr = new UndoRedoManager();
      const cmd = makeCommand('add drawing');
      mgr.execute(cmd);
      expect(cmd.execute).toHaveBeenCalledOnce();
    });

    it('makes undo available', () => {
      const mgr = new UndoRedoManager();
      expect(mgr.canUndo()).toBe(false);
      mgr.execute(makeCommand('test'));
      expect(mgr.canUndo()).toBe(true);
    });

    it('clears redo stack', () => {
      const mgr = new UndoRedoManager();
      mgr.execute(makeCommand('1'));
      mgr.undo();
      expect(mgr.canRedo()).toBe(true);
      mgr.execute(makeCommand('2'));
      expect(mgr.canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('reverses the last command', () => {
      const mgr = new UndoRedoManager();
      const cmd = makeCommand('add');
      mgr.execute(cmd);
      const result = mgr.undo();
      expect(result).toBe(true);
      expect(cmd.undo).toHaveBeenCalledOnce();
    });

    it('returns false when nothing to undo', () => {
      const mgr = new UndoRedoManager();
      expect(mgr.undo()).toBe(false);
    });

    it('undoes commands in reverse order', () => {
      const mgr = new UndoRedoManager();
      const order: string[] = [];
      const cmd1: Command = {
        label: '1',
        execute: () => {},
        undo: () => order.push('undo-1'),
      };
      const cmd2: Command = {
        label: '2',
        execute: () => {},
        undo: () => order.push('undo-2'),
      };
      mgr.execute(cmd1);
      mgr.execute(cmd2);
      mgr.undo();
      mgr.undo();
      expect(order).toEqual(['undo-2', 'undo-1']);
    });
  });

  describe('redo', () => {
    it('re-executes the last undone command', () => {
      const mgr = new UndoRedoManager();
      const cmd = makeCommand('add');
      mgr.execute(cmd);
      mgr.undo();
      const result = mgr.redo();
      expect(result).toBe(true);
      expect(cmd.executeCalls).toBe(2); // once for execute, once for redo
    });

    it('returns false when nothing to redo', () => {
      const mgr = new UndoRedoManager();
      expect(mgr.redo()).toBe(false);
    });
  });

  describe('canUndo / canRedo', () => {
    it('tracks availability correctly through operations', () => {
      const mgr = new UndoRedoManager();
      expect(mgr.canUndo()).toBe(false);
      expect(mgr.canRedo()).toBe(false);

      mgr.execute(makeCommand('1'));
      expect(mgr.canUndo()).toBe(true);
      expect(mgr.canRedo()).toBe(false);

      mgr.undo();
      expect(mgr.canUndo()).toBe(false);
      expect(mgr.canRedo()).toBe(true);

      mgr.redo();
      expect(mgr.canUndo()).toBe(true);
      expect(mgr.canRedo()).toBe(false);
    });
  });

  describe('clear', () => {
    it('empties both stacks', () => {
      const mgr = new UndoRedoManager();
      mgr.execute(makeCommand('1'));
      mgr.execute(makeCommand('2'));
      mgr.undo();
      expect(mgr.canUndo()).toBe(true);
      expect(mgr.canRedo()).toBe(true);

      mgr.clear();
      expect(mgr.canUndo()).toBe(false);
      expect(mgr.canRedo()).toBe(false);
      expect(mgr.undoSize).toBe(0);
      expect(mgr.redoSize).toBe(0);
    });
  });

  describe('max depth', () => {
    it('enforces configurable max depth', () => {
      const mgr = new UndoRedoManager(3);
      expect(mgr.maxDepth).toBe(3);

      mgr.execute(makeCommand('1'));
      mgr.execute(makeCommand('2'));
      mgr.execute(makeCommand('3'));
      mgr.execute(makeCommand('4'));
      expect(mgr.undoSize).toBe(3); // oldest was dropped
    });

    it('defaults to 50', () => {
      const mgr = new UndoRedoManager();
      expect(mgr.maxDepth).toBe(50);
    });
  });

  describe('onChange', () => {
    it('fires callback on execute, undo, redo, clear', () => {
      const mgr = new UndoRedoManager();
      const cb = vi.fn();
      mgr.onChange(cb);

      mgr.execute(makeCommand('1'));
      expect(cb).toHaveBeenCalledTimes(1);

      mgr.undo();
      expect(cb).toHaveBeenCalledTimes(2);

      mgr.redo();
      expect(cb).toHaveBeenCalledTimes(3);

      mgr.clear();
      expect(cb).toHaveBeenCalledTimes(4);
    });

    it('supports offChange to remove callback', () => {
      const mgr = new UndoRedoManager();
      const cb = vi.fn();
      mgr.onChange(cb);
      mgr.offChange(cb);

      mgr.execute(makeCommand('1'));
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('undoSize / redoSize', () => {
    it('tracks stack sizes', () => {
      const mgr = new UndoRedoManager();
      expect(mgr.undoSize).toBe(0);
      expect(mgr.redoSize).toBe(0);

      mgr.execute(makeCommand('1'));
      mgr.execute(makeCommand('2'));
      expect(mgr.undoSize).toBe(2);

      mgr.undo();
      expect(mgr.undoSize).toBe(1);
      expect(mgr.redoSize).toBe(1);
    });
  });
});
