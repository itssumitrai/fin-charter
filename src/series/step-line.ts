import { registerSeries, type SeriesRegistration } from '../core/registry';
import { StepLineRenderer } from '../renderers/step-line';

export const StepLine: SeriesRegistration = {
  type: 'step-line',
  createRenderer(options) {
    const r = new StepLineRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r;
  },
};

registerSeries(StepLine);
