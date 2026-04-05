import type { ColumnStore } from './types';

/**
 * Output descriptor for a custom indicator output line.
 */
export interface IndicatorOutput {
  /** Name of this output (e.g., 'upper', 'middle', 'lower'). */
  name: string;
  /** Default color for rendering. */
  color?: string;
  /** Rendering style: 'line' (default), 'histogram', 'dots', 'area'. */
  style?: 'line' | 'histogram' | 'dots' | 'area';
}

/**
 * Parameter descriptor for a custom indicator parameter.
 */
export interface IndicatorParam {
  /** Parameter name. */
  name: string;
  /** Default value. */
  defaultValue: number;
  /** Minimum value (for UI validation). */
  min?: number;
  /** Maximum value (for UI validation). */
  max?: number;
  /** Step for UI controls. */
  step?: number;
}

/**
 * Compute function signature for custom indicators.
 * Receives the ColumnStore and parameter values, returns a map of output name → Float64Array.
 */
export type IndicatorComputeFn = (
  store: ColumnStore,
  params: Record<string, number>,
) => Map<string, Float64Array>;

/**
 * Descriptor for registering a custom indicator.
 */
export interface CustomIndicatorDescriptor {
  /** Unique name for this indicator type. */
  name: string;
  /** Human-readable label for UI. */
  label: string;
  /** Whether this indicator overlays on the main price chart or gets its own pane. */
  overlay: boolean;
  /** Parameter definitions with defaults. */
  params: IndicatorParam[];
  /** Output definitions (multiple outputs supported, e.g., MACD has signal + histogram). */
  outputs: IndicatorOutput[];
  /** Compute function that produces output values from bar data and parameters. */
  compute: IndicatorComputeFn;
}

/**
 * Registry for custom indicator types.
 * Indicators registered here appear alongside built-in indicators.
 */
export class CustomIndicatorRegistry {
  private _descriptors: Map<string, CustomIndicatorDescriptor> = new Map();

  /** Register a custom indicator type. */
  register(descriptor: CustomIndicatorDescriptor): void {
    if (this._descriptors.has(descriptor.name)) {
      throw new Error(`Custom indicator '${descriptor.name}' is already registered`);
    }
    if (!descriptor.compute) {
      throw new Error(`Custom indicator '${descriptor.name}' must have a compute function`);
    }
    if (descriptor.outputs.length === 0) {
      throw new Error(`Custom indicator '${descriptor.name}' must have at least one output`);
    }
    this._descriptors.set(descriptor.name, descriptor);
  }

  /** Unregister a custom indicator type. */
  unregister(name: string): boolean {
    return this._descriptors.delete(name);
  }

  /** Get a registered descriptor by name. */
  get(name: string): CustomIndicatorDescriptor | undefined {
    return this._descriptors.get(name);
  }

  /** List all registered custom indicator names. */
  list(): string[] {
    return [...this._descriptors.keys()];
  }

  /** Check if a custom indicator type is registered. */
  has(name: string): boolean {
    return this._descriptors.has(name);
  }

  /** Get all registered descriptors. */
  getAll(): CustomIndicatorDescriptor[] {
    return [...this._descriptors.values()];
  }

  /** Compute a custom indicator's outputs for the given data and params. */
  compute(
    name: string,
    store: ColumnStore,
    params: Record<string, number>,
  ): Map<string, Float64Array> {
    const descriptor = this._descriptors.get(name);
    if (!descriptor) {
      throw new Error(`Custom indicator '${name}' is not registered`);
    }
    // Merge default params with provided params
    const mergedParams: Record<string, number> = {};
    for (const p of descriptor.params) {
      mergedParams[p.name] = params[p.name] ?? p.defaultValue;
    }
    return descriptor.compute(store, mergedParams);
  }
}
