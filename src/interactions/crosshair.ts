import type { EventHandler } from './event-router';
import type { Crosshair } from '../core/crosshair';
import type { DataLayer } from '../core/data-layer';
import type { TimeScale } from '../core/time-scale';
import type { PriceScale } from '../core/price-scale';

export class CrosshairHandler implements EventHandler {
  private _crosshair: Crosshair;
  private _dataLayer: DataLayer;
  private _timeScale: TimeScale;
  private _priceScale: PriceScale;
  private _requestInvalidation: () => void;

  constructor(
    crosshair: Crosshair,
    dataLayer: DataLayer,
    timeScale: TimeScale,
    priceScale: PriceScale,
    requestInvalidation: () => void,
  ) {
    this._crosshair = crosshair;
    this._dataLayer = dataLayer;
    this._timeScale = timeScale;
    this._priceScale = priceScale;
    this._requestInvalidation = requestInvalidation;
  }

  onPointerMove(x: number, y: number, _pointerId: number): void {
    const store = this._dataLayer.store;
    if (store.length === 0) {
      this._crosshair.hide();
      this._requestInvalidation();
      return;
    }

    // Convert x pixel to nearest bar index
    const rawIndex = this._timeScale.xToIndex(x);
    const barIndex = Math.max(0, Math.min(store.length - 1, rawIndex));

    // Snap x to the bar center
    const snappedX = this._timeScale.indexToX(barIndex);

    // Convert y pixel to price
    const price = this._priceScale.yToPrice(y);

    const time = store.time[barIndex];

    this._crosshair.update({
      x,
      y,
      barIndex,
      price,
      time,
      snappedX,
    });

    this._requestInvalidation();
  }

  onPointerUp(_pointerId: number): void {
    this._crosshair.hide();
    this._requestInvalidation();
  }
}
