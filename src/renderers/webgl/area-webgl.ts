import type { ColumnStore, VisibleRange } from '../../core/types';
import { createProgram, parseColor, uploadBuffer } from './webgl-utils';

export interface AreaWebGLOptions {
  lineColor: string;
  lineWidth: number;
  topColor: string;
  bottomColor: string;
}

const DEFAULT_OPTIONS: AreaWebGLOptions = {
  lineColor: '#2196F3',
  lineWidth: 2,
  topColor: 'rgba(33, 150, 243, 0.4)',
  bottomColor: 'rgba(33, 150, 243, 0)',
};

// ── Shaders for gradient fill ───────────────────────────────────────────────

const FILL_VERT_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in float a_t; // 0 = top of fill, 1 = bottom

uniform vec2 u_resolution;

out float v_t;

void main() {
  vec2 clipPos = (a_position / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  v_t = a_t;
}
`;

const FILL_FRAG_SOURCE = `#version 300 es
precision highp float;

in float v_t;
uniform vec4 u_topColor;
uniform vec4 u_bottomColor;

out vec4 fragColor;

void main() {
  fragColor = mix(u_topColor, u_bottomColor, v_t);
}
`;

// ── Shaders for the line on top ─────────────────────────────────────────────

const LINE_VERT_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
uniform vec2 u_resolution;

void main() {
  vec2 clipPos = (a_position / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

const LINE_FRAG_SOURCE = `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 fragColor;

void main() {
  fragColor = u_color;
}
`;

/** Cached GL resources for fill pass. */
interface FillResources {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  posBuf: WebGLBuffer;
  tBuf: WebGLBuffer;
  resolutionLoc: WebGLUniformLocation | null;
  topColorLoc: WebGLUniformLocation | null;
  botColorLoc: WebGLUniformLocation | null;
}

/** Cached GL resources for line pass. */
interface LineResources {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  posBuf: WebGLBuffer;
  resolutionLoc: WebGLUniformLocation | null;
  colorLoc: WebGLUniformLocation | null;
}

interface GLResources {
  fill: FillResources;
  line: LineResources;
}

/**
 * GPU-accelerated area (mountain) chart renderer.
 *
 * Renders two passes:
 * 1. Gradient-filled polygon from the price line down to the pane bottom.
 * 2. Thick line along the close prices (same ribbon approach as LineWebGLRenderer).
 */
export class AreaWebGLRenderer {
  private _options: AreaWebGLOptions = { ...DEFAULT_OPTIONS };
  private _resources: Map<WebGL2RenderingContext, GLResources> = new Map();

  // Pre-allocated typed arrays, grown as needed
  private _fillPos: Float32Array = new Float32Array(0);
  private _fillT: Float32Array = new Float32Array(0);
  private _linePos: Float32Array = new Float32Array(0);

  // Cached parsed colors
  private _topColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.topColor);
  private _bottomColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.bottomColor);
  private _lineColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.lineColor);

  applyOptions(options: Partial<AreaWebGLOptions>): void {
    if (options.topColor !== undefined && options.topColor !== this._options.topColor) {
      this._topColor = parseColor(options.topColor);
    }
    if (options.bottomColor !== undefined && options.bottomColor !== this._options.bottomColor) {
      this._bottomColor = parseColor(options.bottomColor);
    }
    if (options.lineColor !== undefined && options.lineColor !== this._options.lineColor) {
      this._lineColor = parseColor(options.lineColor);
    }
    this._options = { ...this._options, ...options };
  }

  private _getResources(gl: WebGL2RenderingContext): GLResources {
    let res = this._resources.get(gl);
    if (res) return res;

    // ── Fill pass setup ──
    const fillProgram = createProgram(gl, FILL_VERT_SOURCE, FILL_FRAG_SOURCE);
    const fillVao = gl.createVertexArray()!;
    gl.bindVertexArray(fillVao);

    const fillPosBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, fillPosBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const fillTBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, fillTBuf);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    // ── Line pass setup ──
    const lineProgram = createProgram(gl, LINE_VERT_SOURCE, LINE_FRAG_SOURCE);
    const lineVao = gl.createVertexArray()!;
    gl.bindVertexArray(lineVao);

    const linePosBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, linePosBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    res = {
      fill: {
        program: fillProgram,
        vao: fillVao,
        posBuf: fillPosBuf,
        tBuf: fillTBuf,
        resolutionLoc: gl.getUniformLocation(fillProgram, 'u_resolution'),
        topColorLoc: gl.getUniformLocation(fillProgram, 'u_topColor'),
        botColorLoc: gl.getUniformLocation(fillProgram, 'u_bottomColor'),
      },
      line: {
        program: lineProgram,
        vao: lineVao,
        posBuf: linePosBuf,
        resolutionLoc: gl.getUniformLocation(lineProgram, 'u_resolution'),
        colorLoc: gl.getUniformLocation(lineProgram, 'u_color'),
      },
    };
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
  ): void {
    const { fromIdx, toIdx } = range;
    if (fromIdx >= toIdx || store.length === 0) return;

    const count = Math.min(toIdx, store.length - 1) - fromIdx + 1;
    if (count < 2) return;

    const res = this._getResources(gl);
    const pr = pixelRatio;
    const bottomY = height * pr;
    const numSeg = count - 1;

    // ── Pass 1: gradient fill ──
    // Build fill triangles directly — no intermediate points array
    const fillPosNeeded = numSeg * 6 * 2;
    const fillTNeeded = numSeg * 6;
    if (this._fillPos.length < fillPosNeeded) this._fillPos = new Float32Array(fillPosNeeded);
    if (this._fillT.length < fillTNeeded) this._fillT = new Float32Array(fillTNeeded);

    const fillPos = this._fillPos;
    const fillT = this._fillT;
    let fi = 0;
    let ti = 0;

    // First pass: find minY for gradient interpolation
    let minY = Infinity;
    let prevX = indexToX(fromIdx) * pr;
    let prevY = priceToY(store.close[fromIdx]) * pr;
    if (prevY < minY) minY = prevY;
    for (let i = fromIdx + 1; i <= toIdx && i < store.length; i++) {
      const y = priceToY(store.close[i]) * pr;
      if (y < minY) minY = y;
    }
    const rangeY = bottomY - minY;

    // Build fill geometry
    for (let i = fromIdx + 1; i <= toIdx && i < store.length; i++) {
      const curX = indexToX(i) * pr;
      const curY = priceToY(store.close[i]) * pr;
      const t0 = rangeY > 0 ? (prevY - minY) / rangeY : 0;
      const t1 = rangeY > 0 ? (curY - minY) / rangeY : 0;

      // Triangle 1: prev, prevBottom, cur
      fillPos[fi++] = prevX; fillPos[fi++] = prevY;
      fillPos[fi++] = prevX; fillPos[fi++] = bottomY;
      fillPos[fi++] = curX; fillPos[fi++] = curY;
      fillT[ti++] = t0; fillT[ti++] = 1; fillT[ti++] = t1;

      // Triangle 2: cur, prevBottom, curBottom
      fillPos[fi++] = curX; fillPos[fi++] = curY;
      fillPos[fi++] = prevX; fillPos[fi++] = bottomY;
      fillPos[fi++] = curX; fillPos[fi++] = bottomY;
      fillT[ti++] = t1; fillT[ti++] = 1; fillT[ti++] = 1;

      prevX = curX;
      prevY = curY;
    }

    const topColor = this._topColor;
    const botColor = this._bottomColor;

    gl.useProgram(res.fill.program);
    gl.uniform2f(res.fill.resolutionLoc, width * pr, height * pr);
    gl.uniform4f(res.fill.topColorLoc, topColor[0], topColor[1], topColor[2], topColor[3]);
    gl.uniform4f(res.fill.botColorLoc, botColor[0], botColor[1], botColor[2], botColor[3]);

    gl.bindVertexArray(res.fill.vao);
    uploadBuffer(gl, res.fill.posBuf, fillPos.subarray(0, fi));
    uploadBuffer(gl, res.fill.tBuf, fillT.subarray(0, ti));
    gl.drawArrays(gl.TRIANGLES, 0, fi / 2);
    gl.bindVertexArray(null);

    // ── Pass 2: line ──
    const lw = this._options.lineWidth * pr;
    const halfW = lw / 2;

    const linePosNeeded = numSeg * 6 * 2;
    if (this._linePos.length < linePosNeeded) this._linePos = new Float32Array(linePosNeeded);
    const linePos = this._linePos;
    let li = 0;

    prevX = indexToX(fromIdx) * pr;
    prevY = priceToY(store.close[fromIdx]) * pr;

    for (let i = fromIdx + 1; i <= toIdx && i < store.length; i++) {
      const curX = indexToX(i) * pr;
      const curY = priceToY(store.close[i]) * pr;
      const dx = curX - prevX;
      const dy = curY - prevY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const nx = (-dy / len) * halfW;
        const ny = (dx / len) * halfW;

        // Quad as 2 triangles
        linePos[li++] = prevX + nx; linePos[li++] = prevY + ny;
        linePos[li++] = prevX - nx; linePos[li++] = prevY - ny;
        linePos[li++] = curX + nx; linePos[li++] = curY + ny;

        linePos[li++] = prevX - nx; linePos[li++] = prevY - ny;
        linePos[li++] = curX - nx; linePos[li++] = curY - ny;
        linePos[li++] = curX + nx; linePos[li++] = curY + ny;
      }
      prevX = curX;
      prevY = curY;
    }

    const lineColor = this._lineColor;

    gl.useProgram(res.line.program);
    gl.uniform2f(res.line.resolutionLoc, width * pr, height * pr);
    gl.uniform4f(res.line.colorLoc, lineColor[0], lineColor[1], lineColor[2], lineColor[3]);

    gl.bindVertexArray(res.line.vao);
    uploadBuffer(gl, res.line.posBuf, linePos.subarray(0, li));
    gl.drawArrays(gl.TRIANGLES, 0, li / 2);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    for (const [gl, res] of this._resources) {
      gl.deleteProgram(res.fill.program);
      gl.deleteVertexArray(res.fill.vao);
      gl.deleteBuffer(res.fill.posBuf);
      gl.deleteBuffer(res.fill.tBuf);
      gl.deleteProgram(res.line.program);
      gl.deleteVertexArray(res.line.vao);
      gl.deleteBuffer(res.line.posBuf);
    }
    this._resources.clear();
  }
}
