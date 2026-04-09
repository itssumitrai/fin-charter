import { registerSeries, type SeriesRegistration } from '../core/registry';
import { RenkoRenderer } from '../renderers/renko';

export const Renko: SeriesRegistration = {
  type: 'renko',
  createRenderer(options) {
    const r = new RenkoRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(Renko);
