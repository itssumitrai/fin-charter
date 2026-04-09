import { registerSeries, type SeriesRegistration } from '../core/registry';
import { BaselineRenderer } from '../renderers/baseline';

export const Baseline: SeriesRegistration = {
  type: 'baseline',
  createRenderer(options) {
    const r = new BaselineRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(Baseline);
