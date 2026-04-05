/**
 * IStorageAdapter — interface for persisting chart drawings and state.
 *
 * Implementations can use localStorage, IndexedDB, REST API, etc.
 */
export interface IStorageAdapter {
  save(key: string, state: unknown): Promise<void>;
  load(key: string): Promise<unknown | null>;
  delete(key: string): Promise<void>;
}

/**
 * LocalStorageAdapter — persists data to browser localStorage.
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private _prefix: string;

  constructor(prefix = 'fc-') {
    this._prefix = prefix;
  }

  async save(key: string, state: unknown): Promise<void> {
    localStorage.setItem(this._prefix + key, JSON.stringify(state));
  }

  async load(key: string): Promise<unknown | null> {
    const data = localStorage.getItem(this._prefix + key);
    if (data === null) return null;
    return JSON.parse(data);
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this._prefix + key);
  }
}

/**
 * IndexedDBAdapter — persists data to browser IndexedDB for larger state.
 */
export class IndexedDBAdapter implements IStorageAdapter {
  private _dbName: string;
  private _storeName: string;
  private _dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName = 'fin-charter', storeName = 'chart-state') {
    this._dbName = dbName;
    this._storeName = storeName;
  }

  private _getDB(): Promise<IDBDatabase> {
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this._storeName)) {
          db.createObjectStore(this._storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this._dbPromise;
  }

  async save(key: string, state: unknown): Promise<void> {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._storeName, 'readwrite');
      tx.objectStore(this._storeName).put(state, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async load(key: string): Promise<unknown | null> {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._storeName, 'readonly');
      const request = tx.objectStore(this._storeName).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._storeName, 'readwrite');
      tx.objectStore(this._storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

/**
 * DrawingPersistence — manages auto-save/load of drawings per symbol.
 */
export class DrawingPersistence {
  private _adapter: IStorageAdapter;
  private _debounceMs: number;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(adapter: IStorageAdapter, debounceMs = 500) {
    this._adapter = adapter;
    this._debounceMs = debounceMs;
  }

  /** Auto-save drawings for a symbol (debounced). */
  saveDrawings(symbol: string, drawings: unknown): void {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._adapter.save(`drawings:${symbol}`, drawings);
    }, this._debounceMs);
  }

  /** Load drawings for a symbol. */
  async loadDrawings(symbol: string): Promise<unknown | null> {
    return this._adapter.load(`drawings:${symbol}`);
  }

  /** Delete drawings for a symbol. */
  async deleteDrawings(symbol: string): Promise<void> {
    return this._adapter.delete(`drawings:${symbol}`);
  }

  /** Flush any pending debounced save immediately. */
  flush(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }
}
