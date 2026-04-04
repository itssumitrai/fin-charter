// ─── HUD (Heads-Up Display) Manager ────────────────────────────────────────

import { createSettingsPopup, type SettingsField, type OnApply } from './settings-popup';

// ── Material Design Icon SVGs (24×24 viewBox, inlined) ──────────────────────
function _svgIcon(pathD: string, size = 14): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.style.cssText = 'fill:currentColor;vertical-align:middle;flex-shrink:0;';
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

// Material Design icon paths
const MDI_EYE = 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
const MDI_EYE_OFF = 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z';
const MDI_SETTINGS = 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z';
const MDI_CLOSE = 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';
const MDI_CHEVRON_DOWN = 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z';
const MDI_CHEVRON_RIGHT = 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z';

export interface HudRowConfig {
  id: string;
  label: string;
  color: string;
  getValues: (barIndex: number) => string;
  onToggleVisible: () => boolean; // returns new visibility state
  onRemove: () => void;
  getSettingsFields: () => SettingsField[];
  onSettingsApply: OnApply;
}

interface HudRowEntry {
  config: HudRowConfig;
  el: HTMLDivElement;
  valuesEl: HTMLSpanElement;
  buttonsEl: HTMLDivElement;
  eyeBtn: HTMLButtonElement;
  visible: boolean;
}

export class HudManager {
  private _container: HTMLDivElement;
  private _rows: Map<string, HudRowEntry> = new Map();
  private _theme: { bg: string; text: string; border: string; fontFamily: string };
  private _activePopup: HTMLDivElement | null = null;
  private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;
  private _pendingRaf: number = 0;

  // Global collapse state
  private _globalCollapsed: boolean = false;
  private _compactLine!: HTMLDivElement;
  private _globalChevron!: HTMLButtonElement;
  private _rowsWrapper!: HTMLDivElement;
  private _onGlobalCollapseToggle: (() => void) | null = null;

  constructor(
    paneRow: HTMLElement,
    theme: { bg: string; text: string; border: string; fontFamily: string },
  ) {
    this._theme = theme;

    this._container = document.createElement('div');
    this._container.style.cssText =
      `position:absolute;top:4px;left:8px;z-index:10;pointer-events:none;` +
      `font-size:11px;font-family:${theme.fontFamily};color:${theme.text};`;

    // Global header: chevron + compact summary line
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:4px;height:18px;pointer-events:auto;';

    this._globalChevron = document.createElement('button');
    this._globalChevron.appendChild(_svgIcon(MDI_CHEVRON_DOWN, 14));
    this._globalChevron.title = 'Collapse legend';
    this._globalChevron.style.cssText = this._chevronStyle();
    this._globalChevron.addEventListener('click', () => {
      this.setGlobalCollapsed(!this._globalCollapsed);
      this._onGlobalCollapseToggle?.();
    });
    header.appendChild(this._globalChevron);

    this._compactLine = document.createElement('div');
    this._compactLine.style.cssText =
      `color:${theme.text};white-space:nowrap;font-size:11px;display:none;cursor:default;`;
    header.appendChild(this._compactLine);

    this._container.appendChild(header);

    this._rowsWrapper = document.createElement('div');
    this._container.appendChild(this._rowsWrapper);

    paneRow.appendChild(this._container);
  }

  // ── Global collapse ──────────────────────────────────────────────────────

  get isGlobalCollapsed(): boolean { return this._globalCollapsed; }

  set onGlobalCollapseToggle(cb: (() => void) | null) { this._onGlobalCollapseToggle = cb; }

  setGlobalCollapsed(collapsed: boolean): void {
    if (this._globalCollapsed === collapsed) return;
    this._globalCollapsed = collapsed;
    this._rowsWrapper.style.display = collapsed ? 'none' : 'block';
    this._compactLine.style.display = collapsed ? 'block' : 'none';
    this._globalChevron.innerHTML = '';
    this._globalChevron.appendChild(_svgIcon(collapsed ? MDI_CHEVRON_RIGHT : MDI_CHEVRON_DOWN, 14));
    this._globalChevron.title = collapsed ? 'Expand legend' : 'Collapse legend';
  }

  // ── Row management ───────────────────────────────────────────────────────

  addRow(config: HudRowConfig): void {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:1px;';

    // ── Header line: swatch + label + action buttons ──────
    const headerLine = document.createElement('div');
    headerLine.style.cssText =
      'display:flex;align-items:center;gap:4px;height:18px;pointer-events:auto;';

    // Color swatch
    const swatch = document.createElement('div');
    swatch.style.cssText =
      `width:10px;height:10px;border-radius:2px;flex-shrink:0;background:${config.color};`;
    headerLine.appendChild(swatch);

    // Label
    const labelEl = document.createElement('span');
    labelEl.textContent = config.label;
    labelEl.style.cssText = `color:${this._theme.text};opacity:0.7;flex-shrink:0;cursor:default;`;
    headerLine.appendChild(labelEl);

    // Action buttons container — always in header, stable position
    const buttonsEl = document.createElement('div');
    buttonsEl.style.cssText =
      'display:inline-flex;align-items:center;gap:2px;margin-left:4px;opacity:0;transition:opacity 0.15s;';

    // Eye toggle
    const eyeBtn = document.createElement('button');
    eyeBtn.appendChild(_svgIcon(MDI_EYE, 14));
    eyeBtn.title = 'Toggle visibility';
    eyeBtn.style.cssText = this._buttonStyle();
    eyeBtn.addEventListener('click', () => {
      const newVis = config.onToggleVisible();
      entry.visible = newVis;
      eyeBtn.innerHTML = '';
      eyeBtn.appendChild(_svgIcon(newVis ? MDI_EYE : MDI_EYE_OFF, 14));
      eyeBtn.style.opacity = newVis ? '0.7' : '0.3';
    });
    buttonsEl.appendChild(eyeBtn);

    // Gear settings
    const gearBtn = document.createElement('button');
    gearBtn.appendChild(_svgIcon(MDI_SETTINGS, 14));
    gearBtn.title = 'Settings';
    gearBtn.style.cssText = this._buttonStyle();
    gearBtn.addEventListener('click', () => {
      this._openSettings(config, gearBtn);
    });
    buttonsEl.appendChild(gearBtn);

    // X remove
    const removeBtn = document.createElement('button');
    removeBtn.appendChild(_svgIcon(MDI_CLOSE, 14));
    removeBtn.title = 'Remove';
    removeBtn.style.cssText = this._buttonStyle();
    removeBtn.addEventListener('click', () => {
      config.onRemove();
    });
    buttonsEl.appendChild(removeBtn);

    headerLine.appendChild(buttonsEl);
    row.appendChild(headerLine);

    // Show buttons on hover over entire row
    row.addEventListener('mouseenter', () => {
      buttonsEl.style.opacity = '1';
    });
    row.addEventListener('mouseleave', () => {
      buttonsEl.style.opacity = '0';
    });

    // ── Values line (always visible within expanded HUD) ──────────────────
    const valuesEl = document.createElement('span');
    valuesEl.style.cssText =
      `color:${this._theme.text};white-space:nowrap;display:block;` +
      `padding-left:14px;height:15px;line-height:15px;`;
    row.appendChild(valuesEl);

    this._rowsWrapper.appendChild(row);

    const entry: HudRowEntry = {
      config, el: row, valuesEl, buttonsEl, eyeBtn, visible: true,
    };
    this._rows.set(config.id, entry);
  }

  removeRow(id: string): void {
    const entry = this._rows.get(id);
    if (entry) {
      entry.el.remove();
      this._rows.delete(id);
    }
  }

  updateValues(barIndex: number): void {
    let firstValues = '';
    for (const entry of this._rows.values()) {
      const vals = entry.config.getValues(barIndex);
      entry.valuesEl.textContent = vals;
      if (!firstValues) {
        firstValues = `${entry.config.label}  ${vals}`;
      }
    }
    this._compactLine.textContent = firstValues;
  }

  /** Programmatically open the settings popup for a row. */
  triggerSettings(rowId: string): void {
    const entry = this._rows.get(rowId);
    if (entry) {
      // Find the gear button (second button in the buttons container)
      const gearBtn = entry.buttonsEl.children[1] as HTMLButtonElement | undefined;
      gearBtn?.click();
    }
  }

  destroy(): void {
    this._closePopup();
    this._container.remove();
    this._rows.clear();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private _chevronStyle(): string {
    return (
      `pointer-events:auto;background:none;border:none;cursor:pointer;` +
      `color:${this._theme.text};padding:0;line-height:1;opacity:0.5;` +
      `display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;`
    );
  }

  private _buttonStyle(): string {
    return (
      `pointer-events:auto;background:none;border:none;cursor:pointer;` +
      `color:${this._theme.text};padding:2px 3px;line-height:1;opacity:0.6;` +
      `border-radius:3px;display:inline-flex;align-items:center;justify-content:center;`
    );
  }

  private _openSettings(config: HudRowConfig, anchor: HTMLButtonElement): void {
    this._closePopup();

    const fields = config.getSettingsFields();
    if (fields.length === 0) return;

    const popup = createSettingsPopup(
      fields,
      (values) => {
        config.onSettingsApply(values);
        this._closePopup();
      },
      () => {
        this._closePopup();
      },
      { bg: this._theme.bg, text: this._theme.text, border: this._theme.border },
    );

    // Position below anchor
    const anchorRect = anchor.getBoundingClientRect();
    const containerRect = this._container.getBoundingClientRect();
    popup.style.left = `${anchorRect.left - containerRect.left}px`;
    popup.style.top = `${anchorRect.bottom - containerRect.top + 4}px`;

    this._container.appendChild(popup);
    this._activePopup = popup;

    // Close on outside click (delayed to avoid immediate trigger)
    this._pendingRaf = requestAnimationFrame(() => {
      this._pendingRaf = 0;
      if (this._activePopup !== popup) return; // popup was closed before RAF fired
      this._outsideClickHandler = (e: MouseEvent) => {
        if (!popup.contains(e.target as Node)) {
          this._closePopup();
        }
      };
      document.addEventListener('mousedown', this._outsideClickHandler, true);
    });
  }

  private _closePopup(): void {
    if (this._pendingRaf) {
      cancelAnimationFrame(this._pendingRaf);
      this._pendingRaf = 0;
    }
    if (this._activePopup) {
      this._activePopup.remove();
      this._activePopup = null;
    }
    if (this._outsideClickHandler) {
      document.removeEventListener('mousedown', this._outsideClickHandler, true);
      this._outsideClickHandler = null;
    }
  }
}
