import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CandlestickWebGLRenderer } from '@/renderers/webgl/candlestick-webgl';
import type { ColumnStore, VisibleRange } from '@/core/types';

function makeStore(length: number): ColumnStore {
  const time = new Float64Array(length);
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    time[i] = 1000 + i * 60;
    open[i] = 100 + i;
    high[i] = 110 + i;
    low[i] = 90 + i;
    close[i] = i % 2 === 0 ? 105 + i : 95 + i;
    volume[i] = 1000 * (i + 1);
  }
  return { time, open, high, low, close, volume, length };
}

function makeMockGL(): WebGL2RenderingContext {
  const vao = { id: 'vao' };
  const buffer = { id: 'buf' };
  const program = { id: 'prog' };
  const shader = { id: 'shader' };
  const uniformLoc = { id: 'loc' };

  return {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    COMPILE_STATUS: 0x8B81,
    LINK_STATUS: 0x8B82,
    ARRAY_BUFFER: 0x8892,
    DYNAMIC_DRAW: 0x88E8,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,

    createShader: vi.fn().mockReturnValue(shader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn().mockReturnValue(true),
    createProgram: vi.fn().mockReturnValue(program),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn().mockReturnValue(true),
    detachShader: vi.fn(),
    deleteShader: vi.fn(),
    getUniformLocation: vi.fn().mockReturnValue(uniformLoc),
    createVertexArray: vi.fn().mockReturnValue(vao),
    bindVertexArray: vi.fn(),
    createBuffer: vi.fn().mockReturnValue(buffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    useProgram: vi.fn(),
    uniform2f: vi.fn(),
    drawArrays: vi.fn(),
    deleteProgram: vi.fn(),
    deleteVertexArray: vi.fn(),
    deleteBuffer: vi.fn(),
  } as unknown as WebGL2RenderingContext;
}

describe('CandlestickWebGLRenderer', () => {
  let renderer: CandlestickWebGLRenderer;
  let gl: WebGL2RenderingContext;

  beforeEach(() => {
    renderer = new CandlestickWebGLRenderer();
    gl = makeMockGL();
  });

  it('draws visible bars using WebGL triangles', () => {
    const store = makeStore(10);
    const range: VisibleRange = { fromIdx: 0, toIdx: 9 };
    const indexToX = (i: number) => i * 10;
    const priceToY = (p: number) => 400 - p * 2;

    renderer.draw(gl, 800, 400, 1, store, range, indexToX, priceToY, 6);

    expect(gl.useProgram).toHaveBeenCalled();
    expect(gl.drawArrays).toHaveBeenCalled();
    // 10 bars × 12 vertices = 120 vertices
    const drawCall = (gl.drawArrays as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(drawCall[0]).toBe(0x0004); // TRIANGLES
    expect(drawCall[2]).toBe(120); // 10 bars * 2 rects * 6 verts
  });

  it('skips drawing when range is empty', () => {
    const store = makeStore(10);
    const range: VisibleRange = { fromIdx: 5, toIdx: 4 }; // empty
    renderer.draw(gl, 800, 400, 1, store, range, () => 0, () => 0, 6);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('skips drawing when store is empty', () => {
    const store = makeStore(0);
    const range: VisibleRange = { fromIdx: 0, toIdx: 10 };
    renderer.draw(gl, 800, 400, 1, store, range, () => 0, () => 0, 6);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('applies custom options and caches parsed colors', () => {
    renderer.applyOptions({ upColor: '#00ff00', downColor: '#0000ff' });
    const store = makeStore(2);
    const range: VisibleRange = { fromIdx: 0, toIdx: 1 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p, 6);
    expect(gl.drawArrays).toHaveBeenCalled();
  });

  it('disposes WebGL resources for all contexts', () => {
    const store = makeStore(2);
    renderer.draw(gl, 800, 400, 1, store, { fromIdx: 0, toIdx: 1 }, (i) => i * 10, (p) => 400 - p, 6);
    renderer.dispose();
    expect(gl.deleteProgram).toHaveBeenCalled();
    expect(gl.deleteVertexArray).toHaveBeenCalled();
    expect(gl.deleteBuffer).toHaveBeenCalled();
  });

  it('handles partial visible range', () => {
    const store = makeStore(100);
    const range: VisibleRange = { fromIdx: 20, toIdx: 40 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 8, (p) => 400 - p * 2, 6);
    const drawCall = (gl.drawArrays as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(drawCall[2]).toBe(21 * 12); // 21 bars in range [20, 40]
  });

  it('handles HiDPI pixelRatio', () => {
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 2, store, range, (i) => i * 10, (p) => 400 - p, 6);
    // Should set resolution uniform with scaled dimensions
    expect(gl.uniform2f).toHaveBeenCalledWith(expect.anything(), 1600, 800);
  });

  it('reuses pre-allocated buffers across frames', () => {
    const store = makeStore(10);
    const range: VisibleRange = { fromIdx: 0, toIdx: 9 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p, 6);
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p, 6);
    // Second draw should reuse resources — only 1 createProgram call
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
  });

  it('creates separate resources for different GL contexts', () => {
    const gl2 = makeMockGL();
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p, 6);
    renderer.draw(gl2, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p, 6);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
    expect(gl2.createProgram).toHaveBeenCalledTimes(1);
  });
});
