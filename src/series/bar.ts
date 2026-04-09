import { registerSeries, type SeriesRegistration } from '../core/registry';
import { BarOHLCRenderer } from '../renderers/bar-ohlc';

export const Bar: SeriesRegistration = {
  type: 'bar',
  createRenderer(options) {
    const r = new BarOHLCRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(Bar);
