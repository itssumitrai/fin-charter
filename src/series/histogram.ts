import { registerSeries, type SeriesRegistration } from '../core/registry';
import { HistogramRenderer } from '../renderers/histogram';

export const Histogram: SeriesRegistration = {
  type: 'histogram',
  createRenderer(options) {
    const r = new HistogramRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(Histogram);
