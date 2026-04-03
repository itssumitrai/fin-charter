export interface CrosshairState {
  x: number;
  y: number;
  barIndex: number;
  price: number;
  time: number;
  /** X coordinate snapped to the bar centre (optional — falls back to x). */
  snappedX?: number;
}

export class Crosshair {
  public visible: boolean = false;
  public x: number = 0;
  public y: number = 0;
  public barIndex: number = -1;
  public price: number = 0;
  public time: number = 0;
  private _snappedX: number | undefined = undefined;

  /** X coordinate snapped to the bar centre; falls back to x if not provided. */
  get snappedX(): number {
    return this._snappedX ?? this.x;
  }

  /** Make the crosshair visible and update all properties. */
  update(state: CrosshairState): void {
    this.visible = true;
    this.x = state.x;
    this.y = state.y;
    this.barIndex = state.barIndex;
    this.price = state.price;
    this.time = state.time;
    this._snappedX = state.snappedX;
  }

  /** Hide the crosshair. */
  hide(): void {
    this.visible = false;
  }
}
