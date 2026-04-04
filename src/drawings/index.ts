import type { ISeriesPrimitive } from '../core/types';
import type { DrawingFactory, AnchorPoint, DrawingOptions, DrawingPrimitive } from './base';

import { createHorizontalLine } from './horizontal-line';
import { createVerticalLine } from './vertical-line';
import { createTrendline } from './trendline';
import { createFibonacci } from './fibonacci';
import { createRectangle } from './rectangle';
import { createTextAnnotation } from './text-annotation';

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
