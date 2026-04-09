/**
 * Full bundle entry point — registers all series types, indicators, and drawings.
 * Import from '@itssumitrai/fin-charter/full' for the batteries-included experience.
 */
import './series'; // registers all series
import './indicators/registrations'; // registers all indicators
// Note: drawings are still auto-registered via DRAWING_REGISTRY for now

// Re-export everything from main index
export * from './index';
