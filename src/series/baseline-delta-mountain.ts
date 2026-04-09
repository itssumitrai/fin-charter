import { registerSeries, type SeriesRegistration } from '../core/registry';
import { BaselineDeltaMountainRenderer } from '../renderers/baseline-delta-mountain';

export const BaselineDeltaMountain: SeriesRegistration = {
  type: 'baseline-delta-mountain',
  createRenderer(options) {
    const r = new BaselineDeltaMountainRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(BaselineDeltaMountain);
