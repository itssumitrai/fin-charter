import { registerSeries, type SeriesRegistration, type ISeriesRenderer } from '../core/registry';
import { AreaRenderer } from '../renderers/area';

export const Area: SeriesRegistration = {
  type: 'area',
  createRenderer(options) {
    const r = new AreaRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r as unknown as ISeriesRenderer;
  },
};

registerSeries(Area);
