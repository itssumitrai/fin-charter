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
  constructor(public options: PriceLineOptions) {}

  applyOptions(opts: Partial<PriceLineOptions>): void {
    Object.assign(this.options, opts);
  }
}
