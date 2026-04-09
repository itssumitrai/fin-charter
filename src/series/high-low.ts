import { registerSeries, type SeriesRegistration } from '../core/registry';
import { HighLowRenderer } from '../renderers/high-low';

export const HighLow: SeriesRegistration = {
  type: 'high-low',
  createRenderer(options) {
    const r = new HighLowRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(HighLow);
