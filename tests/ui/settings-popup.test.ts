import { describe, it, expect, vi } from 'vitest';
import { createSettingsPopup, type SettingsField } from '@/ui/settings-popup';

const defaultTheme = { bg: '#1e1e2e', text: '#cdd6f4', border: '#45475a' };

function makeFields(): SettingsField[] {
  return [
    { key: 'period', label: 'Period', type: 'number', value: 20, min: 1, max: 200, step: 1 },
    { key: 'color', label: 'Color', type: 'color', value: '#ff0000' },
  ];
}

describe('createSettingsPopup', () => {
  // ── DOM creation ──────────────────────────────────────────────────────────

  it('returns a div element', () => {
    const popup = createSettingsPopup(makeFields(), vi.fn(), vi.fn(), defaultTheme);
    expect(popup.tagName).toBe('DIV');
  });

  it('renders a row with label and input for each field', () => {
    const fields = makeFields();
    const popup = createSettingsPopup(fields, vi.fn(), vi.fn(), defaultTheme);

    const labels = popup.querySelectorAll('label');
    expect(labels).toHaveLength(2);
    expect(labels[0].textContent).toBe('Period');
    expect(labels[1].textContent).toBe('Color');

    const inputs = popup.querySelectorAll('input');
    expect(inputs).toHaveLength(2);
  });

  it('creates number input with correct attributes', () => {
    const fields: SettingsField[] = [
      { key: 'period', label: 'Period', type: 'number', value: 14, min: 1, max: 100, step: 1 },
    ];
    const popup = createSettingsPopup(fields, vi.fn(), vi.fn(), defaultTheme);
    const input = popup.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('number');
    expect(input.value).toBe('14');
    expect(input.min).toBe('1');
    expect(input.max).toBe('100');
    expect(input.step).toBe('1');
  });

  it('creates color input with correct value', () => {
    const fields: SettingsField[] = [
      { key: 'lineColor', label: 'Line Color', type: 'color', value: '#00ff00' },
    ];
    const popup = createSettingsPopup(fields, vi.fn(), vi.fn(), defaultTheme);
    const input = popup.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('color');
    expect(input.value).toBe('#00ff00');
  });

  it('renders Apply and Cancel buttons', () => {
    const popup = createSettingsPopup(makeFields(), vi.fn(), vi.fn(), defaultTheme);
    const buttons = popup.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toBe('Cancel');
    expect(buttons[1].textContent).toBe('Apply');
  });

  // ── Label htmlFor links to input id ───────────────────────────────────────

  it('label htmlFor matches input id', () => {
    const fields: SettingsField[] = [
      { key: 'period', label: 'Period', type: 'number', value: 20 },
    ];
    const popup = createSettingsPopup(fields, vi.fn(), vi.fn(), defaultTheme);
    const label = popup.querySelector('label') as HTMLLabelElement;
    const input = popup.querySelector('input') as HTMLInputElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.id).toContain('period');
  });

  // ── Apply callback ────────────────────────────────────────────────────────

  it('Apply button calls onApply with current input values', () => {
    const onApply = vi.fn();
    const fields = makeFields();
    const popup = createSettingsPopup(fields, onApply, vi.fn(), defaultTheme);

    const applyBtn = Array.from(popup.querySelectorAll('button')).find(b => b.textContent === 'Apply')!;
    applyBtn.click();

    expect(onApply).toHaveBeenCalledOnce();
    const values = onApply.mock.calls[0][0];
    expect(values.period).toBe(20); // number type parsed as float
    expect(values.color).toBe('#ff0000'); // color stays as string
  });

  it('Apply reflects modified input values', () => {
    const onApply = vi.fn();
    const fields: SettingsField[] = [
      { key: 'period', label: 'Period', type: 'number', value: 20 },
    ];
    const popup = createSettingsPopup(fields, onApply, vi.fn(), defaultTheme);

    // Simulate user changing the value
    const input = popup.querySelector('input') as HTMLInputElement;
    input.value = '50';

    const applyBtn = Array.from(popup.querySelectorAll('button')).find(b => b.textContent === 'Apply')!;
    applyBtn.click();

    expect(onApply.mock.calls[0][0].period).toBe(50);
  });

  // ── Cancel callback ───────────────────────────────────────────────────────

  it('Cancel button calls onCancel', () => {
    const onCancel = vi.fn();
    const popup = createSettingsPopup(makeFields(), vi.fn(), onCancel, defaultTheme);

    const cancelBtn = Array.from(popup.querySelectorAll('button')).find(b => b.textContent === 'Cancel')!;
    cancelBtn.click();

    expect(onCancel).toHaveBeenCalledOnce();
  });

  // ── Number input without optional min/max/step ────────────────────────────

  it('number input omits min/max/step when not provided', () => {
    const fields: SettingsField[] = [
      { key: 'val', label: 'Value', type: 'number', value: 10 },
    ];
    const popup = createSettingsPopup(fields, vi.fn(), vi.fn(), defaultTheme);
    const input = popup.querySelector('input') as HTMLInputElement;

    expect(input.min).toBe('');
    expect(input.max).toBe('');
    // step defaults to browser default
  });

  // ── Multiple fields ───────────────────────────────────────────────────────

  it('handles multiple fields of same type', () => {
    const fields: SettingsField[] = [
      { key: 'fast', label: 'Fast', type: 'number', value: 12 },
      { key: 'slow', label: 'Slow', type: 'number', value: 26 },
      { key: 'signal', label: 'Signal', type: 'number', value: 9 },
    ];
    const onApply = vi.fn();
    const popup = createSettingsPopup(fields, onApply, vi.fn(), defaultTheme);

    popup.querySelectorAll('button')[1].click();
    const values = onApply.mock.calls[0][0];
    expect(values.fast).toBe(12);
    expect(values.slow).toBe(26);
    expect(values.signal).toBe(9);
  });
});
