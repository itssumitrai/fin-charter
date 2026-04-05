import { describe, it, expect, vi } from 'vitest';
import { TextLabel, createTextLabels, DEFAULT_TEXT_LABEL_OPTIONS } from '@/core/text-label';

describe('TextLabel', () => {
  it('creates with defaults merged with provided options', () => {
    const label = new TextLabel('l1', 100, 50.5, { text: 'Earnings' });
    expect(label.id).toBe('l1');
    expect(label.time).toBe(100);
    expect(label.price).toBe(50.5);
    expect(label.options.text).toBe('Earnings');
    expect(label.options.backgroundColor).toBe(DEFAULT_TEXT_LABEL_OPTIONS.backgroundColor);
  });

  it('options() returns a copy', () => {
    const label = new TextLabel('l1', 0, 0, { text: 'test' });
    const o1 = label.options;
    const o2 = label.options;
    expect(o1).not.toBe(o2);
    expect(o1).toEqual(o2);
  });

  it('applyOptions updates and calls repaint', () => {
    const repaint = vi.fn();
    const label = new TextLabel('l1', 0, 0, { text: 'old' }, repaint);
    label.applyOptions({ text: 'new', textColor: '#FF0000' });
    expect(label.options.text).toBe('new');
    expect(label.options.textColor).toBe('#FF0000');
    expect(repaint).toHaveBeenCalled();
  });

  it('setPosition updates time and price', () => {
    const repaint = vi.fn();
    const label = new TextLabel('l1', 10, 100, { text: 'test' }, repaint);
    label.setPosition(20, 200);
    expect(label.time).toBe(20);
    expect(label.price).toBe(200);
    expect(repaint).toHaveBeenCalled();
  });

  it('createPaneView returns a renderer', () => {
    const label = new TextLabel('l1', 5, 100, { text: 'Label' });
    const view = label.createPaneView(
      (i) => i * 10,
      (p) => 400 - p,
    );
    const renderer = view.renderer();
    expect(renderer).not.toBeNull();
    expect(typeof renderer!.draw).toBe('function');
  });

  it('serialize returns serializable object', () => {
    const label = new TextLabel('l1', 42, 150.5, { text: 'Q2 Earnings' });
    const data = label.serialize();
    expect(data.id).toBe('l1');
    expect(data.time).toBe(42);
    expect(data.price).toBe(150.5);
    expect(data.options.text).toBe('Q2 Earnings');
  });
});

describe('createTextLabels', () => {
  it('creates multiple labels from entries', () => {
    const labels = createTextLabels([
      { time: 10, price: 100, text: 'A' },
      { time: 20, price: 200, text: 'B' },
      { time: 30, price: 300, text: 'C', options: { textColor: '#FF0000' } },
    ]);
    expect(labels.length).toBe(3);
    expect(labels[0].options.text).toBe('A');
    expect(labels[2].options.textColor).toBe('#FF0000');
  });

  it('passes requestRepaint to all labels', () => {
    const repaint = vi.fn();
    const labels = createTextLabels(
      [{ time: 1, price: 1, text: 'test' }],
      repaint,
    );
    labels[0].applyOptions({ text: 'changed' });
    expect(repaint).toHaveBeenCalled();
  });

  it('returns empty array for empty input', () => {
    expect(createTextLabels([])).toEqual([]);
  });
});
