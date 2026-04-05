import type { ColumnStore, VisibleRange } from '../../core/types';
import { createProgram, parseColor, uploadBuffer } from './webgl-utils';

export interface CandlestickWebGLOptions {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
}

const DEFAULT_OPTIONS: CandlestickWebGLOptions = {
  upColor: '#00E396',
  downColor: '#FF3B5C',
  wickUpColor: '#00E396',
  wickDownColor: '#FF3B5C',
};

// ── Shaders ─────────────────────────────────────────────────────────────────

const VERT_SOURCE = `#version 300 es
precision highp float;

// Per-vertex: xy position in pixels
layout(location = 0) in vec2 a_position;
// Per-vertex: rgba color
layout(location = 1) in vec4 a_color;

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
  // Convert pixel coords to clip space (-1..+1)
  vec2 clipPos = (a_position / u_resolution) * 2.0 - 1.0;
  // Flip Y (canvas Y=0 is top)
  clipPos.y = -clipPos.y;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_color = a_color;
}
`;

const FRAG_SOURCE = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
`;

/** Cached GL resources for a single WebGL2 context. */
interface GLResources {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  posBuf: WebGLBuffer;
  colorBuf: WebGLBuffer;
  resolutionLoc: WebGLUniformLocation | null;
}

/**
 * GPU-accelerated candlestick renderer using per-vertex rectangle geometry.
 *
 * Each candle is composed of two rectangles (wick + body), with each
 * rectangle emitted as two triangles (6 vertices) into typed arrays.
 * The vertex buffer is rebuilt each frame from the visible range — fast
 * enough for 500k+ bars because only the visible subset is generated and
 * uploaded.
 */
export class CandlestickWebGLRenderer {
  private _options: CandlestickWebGLOptions = { ...DEFAULT_OPTIONS };
  private _resources: Map<WebGL2RenderingContext, GLResources> = new Map();

  // Pre-allocated typed arrays, grown as needed
  private _posData: Float32Array = new Float32Array(0);
  private _colorData: Float32Array = new Float32Array(0);

  // Cached parsed colors — only reparsed when values actually change
  private _upColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.upColor);
  private _downColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.downColor);
  private _wickUpColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.wickUpColor);
  private _wickDownColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.wickDownColor);

  applyOptions(options: Partial<CandlestickWebGLOptions>): void {
    if (options.upColor !== undefined && options.upColor !== this._options.upColor) {
      this._upColor = parseColor(options.upColor);
    }
    if (options.downColor !== undefined && options.downColor !== this._options.downColor) {
      this._downColor = parseColor(options.downColor);
    }
    if (options.wickUpColor !== undefined && options.wickUpColor !== this._options.wickUpColor) {
      this._wickUpColor = parseColor(options.wickUpColor);
    }
    if (options.wickDownColor !== undefined && options.wickDownColor !== this._options.wickDownColor) {
      this._wickDownColor = parseColor(options.wickDownColor);
    }
    this._options = { ...this._options, ...options };
  }

  private _getResources(gl: WebGL2RenderingContext): GLResources {
    let res = this._resources.get(gl);
    if (res) return res;

    const program = createProgram(gl, VERT_SOURCE, FRAG_SOURCE);
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const colorBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    res = { program, vao, posBuf, colorBuf, resolutionLoc };
    this._resources.set(gl, res);
    return res;
  }

  draw(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    pixelRatio: number,
    store: ColumnStore,
    range: VisibleRange,
    indexToX: (i: number) => number,
    priceToY: (price: number) => number,
    barWidth: number,
  ): void {
    const { fromIdx, toIdx } = range;
    if (fromIdx >= toIdx || store.length === 0) return;

    const res = this._getResources(gl);
    const pr = pixelRatio;

    const upColor = this._upColor;
    const downColor = this._downColor;
    const wickUpColor = this._wickUpColor;
    const wickDownColor = this._wickDownColor;

    const count = Math.min(toIdx, store.length - 1) - fromIdx + 1;
    // 2 rects per candle × 6 vertices per rect = 12 vertices per candle
    const posNeeded = count * 12 * 2;
    const colorNeeded = count * 12 * 4;
    if (this._posData.length < posNeeded) this._posData = new Float32Array(posNeeded);
    if (this._colorData.length < colorNeeded) this._colorData = new Float32Array(colorNeeded);

    const posData = this._posData;
    const colorData = this._colorData;

    let vi = 0; // vertex index into posData (stride 2)
    let ci = 0; // vertex index into colorData (stride 4)

    const halfBody = Math.max(1, (barWidth * pr) / 2);
    const wickHalf = Math.max(0.5, pr / 2);

    for (let i = fromIdx; i <= toIdx && i < store.length; i++) {
      const open = store.open[i];
      const close = store.close[i];
      const high = store.high[i];
      const low = store.low[i];
      const isUp = close >= open;

      const cx = indexToX(i) * pr;
      const openY = priceToY(open) * pr;
      const closeY = priceToY(close) * pr;
      const highY = priceToY(high) * pr;
      const lowY = priceToY(low) * pr;

      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyH = Math.max(1, bodyBottom - bodyTop);

      const wColor = isUp ? wickUpColor : wickDownColor;
      const bColor = isUp ? upColor : downColor;

      // ── Wick rect ──
      const wx0 = cx - wickHalf;
      const wx1 = cx + wickHalf;
      const wy0 = highY;
      const wy1 = lowY;
      // Triangle 1
      posData[vi++] = wx0; posData[vi++] = wy0;
      posData[vi++] = wx1; posData[vi++] = wy0;
      posData[vi++] = wx0; posData[vi++] = wy1;
      // Triangle 2
      posData[vi++] = wx1; posData[vi++] = wy0;
      posData[vi++] = wx1; posData[vi++] = wy1;
      posData[vi++] = wx0; posData[vi++] = wy1;
      for (let v = 0; v < 6; v++) {
        colorData[ci++] = wColor[0];
        colorData[ci++] = wColor[1];
        colorData[ci++] = wColor[2];
        colorData[ci++] = wColor[3];
      }

      // ── Body rect ──
      const bx0 = cx - halfBody;
      const bx1 = cx + halfBody;
      const by0 = bodyTop;
      const by1 = bodyTop + bodyH;
      // Triangle 1
      posData[vi++] = bx0; posData[vi++] = by0;
      posData[vi++] = bx1; posData[vi++] = by0;
      posData[vi++] = bx0; posData[vi++] = by1;
      // Triangle 2
      posData[vi++] = bx1; posData[vi++] = by0;
      posData[vi++] = bx1; posData[vi++] = by1;
      posData[vi++] = bx0; posData[vi++] = by1;
      for (let v = 0; v < 6; v++) {
        colorData[ci++] = bColor[0];
        colorData[ci++] = bColor[1];
        colorData[ci++] = bColor[2];
        colorData[ci++] = bColor[3];
      }
    }

    // Upload & draw
    gl.useProgram(res.program);
    gl.uniform2f(res.resolutionLoc, width * pr, height * pr);
    gl.bindVertexArray(res.vao);

    uploadBuffer(gl, res.posBuf, posData.subarray(0, vi));
    uploadBuffer(gl, res.colorBuf, colorData.subarray(0, ci));

    gl.drawArrays(gl.TRIANGLES, 0, vi / 2);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    for (const [gl, res] of this._resources) {
      gl.deleteProgram(res.program);
      gl.deleteVertexArray(res.vao);
      gl.deleteBuffer(res.posBuf);
      gl.deleteBuffer(res.colorBuf);
    }
    this._resources.clear();
  }
}
