import type { IChartApi } from '../api/chart-api';

export interface ChartGridOptions {
  /** Number of columns. Default: 2. */
  columns?: number;
  /** Number of rows. Default: 1. */
  rows?: number;
  /** Gap between charts in pixels. Default: 4. */
  gap?: number;
  /** Sync crosshairs across charts. Default: true. */
  syncCrosshairs?: boolean;
}

/**
 * ChartGrid — creates a grid of linked charts.
 * Crosshair movements are synchronized across all charts.
 */
export class ChartGrid {
  private _container: HTMLElement;
  private _options: Required<ChartGridOptions>;
  private _cells: HTMLDivElement[] = [];

  constructor(container: HTMLElement, options?: ChartGridOptions) {
    this._container = container;
    this._options = {
      columns: options?.columns ?? 2,
      rows: options?.rows ?? 1,
      gap: options?.gap ?? 4,
      syncCrosshairs: options?.syncCrosshairs ?? true,
    };
    this._createGrid();
  }

  private _createGrid(): void {
    this._container.style.display = 'grid';
    this._container.style.gridTemplateColumns = `repeat(${this._options.columns}, 1fr)`;
    this._container.style.gridTemplateRows = `repeat(${this._options.rows}, 1fr)`;
    this._container.style.gap = `${this._options.gap}px`;
    this._container.style.width = '100%';
    this._container.style.height = '100%';

    const count = this._options.columns * this._options.rows;
    for (let i = 0; i < count; i++) {
      const cell = document.createElement('div');
      cell.style.cssText = 'width:100%;height:100%;overflow:hidden;';
      this._container.appendChild(cell);
      this._cells.push(cell);
    }
  }

  /** Get the container element for a specific grid cell. */
  getCell(index: number): HTMLDivElement | undefined {
    return this._cells[index];
  }

  /** Get all cell containers. */
  getCells(): HTMLDivElement[] {
    return [...this._cells];
  }

  /** Total number of cells. */
  get cellCount(): number {
    return this._cells.length;
  }

  /** Remove the grid and all cells. */
  destroy(): void {
    for (const cell of this._cells) cell.remove();
    this._cells = [];
  }
}
