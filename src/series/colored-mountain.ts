import { registerSeries, type SeriesRegistration } from '../core/registry';
import { ColoredMountainRenderer } from '../renderers/colored-mountain';

export const ColoredMountain: SeriesRegistration = {
  type: 'colored-mountain',
  createRenderer(options) {
    const r = new ColoredMountainRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(ColoredMountain);
