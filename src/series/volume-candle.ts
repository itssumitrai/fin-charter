import { registerSeries, type SeriesRegistration } from '../core/registry';
import { VolumeCandleRenderer } from '../renderers/volume-candle';

export const VolumeCandle: SeriesRegistration = {
  type: 'volume-candle',
  createRenderer(options) {
    const r = new VolumeCandleRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(VolumeCandle);
