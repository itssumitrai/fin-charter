/**
 * Full bundle entry point — registers all series types and indicators.
 * Import from '@itssumitrai/fin-charter/full' for the batteries-included experience.
 * Drawings are registered via DRAWING_REGISTRY (imported by chart-api.ts).
 */
import './series'; // registers all 19 series types
import './indicators/registrations'; // registers all 30 indicators

// Re-export everything from main index
export * from './index';
