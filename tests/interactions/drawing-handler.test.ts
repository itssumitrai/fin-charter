import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingHandler } from '@/interactions/drawing-handler';
import type { DrawingHandlerCallbacks } from '@/interactions/drawing-handler';

// Mock the DRAWING_REGISTRY
vi.mock('@/drawings/index', () => ({
  DRAWING_REGISTRY: new Map(),
}));

import { DRAWING_REGISTRY } from '@/drawings/index';

function makeMockCallbacks(overrides: Partial<DrawingHandlerCallbacks> = {}): DrawingHandlerCallbacks {
  return {
    getDrawings: vi.fn(() => []),
    getDrawingContext: vi.fn(() => null),
    onDrawingCreated: vi.fn(),
    onDrawingUpdated: vi.fn(),
    xToTime: vi.fn((x: number) => x), // identity for simplicity
    yToPrice: vi.fn((y: number) => y),
    ...overrides,
  };
}

function makeMockDrawing(id: string, requiredPoints: number = 2) {
  return {
    drawingType: 'trendline',
    requiredPoints,
    points: [] as { time: number; price: number }[],
    options: {},
    selected: false,
    id,
    serialize: vi.fn(),
    drawingHitTest: vi.fn(() => null),
    setContext: vi.fn(),
    _hitTestDrawing: vi.fn(() => null),
  };
}

describe('DrawingHandler', () => {
  let cb: DrawingHandlerCallbacks;
  let handler: DrawingHandler;

  beforeEach(() => {
    cb = makeMockCallbacks();
    handler = new DrawingHandler(cb);
    vi.mocked(DRAWING_REGISTRY).clear();
  });

  describe('initial state', () => {
    it('starts in IDLE state', () => {
      expect(handler.state).toBe('IDLE');
    });
  });

  describe('setActiveToolType', () => {
    it('transitions to PLACING when a tool type is set', () => {
      handler.setActiveToolType('trendline');
      expect(handler.state).toBe('PLACING');
    });

    it('transitions back to IDLE when tool type is cleared from PLACING', () => {
      handler.setActiveToolType('trendline');
      handler.setActiveToolType(null);
      expect(handler.state).toBe('IDLE');
    });

    it('does not change state if clearing tool when not in PLACING', () => {
      // State is IDLE, clearing should keep it IDLE
      handler.setActiveToolType(null);
      expect(handler.state).toBe('IDLE');
    });
  });

  describe('placement flow', () => {
    it('creates a drawing on first click with registered factory', () => {
      const mockDrawing = makeMockDrawing('test-1', 2);
      mockDrawing.points = [{ time: 50, price: 100 }];
      const factory = vi.fn(() => mockDrawing);
      DRAWING_REGISTRY.set('trendline', factory as any);

      handler.setActiveToolType('trendline');
      const consumed = handler.onPointerDown(50, 100, 1);

      expect(consumed).toBe(true);
      expect(factory).toHaveBeenCalled();
      expect(cb.onDrawingCreated).toHaveBeenCalledWith(mockDrawing);
    });

    it('returns false if factory is not registered', () => {
      handler.setActiveToolType('unknown-tool');
      const consumed = handler.onPointerDown(50, 100, 1);

      expect(consumed).toBe(false);
      expect(cb.onDrawingCreated).not.toHaveBeenCalled();
    });

    it('finalizes single-point drawing immediately', () => {
      const mockDrawing = makeMockDrawing('test-1', 1);
      mockDrawing.points = [{ time: 50, price: 100 }];
      const factory = vi.fn(() => mockDrawing);
      DRAWING_REGISTRY.set('hline', factory as any);

      handler.setActiveToolType('hline');
      handler.onPointerDown(50, 100, 1);

      expect(cb.onDrawingCreated).toHaveBeenCalledWith(mockDrawing);
      // Should still be in PLACING for next drawing of same type
      expect(handler.state).toBe('PLACING');
    });

    it('updates preview point on pointer move during placement', () => {
      const mockDrawing = makeMockDrawing('test-1', 2);
      mockDrawing.points = [{ time: 50, price: 100 }, { time: 50, price: 100 }];
      const factory = vi.fn(() => mockDrawing);
      DRAWING_REGISTRY.set('trendline', factory as any);

      handler.setActiveToolType('trendline');
      handler.onPointerDown(50, 100, 1); // first point

      const moveConsumed = handler.onPointerMove(80, 150, 1);

      expect(moveConsumed).toBe(true);
      expect(mockDrawing.points[1]).toEqual({ time: 80, price: 150 });
      expect(cb.onDrawingUpdated).toHaveBeenCalled();
    });

    it('finalizes two-point drawing on second click', () => {
      const mockDrawing = makeMockDrawing('test-1', 2);
      mockDrawing.points = [{ time: 50, price: 100 }, { time: 50, price: 100 }];
      const factory = vi.fn(() => mockDrawing);
      DRAWING_REGISTRY.set('trendline', factory as any);

      handler.setActiveToolType('trendline');
      handler.onPointerDown(50, 100, 1); // first point
      handler.onPointerDown(80, 150, 1); // second point - finalize

      expect(mockDrawing.points[1]).toEqual({ time: 80, price: 150 });
      expect(cb.onDrawingUpdated).toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('cancels placement and returns to IDLE', () => {
      handler.setActiveToolType('trendline');
      expect(handler.state).toBe('PLACING');

      const consumed = handler.onKeyDown('Escape', false);

      expect(consumed).toBe(true);
      expect(handler.state).toBe('IDLE');
      expect(cb.onDrawingUpdated).toHaveBeenCalled();
    });

    it('deselects selected drawing and returns to IDLE', () => {
      // Set up a selected drawing via hit test
      const mockDrawing = makeMockDrawing('d1', 2);
      mockDrawing.selected = true;
      mockDrawing.points = [{ time: 10, price: 20 }, { time: 30, price: 40 }];
      mockDrawing.drawingHitTest = vi.fn(() => ({
        drawingId: 'd1', part: 'body' as const, cursorStyle: 'move',
      }));

      const drawings = [mockDrawing as any];
      cb = makeMockCallbacks({ getDrawings: vi.fn(() => drawings) });
      handler = new DrawingHandler(cb);

      // Click to select
      handler.onPointerDown(15, 25, 1);
      handler.onPointerUp(1);

      // Escape to deselect
      const consumed = handler.onKeyDown('Escape', false);

      expect(consumed).toBe(true);
      expect(mockDrawing.selected).toBe(false);
      expect(handler.state).toBe('IDLE');
    });

    it('does nothing in IDLE with no selection', () => {
      const consumed = handler.onKeyDown('Escape', false);
      expect(consumed).toBe(false);
    });
  });

  describe('Delete/Backspace key', () => {
    it('deselects and updates when a drawing is selected', () => {
      const mockDrawing = makeMockDrawing('d1', 2);
      mockDrawing.points = [{ time: 10, price: 20 }, { time: 30, price: 40 }];
      mockDrawing.drawingHitTest = vi.fn(() => ({
        drawingId: 'd1', part: 'body' as const, cursorStyle: 'move',
      }));

      cb = makeMockCallbacks({ getDrawings: vi.fn(() => [mockDrawing as any]) });
      handler = new DrawingHandler(cb);

      handler.onPointerDown(15, 25, 1);
      handler.onPointerUp(1);

      const consumed = handler.onKeyDown('Delete', false);

      expect(consumed).toBe(true);
      expect(mockDrawing.selected).toBe(false);
      expect(handler.state).toBe('IDLE');
    });

    it('Backspace also triggers delete behavior', () => {
      const mockDrawing = makeMockDrawing('d1', 2);
      mockDrawing.points = [{ time: 10, price: 20 }, { time: 30, price: 40 }];
      mockDrawing.drawingHitTest = vi.fn(() => ({
        drawingId: 'd1', part: 'body' as const, cursorStyle: 'move',
      }));

      cb = makeMockCallbacks({ getDrawings: vi.fn(() => [mockDrawing as any]) });
      handler = new DrawingHandler(cb);

      handler.onPointerDown(15, 25, 1);
      handler.onPointerUp(1);

      const consumed = handler.onKeyDown('Backspace', false);
      expect(consumed).toBe(true);
    });

    it('does nothing when no drawing is selected', () => {
      const consumed = handler.onKeyDown('Delete', false);
      expect(consumed).toBe(false);
    });
  });

  describe('selection and editing flow', () => {
    it('selects a drawing on click when hit test matches', () => {
      const mockDrawing = makeMockDrawing('d1', 2);
      mockDrawing.points = [{ time: 10, price: 20 }, { time: 30, price: 40 }];
      mockDrawing.drawingHitTest = vi.fn(() => ({
        drawingId: 'd1', part: 'body' as const, cursorStyle: 'move',
      }));

      cb = makeMockCallbacks({ getDrawings: vi.fn(() => [mockDrawing as any]) });
      handler = new DrawingHandler(cb);

      const consumed = handler.onPointerDown(15, 25, 1);

      expect(consumed).toBe(true);
      expect(mockDrawing.selected).toBe(true);
      expect(handler.state).toBe('EDITING');
      expect(cb.onDrawingUpdated).toHaveBeenCalled();
    });

    it('deselects drawing when clicking on empty area', () => {
      const mockDrawing = makeMockDrawing('d1', 2);
      mockDrawing.points = [{ time: 10, price: 20 }, { time: 30, price: 40 }];
      mockDrawing.drawingHitTest = vi.fn()
        .mockReturnValueOnce({ drawingId: 'd1', part: 'body', cursorStyle: 'move' })
        .mockReturnValueOnce(null); // second click misses

      cb = makeMockCallbacks({ getDrawings: vi.fn(() => [mockDrawing as any]) });
      handler = new DrawingHandler(cb);

      handler.onPointerDown(15, 25, 1); // select
      handler.onPointerUp(1);

      handler.onPointerDown(500, 500, 1); // click empty area

      expect(mockDrawing.selected).toBe(false);
      expect(handler.state).toBe('IDLE');
    });

    it('transitions to SELECTING after pointer up from EDITING', () => {
      const mockDrawing = makeMockDrawing('d1', 2);
      mockDrawing.points = [{ time: 10, price: 20 }, { time: 30, price: 40 }];
      mockDrawing.drawingHitTest = vi.fn(() => ({
        drawingId: 'd1', part: 'body' as const, cursorStyle: 'move',
      }));

      cb = makeMockCallbacks({ getDrawings: vi.fn(() => [mockDrawing as any]) });
      handler = new DrawingHandler(cb);

      handler.onPointerDown(15, 25, 1);
      expect(handler.state).toBe('EDITING');

      handler.onPointerUp(1);
      expect(handler.state).toBe('SELECTING');
    });
  });

  describe('pointer events passthrough', () => {
    it('onPointerDown returns false when nothing is hit in IDLE', () => {
      const consumed = handler.onPointerDown(100, 100, 1);
      expect(consumed).toBe(false);
    });

    it('onPointerMove returns false when not placing or editing', () => {
      const consumed = handler.onPointerMove(100, 100, 1);
      expect(consumed).toBe(false);
    });

    it('onPointerUp returns false when not in EDITING state', () => {
      const consumed = handler.onPointerUp(1);
      expect(consumed).toBe(false);
    });
  });
});
