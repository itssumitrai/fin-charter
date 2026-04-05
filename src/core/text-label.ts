import type { IPaneView, IPaneRenderer, IRenderTarget } from './types';

export interface TextLabelOptions {
  /** Text content. */
  text: string;
  /** Background color (set to 'transparent' for no background). */
  backgroundColor: string;
  /** Text color. */
  textColor: string;
  /** Border color (set to 'transparent' for no border). */
  borderColor: string;
  /** Border width in pixels. */
  borderWidth: number;
  /** Border radius in pixels. */
  borderRadius: number;
  /** Font size in pixels. */
  fontSize: number;
  /** Font family. */
  fontFamily: string;
  /** Horizontal text alignment within the box. */
  textAlign: 'left' | 'center' | 'right';
  /** Padding inside the box (pixels). */
  padding: number;
  /** Whether to draw an arrow/connector line from the box to the anchor point. */
  showConnector: boolean;
  /** Connector line color. */
  connectorColor: string;
  /** Y offset of the label box from the anchor point (pixels). */
  yOffset: number;
}

export const DEFAULT_TEXT_LABEL_OPTIONS: TextLabelOptions = {
  text: '',
  backgroundColor: 'rgba(33, 150, 243, 0.85)',
  textColor: '#ffffff',
  borderColor: 'transparent',
  borderWidth: 1,
  borderRadius: 4,
  fontSize: 11,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textAlign: 'center',
  padding: 6,
  showConnector: true,
  connectorColor: 'rgba(33, 150, 243, 0.6)',
  yOffset: -30,
};

/**
 * TextLabel — a lightweight text annotation anchored to a time/price coordinate.
 *
 * Unlike the drawing tool's text annotation, TextLabels are programmatic
 * (e.g., for annotating earnings dates, dividends) and don't require
 * user interaction to place. They survive zoom/pan and are included in
 * screenshot exports.
 */
export class TextLabel {
  readonly id: string;
  private _time: number; // bar index
  private _price: number;
  private _options: TextLabelOptions;
  private _requestRepaint: (() => void) | null;

  constructor(
    id: string,
    time: number,
    price: number,
    options: Partial<TextLabelOptions>,
    requestRepaint?: () => void,
  ) {
    this.id = id;
    this._time = time;
    this._price = price;
    this._options = { ...DEFAULT_TEXT_LABEL_OPTIONS, ...options };
    this._requestRepaint = requestRepaint ?? null;
  }

  get time(): number { return this._time; }
  get price(): number { return this._price; }
  get options(): Readonly<TextLabelOptions> { return { ...this._options }; }

  applyOptions(opts: Partial<TextLabelOptions>): void {
    Object.assign(this._options, opts);
    this._requestRepaint?.();
  }

  setPosition(time: number, price: number): void {
    this._time = time;
    this._price = price;
    this._requestRepaint?.();
  }

  /**
   * Create an IPaneView for rendering this label on the chart canvas.
   */
  createPaneView(
    indexToX: (i: number) => number,
    priceToY: (p: number) => number,
  ): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        return {
          draw(target: IRenderTarget): void {
            const { context: ctx, pixelRatio: pr } = target;
            const opts = self._options;

            const anchorX = indexToX(self._time) * pr;
            const anchorY = priceToY(self._price) * pr;
            const yOff = opts.yOffset * pr;
            const labelY = anchorY + yOff;

            ctx.save();

            // Measure text
            const fontSize = opts.fontSize * pr;
            ctx.font = `${fontSize}px ${opts.fontFamily}`;
            const textW = ctx.measureText(opts.text).width;
            const pad = opts.padding * pr;
            const boxW = textW + pad * 2;
            const boxH = fontSize + pad * 2;
            const borderR = opts.borderRadius * pr;

            // Position box
            let boxX: number;
            switch (opts.textAlign) {
              case 'left': boxX = anchorX; break;
              case 'right': boxX = anchorX - boxW; break;
              default: boxX = anchorX - boxW / 2; break;
            }
            const boxY = labelY - boxH / 2;

            // Connector line
            if (opts.showConnector && opts.connectorColor !== 'transparent') {
              ctx.strokeStyle = opts.connectorColor;
              ctx.lineWidth = pr;
              ctx.setLineDash([3 * pr, 3 * pr]);
              ctx.beginPath();
              ctx.moveTo(anchorX, anchorY);
              ctx.lineTo(anchorX, boxY + boxH / 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // Background box (rounded rect)
            if (opts.backgroundColor !== 'transparent') {
              ctx.fillStyle = opts.backgroundColor;
              ctx.beginPath();
              ctx.moveTo(boxX + borderR, boxY);
              ctx.lineTo(boxX + boxW - borderR, boxY);
              ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + borderR, borderR);
              ctx.lineTo(boxX + boxW, boxY + boxH - borderR);
              ctx.arcTo(boxX + boxW, boxY + boxH, boxX + boxW - borderR, boxY + boxH, borderR);
              ctx.lineTo(boxX + borderR, boxY + boxH);
              ctx.arcTo(boxX, boxY + boxH, boxX, boxY + boxH - borderR, borderR);
              ctx.lineTo(boxX, boxY + borderR);
              ctx.arcTo(boxX, boxY, boxX + borderR, boxY, borderR);
              ctx.closePath();
              ctx.fill();
            }

            // Border
            if (opts.borderColor !== 'transparent' && opts.borderWidth > 0) {
              ctx.strokeStyle = opts.borderColor;
              ctx.lineWidth = opts.borderWidth * pr;
              ctx.stroke();
            }

            // Text
            ctx.fillStyle = opts.textColor;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(opts.text, boxX + pad, boxY + boxH / 2);

            ctx.restore();
          },
        };
      },
    };
  }

  /** Serialize for persistence. */
  serialize(): { id: string; time: number; price: number; options: TextLabelOptions } {
    return {
      id: this.id,
      time: this._time,
      price: this._price,
      options: { ...this._options },
    };
  }
}

/**
 * Batch-create text labels (e.g., for annotating earnings dates).
 */
export function createTextLabels(
  entries: Array<{ time: number; price: number; text: string; options?: Partial<TextLabelOptions> }>,
  requestRepaint?: () => void,
): TextLabel[] {
  return entries.map((e, i) =>
    new TextLabel(`label_${i}`, e.time, e.price, { text: e.text, ...e.options }, requestRepaint),
  );
}
