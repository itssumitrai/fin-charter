import { registerSeries, type SeriesRegistration } from '../core/registry';
import { LineBreakRenderer } from '../renderers/line-break';

export const LineBreak: SeriesRegistration = {
  type: 'line-break',
  createRenderer(options) {
    const r = new LineBreakRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(LineBreak);
