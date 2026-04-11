import { describe, it, expect } from 'vitest';
import { Pane } from '@/core/pane';

describe('Pane constructor', () => {
  it('creates a Pane with the given id', () => {
    const pane = new Pane('main', 200);
    expect(pane.id).toBe('main');
  });

  it('creates a row div element', () => {
    const pane = new Pane('main', 200);
    expect(pane.row).toBeInstanceOf(HTMLDivElement);
  });

  it('row has position:relative style', () => {
    const pane = new Pane('main', 200);
    expect(pane.row.style.position).toBe('relative');
  });

  it('row height is set to the given height', () => {
    const pane = new Pane('main', 200);
    expect(pane.row.style.height).toBe('200px');
  });

  it('enforces minimum height of 50px', () => {
    const pane = new Pane('main', 10);
    expect(pane.height).toBe(50);
    expect(pane.row.style.height).toBe('50px');
  });

  it('height getter returns current height', () => {
    const pane = new Pane('main', 300);
    expect(pane.height).toBe(300);
  });

  it('height setter updates height and row style', () => {
    const pane = new Pane('main', 200);
    pane.height = 350;
    expect(pane.height).toBe(350);
    expect(pane.row.style.height).toBe('350px');
  });

  it('height setter enforces minimum of 50', () => {
    const pane = new Pane('main', 200);
    pane.height = 20;
    expect(pane.height).toBe(50);
  });
});

describe('Pane canvases', () => {
  it('canvases object has chartCanvas', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.chartCanvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('canvases object has overlayCanvas', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.overlayCanvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('canvases object has rightPriceAxisCanvas', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.rightPriceAxisCanvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('canvases object has leftPriceAxisCanvas', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.leftPriceAxisCanvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('canvases object has chartCtx as CanvasRenderingContext2D', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.chartCtx).toBeDefined();
  });

  it('canvases object has overlayCtx as CanvasRenderingContext2D', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.overlayCtx).toBeDefined();
  });

  it('canvases object has rightPriceAxisCtx', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.rightPriceAxisCtx).toBeDefined();
  });

  it('canvases object has leftPriceAxisCtx', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.leftPriceAxisCtx).toBeDefined();
  });

  it('row contains chartCanvas as child', () => {
    const pane = new Pane('main', 200);
    expect(pane.row.contains(pane.canvases.chartCanvas)).toBe(true);
  });

  it('row contains overlayCanvas as child', () => {
    const pane = new Pane('main', 200);
    expect(pane.row.contains(pane.canvases.overlayCanvas)).toBe(true);
  });

  it('row contains rightPriceAxisCanvas as child', () => {
    const pane = new Pane('main', 200);
    expect(pane.row.contains(pane.canvases.rightPriceAxisCanvas)).toBe(true);
  });

  it('row contains leftPriceAxisCanvas as child', () => {
    const pane = new Pane('main', 200);
    expect(pane.row.contains(pane.canvases.leftPriceAxisCanvas)).toBe(true);
  });

  it('chartCanvas zIndex is 1', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.chartCanvas.style.zIndex).toBe('1');
  });

  it('overlayCanvas zIndex is 3', () => {
    const pane = new Pane('main', 200);
    expect(pane.canvases.overlayCanvas.style.zIndex).toBe('3');
  });

  it('webglCanvas is undefined when useWebGL=false', () => {
    const pane = new Pane('main', 200, false);
    expect(pane.canvases.webglCanvas).toBeUndefined();
  });
});

describe('Pane layout()', () => {
  it('sets chartCanvas width and height in pixels', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.chartCanvas.width).toBe(800);
    expect(pane.canvases.chartCanvas.height).toBe(200);
  });

  it('sets chartCanvas style dimensions', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.chartCanvas.style.width).toBe('800px');
    expect(pane.canvases.chartCanvas.style.height).toBe('200px');
  });

  it('applies pixel ratio to canvas pixel dimensions', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 2);
    expect(pane.canvases.chartCanvas.width).toBe(1600);
    expect(pane.canvases.chartCanvas.height).toBe(400);
  });

  it('positions chartCanvas left offset by leftScaleW', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.chartCanvas.style.left).toBe('60px');
  });

  it('positions overlayCanvas same as chartCanvas', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.overlayCanvas.style.width).toBe('800px');
    expect(pane.canvases.overlayCanvas.style.height).toBe('200px');
    expect(pane.canvases.overlayCanvas.style.left).toBe('60px');
  });

  it('positions rightPriceAxisCanvas to the right of chart', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.rightPriceAxisCanvas.style.left).toBe('860px');
  });

  it('sets rightPriceAxisCanvas dimensions', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.rightPriceAxisCanvas.style.width).toBe('60px');
    expect(pane.canvases.rightPriceAxisCanvas.style.height).toBe('200px');
  });

  it('shows rightPriceAxisCanvas when rightScaleVisible=true', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.rightPriceAxisCanvas.style.display).toBe('');
  });

  it('hides rightPriceAxisCanvas when rightScaleVisible=false', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, false, false, 1);
    expect(pane.canvases.rightPriceAxisCanvas.style.display).toBe('none');
  });

  it('shows leftPriceAxisCanvas when leftScaleVisible=true', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, true, 1);
    expect(pane.canvases.leftPriceAxisCanvas.style.display).toBe('');
  });

  it('hides leftPriceAxisCanvas when leftScaleVisible=false', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.canvases.leftPriceAxisCanvas.style.display).toBe('none');
  });

  it('leftPriceAxisCanvas is positioned at left:0', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, true, 1);
    expect(pane.canvases.leftPriceAxisCanvas.style.left).toBe('0px');
  });

  it('updates row height after layout', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 1);
    expect(pane.row.style.height).toBe('200px');
  });

  it('priceScale is accessible', () => {
    const pane = new Pane('main', 200);
    expect(pane.priceScale).toBeDefined();
  });

  it('leftPriceScale is accessible', () => {
    const pane = new Pane('main', 200);
    expect(pane.leftPriceScale).toBeDefined();
  });

  it('layout with leftScaleVisible=true and rightScaleVisible=true shows both axes', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, true, 1);
    expect(pane.canvases.rightPriceAxisCanvas.style.display).toBe('');
    expect(pane.canvases.leftPriceAxisCanvas.style.display).toBe('');
  });

  it('layout with leftScaleVisible=false and rightScaleVisible=false hides both axes', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 0, 60, false, false, 1);
    expect(pane.canvases.rightPriceAxisCanvas.style.display).toBe('none');
    expect(pane.canvases.leftPriceAxisCanvas.style.display).toBe('none');
  });

  it('layout with zero leftScaleW positions chart at 0', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 0, 60, true, false, 1);
    expect(pane.canvases.chartCanvas.style.left).toBe('0px');
  });

  it('layout with pixel ratio 3 applies correct scaling', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 60, true, false, 3);
    expect(pane.canvases.chartCanvas.width).toBe(2400); // 800 * 3
    expect(pane.canvases.chartCanvas.height).toBe(600); // 200 * 3
  });

  it('rightPriceAxisCanvas width matches priceAxisWidth argument', () => {
    const pane = new Pane('main', 200);
    pane.layout(800, 60, 80, true, false, 1);
    expect(pane.canvases.rightPriceAxisCanvas.style.width).toBe('80px');
  });
});

describe('Pane WebGL canvas', () => {
  it('creates webglCanvas when useWebGL=true (if webgl2 context available)', () => {
    // jsdom does not support webgl2, so getContext('webgl2') returns null.
    // In that case the canvas is still created but then removed from the DOM.
    // The test just verifies that constructing with useWebGL=true does not throw.
    expect(() => new Pane('main', 200, true)).not.toThrow();
  });

  it('webglCanvas is undefined when webgl2 context returns null (jsdom)', () => {
    // jsdom returns null for getContext('webgl2'), so the webgl canvas should be cleaned up
    const pane = new Pane('main', 200, true);
    // In jsdom, WebGL2 context is not available, so webglCanvas may be undefined
    // (the canvas is removed from DOM and canvases.webglCanvas is not set)
    expect(pane.canvases.webglCanvas).toBeUndefined();
  });

  it('layout with webglCanvas undefined does not throw', () => {
    const pane = new Pane('main', 200, true);
    // Whether or not webgl was created, layout should not throw
    expect(() => pane.layout(800, 60, 60, true, false, 1)).not.toThrow();
  });
});
