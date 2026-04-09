import { registerSeries, type SeriesRegistration } from '../core/registry';
import { KagiRenderer } from '../renderers/kagi';

export const Kagi: SeriesRegistration = {
  type: 'kagi',
  createRenderer(options) {
    const r = new KagiRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(Kagi);
