import { describe, it, expect, beforeEach } from 'vitest';
import { InvalidateMask } from '@/core/invalidation';
import { InvalidationLevel } from '@/core/types';

describe('InvalidateMask', () => {
  let mask: InvalidateMask;

  beforeEach(() => {
    mask = new InvalidateMask();
  });

  it('starts with no panes', () => {
    expect(mask.paneIds()).toEqual([]);
    expect(mask.needsRepaint()).toBe(false);
  });

  it('addPane registers a pane at level None', () => {
    mask.addPane('p1');
    expect(mask.level('p1')).toBe(InvalidationLevel.None);
    expect(mask.needsRepaint()).toBe(false);
  });

  it('invalidate sets the level for a pane', () => {
    mask.addPane('p1');
    mask.invalidate('p1', InvalidationLevel.Light);
    expect(mask.level('p1')).toBe(InvalidationLevel.Light);
    expect(mask.needsRepaint()).toBe(true);
  });

  it('invalidate keeps the highest level (no downgrade)', () => {
    mask.addPane('p1');
    mask.invalidate('p1', InvalidationLevel.Full);
    mask.invalidate('p1', InvalidationLevel.Cursor); // lower — should be ignored
    expect(mask.level('p1')).toBe(InvalidationLevel.Full);
  });

  it('invalidate escalates level when higher value is provided', () => {
    mask.addPane('p1');
    mask.invalidate('p1', InvalidationLevel.Cursor);
    mask.invalidate('p1', InvalidationLevel.Full);
    expect(mask.level('p1')).toBe(InvalidationLevel.Full);
  });

  it('reset sets all pane levels back to None', () => {
    mask.addPane('p1');
    mask.addPane('p2');
    mask.invalidate('p1', InvalidationLevel.Full);
    mask.invalidate('p2', InvalidationLevel.Light);
    mask.reset();
    expect(mask.level('p1')).toBe(InvalidationLevel.None);
    expect(mask.level('p2')).toBe(InvalidationLevel.None);
    expect(mask.needsRepaint()).toBe(false);
  });

  it('tracks multiple panes independently', () => {
    mask.addPane('p1');
    mask.addPane('p2');
    mask.invalidate('p1', InvalidationLevel.Light);
    expect(mask.level('p1')).toBe(InvalidationLevel.Light);
    expect(mask.level('p2')).toBe(InvalidationLevel.None);
  });

  it('paneIds returns all registered ids', () => {
    mask.addPane('a');
    mask.addPane('b');
    mask.addPane('c');
    expect(mask.paneIds().sort()).toEqual(['a', 'b', 'c']);
  });

  it('invalidateAll applies level to every pane', () => {
    mask.addPane('p1');
    mask.addPane('p2');
    mask.invalidateAll(InvalidationLevel.Full);
    expect(mask.level('p1')).toBe(InvalidationLevel.Full);
    expect(mask.level('p2')).toBe(InvalidationLevel.Full);
    expect(mask.needsRepaint()).toBe(true);
  });

  it('removePane stops tracking that pane', () => {
    mask.addPane('p1');
    mask.addPane('p2');
    mask.invalidate('p1', InvalidationLevel.Full);
    mask.removePane('p1');
    expect(mask.paneIds()).toEqual(['p2']);
    // Unregistered pane returns None
    expect(mask.level('p1')).toBe(InvalidationLevel.None);
    expect(mask.needsRepaint()).toBe(false);
  });

  it('level returns None for an unknown pane', () => {
    expect(mask.level('unknown')).toBe(InvalidationLevel.None);
  });

  it('invalidate on an unregistered pane still works (auto-registers)', () => {
    mask.invalidate('new', InvalidationLevel.Cursor);
    expect(mask.level('new')).toBe(InvalidationLevel.Cursor);
  });
});
