/**
 * Series registrations module.
 *
 * Importing this module registers all built-in series types as a side-effect.
 * This is used by the full bundle entry point (full.ts) and by the test setup.
 */

// Import each series file — each one calls registerSeries() as a side-effect.
import './series/candlestick';
import './series/line';
import './series/area';
import './series/bar';
import './series/baseline';
import './series/hollow-candle';
import './series/histogram';
import './series/step-line';
import './series/colored-line';
import './series/colored-mountain';
import './series/hlc-area';
import './series/high-low';
import './series/column';
import './series/volume-candle';
import './series/baseline-delta-mountain';
import './series/renko';
import './series/kagi';
import './series/line-break';
import './series/point-figure';
