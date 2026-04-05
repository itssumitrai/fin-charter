import { describe, it, expect, vi } from 'vitest';
import { parseColor, isWebGLAvailable, compileShader, createProgram, uploadBuffer } from '@/renderers/webgl/webgl-utils';

describe('parseColor', () => {
  it('parses hex #RRGGBB', () => {
    expect(parseColor('#ff0000')).toEqual([1, 0, 0, 1]);
    expect(parseColor('#00ff00')).toEqual([0, 1, 0, 1]);
    expect(parseColor('#0000ff')).toEqual([0, 0, 1, 1]);
  });

  it('parses hex #RGB shorthand', () => {
    expect(parseColor('#f00')).toEqual([1, 0, 0, 1]);
  });

  it('parses rgb(r, g, b)', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual([1, 0, 0, 1]);
  });

  it('parses rgba(r, g, b, a)', () => {
    const [r, g, b, a] = parseColor('rgba(255, 128, 0, 0.5)');
    expect(r).toBeCloseTo(1, 2);
    expect(g).toBeCloseTo(128 / 255, 2);
    expect(b).toBe(0);
    expect(a).toBe(0.5);
  });

  it('parses hex #RRGGBBAA', () => {
    const [r, g, b, a] = parseColor('#ff000080');
    expect(r).toBe(1);
    expect(g).toBe(0);
    expect(b).toBe(0);
    expect(a).toBeCloseTo(128 / 255, 2);
  });

  it('returns white for unsupported hex lengths', () => {
    expect(parseColor('#ffff')).toEqual([1, 1, 1, 1]);
    expect(parseColor('#f')).toEqual([1, 1, 1, 1]);
  });

  it('returns white for unrecognized format', () => {
    expect(parseColor('not-a-color')).toEqual([1, 1, 1, 1]);
  });
});

describe('isWebGLAvailable', () => {
  it('returns false in jsdom (no real WebGL)', () => {
    // jsdom does not implement WebGL, so this should return false
    expect(isWebGLAvailable()).toBe(false);
  });
});

describe('compileShader', () => {
  it('throws when gl.createShader returns null', () => {
    const gl = {
      createShader: vi.fn().mockReturnValue(null),
    } as unknown as WebGL2RenderingContext;
    expect(() => compileShader(gl, 0x8B31, 'void main(){}')).toThrow('Failed to create shader');
  });

  it('throws on compilation failure', () => {
    const shader = {};
    const gl = {
      createShader: vi.fn().mockReturnValue(shader),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(false),
      getShaderInfoLog: vi.fn().mockReturnValue('syntax error'),
      deleteShader: vi.fn(),
    } as unknown as WebGL2RenderingContext;
    expect(() => compileShader(gl, 0x8B31, 'bad code')).toThrow('Shader compilation failed: syntax error');
    expect(gl.deleteShader).toHaveBeenCalledWith(shader);
  });

  it('returns shader on success', () => {
    const shader = { id: 1 };
    const gl = {
      createShader: vi.fn().mockReturnValue(shader),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
    } as unknown as WebGL2RenderingContext;
    expect(compileShader(gl, 0x8B31, 'void main(){}')).toBe(shader);
  });
});

describe('createProgram', () => {
  function makeSuccessfulGL() {
    const vs = { type: 'vs' };
    const fs = { type: 'fs' };
    const program = { id: 'prog' };
    let callCount = 0;
    const gl = {
      VERTEX_SHADER: 0x8B31,
      FRAGMENT_SHADER: 0x8B30,
      COMPILE_STATUS: 0x8B81,
      LINK_STATUS: 0x8B82,
      createShader: vi.fn().mockImplementation(() => callCount++ === 0 ? vs : fs),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      createProgram: vi.fn().mockReturnValue(program),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(true),
      detachShader: vi.fn(),
      deleteShader: vi.fn(),
    } as unknown as WebGL2RenderingContext;
    return { gl, vs, fs, program };
  }

  it('returns linked program on success', () => {
    const { gl, program } = makeSuccessfulGL();
    const result = createProgram(gl, 'vs src', 'fs src');
    expect(result).toBe(program);
    expect(gl.attachShader).toHaveBeenCalledTimes(2);
    expect(gl.linkProgram).toHaveBeenCalledWith(program);
    expect(gl.detachShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });

  it('throws when createProgram returns null and cleans up shaders', () => {
    const shader = {};
    const gl = {
      VERTEX_SHADER: 0x8B31,
      FRAGMENT_SHADER: 0x8B30,
      COMPILE_STATUS: 0x8B81,
      createShader: vi.fn().mockReturnValue(shader),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      createProgram: vi.fn().mockReturnValue(null),
      deleteShader: vi.fn(),
    } as unknown as WebGL2RenderingContext;
    expect(() => createProgram(gl, 'vs', 'fs')).toThrow('Failed to create program');
    // Both vertex and fragment shaders should be cleaned up
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });

  it('throws on link failure and cleans up shaders', () => {
    const shader = {};
    const program = { id: 'prog' };
    const gl = {
      VERTEX_SHADER: 0x8B31,
      FRAGMENT_SHADER: 0x8B30,
      COMPILE_STATUS: 0x8B81,
      LINK_STATUS: 0x8B82,
      createShader: vi.fn().mockReturnValue(shader),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      createProgram: vi.fn().mockReturnValue(program),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(false),
      getProgramInfoLog: vi.fn().mockReturnValue('link error'),
      deleteProgram: vi.fn(),
      detachShader: vi.fn(),
      deleteShader: vi.fn(),
    } as unknown as WebGL2RenderingContext;
    expect(() => createProgram(gl, 'vs', 'fs')).toThrow('Program linking failed: link error');
    // Shaders cleaned up via finally block
    expect(gl.detachShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });
});

describe('uploadBuffer', () => {
  it('binds buffer and uploads data', () => {
    const buffer = { id: 'buf' };
    const data = new Float32Array([1, 2, 3]);
    const gl = {
      ARRAY_BUFFER: 0x8892,
      DYNAMIC_DRAW: 0x88E8,
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
    } as unknown as WebGL2RenderingContext;
    uploadBuffer(gl, buffer as unknown as WebGLBuffer, data);
    expect(gl.bindBuffer).toHaveBeenCalledWith(0x8892, buffer);
    expect(gl.bufferData).toHaveBeenCalledWith(0x8892, data, 0x88E8);
  });
});
