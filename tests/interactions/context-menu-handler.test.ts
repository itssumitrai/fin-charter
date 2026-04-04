import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextMenuHandler } from '@/interactions/context-menu-handler';
import type { ContextMenuCallbacks } from '@/interactions/context-menu-handler';

// Mock the createContextMenu function
vi.mock('@/ui/context-menu', () => ({
  createContextMenu: vi.fn(),
}));

import { createContextMenu } from '@/ui/context-menu';

function makeMockCallbacks(overrides: Partial<ContextMenuCallbacks> = {}): ContextMenuCallbacks {
  return {
    getDrawings: vi.fn(() => []),
    getIndicatorAtPane: vi.fn(() => null),
    getPaneAtY: vi.fn(() => null),
    mainPaneId: 'main',
    editDrawing: vi.fn(),
    removeDrawing: vi.fn(),
    duplicateDrawing: vi.fn(),
    bringDrawingToFront: vi.fn(),
    sendDrawingToBack: vi.fn(),
    openIndicatorSettings: vi.fn(),
    toggleIndicatorVisibility: vi.fn(),
    removeIndicator: vi.fn(),
    fitContent: vi.fn(),
    scrollToRealTime: vi.fn(),
    toggleCrosshair: vi.fn(),
    theme: { bg: '#fff', text: '#000', border: '#ccc' },
    localToScreen: vi.fn((x: number, y: number) => ({ x: x + 100, y: y + 200 })),
    ...overrides,
  };
}

describe('ContextMenuHandler', () => {
  beforeEach(() => {
    vi.mocked(createContextMenu).mockClear();
  });

  it('returns true (consumes event) on context menu', () => {
    const cb = makeMockCallbacks();
    const handler = new ContextMenuHandler(cb);

    const result = handler.onContextMenu(50, 60);
    expect(result).toBe(true);
  });

  describe('drawing context menu', () => {
    it('shows drawing menu when right-clicking on a drawing', () => {
      const mockDrawing = {
        _hitTestDrawing: vi.fn(() => ({ drawingId: 'd1', part: 'body', cursorStyle: 'move' })),
      };
      const cb = makeMockCallbacks({
        getDrawings: vi.fn(() => [{ drawing: mockDrawing as any, id: 'd1' }]),
      });
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 60);

      expect(createContextMenu).toHaveBeenCalledOnce();
      const [items, pos, theme] = vi.mocked(createContextMenu).mock.calls[0];
      expect(items).toHaveLength(5);
      expect(items.map((i: any) => i.label)).toEqual([
        'Edit', 'Duplicate', 'Remove', 'Bring to Front', 'Send to Back',
      ]);
      expect(pos).toEqual({ x: 150, y: 260 }); // localToScreen(50, 60)
      expect(theme).toEqual(cb.theme);
    });

    it('invokes correct callback when drawing menu action is triggered', () => {
      const mockDrawing = {
        _hitTestDrawing: vi.fn(() => ({ drawingId: 'd1', part: 'body', cursorStyle: 'move' })),
      };
      const cb = makeMockCallbacks({
        getDrawings: vi.fn(() => [{ drawing: mockDrawing as any, id: 'd1' }]),
      });
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 60);

      const [items] = vi.mocked(createContextMenu).mock.calls[0];
      // Trigger "Edit" action
      items[0].action();
      expect(cb.editDrawing).toHaveBeenCalledWith('d1');

      // Trigger "Remove" action
      items[2].action();
      expect(cb.removeDrawing).toHaveBeenCalledWith('d1');
    });
  });

  describe('indicator context menu', () => {
    it('shows indicator menu when right-clicking on an indicator pane', () => {
      const cb = makeMockCallbacks({
        getPaneAtY: vi.fn(() => 'pane-rsi'),
        getIndicatorAtPane: vi.fn(() => ({ id: 'rsi-1', label: 'RSI' })),
      });
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 400);

      expect(createContextMenu).toHaveBeenCalledOnce();
      const [items] = vi.mocked(createContextMenu).mock.calls[0];
      expect(items).toHaveLength(3);
      expect(items.map((i: any) => i.label)).toEqual(['Settings', 'Hide', 'Remove']);
    });

    it('invokes correct callbacks for indicator menu actions', () => {
      const cb = makeMockCallbacks({
        getPaneAtY: vi.fn(() => 'pane-rsi'),
        getIndicatorAtPane: vi.fn(() => ({ id: 'rsi-1', label: 'RSI' })),
      });
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 400);

      const [items] = vi.mocked(createContextMenu).mock.calls[0];
      items[0].action();
      expect(cb.openIndicatorSettings).toHaveBeenCalledWith('rsi-1');

      items[2].action();
      expect(cb.removeIndicator).toHaveBeenCalledWith('rsi-1');
    });

    it('does not show indicator menu for main pane', () => {
      const cb = makeMockCallbacks({
        getPaneAtY: vi.fn(() => 'main'), // mainPaneId is 'main'
      });
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 150);

      // Should fall through to chart menu
      const [items] = vi.mocked(createContextMenu).mock.calls[0];
      expect(items.map((i: any) => i.label)).toEqual([
        'Reset Zoom', 'Scroll to Latest', 'Toggle Crosshair',
      ]);
    });
  });

  describe('chart context menu (empty area)', () => {
    it('shows chart menu when right-clicking on empty area', () => {
      const cb = makeMockCallbacks();
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 60);

      expect(createContextMenu).toHaveBeenCalledOnce();
      const [items] = vi.mocked(createContextMenu).mock.calls[0];
      expect(items).toHaveLength(3);
      expect(items.map((i: any) => i.label)).toEqual([
        'Reset Zoom', 'Scroll to Latest', 'Toggle Crosshair',
      ]);
    });

    it('invokes correct callbacks for chart menu actions', () => {
      const cb = makeMockCallbacks();
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 60);

      const [items] = vi.mocked(createContextMenu).mock.calls[0];
      items[0].action();
      expect(cb.fitContent).toHaveBeenCalled();

      items[1].action();
      expect(cb.scrollToRealTime).toHaveBeenCalled();

      items[2].action();
      expect(cb.toggleCrosshair).toHaveBeenCalled();
    });
  });

  describe('priority order', () => {
    it('prioritizes drawing hit over indicator pane', () => {
      const mockDrawing = {
        _hitTestDrawing: vi.fn(() => ({ drawingId: 'd1', part: 'body', cursorStyle: 'move' })),
      };
      const cb = makeMockCallbacks({
        getDrawings: vi.fn(() => [{ drawing: mockDrawing as any, id: 'd1' }]),
        getPaneAtY: vi.fn(() => 'pane-rsi'),
        getIndicatorAtPane: vi.fn(() => ({ id: 'rsi-1', label: 'RSI' })),
      });
      const handler = new ContextMenuHandler(cb);

      handler.onContextMenu(50, 60);

      const [items] = vi.mocked(createContextMenu).mock.calls[0];
      // Should be drawing menu, not indicator menu
      expect(items[0].label).toBe('Edit');
    });
  });
});
