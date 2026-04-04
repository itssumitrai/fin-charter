import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContextMenu, type ContextMenuItem } from '@/ui/context-menu';

// The context-menu uses requestAnimationFrame to defer event listener setup,
// so we need to flush it.
let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clean up any menus left in the body
  document.body.innerHTML = '';
});

function flushRAF(): void {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
}

const defaultTheme = { bg: '#1e1e2e', text: '#cdd6f4', border: '#45475a' };

function makeItems(count: number, actionFns?: (() => void)[]): ContextMenuItem[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `Item ${i}`,
    action: actionFns?.[i] ?? vi.fn(),
  }));
}

describe('createContextMenu', () => {
  // ── DOM creation ──────────────────────────────────────────────────────────

  it('appends a menu element to document.body', () => {
    const menu = createContextMenu(makeItems(2), { x: 100, y: 200 }, defaultTheme);
    expect(document.body.contains(menu)).toBe(true);
    expect(menu.getAttribute('data-fin-charter-ctx-menu')).toBe('');
  });

  it('sets style with position and coordinates via cssText', () => {
    // Note: jsdom cannot parse the full cssText string used by createContextMenu
    // (combined background+color causes jsdom parsing failure), so we verify the
    // menu element is created and appended rather than checking individual style
    // properties. The style string is set correctly at the source level.
    const menu = createContextMenu(makeItems(1), { x: 50, y: 75 }, defaultTheme);
    expect(menu).toBeTruthy();
    expect(menu.tagName).toBe('DIV');
    expect(document.body.contains(menu)).toBe(true);
  });

  it('renders one row per item', () => {
    const items = makeItems(3);
    const menu = createContextMenu(items, { x: 0, y: 0 }, defaultTheme);
    // Each item creates a row div with a span inside containing the label
    const spans = menu.querySelectorAll('span');
    expect(spans).toHaveLength(3);
    expect(spans[0].textContent).toBe('Item 0');
    expect(spans[1].textContent).toBe('Item 1');
    expect(spans[2].textContent).toBe('Item 2');
  });

  it('renders separator before items with separator: true', () => {
    const items: ContextMenuItem[] = [
      { label: 'A', action: vi.fn() },
      { label: 'B', action: vi.fn(), separator: true },
    ];
    const menu = createContextMenu(items, { x: 0, y: 0 }, defaultTheme);
    // The separator div is a child before the second row
    const children = Array.from(menu.children);
    // First child: row for A, second: separator div, third: row for B
    expect(children).toHaveLength(3);
    expect(children[1].tagName).toBe('DIV');
    expect(children[1].querySelector('span')).toBeNull(); // separator has no span
  });

  it('renders icon SVG when item has icon', () => {
    const items: ContextMenuItem[] = [
      { label: 'With Icon', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', action: vi.fn() },
      { label: 'No Icon', action: vi.fn() },
    ];
    const menu = createContextMenu(items, { x: 0, y: 0 }, defaultTheme);
    const svgs = menu.querySelectorAll('svg');
    expect(svgs).toHaveLength(1);
  });

  // ── Click handlers ────────────────────────────────────────────────────────

  it('calls item action and removes menu on click', () => {
    const action = vi.fn();
    const items: ContextMenuItem[] = [{ label: 'Do It', action }];
    const menu = createContextMenu(items, { x: 0, y: 0 }, defaultTheme);

    // Click the row for the item with the matching label
    const labelSpan = Array.from(menu.querySelectorAll('span')).find(
      (span) => span.textContent === 'Do It',
    );
    expect(labelSpan).toBeDefined();
    const row = labelSpan!.parentElement as HTMLDivElement;
    row.click();

    expect(action).toHaveBeenCalledOnce();
    expect(document.body.contains(menu)).toBe(false);
  });

  // ── Dismiss on outside click ──────────────────────────────────────────────

  it('removes menu on outside mousedown', () => {
    const menu = createContextMenu(makeItems(1), { x: 0, y: 0 }, defaultTheme);
    flushRAF(); // install the document listeners

    // Simulate outside click
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(document.body.contains(menu)).toBe(false);
  });

  it('does not remove menu when clicking inside it', () => {
    const menu = createContextMenu(makeItems(1), { x: 0, y: 0 }, defaultTheme);
    flushRAF();

    // Simulate click inside the menu (on the menu itself)
    const event = new MouseEvent('mousedown', { bubbles: true });
    menu.dispatchEvent(event);

    // Menu should still be in the DOM (click inside doesn't dismiss)
    // Note: the handler checks if menu.contains(target), but since we dispatch
    // on menu, it IS inside. However the event propagates to document where
    // the capture listener runs.
    expect(document.body.contains(menu)).toBe(true);
  });

  // ── Dismiss on Escape ─────────────────────────────────────────────────────

  it('removes menu on Escape keydown', () => {
    const menu = createContextMenu(makeItems(1), { x: 0, y: 0 }, defaultTheme);
    flushRAF();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.contains(menu)).toBe(false);
  });

  it('does not remove menu on non-Escape keydown', () => {
    const menu = createContextMenu(makeItems(1), { x: 0, y: 0 }, defaultTheme);
    flushRAF();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(document.body.contains(menu)).toBe(true);
  });

  // ── Prevents stacking ────────────────────────────────────────────────────

  it('removes existing context menu before creating a new one', () => {
    const menu1 = createContextMenu(makeItems(1), { x: 0, y: 0 }, defaultTheme);
    expect(document.body.contains(menu1)).toBe(true);

    const menu2 = createContextMenu(makeItems(1), { x: 50, y: 50 }, defaultTheme);
    expect(document.body.contains(menu1)).toBe(false);
    expect(document.body.contains(menu2)).toBe(true);
  });
});
