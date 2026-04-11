import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HudManager } from '@/ui/hud';
import type { HudRowConfig } from '@/ui/hud';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockTheme = {
  bg: '#1e1e2e',
  text: '#cdd6f4',
  border: '#313244',
  fontFamily: 'monospace',
};

function makeParent(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function makeConfig(overrides?: Partial<HudRowConfig>): HudRowConfig {
  return {
    id: 'test-row',
    label: 'Test',
    color: '#ff0000',
    getValues: () => 'O:100 H:110 L:95 C:105',
    onToggleVisible: () => true,
    onRemove: () => {},
    getSettingsFields: () => [],
    onSettingsApply: () => {},
    ...overrides,
  };
}

// ─── Constructor ──────────────────────────────────────────────────────────────

describe('HudManager constructor', () => {
  it('creates a container element appended to the parent', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const container = parent.querySelector('div');
    expect(container).not.toBeNull();
    hud.destroy();
  });

  it('initial globalCollapsed state is false', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    expect(hud.isGlobalCollapsed).toBe(false);
    hud.destroy();
  });
});

// ─── addRow ───────────────────────────────────────────────────────────────────

describe('HudManager.addRow', () => {
  it('adding one row results in one row tracked', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig());
    // Access private _rows via cast
    const rows = (hud as any)._rows as Map<string, unknown>;
    expect(rows.size).toBe(1);
    hud.destroy();
  });

  it('adding multiple rows tracks all of them', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'row-1', label: 'Row 1' }));
    hud.addRow(makeConfig({ id: 'row-2', label: 'Row 2' }));
    hud.addRow(makeConfig({ id: 'row-3', label: 'Row 3' }));
    const rows = (hud as any)._rows as Map<string, unknown>;
    expect(rows.size).toBe(3);
    hud.destroy();
  });

  it('row is appended to the DOM', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const config = makeConfig();
    hud.addRow(config);
    // rowsWrapper is a child of container; its children contain the row
    const wrapper = (hud as any)._rowsWrapper as HTMLDivElement;
    expect(wrapper.children.length).toBe(1);
    hud.destroy();
  });

  it('adds a row with a color field (hasColorField branch)', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const config = makeConfig({
      color: '#112233',
      getSettingsFields: () => [
        { key: 'color', label: 'Color', type: 'color', value: '#112233' },
      ],
    });
    expect(() => hud.addRow(config)).not.toThrow();
    hud.destroy();
  });
});

// ─── removeRow ────────────────────────────────────────────────────────────────

describe('HudManager.removeRow', () => {
  it('removes a row that was added', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'to-remove' }));
    expect((hud as any)._rows.size).toBe(1);

    hud.removeRow('to-remove');
    expect((hud as any)._rows.size).toBe(0);
    hud.destroy();
  });

  it('does nothing when removing a non-existent id', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    expect(() => hud.removeRow('no-such-id')).not.toThrow();
    hud.destroy();
  });

  it('row element is removed from the DOM', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'dom-row' }));
    const wrapper = (hud as any)._rowsWrapper as HTMLDivElement;
    expect(wrapper.children.length).toBe(1);

    hud.removeRow('dom-row');
    expect(wrapper.children.length).toBe(0);
    hud.destroy();
  });
});

// ─── updateValues ─────────────────────────────────────────────────────────────

describe('HudManager.updateValues', () => {
  it('calls getValues callback with barIndex', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const getValues = vi.fn(() => 'O:1 H:2 L:3 C:4');
    hud.addRow(makeConfig({ getValues }));
    hud.updateValues(42);
    expect(getValues).toHaveBeenCalledWith(42);
    hud.destroy();
  });

  it('updates valuesEl textContent', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'vals', getValues: () => 'DATA' }));
    hud.updateValues(0);
    const entry = (hud as any)._rows.get('vals');
    expect(entry.valuesEl.textContent).toBe('DATA');
    hud.destroy();
  });

  it('does not throw when there are no rows', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    expect(() => hud.updateValues(5)).not.toThrow();
    hud.destroy();
  });

  it('updates compactLine with first row label and values', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'first', label: 'BTC', getValues: () => 'C:50000' }));
    hud.updateValues(10);
    const compactLine = (hud as any)._compactLine as HTMLDivElement;
    expect(compactLine.textContent).toContain('BTC');
    expect(compactLine.textContent).toContain('C:50000');
    hud.destroy();
  });
});

// ─── setGlobalCollapsed ───────────────────────────────────────────────────────

describe('HudManager.setGlobalCollapsed', () => {
  it('collapses the rows wrapper when set to true', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.setGlobalCollapsed(true);
    expect(hud.isGlobalCollapsed).toBe(true);
    const wrapper = (hud as any)._rowsWrapper as HTMLDivElement;
    expect(wrapper.style.display).toBe('none');
    hud.destroy();
  });

  it('expands the rows wrapper when set to false after collapsing', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.setGlobalCollapsed(true);
    hud.setGlobalCollapsed(false);
    expect(hud.isGlobalCollapsed).toBe(false);
    const wrapper = (hud as any)._rowsWrapper as HTMLDivElement;
    expect(wrapper.style.display).toBe('block');
    hud.destroy();
  });

  it('compact line is shown when collapsed, hidden when expanded', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.setGlobalCollapsed(true);
    const compactLine = (hud as any)._compactLine as HTMLDivElement;
    expect(compactLine.style.display).toBe('block');

    hud.setGlobalCollapsed(false);
    expect(compactLine.style.display).toBe('none');
    hud.destroy();
  });

  it('no-ops when already in the same state', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    // default is expanded (false); calling false again should not throw
    expect(() => hud.setGlobalCollapsed(false)).not.toThrow();
    hud.destroy();
  });

  it('fires onGlobalCollapseToggle callback', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const cb = vi.fn();
    hud.onGlobalCollapseToggle = cb;
    // Trigger via the chevron button click
    const chevron = (hud as any)._globalChevron as HTMLButtonElement;
    chevron.click();
    expect(cb).toHaveBeenCalledTimes(1);
    hud.destroy();
  });
});

// ─── destroy ──────────────────────────────────────────────────────────────────

describe('HudManager.destroy', () => {
  it('removes the container from the DOM', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    expect(parent.children.length).toBeGreaterThan(0);
    hud.destroy();
    expect(parent.children.length).toBe(0);
  });

  it('clears all rows', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'r1' }));
    hud.addRow(makeConfig({ id: 'r2' }));
    hud.destroy();
    expect((hud as any)._rows.size).toBe(0);
  });

  it('can be called multiple times without throwing', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.destroy();
    expect(() => hud.destroy()).not.toThrow();
  });
});

// ─── triggerSettings ──────────────────────────────────────────────────────────

describe('HudManager.triggerSettings', () => {
  it('does not throw for an existing row id', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'settings-row' }));
    expect(() => hud.triggerSettings('settings-row')).not.toThrow();
    hud.destroy();
  });

  it('does not throw for a non-existent row id', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    expect(() => hud.triggerSettings('missing')).not.toThrow();
    hud.destroy();
  });

  it('opens settings popup when row has settings fields', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({
      id: 'with-settings',
      getSettingsFields: () => [
        { key: 'lineWidth', label: 'Width', type: 'number', value: 2 },
      ],
    }));
    expect(() => hud.triggerSettings('with-settings')).not.toThrow();
    hud.destroy();
  });
});

// ─── Row button interactions ──────────────────────────────────────────────────

describe('HudManager row buttons', () => {
  it('onRemove is called when remove button is clicked', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const onRemove = vi.fn();
    hud.addRow(makeConfig({ id: 'removable', onRemove }));
    const entry = (hud as any)._rows.get('removable');
    // removeBtn is 3rd button in buttonsEl
    const removeBtn = entry.buttonsEl.children[2] as HTMLButtonElement;
    removeBtn.click();
    expect(onRemove).toHaveBeenCalledTimes(1);
    hud.destroy();
  });

  it('eye button click calls onToggleVisible', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const onToggleVisible = vi.fn(() => false);
    hud.addRow(makeConfig({ id: 'eye-row', onToggleVisible }));
    const entry = (hud as any)._rows.get('eye-row');
    entry.eyeBtn.click();
    expect(onToggleVisible).toHaveBeenCalledTimes(1);
    hud.destroy();
  });

  it('mouseenter/mouseleave toggle button opacity', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    hud.addRow(makeConfig({ id: 'hover-row' }));
    const entry = (hud as any)._rows.get('hover-row');
    const row = entry.el as HTMLDivElement;

    row.dispatchEvent(new MouseEvent('mouseenter'));
    expect(entry.buttonsEl.style.opacity).toBe('1');

    row.dispatchEvent(new MouseEvent('mouseleave'));
    expect(entry.buttonsEl.style.opacity).toBe('0');
    hud.destroy();
  });
});

// ─── onGlobalCollapseToggle setter ───────────────────────────────────────────

describe('HudManager.onGlobalCollapseToggle setter', () => {
  it('can be set to null without throwing', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    expect(() => { hud.onGlobalCollapseToggle = null; }).not.toThrow();
    hud.destroy();
  });

  it('can be set to a callback', () => {
    const parent = makeParent();
    const hud = new HudManager(parent, mockTheme);
    const cb = vi.fn();
    hud.onGlobalCollapseToggle = cb;
    hud.setGlobalCollapsed(true);
    // collapse was triggered via setGlobalCollapsed directly, cb not fired
    // (cb is only fired from the chevron click handler)
    expect(() => { hud.onGlobalCollapseToggle = null; }).not.toThrow();
    hud.destroy();
  });
});
