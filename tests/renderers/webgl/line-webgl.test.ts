import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineWebGLRenderer } from '@/renderers/webgl/line-webgl';
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
    close[i] = 100 + Math.sin(i) * 10;
    volume[i] = 1000;
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
    uniform4f: vi.fn(),
    drawArrays: vi.fn(),
    deleteProgram: vi.fn(),
    deleteVertexArray: vi.fn(),
    deleteBuffer: vi.fn(),
  } as unknown as WebGL2RenderingContext;
}

describe('LineWebGLRenderer', () => {
  let renderer: LineWebGLRenderer;
  let gl: WebGL2RenderingContext;

  beforeEach(() => {
    renderer = new LineWebGLRenderer();
    gl = makeMockGL();
  });

  it('draws line segments as triangle quads', () => {
    const store = makeStore(10);
    const range: VisibleRange = { fromIdx: 0, toIdx: 9 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p * 2);

    expect(gl.drawArrays).toHaveBeenCalled();
    // 10 points = 9 segments × 6 verts = 54
    const drawCall = (gl.drawArrays as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(drawCall[2]).toBe(54);
  });

  it('skips when fewer than 2 points', () => {
    const store = makeStore(1);
    const range: VisibleRange = { fromIdx: 0, toIdx: 0 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('skips drawing when range is empty', () => {
    const store = makeStore(10);
    const range: VisibleRange = { fromIdx: 5, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, () => 0, () => 0);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('applies custom color and caches parsed value', () => {
    renderer.applyOptions({ color: '#ff0000', lineWidth: 3 });
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    // Should set the color uniform to red
    expect(gl.uniform4f).toHaveBeenCalledWith(expect.anything(), 1, 0, 0, 1);
  });

  it('disposes resources', () => {
    const store = makeStore(5);
    renderer.draw(gl, 800, 400, 1, store, { fromIdx: 0, toIdx: 4 }, (i) => i * 10, (p) => 400 - p);
    renderer.dispose();
    expect(gl.deleteProgram).toHaveBeenCalled();
    expect(gl.deleteVertexArray).toHaveBeenCalled();
    expect(gl.deleteBuffer).toHaveBeenCalled();
  });

  it('reuses resources across frames', () => {
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
  });

  it('creates separate resources for different GL contexts', () => {
    const gl2 = makeMockGL();
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    renderer.draw(gl2, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
    expect(gl2.createProgram).toHaveBeenCalledTimes(1);
  });
});
