/**
 * IPlugin — formal plugin interface with lifecycle hooks.
 *
 * Plugins can add custom series types, indicators, drawing tools,
 * UI panels, and intercept chart events.
 */
export interface IPlugin {
  /** Unique plugin identifier. */
  readonly name: string;
  /** Plugin version (semver). */
  readonly version?: string;
  /** Plugins this plugin depends on (by name). */
  readonly dependencies?: string[];

  /**
   * Called when the plugin is installed on a chart via chart.use(plugin).
   * Receives the chart API for registering extensions.
   */
  install(chart: PluginChartApi): void;

  /**
   * Called when the plugin is uninstalled or the chart is destroyed.
   */
  uninstall?(): void;

  /**
   * Called on each paint cycle, after all series have been rendered.
   * Allows plugins to render custom overlays.
   */
  onPaint?(context: PluginPaintContext): void;

  /**
   * Called when chart options change.
   */
  onOptionsChange?(options: Record<string, unknown>): void;

  /**
   * Called when data is updated on any series.
   */
  onDataUpdate?(): void;
}

/**
 * Subset of the chart API exposed to plugins.
 */
export interface PluginChartApi {
  /** Get the DOM container element. */
  getContainer(): HTMLElement;
  /** Request a chart repaint. */
  requestRepaint(): void;
  /** Get chart dimensions. */
  getSize(): { width: number; height: number };
}

/**
 * Context passed to plugin paint callbacks.
 */
export interface PluginPaintContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

/**
 * PluginManager — manages plugin lifecycle, dependency resolution,
 * and event dispatch.
 */
export class PluginManager {
  private _plugins: Map<string, IPlugin> = new Map();
  private _installOrder: string[] = [];
  private _chartApi: PluginChartApi | null = null;

  /** Set the chart API reference. Called once during chart initialization. */
  setChartApi(api: PluginChartApi): void {
    this._chartApi = api;
  }

  /**
   * Install a plugin. Resolves dependencies (must already be installed).
   */
  use(plugin: IPlugin): void {
    if (this._plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already installed`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this._plugins.has(dep)) {
          throw new Error(
            `Plugin '${plugin.name}' depends on '${dep}' which is not installed`,
          );
        }
      }
    }

    this._plugins.set(plugin.name, plugin);
    this._installOrder.push(plugin.name);

    if (this._chartApi) {
      plugin.install(this._chartApi);
    }
  }

  /** Uninstall a plugin by name. */
  remove(name: string): boolean {
    const plugin = this._plugins.get(name);
    if (!plugin) return false;

    // Check if other plugins depend on this one
    for (const [otherName, other] of this._plugins) {
      if (otherName !== name && other.dependencies?.includes(name)) {
        throw new Error(
          `Cannot remove plugin '${name}': plugin '${otherName}' depends on it`,
        );
      }
    }

    plugin.uninstall?.();
    this._plugins.delete(name);
    this._installOrder = this._installOrder.filter((n) => n !== name);
    return true;
  }

  /** Get an installed plugin by name. */
  get(name: string): IPlugin | undefined {
    return this._plugins.get(name);
  }

  /** List installed plugin names in install order. */
  list(): string[] {
    return [...this._installOrder];
  }

  /** Whether a plugin is installed. */
  has(name: string): boolean {
    return this._plugins.has(name);
  }

  /** Notify all plugins of a paint cycle. */
  notifyPaint(context: PluginPaintContext): void {
    for (const name of this._installOrder) {
      this._plugins.get(name)?.onPaint?.(context);
    }
  }

  /** Notify all plugins of options change. */
  notifyOptionsChange(options: Record<string, unknown>): void {
    for (const name of this._installOrder) {
      this._plugins.get(name)?.onOptionsChange?.(options);
    }
  }

  /** Notify all plugins of data update. */
  notifyDataUpdate(): void {
    for (const name of this._installOrder) {
      this._plugins.get(name)?.onDataUpdate?.();
    }
  }

  /** Uninstall all plugins in reverse order. */
  removeAll(): void {
    for (let i = this._installOrder.length - 1; i >= 0; i--) {
      const name = this._installOrder[i];
      this._plugins.get(name)?.uninstall?.();
    }
    this._plugins.clear();
    this._installOrder = [];
  }
}
