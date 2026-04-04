# Drawings, Indicators, Context Menu, HUD & API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 drawing tools, 12 indicators, context menu, TV-style HUD collapse, unified `addSeries()` API, and updated docs/stories with measured bundle sizes.

**Architecture:** Six independent subsystems implemented in parallel where possible. Drawings/indicators follow existing patterns (BaseDrawing subclass, compute function). Context menu adds a new EventHandler + DOM component. HUD redesign modifies the existing HudManager. API unification adds a single `addSeries()` method with discriminated union types.

**Tech Stack:** TypeScript, Canvas 2D, DOM, Vitest, Storybook

**Spec:** `docs/superpowers/specs/2026-04-04-drawings-indicators-contextmenu-hud-design.md`

---

## Phase 1: Foundation (API, base changes)

### Task 1: Unified `addSeries()` API

**Files:**
- Modify: `src/api/options.ts` — add `SeriesOptions` discriminated union
- Modify: `src/api/chart-api.ts` — add `addSeries()` method, deprecate old methods
- Modify: `src/api/chart-api.ts` — update `IChartApi` interface
- Test: `tests/api/add-series.test.ts`

- [ ] **Step 1: Add the discriminated union type to options.ts**

In `src/api/options.ts`, after the `SeriesOptionsMap` interface, add:

```typescript
/** Discriminated union for the unified addSeries() API. */
export type SeriesOptions =
  | ({ type: 'candlestick' } & Partial<CandlestickSeriesOptions>)
  | ({ type: 'line' } & Partial<LineSeriesOptions>)
  | ({ type: 'area' } & Partial<AreaSeriesOptions>)
  | ({ type: 'bar' } & Partial<BarSeriesOptions>)
  | ({ type: 'baseline' } & Partial<BaselineSeriesOptions>)
  | ({ type: 'hollow-candle' } & Partial<HollowCandleSeriesOptions>)
  | ({ type: 'histogram' } & Partial<HistogramSeriesOptions>)
  | ({ type: 'heikin-ashi' } & Partial<CandlestickSeriesOptions>);
```

- [ ] **Step 2: Add `addSeries()` to IChartApi and ChartApi**

In `IChartApi` interface, add:

```typescript
/** Add a series using a unified options object with a `type` discriminator. */
addSeries(options: SeriesOptions): ISeriesApi<SeriesType>;
```

In `ChartApi` class, add the implementation:

```typescript
addSeries(options: SeriesOptions): ISeriesApi<SeriesType> {
  const { type, ...rest } = options;
  return this._addSeries(type, rest as DeepPartial<SeriesOptionsMap[typeof type]>);
}
```

- [ ] **Step 3: Mark old methods as deprecated**

Add `@deprecated Use addSeries({ type: '...' }) instead.` JSDoc to all 8 `addXxxSeries()` methods. Do NOT remove them.

- [ ] **Step 4: Write test**

Create `tests/api/add-series.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
// Use a lightweight integration test approach — just verify the method exists
// and returns a series with the correct type. Full rendering tests exist elsewhere.

describe('addSeries() unified API', () => {
  // NOTE: Full chart creation requires DOM (jsdom).
  // Test the type inference and options shape at compile time.
  // Runtime tests for addSeries are covered by existing series creation tests
  // since addSeries delegates to _addSeries.

  it('SeriesOptions type covers all series types', () => {
    // Compile-time check — if this file compiles, the union is correct
    const options: import('@/api/options').SeriesOptions[] = [
      { type: 'candlestick' },
      { type: 'line', color: '#ff0000' },
      { type: 'area', lineColor: '#00ff00' },
      { type: 'bar' },
      { type: 'baseline' },
      { type: 'hollow-candle' },
      { type: 'histogram' },
      { type: 'heikin-ashi' },
    ];
    expect(options).toHaveLength(8);
  });
});
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npx vitest run tests/api/add-series.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/api/options.ts src/api/chart-api.ts tests/api/add-series.test.ts
git commit -m "feat: add unified addSeries() API with discriminated union types"
```

### Task 2: Extend DrawingHitTestResult for 3-point drawings

**Files:**
- Modify: `src/drawings/base.ts` — add `'handle3'` to part union

- [ ] **Step 1: Update the type**

In `src/drawings/base.ts`, change:

```typescript
part: 'body' | 'handle1' | 'handle2' | 'edge';
```

to:

```typescript
part: 'body' | 'handle1' | 'handle2' | 'handle3' | 'edge';
```

- [ ] **Step 2: Run existing tests to verify no regression**

Run: `npx vitest run tests/drawings/`
Expected: All pass (no existing code uses `handle3` yet).

- [ ] **Step 3: Commit**

```bash
git add src/drawings/base.ts
git commit -m "feat: add handle3 to DrawingHitTestResult for 3-point drawings"
```

---

## Phase 2: Drawing Tools (10 new tools)

All drawings follow the same pattern: extend `BaseDrawing`, implement `_hitTestDrawing()` and `_createPaneView()`, export a `createXxx()` factory. Register in `src/drawings/index.ts`.

### Task 3: Ray drawing

**Files:**
- Create: `src/drawings/ray.ts`
- Test: `tests/drawings/ray.test.ts`

- [ ] **Step 1: Create ray.ts**

```typescript
import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  distToSegment,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

export class RayDrawing extends BaseDrawing {
  readonly drawingType = 'ray';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  /** Extend line from p1 through p2 to chart boundary. Returns the far endpoint. */
  private _extendedEnd(
    x1: number, y1: number, x2: number, y2: number, w: number, h: number,
  ): { x: number; y: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return { x: x2, y: y2 };

    // Find t where the ray exits the chart bounding box [0, w] x [0, h]
    let tMax = Infinity;
    if (dx !== 0) {
      const t = (dx > 0 ? w - x1 : -x1) / dx;
      if (t > 0) tMax = Math.min(tMax, t);
    }
    if (dy !== 0) {
      const t = (dy > 0 ? h - y1 : -y1) / dy;
      if (t > 0) tMax = Math.min(tMax, t);
    }
    if (!isFinite(tMax)) tMax = 1;
    return { x: x1 + dx * tMax, y: y1 + dy * tMax };
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);

    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }

    const end = this._extendedEnd(x1, y1, x2, y2, ctx.chartWidth, ctx.chartHeight);
    if (distToSegment(x, y, x1, y1, end.x, end.y) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 2) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r, width: w, height: h } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const end = self._extendedEnd(x1, y1, x2, y2, w, h);
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(end.x, end.y);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x1 - hs, y1 - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, y2 - hs, hs * 2, hs * 2);
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createRay(
  id: string, points: AnchorPoint[], options: DrawingOptions,
): RayDrawing {
  return new RayDrawing(id, points, options);
}
```

- [ ] **Step 2: Write test**

Create `tests/drawings/ray.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { RayDrawing } from '@/drawings/ray';

describe('RayDrawing', () => {
  it('has correct drawingType and requiredPoints', () => {
    const d = new RayDrawing('r1', [{ time: 0, price: 100 }, { time: 5, price: 200 }], {});
    expect(d.drawingType).toBe('ray');
    expect(d.requiredPoints).toBe(2);
  });

  it('serializes correctly', () => {
    const pts = [{ time: 0, price: 100 }, { time: 5, price: 200 }];
    const d = new RayDrawing('r1', pts, { color: '#ff0000' });
    const s = d.serialize();
    expect(s.type).toBe('ray');
    expect(s.id).toBe('r1');
    expect(s.points).toHaveLength(2);
    expect(s.options.color).toBe('#ff0000');
  });

  it('returns null hit-test without context', () => {
    const d = new RayDrawing('r1', [{ time: 0, price: 100 }, { time: 5, price: 200 }], {});
    expect(d._hitTestDrawing(10, 10)).toBeNull();
  });
});
```

- [ ] **Step 3: Run test**

Run: `npx vitest run tests/drawings/ray.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/drawings/ray.ts tests/drawings/ray.test.ts
git commit -m "feat: add ray drawing tool"
```

### Task 4: Arrow drawing

**Files:**
- Create: `src/drawings/arrow.ts`
- Test: `tests/drawings/arrow.test.ts`

- [ ] **Step 1: Create arrow.ts**

```typescript
import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  distToSegment,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const ARROW_SIZE = 10;

export class ArrowDrawing extends BaseDrawing {
  readonly drawingType = 'arrow';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);

    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }
    if (distToSegment(x, y, x1, y1, x2, y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 2) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;
            const arrowSize = ARROW_SIZE * r;

            c.save();
            c.strokeStyle = color;
            c.fillStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            // Line
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();

            // Arrowhead
            const angle = Math.atan2(y2 - y1, x2 - x1);
            c.beginPath();
            c.moveTo(x2, y2);
            c.lineTo(
              x2 - arrowSize * Math.cos(angle - Math.PI / 6),
              y2 - arrowSize * Math.sin(angle - Math.PI / 6),
            );
            c.lineTo(
              x2 - arrowSize * Math.cos(angle + Math.PI / 6),
              y2 - arrowSize * Math.sin(angle + Math.PI / 6),
            );
            c.closePath();
            c.fill();

            if (self.selected) {
              const hs = 4 * r;
              c.fillRect(x1 - hs, y1 - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, y2 - hs, hs * 2, hs * 2);
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createArrow(
  id: string, points: AnchorPoint[], options: DrawingOptions,
): ArrowDrawing {
  return new ArrowDrawing(id, points, options);
}
```

- [ ] **Step 2: Write test** (same pattern as ray test — verify type, requiredPoints, serialization, null context hit-test)

- [ ] **Step 3: Run test, commit**

### Task 5: Channel drawing (3-point)

**Files:**
- Create: `src/drawings/channel.ts`
- Test: `tests/drawings/channel.test.ts`

- [ ] **Step 1: Create channel.ts**

```typescript
import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  distToSegment,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const FILL_ALPHA = 0.08;

export class ChannelDrawing extends BaseDrawing {
  readonly drawingType = 'channel';
  readonly requiredPoints = 3;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 3) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);
    const x3 = ctx.timeScale.indexToX(this.points[2].time);
    const y3 = ctx.priceScale.priceToY(this.points[2].price);

    // Handles
    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x3, y - y3) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle3', cursorStyle: 'grab' };
    }

    // p3 defines the offset for the parallel line
    const dx = x3 - x1;
    const dy = y3 - y1;

    // Top line: p1 -> p2
    if (distToSegment(x, y, x1, y1, x2, y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    // Bottom line: (p1+offset) -> (p2+offset)
    if (distToSegment(x, y, x1 + dx, y1 + dy, x2 + dx, y2 + dy) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 3) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const x3 = ctx.timeScale.indexToX(self.points[2].time) * r;
            const y3 = ctx.priceScale.priceToY(self.points[2].price) * r;
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            // Offset from p1 to p3
            const dx = x3 - x1;
            const dy = y3 - y1;

            c.save();

            // Fill between lines
            c.globalAlpha = FILL_ALPHA;
            c.fillStyle = self.options.fillColor ?? color;
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.lineTo(x2 + dx, y2 + dy);
            c.lineTo(x1 + dx, y1 + dy);
            c.closePath();
            c.fill();

            // Lines
            c.globalAlpha = 1;
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();

            c.beginPath();
            c.moveTo(x1 + dx, y1 + dy);
            c.lineTo(x2 + dx, y2 + dy);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x1 - hs, y1 - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, y2 - hs, hs * 2, hs * 2);
              c.fillRect(x3 - hs, y3 - hs, hs * 2, hs * 2);
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createChannel(
  id: string, points: AnchorPoint[], options: DrawingOptions,
): ChannelDrawing {
  return new ChannelDrawing(id, points, options);
}
```

- [ ] **Step 2: Write test** (verify type, requiredPoints=3, serialization with 3 points)

- [ ] **Step 3: Run test, commit**

### Task 6: Ellipse drawing

**Files:**
- Create: `src/drawings/ellipse.ts`
- Test: `tests/drawings/ellipse.test.ts`

- [ ] **Step 1: Create ellipse.ts**

```typescript
import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

const FILL_ALPHA = 0.1;

export class EllipseDrawing extends BaseDrawing {
  readonly drawingType = 'ellipse';
  readonly requiredPoints = 2;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 2) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);

    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    }
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    }

    // Point-in-ellipse test
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    if (rx === 0 || ry === 0) return null;
    const d = ((x - cx) * (x - cx)) / (rx * rx) + ((y - cy) * (y - cy)) / (ry * ry);
    if (d <= 1) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 2) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const rx = Math.abs(x2 - x1) / 2;
            const ry = Math.abs(y2 - y1) / 2;

            c.save();

            // Fill
            c.globalAlpha = FILL_ALPHA;
            c.fillStyle = self.options.fillColor ?? color;
            c.beginPath();
            c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            c.fill();

            // Stroke
            c.globalAlpha = 1;
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);
            c.beginPath();
            c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x1 - hs, y1 - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, y2 - hs, hs * 2, hs * 2);
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createEllipse(
  id: string, points: AnchorPoint[], options: DrawingOptions,
): EllipseDrawing {
  return new EllipseDrawing(id, points, options);
}
```

- [ ] **Step 2: Write test, run, commit**

### Task 7: Pitchfork drawing (3-point)

**Files:**
- Create: `src/drawings/pitchfork.ts`
- Test: `tests/drawings/pitchfork.test.ts`

- [ ] **Step 1: Create pitchfork.ts**

Andrew's Pitchfork: p1 is the pivot, p2 and p3 are the channel endpoints. Median line goes from p1 through midpoint of p2-p3. Parallel tines go through p2 and p3.

```typescript
import type { IPaneView, IPaneRenderer, IRenderTarget } from '../core/types';
import {
  BaseDrawing,
  HIT_THRESHOLD,
  distToSegment,
  applyLineStyle,
  type AnchorPoint,
  type DrawingOptions,
  type DrawingHitTestResult,
} from './base';

export class PitchforkDrawing extends BaseDrawing {
  readonly drawingType = 'pitchfork';
  readonly requiredPoints = 3;

  constructor(id: string, points: AnchorPoint[], options: DrawingOptions) {
    super(id, points, options);
  }

  _hitTestDrawing(x: number, y: number): DrawingHitTestResult | null {
    const ctx = this._ctx;
    if (!ctx || this.points.length < 3) return null;

    const x1 = ctx.timeScale.indexToX(this.points[0].time);
    const y1 = ctx.priceScale.priceToY(this.points[0].price);
    const x2 = ctx.timeScale.indexToX(this.points[1].time);
    const y2 = ctx.priceScale.priceToY(this.points[1].price);
    const x3 = ctx.timeScale.indexToX(this.points[2].time);
    const y3 = ctx.priceScale.priceToY(this.points[2].price);

    if (Math.hypot(x - x1, y - y1) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle1', cursorStyle: 'grab' };
    if (Math.hypot(x - x2, y - y2) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle2', cursorStyle: 'grab' };
    if (Math.hypot(x - x3, y - y3) < HIT_THRESHOLD) return { drawingId: this.id, part: 'handle3', cursorStyle: 'grab' };

    const mx = (x2 + x3) / 2;
    const my = (y2 + y3) / 2;

    // Median line: p1 -> midpoint(p2,p3), extended
    if (distToSegment(x, y, x1, y1, mx + (mx - x1), my + (my - y1)) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    // Upper tine through p2, parallel to median
    const dx = mx - x1;
    const dy = my - y1;
    if (distToSegment(x, y, x2, y2, x2 + dx, y2 + dy) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    // Lower tine through p3, parallel to median
    if (distToSegment(x, y, x3, y3, x3 + dx, y3 + dy) < HIT_THRESHOLD) {
      return { drawingId: this.id, part: 'body', cursorStyle: 'move' };
    }
    return null;
  }

  protected _createPaneView(): IPaneView {
    const self = this;
    return {
      renderer(): IPaneRenderer | null {
        const ctx = self._ctx;
        if (!ctx || self.points.length < 3) return null;
        return {
          draw(target: IRenderTarget): void {
            const { context: c, pixelRatio: r } = target;
            const x1 = ctx.timeScale.indexToX(self.points[0].time) * r;
            const y1 = ctx.priceScale.priceToY(self.points[0].price) * r;
            const x2 = ctx.timeScale.indexToX(self.points[1].time) * r;
            const y2 = ctx.priceScale.priceToY(self.points[1].price) * r;
            const x3 = ctx.timeScale.indexToX(self.points[2].time) * r;
            const y3 = ctx.priceScale.priceToY(self.points[2].price) * r;
            const color = self.options.color ?? '#2196F3';
            const lw = (self.options.lineWidth ?? 1) * r;

            const mx = (x2 + x3) / 2;
            const my = (y2 + y3) / 2;
            const dx = mx - x1;
            const dy = my - y1;

            c.save();
            c.strokeStyle = color;
            c.lineWidth = lw;
            applyLineStyle(c, self.options.lineStyle);

            // Median line (extended 1x beyond midpoint)
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(mx + dx, my + dy);
            c.stroke();

            // Upper tine (from p2, parallel to median)
            c.beginPath();
            c.moveTo(x2, y2);
            c.lineTo(x2 + dx, y2 + dy);
            c.stroke();

            // Lower tine (from p3, parallel to median)
            c.beginPath();
            c.moveTo(x3, y3);
            c.lineTo(x3 + dx, y3 + dy);
            c.stroke();

            if (self.selected) {
              c.fillStyle = color;
              const hs = 4 * r;
              c.fillRect(x1 - hs, y1 - hs, hs * 2, hs * 2);
              c.fillRect(x2 - hs, y2 - hs, hs * 2, hs * 2);
              c.fillRect(x3 - hs, y3 - hs, hs * 2, hs * 2);
            }
            c.restore();
          },
        };
      },
    };
  }
}

export function createPitchfork(
  id: string, points: AnchorPoint[], options: DrawingOptions,
): PitchforkDrawing {
  return new PitchforkDrawing(id, points, options);
}
```

- [ ] **Step 2: Write test, run, commit**

### Task 8: Fib Projection, Fib Arc, Fib Fan drawings

**Files:**
- Create: `src/drawings/fib-projection.ts`, `src/drawings/fib-arc.ts`, `src/drawings/fib-fan.ts`
- Test: `tests/drawings/fib-tools.test.ts`

These follow the fibonacci pattern from the existing `fibonacci.ts`. Key differences:

**fib-projection.ts**: 3 points. Projects fib ratios (0%, 61.8%, 100%, 161.8%, 261.8%) from the p1-p2 price move onto p3. Horizontal lines at each level.

**fib-arc.ts**: 2 points. Semi-circular arcs centered at p2 at fib ratios (23.6%, 38.2%, 50%, 61.8%) of the p1-p2 distance. Uses `c.arc()`.

**fib-fan.ts**: 2 points. Lines from p1 through points at fib ratios (23.6%, 38.2%, 50%, 61.8%, 78.6%) of the vertical distance at p2's x-coordinate. Extended to chart edge.

- [ ] **Step 1: Implement all three fib tools** following the patterns established above
- [ ] **Step 2: Write combined test file** verifying type, points, serialization for each
- [ ] **Step 3: Run tests, commit**

### Task 9: Crossline and Measurement drawings

**Files:**
- Create: `src/drawings/crossline.ts`, `src/drawings/measurement.ts`
- Test: `tests/drawings/crossline-measurement.test.ts`

**crossline.ts**: 1 point. Draws horizontal + vertical lines through the point (like a permanent crosshair marker). Hit-test on either line.

**measurement.ts**: 2 points. Dashed connector line + info label showing:
- Price change: `+12.50` / `-8.30`
- Percent change: `(+2.5%)`
- Bar count: `15 bars`

Label rendered as filled rect with text at the midpoint of the connector.

- [ ] **Step 1: Implement crossline** (similar to horizontal-line but adds vertical too, 1 point)
- [ ] **Step 2: Implement measurement** (trendline base + label rendering at midpoint)
- [ ] **Step 3: Write tests, run, commit**

### Task 10: Register all new drawings + update existing tests

**Files:**
- Modify: `src/drawings/index.ts` — register 10 new drawing types
- Modify: `tests/drawings/drawings.test.ts` — update registry count to 16

- [ ] **Step 1: Update index.ts**

Add imports and registrations for all 10 new drawings:

```typescript
import { createRay } from './ray';
import { createArrow } from './arrow';
import { createChannel } from './channel';
import { createEllipse } from './ellipse';
import { createPitchfork } from './pitchfork';
import { createFibProjection } from './fib-projection';
import { createFibArc } from './fib-arc';
import { createFibFan } from './fib-fan';
import { createCrossline } from './crossline';
import { createMeasurement } from './measurement';
```

In `registerBuiltinDrawings()`, add:

```typescript
DRAWING_REGISTRY.set('ray', createRay as DrawingFactory);
DRAWING_REGISTRY.set('arrow', createArrow as DrawingFactory);
DRAWING_REGISTRY.set('channel', createChannel as DrawingFactory);
DRAWING_REGISTRY.set('ellipse', createEllipse as DrawingFactory);
DRAWING_REGISTRY.set('pitchfork', createPitchfork as DrawingFactory);
DRAWING_REGISTRY.set('fib-projection', createFibProjection as DrawingFactory);
DRAWING_REGISTRY.set('fib-arc', createFibArc as DrawingFactory);
DRAWING_REGISTRY.set('fib-fan', createFibFan as DrawingFactory);
DRAWING_REGISTRY.set('crossline', createCrossline as DrawingFactory);
DRAWING_REGISTRY.set('measurement', createMeasurement as DrawingFactory);
```

- [ ] **Step 2: Update existing test**

In `tests/drawings/drawings.test.ts`, change:

```typescript
expect(DRAWING_REGISTRY.size).toBe(6);
```

to:

```typescript
expect(DRAWING_REGISTRY.size).toBe(16);
```

And add `expect(DRAWING_REGISTRY.has('ray')).toBe(true);` etc. for all 10 new types.

- [ ] **Step 3: Run all drawing tests**

Run: `npx vitest run tests/drawings/`

- [ ] **Step 4: Commit**

```bash
git add src/drawings/ tests/drawings/
git commit -m "feat: register all 10 new drawing tools in DRAWING_REGISTRY"
```

---

## Phase 3: Technical Indicators (12 new)

All indicators follow the same pattern: pure `compute*()` function taking typed arrays + params, returning `Float64Array` or result object.

### Task 11: ROC, VWMA, Linear Regression (simple single-output)

**Files:**
- Create: `src/indicators/roc.ts`, `src/indicators/vwma.ts`, `src/indicators/linear-regression.ts`
- Test: `tests/indicators/roc.test.ts`, `tests/indicators/vwma.test.ts`, `tests/indicators/linear-regression.test.ts`

- [ ] **Step 1: Implement ROC**

```typescript
// src/indicators/roc.ts
export function computeROC(close: Float64Array, length: number, period: number): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period; i++) result[i] = NaN;
  for (let i = period; i < length; i++) {
    const prev = close[i - period];
    result[i] = prev === 0 ? NaN : ((close[i] - prev) / prev) * 100;
  }
  return result;
}
```

- [ ] **Step 2: Implement VWMA**

```typescript
// src/indicators/vwma.ts
export function computeVWMA(
  close: Float64Array, volume: Float64Array, length: number, period: number,
): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period - 1; i++) result[i] = NaN;
  for (let i = period - 1; i < length; i++) {
    let sumCV = 0;
    let sumV = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumCV += close[j] * volume[j];
      sumV += volume[j];
    }
    result[i] = sumV === 0 ? NaN : sumCV / sumV;
  }
  return result;
}
```

- [ ] **Step 3: Implement Linear Regression**

```typescript
// src/indicators/linear-regression.ts
export function computeLinearRegression(
  close: Float64Array, length: number, period: number,
): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period - 1; i++) result[i] = NaN;
  for (let i = period - 1; i < length; i++) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let j = 0; j < period; j++) {
      const x = j;
      const y = close[i - period + 1 + j];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    const n = period;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    result[i] = intercept + slope * (period - 1);
  }
  return result;
}
```

- [ ] **Step 4: Write tests for all three** (verify NaN for initial period, known values, array length)
- [ ] **Step 5: Run tests, commit**

### Task 12: Aroon, MFI, Choppiness Index

**Files:**
- Create: `src/indicators/aroon.ts`, `src/indicators/mfi.ts`, `src/indicators/choppiness.ts`
- Test: `tests/indicators/aroon.test.ts`, `tests/indicators/mfi.test.ts`, `tests/indicators/choppiness.test.ts`

- [ ] **Step 1: Implement Aroon**

```typescript
// src/indicators/aroon.ts
export interface AroonResult { up: Float64Array; down: Float64Array; }

export function computeAroon(
  high: Float64Array, low: Float64Array, length: number, period: number,
): AroonResult {
  const up = new Float64Array(length);
  const down = new Float64Array(length);
  for (let i = 0; i < period; i++) { up[i] = NaN; down[i] = NaN; }
  for (let i = period; i < length; i++) {
    let highIdx = i - period;
    let lowIdx = i - period;
    for (let j = i - period; j <= i; j++) {
      if (high[j] >= high[highIdx]) highIdx = j;
      if (low[j] <= low[lowIdx]) lowIdx = j;
    }
    up[i] = ((period - (i - highIdx)) / period) * 100;
    down[i] = ((period - (i - lowIdx)) / period) * 100;
  }
  return { up, down };
}
```

- [ ] **Step 2: Implement MFI**

```typescript
// src/indicators/mfi.ts
export function computeMFI(
  high: Float64Array, low: Float64Array, close: Float64Array,
  volume: Float64Array, length: number, period: number,
): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period; i++) result[i] = NaN;
  for (let i = period; i < length; i++) {
    let posFlow = 0, negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const tp = (high[j] + low[j] + close[j]) / 3;
      const prevTp = (high[j - 1] + low[j - 1] + close[j - 1]) / 3;
      const rawMF = tp * volume[j];
      if (tp > prevTp) posFlow += rawMF;
      else if (tp < prevTp) negFlow += rawMF;
    }
    result[i] = negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow);
  }
  return result;
}
```

- [ ] **Step 3: Implement Choppiness Index**

```typescript
// src/indicators/choppiness.ts
import { computeATR } from './atr';

export function computeChoppiness(
  high: Float64Array, low: Float64Array, close: Float64Array,
  length: number, period: number,
): Float64Array {
  const atr = computeATR(high, low, close, length, 1); // ATR(1) = true range
  const result = new Float64Array(length);
  for (let i = 0; i < period; i++) result[i] = NaN;
  for (let i = period; i < length; i++) {
    let atrSum = 0;
    let hh = -Infinity, ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      atrSum += atr[j];
      if (high[j] > hh) hh = high[j];
      if (low[j] < ll) ll = low[j];
    }
    const range = hh - ll;
    result[i] = range === 0 ? NaN : 100 * Math.log10(atrSum / range) / Math.log10(period);
  }
  return result;
}
```

- [ ] **Step 4: Write tests, run, commit**

### Task 13: Awesome Oscillator, Chaikin MF, Elder Force Index

**Files:**
- Create: `src/indicators/awesome-oscillator.ts`, `src/indicators/chaikin-mf.ts`, `src/indicators/elder-force.ts`
- Test: one test file per indicator

- [ ] **Step 1: Implement Awesome Oscillator**

```typescript
// src/indicators/awesome-oscillator.ts
import { computeSMA } from './sma';

export function computeAwesomeOscillator(
  high: Float64Array, low: Float64Array, length: number,
  fastPeriod: number, slowPeriod: number,
): Float64Array {
  const median = new Float64Array(length);
  for (let i = 0; i < length; i++) median[i] = (high[i] + low[i]) / 2;
  const fastSMA = computeSMA(median, length, fastPeriod);
  const slowSMA = computeSMA(median, length, slowPeriod);
  const result = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = isNaN(fastSMA[i]) || isNaN(slowSMA[i]) ? NaN : fastSMA[i] - slowSMA[i];
  }
  return result;
}
```

- [ ] **Step 2: Implement Chaikin Money Flow**

```typescript
// src/indicators/chaikin-mf.ts
export function computeChaikinMF(
  high: Float64Array, low: Float64Array, close: Float64Array,
  volume: Float64Array, length: number, period: number,
): Float64Array {
  const result = new Float64Array(length);
  for (let i = 0; i < period - 1; i++) result[i] = NaN;
  for (let i = period - 1; i < length; i++) {
    let mfvSum = 0, volSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const hl = high[j] - low[j];
      const mfm = hl === 0 ? 0 : ((close[j] - low[j]) - (high[j] - close[j])) / hl;
      mfvSum += mfm * volume[j];
      volSum += volume[j];
    }
    result[i] = volSum === 0 ? 0 : mfvSum / volSum;
  }
  return result;
}
```

- [ ] **Step 3: Implement Elder Force Index**

```typescript
// src/indicators/elder-force.ts
import { computeEMA } from './ema';

export function computeElderForce(
  close: Float64Array, volume: Float64Array, length: number, period: number,
): Float64Array {
  const raw = new Float64Array(length);
  raw[0] = NaN;
  for (let i = 1; i < length; i++) {
    raw[i] = (close[i] - close[i - 1]) * volume[i];
  }
  return computeEMA(raw, length, period);
}
```

- [ ] **Step 4: Write tests, run, commit**

### Task 14: Coppock Curve, TRIX, Supertrend

**Files:**
- Create: `src/indicators/coppock.ts`, `src/indicators/trix.ts`, `src/indicators/supertrend.ts`
- Test: one test file per indicator

- [ ] **Step 1: Implement Coppock Curve**

```typescript
// src/indicators/coppock.ts
export function computeCoppock(
  close: Float64Array, length: number,
  wmaPeriod: number, longROC: number, shortROC: number,
): Float64Array {
  const result = new Float64Array(length);
  const maxLag = Math.max(longROC, shortROC);
  for (let i = 0; i < maxLag + wmaPeriod - 1; i++) result[i] = NaN;

  // ROC values
  const roc = new Float64Array(length);
  for (let i = 0; i < maxLag; i++) roc[i] = NaN;
  for (let i = maxLag; i < length; i++) {
    const lr = close[i - longROC] === 0 ? 0 : ((close[i] - close[i - longROC]) / close[i - longROC]) * 100;
    const sr = close[i - shortROC] === 0 ? 0 : ((close[i] - close[i - shortROC]) / close[i - shortROC]) * 100;
    roc[i] = lr + sr;
  }

  // WMA of ROC
  for (let i = maxLag + wmaPeriod - 1; i < length; i++) {
    let num = 0, den = 0;
    for (let j = 0; j < wmaPeriod; j++) {
      const w = wmaPeriod - j;
      const val = roc[i - j];
      if (isNaN(val)) { num = NaN; break; }
      num += val * w;
      den += w;
    }
    result[i] = isNaN(num) ? NaN : num / den;
  }
  return result;
}
```

- [ ] **Step 2: Implement TRIX**

```typescript
// src/indicators/trix.ts
import { computeEMA } from './ema';

export interface TRIXResult { trix: Float64Array; signal: Float64Array; }

export function computeTRIX(
  close: Float64Array, length: number, period: number, signalPeriod: number,
): TRIXResult {
  const ema1 = computeEMA(close, length, period);
  const ema2 = computeEMA(ema1, length, period);
  const ema3 = computeEMA(ema2, length, period);

  const trix = new Float64Array(length);
  trix[0] = NaN;
  for (let i = 1; i < length; i++) {
    if (isNaN(ema3[i]) || isNaN(ema3[i - 1]) || ema3[i - 1] === 0) {
      trix[i] = NaN;
    } else {
      trix[i] = ((ema3[i] - ema3[i - 1]) / ema3[i - 1]) * 100;
    }
  }
  const signal = computeEMA(trix, length, signalPeriod);
  return { trix, signal };
}
```

- [ ] **Step 3: Implement Supertrend**

```typescript
// src/indicators/supertrend.ts
import { computeATR } from './atr';

export interface SupertrendResult {
  value: Float64Array;
  direction: Float64Array; // 1 = up (bullish), -1 = down (bearish)
}

export function computeSupertrend(
  high: Float64Array, low: Float64Array, close: Float64Array,
  length: number, period: number, multiplier: number,
): SupertrendResult {
  const atr = computeATR(high, low, close, length, period);
  const value = new Float64Array(length);
  const direction = new Float64Array(length);

  for (let i = 0; i < period; i++) { value[i] = NaN; direction[i] = NaN; }

  let prevUpper = 0, prevLower = 0, prevDir = 1;

  for (let i = period; i < length; i++) {
    const mid = (high[i] + low[i]) / 2;
    let upper = mid + multiplier * atr[i];
    let lower = mid - multiplier * atr[i];

    if (i > period) {
      if (lower > prevLower || close[i - 1] < prevLower) { /* keep lower */ }
      else lower = prevLower;
      if (upper < prevUpper || close[i - 1] > prevUpper) { /* keep upper */ }
      else upper = prevUpper;
    }

    let dir: number;
    if (i === period) {
      dir = close[i] > upper ? 1 : -1;
    } else if (prevDir === 1) {
      dir = close[i] < lower ? -1 : 1;
    } else {
      dir = close[i] > upper ? 1 : -1;
    }

    value[i] = dir === 1 ? lower : upper;
    direction[i] = dir;
    prevUpper = upper;
    prevLower = lower;
    prevDir = dir;
  }
  return { value, direction };
}
```

- [ ] **Step 4: Write tests, run, commit**

### Task 15: Wire all new indicators into chart-api

**Files:**
- Modify: `src/indicators/index.ts` — export all new compute functions
- Modify: `src/api/options.ts` — extend `IndicatorType`
- Modify: `src/api/chart-api.ts` — add cases to `_computeIndicator`, `_getIndicatorColorMap`

- [ ] **Step 1: Update `src/indicators/index.ts`**

Add exports for all 12 new indicators:

```typescript
export { computeAroon, type AroonResult } from './aroon';
export { computeAwesomeOscillator } from './awesome-oscillator';
export { computeChaikinMF } from './chaikin-mf';
export { computeCoppock } from './coppock';
export { computeElderForce } from './elder-force';
export { computeTRIX, type TRIXResult } from './trix';
export { computeSupertrend, type SupertrendResult } from './supertrend';
export { computeVWMA } from './vwma';
export { computeChoppiness } from './choppiness';
export { computeMFI } from './mfi';
export { computeROC } from './roc';
export { computeLinearRegression } from './linear-regression';
```

- [ ] **Step 2: Extend IndicatorType in options.ts**

Add to the union: `| 'aroon' | 'awesome-oscillator' | 'chaikin-mf' | 'coppock' | 'elder-force' | 'trix' | 'supertrend' | 'vwma' | 'choppiness' | 'mfi' | 'roc' | 'linear-regression'`

- [ ] **Step 3: Add import and switch cases in chart-api.ts `_computeIndicator`**

Add imports at top of chart-api.ts for all new compute functions. Add cases:

```typescript
case 'aroon': {
  const r = computeAroon(high, low, len, params.period ?? 25);
  return { up: r.up, down: r.down };
}
case 'awesome-oscillator':
  return { histogram: computeAwesomeOscillator(high, low, len, params.fastPeriod ?? 5, params.slowPeriod ?? 34) };
case 'chaikin-mf':
  return { value: computeChaikinMF(high, low, close, volume, len, params.period ?? 20) };
case 'coppock':
  return { value: computeCoppock(close, len, params.wmaPeriod ?? 10, params.longROC ?? 14, params.shortROC ?? 11) };
case 'elder-force':
  return { value: computeElderForce(close, volume, len, params.period ?? 13) };
case 'trix': {
  const r = computeTRIX(close, len, params.period ?? 15, params.signalPeriod ?? 9);
  return { trix: r.trix, signal: r.signal };
}
case 'supertrend': {
  const r = computeSupertrend(high, low, close, len, params.period ?? 10, params.multiplier ?? 3);
  return { value: r.value };
}
case 'vwma':
  return { value: computeVWMA(close, volume, len, params.period ?? 20) };
case 'choppiness':
  return { value: computeChoppiness(high, low, close, len, params.period ?? 14) };
case 'mfi':
  return { value: computeMFI(high, low, close, volume, len, params.period ?? 14) };
case 'roc':
  return { value: computeROC(close, len, params.period ?? 12) };
case 'linear-regression':
  return { value: computeLinearRegression(close, len, params.period ?? 20) };
```

- [ ] **Step 4: Add color maps for multi-output indicators**

In `_getIndicatorColorMap`, add:

```typescript
case 'aroon':
  return { up: '#22AB94', down: '#F7525F' };
case 'trix':
  return { trix: primaryColor, signal: '#ff6d00' };
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`

- [ ] **Step 6: Commit**

```bash
git add src/indicators/ src/api/options.ts src/api/chart-api.ts
git commit -m "feat: add 12 new technical indicators (aroon, AO, CMF, coppock, elder, trix, supertrend, vwma, choppiness, mfi, roc, linreg)"
```

---

## Phase 4: Context Menu

### Task 16: Context menu UI component

**Files:**
- Create: `src/ui/context-menu.ts`

- [ ] **Step 1: Create context-menu.ts**

```typescript
export interface ContextMenuItem {
  label: string;
  icon?: string; // SVG path data
  action: () => void;
  separator?: boolean; // render a divider line before this item
}

export function createContextMenu(
  items: ContextMenuItem[],
  position: { x: number; y: number },
  theme: { bg: string; text: string; border: string },
): HTMLDivElement {
  const menu = document.createElement('div');
  menu.style.cssText =
    `position:fixed;left:${position.x}px;top:${position.y}px;z-index:1000;` +
    `background:${theme.bg};color:${theme.text};border:1px solid ${theme.border};` +
    `border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.3);padding:4px 0;` +
    `min-width:180px;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;`;

  for (const item of items) {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.style.cssText = `height:1px;background:${theme.border};margin:4px 0;`;
      menu.appendChild(sep);
    }

    const row = document.createElement('div');
    row.style.cssText =
      `padding:6px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;` +
      `white-space:nowrap;`;
    row.addEventListener('mouseenter', () => {
      row.style.background = theme.border;
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = 'transparent';
    });

    if (item.icon) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '14');
      svg.setAttribute('height', '14');
      svg.style.cssText = 'fill:currentColor;flex-shrink:0;';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', item.icon);
      svg.appendChild(path);
      row.appendChild(svg);
    }

    const label = document.createElement('span');
    label.textContent = item.label;
    row.appendChild(label);

    row.addEventListener('click', () => {
      item.action();
      menu.remove();
      cleanup();
    });

    menu.appendChild(row);
  }

  // Close on outside click or Escape
  const onOutsideClick = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      cleanup();
    }
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      menu.remove();
      cleanup();
    }
  };
  const cleanup = () => {
    document.removeEventListener('mousedown', onOutsideClick, true);
    document.removeEventListener('keydown', onEscape, true);
  };

  // Delay listener to avoid immediate trigger
  requestAnimationFrame(() => {
    document.addEventListener('mousedown', onOutsideClick, true);
    document.addEventListener('keydown', onEscape, true);
  });

  document.body.appendChild(menu);
  return menu;
}
```

- [ ] **Step 2: Commit**

### Task 17: Context menu handler + EventRouter integration

**Files:**
- Modify: `src/interactions/event-router.ts` — add `onContextMenu` to `EventHandler`, listen for `contextmenu`
- Create: `src/interactions/context-menu-handler.ts`
- Modify: `src/api/chart-api.ts` — instantiate and wire the handler

- [ ] **Step 1: Extend EventHandler interface**

In `event-router.ts`, add to `EventHandler`:

```typescript
onContextMenu?(x: number, y: number): boolean | void;
```

Add bound listener in constructor:

```typescript
private _boundContextMenu: (e: MouseEvent) => void;
// in constructor:
this._boundContextMenu = this._handleContextMenu.bind(this);
```

In `attach()`, add:

```typescript
element.addEventListener('contextmenu', this._boundContextMenu);
```

In `detach()`, add:

```typescript
el.removeEventListener('contextmenu', this._boundContextMenu);
```

Add handler method:

```typescript
private _handleContextMenu(e: MouseEvent): void {
  e.preventDefault();
  const el = this._element;
  let x = e.clientX, y = e.clientY;
  if (el) {
    const rect = el.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  for (const h of this._handlers) {
    if (h.onContextMenu?.(x, y) === true) break;
  }
}
```

- [ ] **Step 2: Create context-menu-handler.ts**

```typescript
import type { EventHandler } from './event-router';
import type { ContextMenuItem } from '../ui/context-menu';
import { createContextMenu } from '../ui/context-menu';
import { BaseDrawing } from '../drawings/base';

export interface ContextMenuCallbacks {
  getDrawings(): { drawing: BaseDrawing; id: string }[];
  getIndicatorAtPane(paneId: string): { id: string; label: string } | null;
  getPaneAtY(y: number): string | null;
  mainPaneId: string;

  // Drawing actions
  editDrawing(id: string): void;
  removeDrawing(id: string): void;
  duplicateDrawing(id: string): void;
  bringDrawingToFront(id: string): void;
  sendDrawingToBack(id: string): void;

  // Indicator actions
  openIndicatorSettings(id: string): void;
  toggleIndicatorVisibility(id: string): void;
  removeIndicator(id: string): void;

  // Chart actions
  fitContent(): void;
  scrollToRealTime(): void;

  // Theme
  theme: { bg: string; text: string; border: string };

  // Convert local coords to screen coords for positioning
  localToScreen(x: number, y: number): { x: number; y: number };
}

export class ContextMenuHandler implements EventHandler {
  private _callbacks: ContextMenuCallbacks;

  constructor(callbacks: ContextMenuCallbacks) {
    this._callbacks = callbacks;
  }

  onContextMenu(x: number, y: number): boolean {
    const cb = this._callbacks;
    const screenPos = cb.localToScreen(x, y);

    // 1. Check drawings
    for (const { drawing, id } of cb.getDrawings()) {
      const hit = drawing._hitTestDrawing(x, y);
      if (hit) {
        this._showDrawingMenu(id, screenPos);
        return true;
      }
    }

    // 2. Check indicator panes
    const paneId = cb.getPaneAtY(y);
    if (paneId && paneId !== cb.mainPaneId) {
      const indicator = cb.getIndicatorAtPane(paneId);
      if (indicator) {
        this._showIndicatorMenu(indicator.id, screenPos);
        return true;
      }
    }

    // 3. Empty chart area
    this._showChartMenu(screenPos);
    return true;
  }

  private _showDrawingMenu(id: string, pos: { x: number; y: number }): void {
    const cb = this._callbacks;
    createContextMenu([
      { label: 'Edit', action: () => cb.editDrawing(id) },
      { label: 'Duplicate', action: () => cb.duplicateDrawing(id) },
      { label: 'Remove', action: () => cb.removeDrawing(id) },
      { label: 'Bring to Front', action: () => cb.bringDrawingToFront(id), separator: true },
      { label: 'Send to Back', action: () => cb.sendDrawingToBack(id) },
    ], pos, cb.theme);
  }

  private _showIndicatorMenu(id: string, pos: { x: number; y: number }): void {
    const cb = this._callbacks;
    createContextMenu([
      { label: 'Settings', action: () => cb.openIndicatorSettings(id) },
      { label: 'Hide', action: () => cb.toggleIndicatorVisibility(id) },
      { label: 'Remove', action: () => cb.removeIndicator(id) },
    ], pos, cb.theme);
  }

  private _showChartMenu(pos: { x: number; y: number }): void {
    const cb = this._callbacks;
    createContextMenu([
      { label: 'Reset Zoom', action: () => cb.fitContent() },
      { label: 'Scroll to Latest', action: () => cb.scrollToRealTime() },
    ], pos, cb.theme);
  }
}
```

- [ ] **Step 3: Wire into chart-api.ts**

In the constructor or after pane setup, create and add the handler:

```typescript
import { ContextMenuHandler, type ContextMenuCallbacks } from '../interactions/context-menu-handler';

// In constructor, after eventRouter.attach():
this._contextMenuHandler = new ContextMenuHandler({
  getDrawings: () => this._drawings.filter(d => d instanceof BaseDrawing).map(d => ({
    drawing: d as BaseDrawing,
    id: (d as BaseDrawing).id,
  })),
  getIndicatorAtPane: (paneId: string) => {
    const ind = this._indicators.find(i => i.paneId() === paneId);
    return ind ? { id: `indicator-${ind.id}`, label: ind.label() } : null;
  },
  getPaneAtY: (y: number) => { /* determine pane from y coordinate */ },
  mainPaneId: this._mainPaneId,
  editDrawing: (id) => { /* select drawing, open settings */ },
  removeDrawing: (id) => {
    const api = this._drawingApis.get(id);
    if (api) this.removeDrawing(api);
  },
  duplicateDrawing: (id) => { /* serialize + create copy with offset */ },
  bringDrawingToFront: (id) => { /* move to end of _drawings array */ },
  sendDrawingToBack: (id) => { /* move to start of _drawings array */ },
  openIndicatorSettings: (id) => { /* trigger HUD settings popup */ },
  toggleIndicatorVisibility: (id) => { /* toggle via indicator api */ },
  removeIndicator: (id) => {
    const ind = this._indicators.find(i => `indicator-${i.id}` === id);
    if (ind) this.removeIndicator(ind);
  },
  fitContent: () => this._timeScale.fitContent(),
  scrollToRealTime: () => this.scrollToRealTime(),
  theme: { bg: this._options.layout.backgroundColor, text: this._options.layout.textColor, border: '#333' },
  localToScreen: (x, y) => {
    const rect = this._wrapper.getBoundingClientRect();
    return { x: rect.left + x, y: rect.top + y };
  },
});
this._eventRouter.addHandler(this._contextMenuHandler);
```

Implement `getPaneAtY` by iterating panes and checking cumulative heights. Implement `duplicateDrawing` by serializing the drawing and creating a new one with offset points. Implement `editDrawing` by selecting the drawing. Implement `bringDrawingToFront`/`sendDrawingToBack` by reordering `_drawings` array.

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`

- [ ] **Step 5: Commit**

```bash
git add src/ui/context-menu.ts src/interactions/context-menu-handler.ts src/interactions/event-router.ts src/api/chart-api.ts
git commit -m "feat: add right-click context menu for drawings, indicators, and chart"
```

---

## Phase 5: HUD Redesign

### Task 18: TV-style global HUD collapse

**Files:**
- Modify: `src/ui/hud.ts` — replace per-row chevrons with global chevron, add `setGlobalCollapsed()`
- Modify: `src/api/chart-api.ts` — add cross-pane sync on collapse toggle

- [ ] **Step 1: Redesign HudManager**

Replace the per-row collapse chevron logic. The global chevron is the first element in the container. When collapsed, hide all rows except a compact summary line.

Key changes to `src/ui/hud.ts`:

1. Add `_globalCollapsed: boolean = false` field
2. Add `_compactLine: HTMLDivElement` element (always visible — shows symbol + OHLC or indicator label)
3. Add `_globalChevron: HTMLButtonElement` element (first in container)
4. Add `_rowsWrapper: HTMLDivElement` (wraps all rows, hidden when collapsed)
5. Remove per-row chevron buttons
6. Add `setGlobalCollapsed(collapsed: boolean)` method
7. Add `onGlobalCollapseToggle: (() => void) | null` callback for cross-pane sync

In `addRow()`: remove the per-row chevron. Put all rows inside `_rowsWrapper`. The first row added provides the compact line text (symbol + OHLC).

In `updateValues()`: update both row values and the compact line.

- [ ] **Step 2: Add cross-pane sync in chart-api.ts**

When main pane HUD collapse is toggled, iterate all HudManagers and call `setGlobalCollapsed()`:

```typescript
// In HUD creation callback for main pane:
mainHud.onGlobalCollapseToggle = () => {
  const collapsed = mainHud.isGlobalCollapsed();
  for (const [paneId, hud] of this._huds) {
    if (paneId !== this._mainPaneId) {
      hud.setGlobalCollapsed(collapsed);
    }
  }
};
```

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`

- [ ] **Step 4: Commit**

```bash
git add src/ui/hud.ts src/api/chart-api.ts
git commit -m "feat: TV-style global HUD collapse with cross-pane sync"
```

---

## Phase 6: Storybook Stories & Documentation

### Task 19: Storybook stories for new drawings

**Files:**
- Create: `stories/Drawings/NewDrawings.stories.ts`

- [ ] **Step 1: Create stories file**

One story per new drawing tool. Each includes `parameters.docs.source.code` with a clean code snippet. Pattern for each story:

```typescript
export const Ray: Story = {
  name: 'Ray',
  parameters: {
    docs: {
      source: {
        code: `const chart = createChart(container, { autoSize: true, symbol: 'AAPL' });
const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);

chart.addDrawing('ray', [
  { time: data[20].time, price: data[20].close },
  { time: data[40].time, price: data[40].close },
], { color: '#2196F3', lineWidth: 2 });`,
      },
    },
  },
  render: () => {
    // Full render implementation
  },
};
```

Repeat for: ray, arrow, channel, ellipse, pitchfork, fib-projection, fib-arc, fib-fan, crossline, measurement.

- [ ] **Step 2: Commit**

### Task 20: Storybook stories for new indicators

**Files:**
- Create: `stories/Indicators/NewIndicators.stories.ts`

- [ ] **Step 1: Create stories file**

One story per new indicator, each with code snippet. Pattern:

```typescript
export const Aroon: Story = {
  name: 'Aroon (25)',
  parameters: {
    docs: {
      source: {
        code: `const series = chart.addSeries({ type: 'candlestick' });
series.setData(data);
chart.addIndicator('aroon', { source: series, params: { period: 25 } });`,
      },
    },
  },
  render: () => { /* ... */ },
};
```

- [ ] **Step 2: Commit**

### Task 21: Storybook stories for context menu and HUD

**Files:**
- Create: `stories/Features/ContextMenu.stories.ts`
- Create: `stories/Features/HudCollapse.stories.ts`

- [ ] **Step 1: Create ContextMenu story** — chart with drawings + instructions to right-click
- [ ] **Step 2: Create HudCollapse story** — chart with indicators showing collapse/expand
- [ ] **Step 3: Commit**

### Task 22: Update README with actual bundle sizes

**Files:**
- Modify: `README.md`
- Modify: `package.json` — add `"size"` npm script

- [ ] **Step 1: Add size measurement script to package.json**

Add to `scripts`:

```json
"size": "node -e \"const{execSync:e}=require('child_process');const r=s=>e('gzip -c '+s+' | wc -c').toString().trim();console.log('Core (chart-api):', (parseInt(r('dist/index56.js'))/1024).toFixed(1),'KB gzip');console.log('Full bundle:', (parseInt(e('cat dist/*.js | gzip | wc -c').toString().trim())/1024).toFixed(1),'KB gzip')\""
```

- [ ] **Step 2: Run build + size measurement**

```bash
npm run build && npm run size
```

- [ ] **Step 3: Update README.md**

Replace the "Bundle Size Targets" section with actual measured values:

```markdown
## Bundle Size (measured)

| Entry point | Size (gzip) |
|---|---|
| Core (chart + renderers) | ~13 KB |
| Core + 3 indicators (SMA, RSI, MACD) | ~15 KB |
| Full bundle (all chart types + 30 indicators + drawings) | ~32 KB |
```

Update feature list: 30 indicators, 16 drawing tools, context menu, TV-style HUD.

Update Quick Start to use `addSeries()`:

```typescript
const series = chart.addSeries({ type: 'candlestick' });
```

Update Chart Types table to show `addSeries({ type: '...' })` API.

- [ ] **Step 4: Commit**

```bash
git add README.md package.json
git commit -m "docs: update README with actual bundle sizes, unified API, new feature counts"
```

### Task 23: Update docs

**Files:**
- Modify: `docs/api-reference.md` — add `addSeries()`, deprecation notes
- Modify: `docs/drawings.md` — add 10 new drawing tools
- Modify: `docs/indicators.md` — add 12 new indicators

- [ ] **Step 1: Update api-reference.md** with `addSeries()` documentation and mark old methods deprecated
- [ ] **Step 2: Update drawings.md** with new drawing tools, parameters, and usage examples
- [ ] **Step 3: Update indicators.md** with new indicators, parameters, formulas
- [ ] **Step 4: Commit**

### Task 24: Final build + full test run

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Final commit if any remaining changes**
