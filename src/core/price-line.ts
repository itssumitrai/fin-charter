// ─── Price Lines ────────────────────────────────────────────────────────────

export interface PriceLineOptions {
  price: number;
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  title: string;
  axisLabelVisible: boolean;
  axisLabelColor?: string;
  axisLabelTextColor?: string;
}

export class PriceLine {
  private _options: PriceLineOptions;
  private _requestRepaint: (() => void) | null;

  constructor(options: PriceLineOptions, requestRepaint?: () => void) {
    this._options = options;
    this._requestRepaint = requestRepaint ?? null;
  }

  get options(): Readonly<PriceLineOptions> {
    return this._options;
  }

  applyOptions(opts: Partial<PriceLineOptions>, requestRepaint?: () => void): void {
    Object.assign(this._options, opts);
    const repaint = requestRepaint ?? this._requestRepaint;
    if (repaint) repaint();
  }
}
