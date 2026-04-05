import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageAdapter, DrawingPersistence } from '@/core/storage-adapter';
import type { IStorageAdapter } from '@/core/storage-adapter';

describe('LocalStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads data with prefix', async () => {
    const adapter = new LocalStorageAdapter('test-');
    await adapter.save('key1', { data: 'hello' });
    const result = await adapter.load('key1');
    expect(result).toEqual({ data: 'hello' });
  });

  it('returns null for non-existent key', async () => {
    const adapter = new LocalStorageAdapter();
    const result = await adapter.load('nonexistent');
    expect(result).toBeNull();
  });

  it('deletes data', async () => {
    const adapter = new LocalStorageAdapter('test-');
    await adapter.save('key1', 'value');
    await adapter.delete('key1');
    const result = await adapter.load('key1');
    expect(result).toBeNull();
  });

  it('uses configurable prefix', async () => {
    const adapter = new LocalStorageAdapter('custom-');
    await adapter.save('key1', 'val');
    expect(localStorage.getItem('custom-key1')).toBe('"val"');
  });
});

describe('DrawingPersistence', () => {
  function makeMockAdapter(): IStorageAdapter {
    return {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('saves drawings for a symbol', async () => {
    const adapter = makeMockAdapter();
    const persistence = new DrawingPersistence(adapter, 0); // no debounce for test
    const drawings = [{ type: 'trendline', points: [] }];

    persistence.saveDrawings('AAPL', drawings);

    // Wait for debounce (0ms)
    await new Promise((r) => setTimeout(r, 10));
    expect(adapter.save).toHaveBeenCalledWith('drawings:AAPL', drawings);
  });

  it('loads drawings for a symbol', async () => {
    const adapter = makeMockAdapter();
    (adapter.load as ReturnType<typeof vi.fn>).mockResolvedValue([{ type: 'line' }]);
    const persistence = new DrawingPersistence(adapter);

    const result = await persistence.loadDrawings('AAPL');
    expect(result).toEqual([{ type: 'line' }]);
    expect(adapter.load).toHaveBeenCalledWith('drawings:AAPL');
  });

  it('deletes drawings for a symbol', async () => {
    const adapter = makeMockAdapter();
    const persistence = new DrawingPersistence(adapter);

    await persistence.deleteDrawings('AAPL');
    expect(adapter.delete).toHaveBeenCalledWith('drawings:AAPL');
  });

  it('debounces saves', async () => {
    const adapter = makeMockAdapter();
    const persistence = new DrawingPersistence(adapter, 50);

    persistence.saveDrawings('AAPL', { v: 1 });
    persistence.saveDrawings('AAPL', { v: 2 });
    persistence.saveDrawings('AAPL', { v: 3 });

    // Only the last save should be executed after debounce
    await new Promise((r) => setTimeout(r, 100));
    expect(adapter.save).toHaveBeenCalledTimes(1);
    expect(adapter.save).toHaveBeenCalledWith('drawings:AAPL', { v: 3 });
  });

  it('flush cancels pending debounce', () => {
    const adapter = makeMockAdapter();
    const persistence = new DrawingPersistence(adapter, 1000);

    persistence.saveDrawings('AAPL', { v: 1 });
    persistence.flush();

    // Save should not have been called (flushed before debounce fired)
    expect(adapter.save).not.toHaveBeenCalled();
  });
});
