// ─── HUD (Heads-Up Display) Manager ────────────────────────────────────────

import { createSettingsPopup, type SettingsField, type OnApply } from './settings-popup';

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
  eyeBtn: HTMLButtonElement;
  visible: boolean;
}

export class HudManager {
  private _container: HTMLDivElement;
  private _rows: Map<string, HudRowEntry> = new Map();
  private _theme: { bg: string; text: string; border: string; fontFamily: string };
  private _activePopup: HTMLDivElement | null = null;
  private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(
    paneRow: HTMLElement,
    theme: { bg: string; text: string; border: string; fontFamily: string },
  ) {
    this._theme = theme;

    this._container = document.createElement('div');
    this._container.style.cssText =
      `position:absolute;top:4px;left:8px;z-index:10;pointer-events:none;` +
      `font-size:11px;font-family:${theme.fontFamily};color:${theme.text};`;
    paneRow.appendChild(this._container);
  }

  addRow(config: HudRowConfig): void {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:2px;height:16px;';

    // Color swatch
    const swatch = document.createElement('div');
    swatch.style.cssText =
      `width:10px;height:10px;border-radius:2px;flex-shrink:0;background:${config.color};`;
    row.appendChild(swatch);

    // Label
    const labelEl = document.createElement('span');
    labelEl.textContent = config.label;
    labelEl.style.cssText = `color:${this._theme.text};opacity:0.7;flex-shrink:0;`;
    row.appendChild(labelEl);

    // Values
    const valuesEl = document.createElement('span');
    valuesEl.style.cssText = `color:${this._theme.text};white-space:nowrap;`;
    row.appendChild(valuesEl);

    // Eye toggle
    const eyeBtn = document.createElement('button');
    eyeBtn.textContent = '\u{1F441}';
    eyeBtn.title = 'Toggle visibility';
    eyeBtn.style.cssText = this._buttonStyle();
    eyeBtn.addEventListener('click', () => {
      const newVis = config.onToggleVisible();
      entry.visible = newVis;
      eyeBtn.style.opacity = newVis ? '1' : '0.3';
    });
    row.appendChild(eyeBtn);

    // Gear settings
    const gearBtn = document.createElement('button');
    gearBtn.textContent = '\u2699';
    gearBtn.title = 'Settings';
    gearBtn.style.cssText = this._buttonStyle();
    gearBtn.addEventListener('click', () => {
      this._openSettings(config, gearBtn);
    });
    row.appendChild(gearBtn);

    // X remove
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '\u2715';
    removeBtn.title = 'Remove';
    removeBtn.style.cssText = this._buttonStyle();
    removeBtn.addEventListener('click', () => {
      config.onRemove();
    });
    row.appendChild(removeBtn);

    this._container.appendChild(row);

    const entry: HudRowEntry = { config, el: row, valuesEl, eyeBtn, visible: true };
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
    for (const entry of this._rows.values()) {
      entry.valuesEl.textContent = entry.config.getValues(barIndex);
    }
  }

  destroy(): void {
    this._closePopup();
    this._container.remove();
    this._rows.clear();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private _buttonStyle(): string {
    return (
      `pointer-events:auto;background:none;border:none;cursor:pointer;` +
      `color:${this._theme.text};font-size:12px;padding:0 2px;line-height:1;opacity:0.6;`
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
    requestAnimationFrame(() => {
      this._outsideClickHandler = (e: MouseEvent) => {
        if (!popup.contains(e.target as Node)) {
          this._closePopup();
        }
      };
      document.addEventListener('mousedown', this._outsideClickHandler, true);
    });
  }

  private _closePopup(): void {
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
