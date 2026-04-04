import { describe, it, expect, vi } from 'vitest';
import { PaneApi } from '@/api/pane-api';
import type { IPanePrimitive, AttachedParams } from '@/core/types';

// Minimal mock of the internal Pane class
function createMockPane(initialHeight = 200) {
  return {
    id: 'pane-mock',
    height: initialHeight,
    row: document.createElement('div'),
    canvases: {},
    priceScale: {},
    leftPriceScale: {},
  } as unknown as import('@/core/pane').Pane;
}

describe('PaneApi', () => {
  // ── Construction ──────────────────────────────────────────────────────────

  it('stores the id from constructor', () => {
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, vi.fn());
    expect(api.id).toBe('pane-1');
  });

  // ── Height management ─────────────────────────────────────────────────────

  it('getHeight returns the internal pane height', () => {
    const pane = createMockPane(300);
    const api = new PaneApi('pane-1', pane, vi.fn());
    expect(api.getHeight()).toBe(300);
  });

  it('setHeight updates height and calls requestRepaint', () => {
    const repaint = vi.fn();
    const pane = createMockPane(200);
    const api = new PaneApi('pane-1', pane, repaint);

    api.setHeight(400);
    expect(api.getHeight()).toBe(400);
    expect(repaint).toHaveBeenCalledOnce();
  });

  it('setHeight can be called multiple times', () => {
    const repaint = vi.fn();
    const pane = createMockPane(100);
    const api = new PaneApi('pane-1', pane, repaint);

    api.setHeight(150);
    api.setHeight(250);
    expect(api.getHeight()).toBe(250);
    expect(repaint).toHaveBeenCalledTimes(2);
  });

  // ── getPane ───────────────────────────────────────────────────────────────

  it('getPane returns the internal Pane instance', () => {
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, vi.fn());
    expect(api.getPane()).toBe(pane);
  });

  // ── Primitive attachment ──────────────────────────────────────────────────

  it('attachPrimitive adds primitive and calls attached()', () => {
    const repaint = vi.fn();
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, repaint);

    const attachedFn = vi.fn();
    const primitive: IPanePrimitive = {
      attached: attachedFn,
    };

    api.attachPrimitive(primitive);

    expect(attachedFn).toHaveBeenCalledOnce();
    // attached receives an object with requestUpdate
    const params: AttachedParams = attachedFn.mock.calls[0][0];
    expect(typeof params.requestUpdate).toBe('function');

    expect(api.getPrimitives()).toContain(primitive);
  });

  it('attachPrimitive provides requestUpdate that calls requestRepaint', () => {
    const repaint = vi.fn();
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, repaint);

    const attachedFn = vi.fn();
    const primitive: IPanePrimitive = { attached: attachedFn };

    api.attachPrimitive(primitive);

    const params: AttachedParams = attachedFn.mock.calls[0][0];
    params.requestUpdate();
    expect(repaint).toHaveBeenCalled();
  });

  it('attachPrimitive works when primitive has no attached method', () => {
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, vi.fn());
    const primitive: IPanePrimitive = {};

    // Should not throw
    api.attachPrimitive(primitive);
    expect(api.getPrimitives()).toContain(primitive);
  });

  it('detachPrimitive removes primitive and calls detached()', () => {
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, vi.fn());

    const detachedFn = vi.fn();
    const primitive: IPanePrimitive = {
      attached: vi.fn(),
      detached: detachedFn,
    };

    api.attachPrimitive(primitive);
    expect(api.getPrimitives()).toHaveLength(1);

    api.detachPrimitive(primitive);
    expect(api.getPrimitives()).toHaveLength(0);
    expect(detachedFn).toHaveBeenCalledOnce();
  });

  it('detachPrimitive is a no-op for non-attached primitive', () => {
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, vi.fn());

    const primitive: IPanePrimitive = { detached: vi.fn() };
    api.detachPrimitive(primitive);
    expect(primitive.detached).not.toHaveBeenCalled();
  });

  it('detachPrimitive works when primitive has no detached method', () => {
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, vi.fn());

    const primitive: IPanePrimitive = { attached: vi.fn() };
    api.attachPrimitive(primitive);

    // Should not throw
    api.detachPrimitive(primitive);
    expect(api.getPrimitives()).toHaveLength(0);
  });

  it('getPrimitives returns readonly list of attached primitives', () => {
    const pane = createMockPane();
    const api = new PaneApi('pane-1', pane, vi.fn());

    const p1: IPanePrimitive = {};
    const p2: IPanePrimitive = {};
    api.attachPrimitive(p1);
    api.attachPrimitive(p2);

    const primitives = api.getPrimitives();
    expect(primitives).toHaveLength(2);
    expect(primitives[0]).toBe(p1);
    expect(primitives[1]).toBe(p2);
  });
});
