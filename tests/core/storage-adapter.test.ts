import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageAdapter, IndexedDBAdapter, DrawingPersistence } from '@/core/storage-adapter';
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

describe('IndexedDBAdapter', () => {
  function makeIDBMock() {
    const store: Record<string, unknown> = {};

    const objectStoreMock = {
      put: vi.fn((value: unknown, key: string) => {
        store[key] = value;
        const req = { result: undefined, onsuccess: null as ((e: Event) => void) | null, onerror: null };
        setTimeout(() => { if (req.onsuccess) req.onsuccess({} as Event); }, 0);
        return req;
      }),
      get: vi.fn((key: string) => {
        const req = { result: store[key] ?? null, onsuccess: null as ((e: Event) => void) | null, onerror: null };
        setTimeout(() => { if (req.onsuccess) req.onsuccess({} as Event); }, 0);
        return req;
      }),
      delete: vi.fn((key: string) => {
        delete store[key];
        const req = { result: undefined, onsuccess: null as ((e: Event) => void) | null, onerror: null };
        setTimeout(() => { if (req.onsuccess) req.onsuccess({} as Event); }, 0);
        return req;
      }),
    };

    const txMock = {
      objectStore: vi.fn(() => objectStoreMock),
      oncomplete: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };

    const dbMock = {
      objectStoreNames: { contains: () => true },
      createObjectStore: vi.fn(),
      transaction: vi.fn((_name: string, _mode: string) => {
        setTimeout(() => { if (txMock.oncomplete) txMock.oncomplete(); }, 0);
        return txMock;
      }),
    };

    const openRequest = {
      result: dbMock,
      onupgradeneeded: null as ((e: Event) => void) | null,
      onsuccess: null as ((e: Event) => void) | null,
      onerror: null as ((e: Event) => void) | null,
    };
    setTimeout(() => { if (openRequest.onsuccess) openRequest.onsuccess({} as Event); }, 0);

    const idbMock = { open: vi.fn(() => openRequest) };
    Object.defineProperty(globalThis, 'indexedDB', {
      value: idbMock,
      writable: true,
      configurable: true,
    });

    return { store, dbMock, txMock, objectStoreMock, openRequest, idbMock };
  }

  it('constructs with default dbName and storeName', () => {
    const adapter = new IndexedDBAdapter();
    expect(adapter).toBeInstanceOf(IndexedDBAdapter);
  });

  it('constructs with custom dbName and storeName', () => {
    const adapter = new IndexedDBAdapter('my-db', 'my-store');
    expect(adapter).toBeInstanceOf(IndexedDBAdapter);
  });

  it('save calls indexedDB transaction and stores value', async () => {
    const { objectStoreMock } = makeIDBMock();
    const adapter = new IndexedDBAdapter();
    await adapter.save('testKey', { x: 1 });
    expect(objectStoreMock.put).toHaveBeenCalledWith({ x: 1 }, 'testKey');
  });

  it('load retrieves the stored value', async () => {
    const { store } = makeIDBMock();
    store['loadKey'] = { y: 2 };
    const adapter = new IndexedDBAdapter();
    const result = await adapter.load('loadKey');
    expect(result).toEqual({ y: 2 });
  });

  it('load returns null for missing key', async () => {
    makeIDBMock();
    const adapter = new IndexedDBAdapter();
    const result = await adapter.load('nonexistent');
    expect(result).toBeNull();
  });

  it('delete removes the key', async () => {
    const { objectStoreMock } = makeIDBMock();
    const adapter = new IndexedDBAdapter();
    await adapter.delete('delKey');
    expect(objectStoreMock.delete).toHaveBeenCalledWith('delKey');
  });

  it('reuses the same DB promise on second call', async () => {
    const { idbMock } = makeIDBMock();
    const adapter = new IndexedDBAdapter();
    await adapter.save('k1', 'v1');
    await adapter.save('k2', 'v2');
    // open should only be called once (DB promise cached)
    expect(idbMock.open).toHaveBeenCalledTimes(1);
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
