import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketAdapter, PollingAdapter, TickBuffer } from '@/core/streaming-adapter';
import type { Bar } from '@/core/types';

// ─── Mock WebSocket ─────────────────────────────────────────────────────────

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async open
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 0);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe('WebSocketAdapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('connects and sets connected state', async () => {
    const adapter = new WebSocketAdapter({ url: 'wss://test.com' });
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10);
    expect(adapter.connected).toBe(true);
  });

  it('dispatches parsed bar to subscriber', async () => {
    const adapter = new WebSocketAdapter({ url: 'wss://test.com' });
    const cb = vi.fn();
    adapter.subscribeBars('AAPL', 'D', cb);
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10);

    const ws = MockWebSocket.instances[0];
    ws.simulateMessage({
      symbol: 'AAPL',
      resolution: 'D',
      bar: { time: 1000, open: 100, high: 110, low: 90, close: 105, volume: 5000 },
    });

    expect(cb).toHaveBeenCalledWith(expect.objectContaining({
      time: 1000,
      open: 100,
      close: 105,
    }));
  });

  it('does not dispatch to unsubscribed symbols', async () => {
    const adapter = new WebSocketAdapter({ url: 'wss://test.com' });
    const cb = vi.fn();
    adapter.subscribeBars('AAPL', 'D', cb);
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10);

    const ws = MockWebSocket.instances[0];
    ws.simulateMessage({
      symbol: 'GOOG',
      resolution: 'D',
      bar: { time: 1000, open: 100, high: 110, low: 90, close: 105, volume: 5000 },
    });

    expect(cb).not.toHaveBeenCalled();
  });

  it('disconnects cleanly', async () => {
    const adapter = new WebSocketAdapter({ url: 'wss://test.com' });
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10);
    adapter.disconnect();
    expect(adapter.connected).toBe(false);
  });

  it('reconnects with exponential backoff', async () => {
    const adapter = new WebSocketAdapter({
      url: 'wss://test.com',
      reconnect: true,
      reconnectDelay: 100,
    });
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10);
    expect(MockWebSocket.instances.length).toBe(1);

    // Simulate connection loss
    MockWebSocket.instances[0].close();
    expect(adapter.connected).toBe(false);

    // First reconnect after 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(MockWebSocket.instances.length).toBe(2);
    expect(adapter.reconnectAttempts).toBe(1);
  });

  it('does not reconnect after intentional disconnect', async () => {
    const adapter = new WebSocketAdapter({
      url: 'wss://test.com',
      reconnect: true,
      reconnectDelay: 100,
    });
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10);
    adapter.disconnect();

    await vi.advanceTimersByTimeAsync(500);
    expect(MockWebSocket.instances.length).toBe(1); // no reconnect
  });

  it('tracks reconnect attempts', async () => {
    const adapter = new WebSocketAdapter({
      url: 'wss://test.com',
      reconnect: true,
      maxReconnectAttempts: 2,
      reconnectDelay: 50,
    });
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10); // let onopen fire
    expect(adapter.connected).toBe(true);
    expect(adapter.reconnectAttempts).toBe(0);

    // First disconnect triggers reconnect attempt 1
    MockWebSocket.instances[0].close();
    await vi.advanceTimersByTimeAsync(60);
    expect(adapter.reconnectAttempts).toBe(0); // resets on open
    expect(MockWebSocket.instances.length).toBe(2);
  });

  it('unsubscribeBars stops delivery', async () => {
    const adapter = new WebSocketAdapter({ url: 'wss://test.com' });
    const cb = vi.fn();
    adapter.subscribeBars('AAPL', 'D', cb);
    adapter.connect();
    await vi.advanceTimersByTimeAsync(10);

    adapter.unsubscribeBars('AAPL', 'D');

    const ws = MockWebSocket.instances[0];
    ws.simulateMessage({
      symbol: 'AAPL',
      resolution: 'D',
      bar: { time: 1000, open: 100, high: 110, low: 90, close: 105, volume: 5000 },
    });
    expect(cb).not.toHaveBeenCalled();
  });
});

// ─── PollingAdapter ─────────────────────────────────────────────────────────

describe('PollingAdapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls at the configured interval', async () => {
    const fetchBar = vi.fn().mockResolvedValue({
      time: 1000, open: 100, high: 110, low: 90, close: 105, volume: 1000,
    });
    const adapter = new PollingAdapter({ fetchBar, interval: 200 });
    const cb = vi.fn();
    adapter.subscribeBars('AAPL', 'D', cb);

    await vi.advanceTimersByTimeAsync(200);
    expect(fetchBar).toHaveBeenCalledWith('AAPL', 'D');
    expect(cb).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(fetchBar).toHaveBeenCalledTimes(2);
  });

  it('stops polling on unsubscribe', async () => {
    const fetchBar = vi.fn().mockResolvedValue(null);
    const adapter = new PollingAdapter({ fetchBar, interval: 100 });
    adapter.subscribeBars('AAPL', 'D', vi.fn());
    adapter.unsubscribeBars('AAPL', 'D');

    await vi.advanceTimersByTimeAsync(300);
    expect(fetchBar).not.toHaveBeenCalled();
  });

  it('disconnect stops all polling', async () => {
    const fetchBar = vi.fn().mockResolvedValue(null);
    const adapter = new PollingAdapter({ fetchBar, interval: 100 });
    adapter.subscribeBars('AAPL', 'D', vi.fn());
    adapter.subscribeBars('GOOG', 'D', vi.fn());
    adapter.disconnect();

    await vi.advanceTimersByTimeAsync(300);
    expect(fetchBar).not.toHaveBeenCalled();
  });
});

// ─── TickBuffer ─────────────────────────────────────────────────────────────

describe('TickBuffer', () => {
  it('buffers ticks and flushes via rAF', async () => {
    const buffer = new TickBuffer();
    const cb = vi.fn();
    buffer.register('AAPL:D', cb);

    const bar: Bar = { time: 1000, open: 100, high: 110, low: 90, close: 105, volume: 1000 };
    buffer.push('AAPL:D', bar);

    // Simulate rAF
    await new Promise((r) => requestAnimationFrame(r));

    expect(cb).toHaveBeenCalledWith(bar);
    buffer.unregister('AAPL:D');
  });

  it('only flushes latest tick per key', async () => {
    const buffer = new TickBuffer();
    const cb = vi.fn();
    buffer.register('AAPL:D', cb);

    buffer.push('AAPL:D', { time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 });
    buffer.push('AAPL:D', { time: 2, open: 2, high: 2, low: 2, close: 2, volume: 2 });

    await new Promise((r) => requestAnimationFrame(r));

    // Only the latest bar (time=2) should be flushed
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ time: 2 }));
    buffer.unregister('AAPL:D');
  });
});
