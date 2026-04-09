import { registerSeries, type SeriesRegistration, type ISeriesRenderer } from '../core/registry';
import { CandlestickRenderer } from '../renderers/candlestick';

export const Candlestick: SeriesRegistration = {
  type: 'candlestick',
  aliases: ['heikin-ashi'],
  createRenderer(options) {
    const r = new CandlestickRenderer();
    if (Object.keys(options).length > 0) r.applyOptions(options as never);
    return r as unknown as ISeriesRenderer;
  },
};

registerSeries(Candlestick);
