import { registerSeries, type SeriesRegistration } from '../core/registry';
import { HLCAreaRenderer } from '../renderers/hlc-area';

export const HLCArea: SeriesRegistration = {
  type: 'hlc-area',
  createRenderer(options) {
    const r = new HLCAreaRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(HLCArea);
