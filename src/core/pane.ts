import { PriceScale } from './price-scale';

const MIN_PANE_HEIGHT = 50;

export interface PaneCanvases {
  chartCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  rightPriceAxisCanvas: HTMLCanvasElement;
  leftPriceAxisCanvas: HTMLCanvasElement;
  chartCtx: CanvasRenderingContext2D;
  overlayCtx: CanvasRenderingContext2D;
  rightPriceAxisCtx: CanvasRenderingContext2D;
  leftPriceAxisCtx: CanvasRenderingContext2D;
}

/**
 * Internal Pane class. Holds canvases, contexts, and price scales for a single pane row.
 */
export class Pane {
  public readonly id: string;
  public readonly row: HTMLDivElement;
  public readonly canvases: PaneCanvases;
  public readonly priceScale: PriceScale;
  public readonly leftPriceScale: PriceScale;

  private _height: number;

  constructor(id: string, height: number) {
    this.id = id;
    this._height = Math.max(MIN_PANE_HEIGHT, height);

    this.priceScale = new PriceScale('right');
    this.leftPriceScale = new PriceScale('left');

    // Create the row container
    this.row = document.createElement('div');
    this.row.style.position = 'relative';
    this.row.style.width = '100%';
    this.row.style.height = `${this._height}px`;
    this.row.style.overflow = 'hidden';

    // Chart canvas (series + grid)
    const chartCanvas = document.createElement('canvas');
    chartCanvas.style.position = 'absolute';
    chartCanvas.style.left = '0';
    chartCanvas.style.top = '0';
    chartCanvas.style.zIndex = '1';

    // Overlay canvas (crosshair)
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.zIndex = '2';

    // Right price axis canvas
    const rightPriceAxisCanvas = document.createElement('canvas');
    rightPriceAxisCanvas.style.position = 'absolute';
    rightPriceAxisCanvas.style.top = '0';
    rightPriceAxisCanvas.style.zIndex = '1';

    // Left price axis canvas
    const leftPriceAxisCanvas = document.createElement('canvas');
    leftPriceAxisCanvas.style.position = 'absolute';
    leftPriceAxisCanvas.style.top = '0';
    leftPriceAxisCanvas.style.left = '0';
    leftPriceAxisCanvas.style.zIndex = '1';

    this.row.appendChild(chartCanvas);
    this.row.appendChild(overlayCanvas);
    this.row.appendChild(rightPriceAxisCanvas);
    this.row.appendChild(leftPriceAxisCanvas);

    this.canvases = {
      chartCanvas,
      overlayCanvas,
      rightPriceAxisCanvas,
      leftPriceAxisCanvas,
      chartCtx: chartCanvas.getContext('2d')!,
      overlayCtx: overlayCanvas.getContext('2d')!,
      rightPriceAxisCtx: rightPriceAxisCanvas.getContext('2d')!,
      leftPriceAxisCtx: leftPriceAxisCanvas.getContext('2d')!,
    };
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = Math.max(MIN_PANE_HEIGHT, value);
    this.row.style.height = `${this._height}px`;
  }

  /**
   * Layout all canvases within this pane row.
   */
  layout(
    chartW: number,
    leftScaleW: number,
    priceAxisWidth: number,
    rightScaleVisible: boolean,
    leftScaleVisible: boolean,
    pixelRatio: number,
  ): void {
    const h = this._height;

    this.priceScale.setHeight(h);
    this.leftPriceScale.setHeight(h);

    // Chart + overlay canvases
    for (const canvas of [this.canvases.chartCanvas, this.canvases.overlayCanvas]) {
      canvas.width = Math.round(chartW * pixelRatio);
      canvas.height = Math.round(h * pixelRatio);
      canvas.style.width = `${chartW}px`;
      canvas.style.height = `${h}px`;
      canvas.style.left = `${leftScaleW}px`;
    }

    // Right price axis canvas
    this.canvases.rightPriceAxisCanvas.width = Math.round(priceAxisWidth * pixelRatio);
    this.canvases.rightPriceAxisCanvas.height = Math.round(h * pixelRatio);
    this.canvases.rightPriceAxisCanvas.style.width = `${priceAxisWidth}px`;
    this.canvases.rightPriceAxisCanvas.style.height = `${h}px`;
    this.canvases.rightPriceAxisCanvas.style.left = `${leftScaleW + chartW}px`;
    this.canvases.rightPriceAxisCanvas.style.display = rightScaleVisible ? '' : 'none';

    // Left price axis canvas
    this.canvases.leftPriceAxisCanvas.width = Math.round(priceAxisWidth * pixelRatio);
    this.canvases.leftPriceAxisCanvas.height = Math.round(h * pixelRatio);
    this.canvases.leftPriceAxisCanvas.style.width = `${priceAxisWidth}px`;
    this.canvases.leftPriceAxisCanvas.style.height = `${h}px`;
    this.canvases.leftPriceAxisCanvas.style.left = '0px';
    this.canvases.leftPriceAxisCanvas.style.display = leftScaleVisible ? '' : 'none';

    // Update row height
    this.row.style.height = `${h}px`;
  }
}
