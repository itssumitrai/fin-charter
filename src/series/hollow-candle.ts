import { registerSeries, type SeriesRegistration } from '../core/registry';
import { HollowCandleRenderer } from '../renderers/hollow-candle';

export const HollowCandle: SeriesRegistration = {
  type: 'hollow-candle',
  createRenderer(options) {
    const r = new HollowCandleRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(HollowCandle);
