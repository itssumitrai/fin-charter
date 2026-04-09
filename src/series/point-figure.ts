import { registerSeries, type SeriesRegistration } from '../core/registry';
import { PointFigureRenderer } from '../renderers/point-figure';

export const PointFigure: SeriesRegistration = {
  type: 'point-figure',
  createRenderer(options) {
    const r = new PointFigureRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(PointFigure);
