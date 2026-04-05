import { describe, it, expect, vi } from 'vitest';
import { PluginManager } from '@/core/plugin';
import type { IPlugin, PluginChartApi } from '@/core/plugin';

function makeMockApi(): PluginChartApi {
  return {
    getContainer: () => document.createElement('div'),
    requestRepaint: vi.fn(),
    getSize: () => ({ width: 800, height: 400 }),
  };
}

function makePlugin(name: string, deps?: string[]): IPlugin {
  return {
    name,
    dependencies: deps,
    install: vi.fn(),
    uninstall: vi.fn(),
    onPaint: vi.fn(),
    onDataUpdate: vi.fn(),
  };
}

describe('PluginManager', () => {
  it('installs a plugin and calls install()', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    const plugin = makePlugin('test');
    mgr.use(plugin);
    expect(plugin.install).toHaveBeenCalled();
    expect(mgr.has('test')).toBe(true);
  });

  it('throws on duplicate plugin name', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    mgr.use(makePlugin('test'));
    expect(() => mgr.use(makePlugin('test'))).toThrow('already installed');
  });

  it('resolves dependencies', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    mgr.use(makePlugin('base'));
    mgr.use(makePlugin('dependent', ['base']));
    expect(mgr.list()).toEqual(['base', 'dependent']);
  });

  it('throws when dependency is missing', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    expect(() => mgr.use(makePlugin('child', ['missing']))).toThrow('not installed');
  });

  it('removes a plugin', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    const plugin = makePlugin('test');
    mgr.use(plugin);
    expect(mgr.remove('test')).toBe(true);
    expect(plugin.uninstall).toHaveBeenCalled();
    expect(mgr.has('test')).toBe(false);
  });

  it('prevents removing plugin with dependents', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    mgr.use(makePlugin('base'));
    mgr.use(makePlugin('child', ['base']));
    expect(() => mgr.remove('base')).toThrow('depends on it');
  });

  it('notifies plugins on paint', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    const plugin = makePlugin('test');
    mgr.use(plugin);
    const ctx = { ctx: {} as CanvasRenderingContext2D, width: 800, height: 400, pixelRatio: 1 };
    mgr.notifyPaint(ctx);
    expect(plugin.onPaint).toHaveBeenCalledWith(ctx);
  });

  it('notifies plugins on data update', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    const plugin = makePlugin('test');
    mgr.use(plugin);
    mgr.notifyDataUpdate();
    expect(plugin.onDataUpdate).toHaveBeenCalled();
  });

  it('removeAll uninstalls in reverse order', () => {
    const mgr = new PluginManager();
    mgr.setChartApi(makeMockApi());
    const order: string[] = [];
    const p1: IPlugin = { name: 'a', install: vi.fn(), uninstall: () => order.push('a') };
    const p2: IPlugin = { name: 'b', install: vi.fn(), uninstall: () => order.push('b') };
    mgr.use(p1);
    mgr.use(p2);
    mgr.removeAll();
    expect(order).toEqual(['b', 'a']); // reverse
    expect(mgr.list()).toEqual([]);
  });
});
