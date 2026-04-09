import { registerSeries, type SeriesRegistration, type ISeriesRenderer } from '../core/registry';
import { LineRenderer } from '../renderers/line';

export const Line: SeriesRegistration = {
  type: 'line',
  createRenderer(options) {
    const r = new LineRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r as unknown as ISeriesRenderer;
  },
};

registerSeries(Line);
