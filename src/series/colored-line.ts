import { registerSeries, type SeriesRegistration } from '../core/registry';
import { ColoredLineRenderer } from '../renderers/colored-line';

export const ColoredLine: SeriesRegistration = {
  type: 'colored-line',
  createRenderer(options) {
    const r = new ColoredLineRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(ColoredLine);
