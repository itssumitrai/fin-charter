import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AreaWebGLRenderer } from '@/renderers/webgl/area-webgl';
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

describe('AreaWebGLRenderer', () => {
  let renderer: AreaWebGLRenderer;
  let gl: WebGL2RenderingContext;

  beforeEach(() => {
    renderer = new AreaWebGLRenderer();
    gl = makeMockGL();
  });

  it('draws fill and line in two passes', () => {
    const store = makeStore(10);
    const range: VisibleRange = { fromIdx: 0, toIdx: 9 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p * 2);

    // Should make 2 draw calls: fill pass and line pass
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);

    // Fill pass: 9 segments × 6 verts = 54
    const fillCall = (gl.drawArrays as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fillCall[2]).toBe(54);

    // Line pass: 9 segments × 6 verts = 54
    const lineCall = (gl.drawArrays as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(lineCall[2]).toBe(54);
  });

  it('skips when range is empty', () => {
    const store = makeStore(10);
    const range: VisibleRange = { fromIdx: 5, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, () => 0, () => 0);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('skips when store is empty', () => {
    const store = makeStore(0);
    const range: VisibleRange = { fromIdx: 0, toIdx: 5 };
    renderer.draw(gl, 800, 400, 1, store, range, () => 0, () => 0);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('skips when fewer than 2 points', () => {
    const store = makeStore(1);
    const range: VisibleRange = { fromIdx: 0, toIdx: 0 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });

  it('applies custom options and caches parsed colors', () => {
    renderer.applyOptions({ lineColor: '#ff0000', topColor: 'rgba(255, 0, 0, 0.5)' });
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  });

  it('disposes resources from both passes for all contexts', () => {
    const store = makeStore(5);
    renderer.draw(gl, 800, 400, 1, store, { fromIdx: 0, toIdx: 4 }, (i) => i * 10, (p) => 400 - p);
    renderer.dispose();
    // Should delete both fill and line programs
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.deleteVertexArray).toHaveBeenCalledTimes(2);
    // 3 buffers total: fill pos, fill t, line pos
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(3);
  });

  it('uses two separate shader programs', () => {
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    // useProgram called for fill pass and line pass
    expect(gl.useProgram).toHaveBeenCalledTimes(2);
  });

  it('reuses resources across frames', () => {
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    // 2 programs created total (fill + line), not 4
    expect(gl.createProgram).toHaveBeenCalledTimes(2);
  });

  it('creates separate resources for different GL contexts', () => {
    const gl2 = makeMockGL();
    const store = makeStore(5);
    const range: VisibleRange = { fromIdx: 0, toIdx: 4 };
    renderer.draw(gl, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    renderer.draw(gl2, 800, 400, 1, store, range, (i) => i * 10, (p) => 400 - p);
    // Each context gets 2 programs (fill + line)
    expect(gl.createProgram).toHaveBeenCalledTimes(2);
    expect(gl2.createProgram).toHaveBeenCalledTimes(2);
  });
});
