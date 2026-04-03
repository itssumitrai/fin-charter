import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasRenderer } from '@/renderers/canvas-renderer';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeMockGradient(): CanvasGradient {
  return { addColorStop: vi.fn() } as unknown as CanvasGradient;
}

function makeMockCtx() {
  const gradient = makeMockGradient();
  const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
  const ctx = {
    canvas,
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    fill: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 20 }),
    setTransform: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue(gradient),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    globalAlpha: 1,
  };
  return { ctx, canvas, gradient };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CanvasRenderer', () => {
  let mock: ReturnType<typeof makeMockCtx>;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    mock = makeMockCtx();
    renderer = new CanvasRenderer(mock.ctx as unknown as CanvasRenderingContext2D, 2);
  });

  // ── clear ──────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('calls clearRect with full canvas dimensions', () => {
      mock.canvas.width = 800;
      mock.canvas.height = 600;
      renderer.clear();
      expect(mock.ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });
  });

  // ── setSize ────────────────────────────────────────────────────────────────

  describe('setSize', () => {
    it('updates canvas pixel dimensions applying pixelRatio', () => {
      renderer.setSize(400, 300, 2);
      expect(mock.canvas.width).toBe(800);
      expect(mock.canvas.height).toBe(600);
    });
  });

  // ── save / restore ────────────────────────────────────────────────────────

  describe('save / restore', () => {
    it('delegates to ctx.save and ctx.restore', () => {
      renderer.save();
      renderer.restore();
      expect(mock.ctx.save).toHaveBeenCalledOnce();
      expect(mock.ctx.restore).toHaveBeenCalledOnce();
    });
  });

  // ── clip ──────────────────────────────────────────────────────────────────

  describe('clip', () => {
    it('scales the rect by pixelRatio and calls ctx.clip', () => {
      renderer.clip(10, 20, 100, 50);
      expect(mock.ctx.beginPath).toHaveBeenCalled();
      // pixelRatio = 2
      expect(mock.ctx.rect).toHaveBeenCalledWith(20, 40, 200, 100);
      expect(mock.ctx.clip).toHaveBeenCalled();
    });
  });

  // ── drawLine ──────────────────────────────────────────────────────────────

  describe('drawLine', () => {
    it('scales coordinates by pixelRatio', () => {
      renderer.drawLine(5, 10, 15, 20);
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(10, 20);
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(30, 40);
      expect(mock.ctx.stroke).toHaveBeenCalled();
    });
  });

  // ── fillRect ──────────────────────────────────────────────────────────────

  describe('fillRect', () => {
    it('scales coordinates by pixelRatio', () => {
      renderer.fillRect(1, 2, 10, 20);
      expect(mock.ctx.fillRect).toHaveBeenCalledWith(2, 4, 20, 40);
    });
  });

  // ── drawRect ──────────────────────────────────────────────────────────────

  describe('drawRect', () => {
    it('calls strokeRect with scaled coordinates', () => {
      renderer.drawRect(3, 4, 6, 8);
      expect(mock.ctx.strokeRect).toHaveBeenCalledWith(6, 8, 12, 16);
    });
  });

  // ── setStyle ──────────────────────────────────────────────────────────────

  describe('setStyle', () => {
    it('applies strokeColor and fillColor', () => {
      renderer.setStyle({ strokeColor: '#ff0000', fillColor: '#00ff00' });
      expect(mock.ctx.strokeStyle).toBe('#ff0000');
      expect(mock.ctx.fillStyle).toBe('#00ff00');
    });

    it('scales lineWidth by pixelRatio', () => {
      renderer.setStyle({ lineWidth: 3 });
      expect(mock.ctx.lineWidth).toBe(6); // 3 * 2
    });

    it('scales lineDash values by pixelRatio', () => {
      renderer.setStyle({ lineDash: [4, 2] });
      expect(mock.ctx.setLineDash).toHaveBeenCalledWith([8, 4]);
    });

    it('sets font, textAlign, textBaseline, globalAlpha', () => {
      renderer.setStyle({
        font: '12px Arial',
        textAlign: 'center',
        textBaseline: 'middle',
        globalAlpha: 0.5,
      });
      expect(mock.ctx.font).toBe('12px Arial');
      expect(mock.ctx.textAlign).toBe('center');
      expect(mock.ctx.textBaseline).toBe('middle');
      expect(mock.ctx.globalAlpha).toBe(0.5);
    });
  });

  // ── fillText ──────────────────────────────────────────────────────────────

  describe('fillText', () => {
    it('scales coordinates by pixelRatio', () => {
      renderer.fillText('hello', 10, 20);
      expect(mock.ctx.fillText).toHaveBeenCalledWith('hello', 20, 40);
    });
  });

  // ── measureText ───────────────────────────────────────────────────────────

  describe('measureText', () => {
    it('returns width divided by pixelRatio (logical px)', () => {
      mock.ctx.measureText.mockReturnValue({ width: 40 });
      const width = renderer.measureText('test');
      expect(width).toBe(20); // 40 / 2
      expect(mock.ctx.measureText).toHaveBeenCalledWith('test');
    });
  });

  // ── createGradient ────────────────────────────────────────────────────────

  describe('createGradient', () => {
    it('creates a linear gradient with scaled coordinates and color stops', () => {
      const grad = renderer.createGradient(0, 0, 0, 100, [
        { offset: 0, color: 'red' },
        { offset: 1, color: 'blue' },
      ]);
      expect(mock.ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 200);
      expect((mock.gradient.addColorStop as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        0,
        'red',
      );
      expect((mock.gradient.addColorStop as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        1,
        'blue',
      );
      expect(grad).toBe(mock.gradient);
    });
  });

  // ── drawPath ──────────────────────────────────────────────────────────────

  describe('drawPath', () => {
    it('executes M, L, Z commands with scaled coordinates', () => {
      renderer.drawPath([
        { cmd: 'M', x: 0, y: 0 },
        { cmd: 'L', x: 10, y: 20 },
        { cmd: 'Z' },
      ]);
      expect(mock.ctx.moveTo).toHaveBeenCalledWith(0, 0);
      expect(mock.ctx.lineTo).toHaveBeenCalledWith(20, 40);
      expect(mock.ctx.closePath).toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalled();
      expect(mock.ctx.fill).not.toHaveBeenCalled();
    });

    it('calls fill when fill=true', () => {
      renderer.drawPath([{ cmd: 'M', x: 0, y: 0 }], true);
      expect(mock.ctx.fill).toHaveBeenCalled();
    });
  });
});
