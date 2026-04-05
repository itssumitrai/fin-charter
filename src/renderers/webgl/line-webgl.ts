import type { ColumnStore, VisibleRange } from '../../core/types';
import { createProgram, parseColor, uploadBuffer } from './webgl-utils';

export interface LineWebGLOptions {
  color: string;
  lineWidth: number;
}

const DEFAULT_OPTIONS: LineWebGLOptions = {
  color: '#2196F3',
  lineWidth: 2,
};

// ── Shaders ─────────────────────────────────────────────────────────────────

const VERT_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform vec2 u_resolution;

void main() {
  vec2 clipPos = (a_position / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

const FRAG_SOURCE = `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 fragColor;

void main() {
  fragColor = u_color;
}
`;

/** Cached GL resources for a single WebGL2 context. */
interface GLResources {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  posBuf: WebGLBuffer;
  resolutionLoc: WebGLUniformLocation | null;
  colorLoc: WebGLUniformLocation | null;
}

/**
 * GPU-accelerated line renderer.
 *
 * Draws the close-price polyline as a screen-space ribbon: each line segment
 * is expanded into a quad (2 triangles) on the CPU when building the vertex
 * buffer, and the vertex shader transforms those positions to clip space,
 * giving a consistent pixel-width line regardless of zoom level.
 */
export class LineWebGLRenderer {
  private _options: LineWebGLOptions = { ...DEFAULT_OPTIONS };
  private _resources: Map<WebGL2RenderingContext, GLResources> = new Map();

  // Pre-allocated typed array, grown as needed
  private _posData: Float32Array = new Float32Array(0);

  // Cached parsed color — only reparsed when value actually changes
  private _parsedColor: [number, number, number, number] = parseColor(DEFAULT_OPTIONS.color);

  applyOptions(options: Partial<LineWebGLOptions>): void {
    const previousColor = this._options.color;
    this._options = { ...this._options, ...options };
    if (options.color !== undefined && options.color !== previousColor) {
      this._parsedColor = parseColor(options.color);
    }
  }

  private _getResources(gl: WebGL2RenderingContext): GLResources {
    let res = this._resources.get(gl);
    if (res) return res;

    const program = createProgram(gl, VERT_SOURCE, FRAG_SOURCE);
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const colorLoc = gl.getUniformLocation(program, 'u_color');

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    res = { program, vao, posBuf, resolutionLoc, colorLoc };
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
    const lw = this._options.lineWidth * pr;
    const halfW = lw / 2;

    // Build ribbon quads directly — no intermediate points array
    const numSegments = count - 1;
    const posNeeded = numSegments * 6 * 2;
    if (this._posData.length < posNeeded) this._posData = new Float32Array(posNeeded);
    const posData = this._posData;
    let vi = 0;

    let prevX = indexToX(fromIdx) * pr;
    let prevY = priceToY(store.close[fromIdx]) * pr;

    for (let i = fromIdx + 1; i <= toIdx && i < store.length; i++) {
      const curX = indexToX(i) * pr;
      const curY = priceToY(store.close[i]) * pr;
      const dx = curX - prevX;
      const dy = curY - prevY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        // Perpendicular normal
        const nx = (-dy / len) * halfW;
        const ny = (dx / len) * halfW;

        // Quad corners
        const ax = prevX + nx, ay = prevY + ny;
        const bx = prevX - nx, by = prevY - ny;
        const cx = curX + nx, cy = curY + ny;
        const ddx = curX - nx, ddy = curY - ny;

        // Triangle 1
        posData[vi++] = ax; posData[vi++] = ay;
        posData[vi++] = bx; posData[vi++] = by;
        posData[vi++] = cx; posData[vi++] = cy;
        // Triangle 2
        posData[vi++] = bx; posData[vi++] = by;
        posData[vi++] = ddx; posData[vi++] = ddy;
        posData[vi++] = cx; posData[vi++] = cy;
      }
      prevX = curX;
      prevY = curY;
    }

    const color = this._parsedColor;

    gl.useProgram(res.program);
    gl.uniform2f(res.resolutionLoc, width * pr, height * pr);
    gl.uniform4f(res.colorLoc, color[0], color[1], color[2], color[3]);

    gl.bindVertexArray(res.vao);
    uploadBuffer(gl, res.posBuf, posData.subarray(0, vi));

    gl.drawArrays(gl.TRIANGLES, 0, vi / 2);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    for (const [gl, res] of this._resources) {
      gl.deleteProgram(res.program);
      gl.deleteVertexArray(res.vao);
      gl.deleteBuffer(res.posBuf);
    }
    this._resources.clear();
  }
}
