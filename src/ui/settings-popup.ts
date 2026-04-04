// ─── Settings Popup ────────────────────────────────────────────────────────

export interface SettingsField {
  key: string;
  label: string;
  type: 'number' | 'color';
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
}

export type OnApply = (values: Record<string, number | string>) => void;

export function createSettingsPopup(
  fields: SettingsField[],
  onApply: OnApply,
  onCancel: () => void,
  theme: { bg: string; text: string; border: string },
): HTMLDivElement {
  const popup = document.createElement('div');
  popup.style.cssText =
    `position:absolute;z-index:30;padding:8px 10px;border-radius:4px;` +
    `background:${theme.bg};color:${theme.text};border:1px solid ${theme.border};` +
    `font-size:11px;pointer-events:auto;min-width:160px;box-shadow:0 2px 8px rgba(0,0,0,0.3);`;

  const inputs: Map<string, HTMLInputElement> = new Map();
  let fieldIdx = 0;

  for (const field of fields) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:8px;';

    const inputId = `settings-field-${field.key}-${fieldIdx++}`;

    const label = document.createElement('label');
    label.textContent = field.label;
    label.style.cssText = 'flex-shrink:0;';
    label.htmlFor = inputId;

    const input = document.createElement('input');
    input.id = inputId;
    input.type = field.type;

    if (field.type === 'number') {
      input.style.cssText =
        `width:60px;background:${theme.bg};color:${theme.text};border:1px solid ${theme.border};` +
        `border-radius:2px;padding:2px 4px;font-size:11px;`;
      input.value = String(field.value);
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      if (field.step !== undefined) input.step = String(field.step);
    } else {
      // color input
      input.style.cssText = 'width:28px;height:20px;padding:0;border:none;cursor:pointer;';
      input.value = String(field.value);
    }

    inputs.set(field.key, input);
    row.appendChild(label);
    row.appendChild(input);
    popup.appendChild(row);
  }

  // Button row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:6px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText =
    `padding:2px 8px;font-size:11px;cursor:pointer;border-radius:2px;` +
    `background:transparent;color:${theme.text};border:1px solid ${theme.border};pointer-events:auto;`;
  cancelBtn.addEventListener('click', () => onCancel());

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.style.cssText =
    `padding:2px 8px;font-size:11px;cursor:pointer;border-radius:2px;` +
    `background:#2962ff;color:#fff;border:none;pointer-events:auto;`;
  applyBtn.addEventListener('click', () => {
    const values: Record<string, number | string> = {};
    for (const field of fields) {
      const inp = inputs.get(field.key)!;
      if (field.type === 'number') {
        values[field.key] = parseFloat(inp.value);
      } else {
        values[field.key] = inp.value;
      }
    }
    onApply(values);
  });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(applyBtn);
  popup.appendChild(btnRow);

  return popup;
}
