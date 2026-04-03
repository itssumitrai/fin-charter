import type { GradientStop, PathCommand } from '@/core/types';
import type { DrawStyle, IRenderer } from './renderer';

/**
 * CanvasRenderer — IRenderer implementation backed by a CanvasRenderingContext2D.
 *
 * Coordinate arguments accepted by public methods are in **logical (CSS) pixels**.
 * The implementation multiplies all coordinates by `pixelRatio` so that the
 * resulting marks are always sharp on HiDPI/Retina displays.
 */
export class CanvasRenderer implements IRenderer {
  private _ctx: CanvasRenderingContext2D;
  private _pixelRatio: number;

  constructor(ctx: CanvasRenderingContext2D, pixelRatio = 1) {
    this._ctx = ctx;
    this._pixelRatio = pixelRatio;
  }

  // ─── Surface management ────────────────────────────────────────────────────

  setSize(width: number, height: number, pixelRatio: number): void {
    this._pixelRatio = pixelRatio;
    const canvas = this._ctx.canvas;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
  }

  clear(): void {
    const canvas = this._ctx.canvas;
    this._ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ─── State stack ──────────────────────────────────────────────────────────

  save(): void {
    this._ctx.save();
  }

  restore(): void {
    this._ctx.restore();
  }

  // ─── Transform & clip ─────────────────────────────────────────────────────

  clip(x: number, y: number, width: number, height: number): void {
    const pr = this._pixelRatio;
    this._ctx.beginPath();
    this._ctx.rect(
      Math.round(x * pr),
      Math.round(y * pr),
      Math.round(width * pr),
      Math.round(height * pr),
    );
    this._ctx.clip();
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this._ctx.setTransform(a, b, c, d, e, f);
  }

  // ─── Drawing primitives ───────────────────────────────────────────────────

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    const pr = this._pixelRatio;
    const ctx = this._ctx;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1 * pr), Math.round(y1 * pr));
    ctx.lineTo(Math.round(x2 * pr), Math.round(y2 * pr));
    ctx.stroke();
  }

  drawRect(x: number, y: number, width: number, height: number): void {
    const pr = this._pixelRatio;
    this._ctx.strokeRect(
      Math.round(x * pr),
      Math.round(y * pr),
      Math.round(width * pr),
      Math.round(height * pr),
    );
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    const pr = this._pixelRatio;
    this._ctx.fillRect(
      Math.round(x * pr),
      Math.round(y * pr),
      Math.round(width * pr),
      Math.round(height * pr),
    );
  }

  drawPath(commands: PathCommand[], fill = false): void {
    const pr = this._pixelRatio;
    const ctx = this._ctx;
    ctx.beginPath();
    for (const cmd of commands) {
      switch (cmd.cmd) {
        case 'M':
          ctx.moveTo(Math.round(cmd.x * pr), Math.round(cmd.y * pr));
          break;
        case 'L':
          ctx.lineTo(Math.round(cmd.x * pr), Math.round(cmd.y * pr));
          break;
        case 'Q':
          ctx.quadraticCurveTo(
            Math.round(cmd.cpx * pr),
            Math.round(cmd.cpy * pr),
            Math.round(cmd.x * pr),
            Math.round(cmd.y * pr),
          );
          break;
        case 'C':
          ctx.bezierCurveTo(
            Math.round(cmd.cp1x * pr),
            Math.round(cmd.cp1y * pr),
            Math.round(cmd.cp2x * pr),
            Math.round(cmd.cp2y * pr),
            Math.round(cmd.x * pr),
            Math.round(cmd.y * pr),
          );
          break;
        case 'Z':
          ctx.closePath();
          break;
      }
    }
    if (fill) ctx.fill();
    ctx.stroke();
  }

  fillText(text: string, x: number, y: number): void {
    const pr = this._pixelRatio;
    this._ctx.fillText(text, Math.round(x * pr), Math.round(y * pr));
  }

  measureText(text: string): number {
    return this._ctx.measureText(text).width / this._pixelRatio;
  }

  // ─── Style ────────────────────────────────────────────────────────────────

  setStyle(style: DrawStyle): void {
    const ctx = this._ctx;
    if (style.strokeColor !== undefined) ctx.strokeStyle = style.strokeColor;
    if (style.fillColor !== undefined) ctx.fillStyle = style.fillColor;
    if (style.lineWidth !== undefined) ctx.lineWidth = style.lineWidth * this._pixelRatio;
    if (style.lineDash !== undefined)
      ctx.setLineDash(style.lineDash.map((v) => v * this._pixelRatio));
    if (style.font !== undefined) ctx.font = style.font;
    if (style.textAlign !== undefined) ctx.textAlign = style.textAlign;
    if (style.textBaseline !== undefined) ctx.textBaseline = style.textBaseline;
    if (style.globalAlpha !== undefined) ctx.globalAlpha = style.globalAlpha;
  }

  // ─── Gradient ─────────────────────────────────────────────────────────────

  createGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: GradientStop[],
  ): CanvasGradient {
    const pr = this._pixelRatio;
    const gradient = this._ctx.createLinearGradient(
      Math.round(x0 * pr),
      Math.round(y0 * pr),
      Math.round(x1 * pr),
      Math.round(y1 * pr),
    );
    for (const stop of stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }
    return gradient;
  }
}
