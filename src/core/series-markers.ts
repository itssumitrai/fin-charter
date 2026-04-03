// ─── Series Markers ─────────────────────────────────────────────────────────

export type MarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';
export type MarkerPosition = 'aboveBar' | 'belowBar' | 'inBar';

export interface SeriesMarker {
  time: number;
  position: MarkerPosition;
  shape: MarkerShape;
  color: string;
  text?: string;
  size?: number; // default 1
  id?: string;
}
