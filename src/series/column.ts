import { registerSeries, type SeriesRegistration } from '../core/registry';
import { ColumnRenderer } from '../renderers/column';

export const Column: SeriesRegistration = {
  type: 'column',
  createRenderer(options) {
    const r = new ColumnRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(Column);
