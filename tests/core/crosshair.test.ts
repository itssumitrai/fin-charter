import { describe, it, expect, beforeEach } from 'vitest';
import { Crosshair } from '@/core/crosshair';

describe('Crosshair', () => {
  let ch: Crosshair;

  beforeEach(() => {
    ch = new Crosshair();
  });

  it('starts invisible', () => {
    expect(ch.visible).toBe(false);
  });

  it('update makes the crosshair visible', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 123.45, time: 1700000000 });
    expect(ch.visible).toBe(true);
  });

  it('update sets all properties correctly', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 123.45, time: 1700000000 });
    expect(ch.x).toBe(100);
    expect(ch.y).toBe(200);
    expect(ch.barIndex).toBe(5);
    expect(ch.price).toBeCloseTo(123.45);
    expect(ch.time).toBe(1700000000);
  });

  it('hide makes the crosshair invisible', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 123.45, time: 1700000000 });
    ch.hide();
    expect(ch.visible).toBe(false);
  });

  it('hide does not clear the other properties', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 123.45, time: 1700000000 });
    ch.hide();
    // Properties are still there even when invisible
    expect(ch.x).toBe(100);
    expect(ch.barIndex).toBe(5);
  });

  it('snappedX returns snappedX when provided', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 10, time: 0, snappedX: 105 });
    expect(ch.snappedX).toBe(105);
  });

  it('snappedX falls back to x when not provided', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 10, time: 0 });
    expect(ch.snappedX).toBe(100);
  });

  it('multiple update calls overwrite previous state', () => {
    ch.update({ x: 50, y: 60, barIndex: 1, price: 10, time: 100 });
    ch.update({ x: 150, y: 160, barIndex: 9, price: 99, time: 200 });
    expect(ch.x).toBe(150);
    expect(ch.barIndex).toBe(9);
    expect(ch.time).toBe(200);
  });

  it('can be hidden and then re-shown', () => {
    ch.update({ x: 50, y: 60, barIndex: 1, price: 10, time: 100 });
    ch.hide();
    expect(ch.visible).toBe(false);
    ch.update({ x: 70, y: 80, barIndex: 2, price: 20, time: 200 });
    expect(ch.visible).toBe(true);
  });

  it('sourcePaneId defaults to empty string', () => {
    expect(ch.sourcePaneId).toBe('');
  });

  it('update sets sourcePaneId when provided', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 10, time: 0, sourcePaneId: 'pane-1' });
    expect(ch.sourcePaneId).toBe('pane-1');
  });

  it('update preserves sourcePaneId when not provided', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 10, time: 0, sourcePaneId: 'pane-1' });
    ch.update({ x: 150, y: 250, barIndex: 6, price: 20, time: 1 });
    expect(ch.sourcePaneId).toBe('pane-1');
  });

  it('sourcePaneId updates when switching panes', () => {
    ch.update({ x: 100, y: 200, barIndex: 5, price: 10, time: 0, sourcePaneId: 'main' });
    expect(ch.sourcePaneId).toBe('main');
    ch.update({ x: 100, y: 50, barIndex: 5, price: 80, time: 0, sourcePaneId: 'pane-1' });
    expect(ch.sourcePaneId).toBe('pane-1');
  });
});
