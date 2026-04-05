import type { Bar } from './types';

/**
 * IStreamingAdapter — interface for real-time bar data streaming.
 *
 * Implementations connect to WebSocket, polling, or SSE endpoints
 * and push bar updates to the chart via callbacks.
 */
export interface IStreamingAdapter {
  /** Connect to the data source. */
  connect(): void;
  /** Disconnect and clean up. */
  disconnect(): void;
  /** Subscribe to real-time bar updates for a symbol/resolution. */
  subscribeBars(
    symbol: string,
    resolution: string,
    onBar: (bar: Bar) => void,
  ): void;
  /** Unsubscribe from bar updates. */
  unsubscribeBars(symbol: string, resolution: string): void;
}

// ─── WebSocket Adapter ──────────────────────────────────────────────────────

export interface WebSocketAdapterOptions {
  /** WebSocket URL (e.g., 'wss://stream.example.com/bars'). */
  url: string;
  /** Auto-reconnect on disconnect (default: true). */
  reconnect?: boolean;
  /** Max reconnect attempts (default: 10, 0 = unlimited). */
  maxReconnectAttempts?: number;
  /** Initial reconnect delay in ms (default: 1000). Doubles each attempt. */
  reconnectDelay?: number;
  /** Max reconnect delay in ms (default: 30000). */
  maxReconnectDelay?: number;
  /**
   * Parse an incoming WebSocket message into a Bar.
   * Return null to skip the message.
   */
  parseMessage?: (data: unknown) => { symbol: string; resolution: string; bar: Bar } | null;
}

type BarCallback = (bar: Bar) => void;

/**
 * WebSocketAdapter — streams bar data over a WebSocket connection
 * with automatic reconnection and exponential backoff.
 */
export class WebSocketAdapter implements IStreamingAdapter {
  private _options: Required<WebSocketAdapterOptions>;
  private _ws: WebSocket | null = null;
  private _subscriptions: Map<string, BarCallback> = new Map();
  private _reconnectAttempts = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;
  private _intentionalClose = false;

  constructor(options: WebSocketAdapterOptions) {
    this._options = {
      url: options.url,
      reconnect: options.reconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      reconnectDelay: options.reconnectDelay ?? 1000,
      maxReconnectDelay: options.maxReconnectDelay ?? 30000,
      parseMessage: options.parseMessage ?? defaultParseMessage,
    };
  }

  get connected(): boolean {
    return this._connected;
  }

  get reconnectAttempts(): number {
    return this._reconnectAttempts;
  }

  connect(): void {
    this._intentionalClose = false;
    this._createConnection();
  }

  disconnect(): void {
    this._intentionalClose = true;
    this._clearReconnectTimer();
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
  }

  subscribeBars(symbol: string, resolution: string, onBar: BarCallback): void {
    const key = `${symbol}:${resolution}`;
    this._subscriptions.set(key, onBar);
  }

  unsubscribeBars(symbol: string, resolution: string): void {
    const key = `${symbol}:${resolution}`;
    this._subscriptions.delete(key);
  }

  private _createConnection(): void {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }

    const ws = new WebSocket(this._options.url);

    ws.onopen = () => {
      this._connected = true;
      this._reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      let data: unknown;
      try {
        data = JSON.parse(event.data as string);
      } catch {
        return;
      }

      const parsed = this._options.parseMessage(data);
      if (!parsed) return;

      const key = `${parsed.symbol}:${parsed.resolution}`;
      const callback = this._subscriptions.get(key);
      if (callback) callback(parsed.bar);
    };

    ws.onclose = () => {
      this._connected = false;
      this._ws = null;
      if (!this._intentionalClose && this._options.reconnect) {
        this._scheduleReconnect();
      }
    };

    ws.onerror = () => {
      // Error is followed by close event; reconnection handled there.
    };

    this._ws = ws;
  }

  private _scheduleReconnect(): void {
    const { maxReconnectAttempts, reconnectDelay, maxReconnectDelay } = this._options;
    if (maxReconnectAttempts > 0 && this._reconnectAttempts >= maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(
      reconnectDelay * Math.pow(2, this._reconnectAttempts),
      maxReconnectDelay,
    );
    this._reconnectAttempts++;

    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._createConnection();
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }
}

// ─── Polling Adapter ────────────────────────────────────────────────────────

export interface PollingAdapterOptions {
  /** Fetch function that returns the latest bar for a symbol/resolution. */
  fetchBar: (symbol: string, resolution: string) => Promise<Bar | null>;
  /** Polling interval in ms (default: 5000). */
  interval?: number;
}

/**
 * PollingAdapter — polls a REST endpoint at regular intervals
 * for the latest bar data.
 */
export class PollingAdapter implements IStreamingAdapter {
  private _options: PollingAdapterOptions;
  private _interval: number;
  private _timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private _subscriptions: Map<string, BarCallback> = new Map();

  constructor(options: PollingAdapterOptions) {
    this._options = options;
    this._interval = options.interval ?? 5000;
  }

  connect(): void {
    // Polling starts per-subscription, nothing to do globally.
  }

  disconnect(): void {
    for (const timer of this._timers.values()) {
      clearInterval(timer);
    }
    this._timers.clear();
    this._subscriptions.clear();
  }

  subscribeBars(symbol: string, resolution: string, onBar: BarCallback): void {
    const key = `${symbol}:${resolution}`;
    this._subscriptions.set(key, onBar);

    const timer = setInterval(async () => {
      const bar = await this._options.fetchBar(symbol, resolution);
      const cb = this._subscriptions.get(key);
      if (bar && cb) cb(bar);
    }, this._interval);

    this._timers.set(key, timer);
  }

  unsubscribeBars(symbol: string, resolution: string): void {
    const key = `${symbol}:${resolution}`;
    const timer = this._timers.get(key);
    if (timer) {
      clearInterval(timer);
      this._timers.delete(key);
    }
    this._subscriptions.delete(key);
  }
}

// ─── Tick Buffer ────────────────────────────────────────────────────────────

/**
 * TickBuffer — collects incoming ticks and flushes them at 60fps
 * to avoid overwhelming the chart with per-tick repaints.
 */
export class TickBuffer {
  private _buffer: Map<string, Bar> = new Map();
  private _flushCallbacks: Map<string, BarCallback> = new Map();
  private _rafId: number | null = null;

  /** Register a flush callback for a symbol:resolution key. */
  register(key: string, onFlush: BarCallback): void {
    this._flushCallbacks.set(key, onFlush);
    if (this._rafId === null) this._startLoop();
  }

  /** Unregister and stop flushing for a key. */
  unregister(key: string): void {
    this._flushCallbacks.delete(key);
    this._buffer.delete(key);
    if (this._flushCallbacks.size === 0) this._stopLoop();
  }

  /** Push a tick into the buffer (latest tick wins per key). */
  push(key: string, bar: Bar): void {
    this._buffer.set(key, bar);
  }

  private _startLoop(): void {
    const flush = () => {
      for (const [key, bar] of this._buffer) {
        const cb = this._flushCallbacks.get(key);
        if (cb) cb(bar);
      }
      this._buffer.clear();
      this._rafId = requestAnimationFrame(flush);
    };
    this._rafId = requestAnimationFrame(flush);
  }

  private _stopLoop(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._buffer.clear();
  }
}

// ─── Default message parser ─────────────────────────────────────────────────

function defaultParseMessage(
  data: unknown,
): { symbol: string; resolution: string; bar: Bar } | null {
  if (typeof data !== 'object' || data === null) return null;
  const msg = data as Record<string, unknown>;
  if (typeof msg.symbol !== 'string' || typeof msg.resolution !== 'string') return null;
  const bar = msg.bar ?? msg;
  if (typeof (bar as Record<string, unknown>).time !== 'number') return null;
  const b = bar as Record<string, number>;
  return {
    symbol: msg.symbol as string,
    resolution: msg.resolution as string,
    bar: {
      time: b.time,
      open: b.open ?? 0,
      high: b.high ?? 0,
      low: b.low ?? 0,
      close: b.close ?? 0,
      volume: b.volume ?? 0,
    },
  };
}
