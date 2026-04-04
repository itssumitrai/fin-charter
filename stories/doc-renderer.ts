/**
 * Custom story documentation renderer for fin-charter Storybook.
 *
 * Wraps each story with an inline documentation panel showing a description
 * and a collapsible, syntax-highlighted code snippet — visible directly in the
 * Canvas view so that users can learn from examples without switching to Docs.
 */

/* ------------------------------------------------------------------ */
/*  Minimal syntax highlighting for TypeScript / JavaScript snippets  */
/* ------------------------------------------------------------------ */

const TOKEN_COLORS: Record<string, string> = {
  keyword: '#c678dd',   // purple – import, const, let, new, function, …
  string: '#98c379',    // green  – '…', "…", `…`
  comment: '#5c6370',   // gray   – // … and /* … */
  number: '#d19a66',    // orange – 42, 3.14
  method: '#61afef',    // blue   – .addCandlestickSeries
  property: '#e5c07b',  // yellow – object keys before ':'
  type: '#e06c75',      // red    – type names after ':'
  punctuation: '#abb2bf',
  default: '#d1d4dc',
};

function highlightCode(code: string): string {
  // Order matters – earlier rules win
  const rules: Array<{ re: RegExp; cls: string }> = [
    // Comments (single-line only for simplicity)
    { re: /(\/\/[^\n]*)/g, cls: 'comment' },
    // Strings (single-quoted, double-quoted, backtick)
    { re: /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, cls: 'string' },
    // Keywords
    {
      re: /\b(import|from|export|default|const|let|var|function|return|if|else|new|true|false|null|undefined|typeof|void|async|await|class|extends|type|interface)\b/g,
      cls: 'keyword',
    },
    // Numbers
    { re: /\b(\d+(?:\.\d+)?)\b/g, cls: 'number' },
    // Method calls  .foo(
    { re: /\.([a-zA-Z_]\w*)\s*\(/g, cls: 'method' },
    // Object keys   foo:
    { re: /([a-zA-Z_]\w*)\s*:/g, cls: 'property' },
  ];

  // We build highlighted HTML by walking through the string, applying the
  // first matching rule at each position.
  let result = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    let earliest: { start: number; end: number; html: string } | null = null;

    for (const { re, cls } of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (!m) continue;

      // For groups like .method( we want the group, not the full match
      const matchStart = m.index;
      const fullMatch = m[0];
      const groupMatch = m[1] || fullMatch;

      if (!earliest || matchStart < earliest.start) {
        const color = TOKEN_COLORS[cls] || TOKEN_COLORS.default;

        if (cls === 'method') {
          // Wrap only the method name, keep the dot and paren
          const beforeGroup = fullMatch.indexOf(groupMatch);
          const pre = escapeHtml(fullMatch.slice(0, beforeGroup));
          const post = escapeHtml(fullMatch.slice(beforeGroup + groupMatch.length));
          earliest = {
            start: matchStart,
            end: matchStart + fullMatch.length,
            html: pre + `<span style="color:${color}">${escapeHtml(groupMatch)}</span>` + post,
          };
        } else if (cls === 'property') {
          const post = escapeHtml(fullMatch.slice(groupMatch.length));
          earliest = {
            start: matchStart,
            end: matchStart + fullMatch.length,
            html: `<span style="color:${color}">${escapeHtml(groupMatch)}</span>` + post,
          };
        } else {
          earliest = {
            start: matchStart,
            end: matchStart + fullMatch.length,
            html: `<span style="color:${color}">${escapeHtml(fullMatch)}</span>`,
          };
        }
      }
    }

    if (earliest && earliest.start < len) {
      // Emit plain text before the match
      if (earliest.start > i) {
        result += escapeHtml(code.slice(i, earliest.start));
      }
      result += earliest.html;
      i = earliest.end;
    } else {
      // No more matches – emit the rest as plain text
      result += escapeHtml(code.slice(i));
      break;
    }
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface DocOptions {
  /** Short description shown above the chart. Supports simple line breaks. */
  description: string;
  /** Code snippet displayed in a collapsible block. */
  code: string;
  /** If true the code block starts expanded (default: true). */
  codeExpanded?: boolean;
}

/**
 * Wraps a story element with an inline documentation panel.
 *
 * Usage inside a Storybook render function:
 * ```ts
 * render: () => {
 *   const container = createChartContainer();
 *   const chart = createChart(container, { ... });
 *   // … set up chart …
 *   return withDocs(container, {
 *     description: 'This story demonstrates …',
 *     code: `const chart = createChart(…);`,
 *   });
 * }
 * ```
 */
export function withDocs(
  chartElement: HTMLElement,
  opts: DocOptions,
): HTMLElement {
  const expanded = opts.codeExpanded !== false;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 0;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  `;

  /* --- Doc panel (description + code) --- */
  const docPanel = document.createElement('div');
  docPanel.style.cssText = `
    padding: 20px 24px 16px;
    background: #13141f;
    border-bottom: 1px solid #1e2235;
    flex-shrink: 0;
  `;

  // Description
  const desc = document.createElement('p');
  desc.style.cssText = `
    margin: 0 0 12px 0;
    color: #b2b5be;
    font-size: 14px;
    line-height: 1.65;
    max-width: 860px;
  `;
  desc.innerHTML = opts.description.replace(/\n/g, '<br>');
  docPanel.appendChild(desc);

  // Collapsible code block
  const codeSection = document.createElement('div');
  codeSection.style.cssText = `margin-top: 4px;`;

  const toggle = document.createElement('button');
  toggle.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: none;
    background: none;
    color: #5d8ecf;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    margin-bottom: 8px;
    letter-spacing: 0.3px;
  `;
  toggle.onmouseenter = () => { toggle.style.color = '#7db1ef'; };
  toggle.onmouseleave = () => { toggle.style.color = '#5d8ecf'; };

  const chevron = document.createElement('span');
  chevron.style.cssText = `
    display: inline-block;
    transition: transform 0.15s ease;
    font-size: 10px;
  `;
  chevron.textContent = '\u25B6'; // ▶
  if (expanded) chevron.style.transform = 'rotate(90deg)';

  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = 'Show code';

  toggle.appendChild(chevron);
  toggle.appendChild(toggleLabel);

  const codeBlock = document.createElement('div');
  codeBlock.style.cssText = `
    background: #1a1b2e;
    border: 1px solid #262840;
    border-radius: 6px;
    padding: 14px 18px;
    overflow-x: auto;
    max-height: 360px;
    overflow-y: auto;
    display: ${expanded ? 'block' : 'none'};
  `;

  const pre = document.createElement('pre');
  pre.style.cssText = `
    margin: 0;
    font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', Menlo, Consolas, monospace;
    font-size: 13px;
    line-height: 1.55;
    color: ${TOKEN_COLORS.default};
    white-space: pre;
    tab-size: 2;
  `;
  pre.innerHTML = highlightCode(dedent(opts.code));

  codeBlock.appendChild(pre);
  codeSection.appendChild(toggle);
  codeSection.appendChild(codeBlock);
  docPanel.appendChild(codeSection);

  toggle.addEventListener('click', () => {
    const isVisible = codeBlock.style.display !== 'none';
    codeBlock.style.display = isVisible ? 'none' : 'block';
    chevron.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  /* --- Chart container --- */
  const chartWrapper = document.createElement('div');
  chartWrapper.style.cssText = `flex: 1; min-height: 0;`;
  chartWrapper.appendChild(chartElement);
  // Make chart fill remaining space
  chartElement.style.height = '100%';

  wrapper.appendChild(docPanel);
  wrapper.appendChild(chartWrapper);

  return wrapper;
}

/** Strip common leading whitespace so template literals look tidy. */
function dedent(str: string): string {
  const lines = str.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
  const minIndent = lines
    .filter((l) => l.trim().length > 0)
    .reduce((min, l) => {
      const match = l.match(/^(\s*)/);
      return match ? Math.min(min, match[1].length) : min;
    }, Infinity);
  if (!isFinite(minIndent) || minIndent === 0) return lines.join('\n');
  return lines.map((l) => l.slice(minIndent)).join('\n');
}
