export interface ContextMenuItem {
  label: string;
  icon?: string;       // SVG path data (MDI icon)
  action: () => void;
  separator?: boolean; // render a divider line before this item
}

export function createContextMenu(
  items: ContextMenuItem[],
  position: { x: number; y: number },
  theme: { bg: string; text: string; border: string },
): HTMLDivElement {
  // Remove any existing context menu to prevent stacking
  const existing = document.querySelector('[data-fin-charter-ctx-menu]');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.setAttribute('data-fin-charter-ctx-menu', '');
  menu.style.cssText =
    `position:fixed;left:${position.x}px;top:${position.y}px;z-index:1000;` +
    `background:${theme.bg};color:${theme.text};border:1px solid ${theme.border};` +
    `border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.3);padding:4px 0;` +
    `min-width:180px;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;`;

  for (const item of items) {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.style.cssText = `height:1px;background:${theme.border};margin:4px 0;`;
      menu.appendChild(sep);
    }

    const row = document.createElement('div');
    row.style.cssText =
      `padding:6px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;white-space:nowrap;`;
    row.addEventListener('mouseenter', () => { row.style.background = theme.border; });
    row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });

    if (item.icon) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '14');
      svg.setAttribute('height', '14');
      svg.style.cssText = 'fill:currentColor;flex-shrink:0;';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', item.icon);
      svg.appendChild(path);
      row.appendChild(svg);
    }

    const label = document.createElement('span');
    label.textContent = item.label;
    row.appendChild(label);

    row.addEventListener('click', () => { item.action(); menu.remove(); cleanup(); });
    menu.appendChild(row);
  }

  // Close on outside click or Escape
  const onOutsideClick = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) { menu.remove(); cleanup(); }
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { menu.remove(); cleanup(); }
  };
  const cleanup = () => {
    document.removeEventListener('mousedown', onOutsideClick, true);
    document.removeEventListener('keydown', onEscape, true);
  };
  requestAnimationFrame(() => {
    document.addEventListener('mousedown', onOutsideClick, true);
    document.addEventListener('keydown', onEscape, true);
  });

  document.body.appendChild(menu);
  return menu;
}
