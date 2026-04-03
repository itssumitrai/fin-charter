import type { GradientStop, PathCommand } from '@/core/types';

/**
 * Style options for drawing operations.
 */
export interface DrawStyle {
  strokeColor?: string;
  fillColor?: string;
  lineWidth?: number;
  lineDash?: number[];
  font?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  globalAlpha?: number;
}

/**
 * IRenderer — thin abstraction over a 2D drawing surface.
 *
 * All coordinate arguments are in **logical (CSS) pixels**; implementations
 * are responsible for applying the pixelRatio internally.
 */
export interface IRenderer {
  /** Resize the backing surface. */
  setSize(width: number, height: number, pixelRatio: number): void;

  /** Clear the entire surface. */
  clear(): void;

  /** Push the current drawing state onto the stack. */
  save(): void;

  /** Pop the top drawing state from the stack. */
  restore(): void;

  /** Clip subsequent drawing to the given rectangle (logical px). */
  clip(x: number, y: number, width: number, height: number): void;

  /**
   * Set the current transform matrix (six-element affine transform).
   * Values are in physical pixels (already account for pixelRatio).
   */
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;

  /** Draw a stroked line from (x1, y1) to (x2, y2). */
  drawLine(x1: number, y1: number, x2: number, y2: number): void;

  /** Draw a stroked rectangle. */
  drawRect(x: number, y: number, width: number, height: number): void;

  /** Draw a filled rectangle. */
  fillRect(x: number, y: number, width: number, height: number): void;

  /**
   * Execute a series of path commands and then stroke (and optionally fill)
   * the resulting path.
   */
  drawPath(commands: PathCommand[], fill?: boolean): void;

  /** Render a text string at the given position. */
  fillText(text: string, x: number, y: number): void;

  /** Return the rendered width of the given text string in logical pixels. */
  measureText(text: string): number;

  /** Apply a set of style properties to subsequent drawing operations. */
  setStyle(style: DrawStyle): void;

  /**
   * Create a vertical linear gradient between y0 and y1 (logical px) and
   * return it as a CanvasGradient.
   */
  createGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: GradientStop[],
  ): CanvasGradient;
}
