import type { ISeriesPrimitive } from '../core/types';
import type { DrawingFactory, AnchorPoint, DrawingOptions, DrawingPrimitive } from './base';

import { createHorizontalLine } from './horizontal-line';
import { createVerticalLine } from './vertical-line';
import { createTrendline } from './trendline';
import { createFibonacci } from './fibonacci';
import { createRectangle } from './rectangle';
import { createTextAnnotation } from './text-annotation';
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
import { createGannFan } from './gann-fan';
import { createParallelChannel } from './parallel-channel';
import { createFibonacciTimezone } from './fibonacci-timezone';
import { createPriceRange } from './price-range';
import { createDateRange } from './date-range';
import { createCallout } from './callout';

// Re-export public types
export type { AnchorPoint, DrawingOptions, DrawingHitTestResult, SerializedDrawing, DrawingPrimitive, DrawingContext, DrawingFactory } from './base';
export { distToSegment, pointInRect, HIT_THRESHOLD, BaseDrawing } from './base';

// ─── Registry ─────────────────────────────────────────────────────────────────

export const DRAWING_REGISTRY = new Map<string, DrawingFactory>();

export function registerBuiltinDrawings(): void {
  DRAWING_REGISTRY.set('horizontal-line', createHorizontalLine as DrawingFactory);
  DRAWING_REGISTRY.set('vertical-line', createVerticalLine as DrawingFactory);
  DRAWING_REGISTRY.set('trendline', createTrendline as DrawingFactory);
  DRAWING_REGISTRY.set('fibonacci', createFibonacci as DrawingFactory);
  DRAWING_REGISTRY.set('rectangle', createRectangle as DrawingFactory);
  DRAWING_REGISTRY.set('text-annotation', createTextAnnotation as DrawingFactory);
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
  DRAWING_REGISTRY.set('gann-fan', createGannFan as DrawingFactory);
  DRAWING_REGISTRY.set('parallel-channel', createParallelChannel as DrawingFactory);
  DRAWING_REGISTRY.set('fibonacci-timezone', createFibonacciTimezone as DrawingFactory);
  DRAWING_REGISTRY.set('price-range', createPriceRange as DrawingFactory);
  DRAWING_REGISTRY.set('date-range', createDateRange as DrawingFactory);
  DRAWING_REGISTRY.set('callout', createCallout as DrawingFactory);
}

// Register built-ins immediately on import
registerBuiltinDrawings();

export function createBuiltinDrawing(
  type: string,
  id: string,
  points: AnchorPoint[],
  options: DrawingOptions,
): (ISeriesPrimitive & DrawingPrimitive) | null {
  const factory = DRAWING_REGISTRY.get(type);
  if (!factory) return null;
  return factory(id, points, options);
}
