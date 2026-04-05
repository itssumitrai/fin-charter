import { describe, it, expect, vi } from 'vitest';
import { OrderLine, PositionLine } from '@/core/order-line';
import type { OrderLineOptions, PositionLineOptions } from '@/core/order-line';

// ─── OrderLine ──────────────────────────────────────────────────────────────

describe('OrderLine', () => {
  function makeOrder(overrides: Partial<OrderLineOptions> = {}): OrderLine {
    return new OrderLine({
      price: 150,
      quantity: 100,
      side: 'buy',
      orderType: 'limit',
      ...overrides,
    });
  }

  it('creates with correct properties', () => {
    const order = makeOrder();
    expect(order.price).toBe(150);
    expect(order.quantity).toBe(100);
    expect(order.side).toBe('buy');
    expect(order.orderType).toBe('limit');
    expect(order.draggable).toBe(true);
    expect(order.isCancelled).toBe(false);
    expect(order.id).toMatch(/^order-/);
  });

  it('applies default options', () => {
    const order = makeOrder();
    expect(order.color).toBe('#2196F3');
    expect(order.lineWidth).toBe(1);
    expect(order.lineStyle).toBe('dashed');
    expect(order.title).toBe('');
    expect(order.axisLabelVisible).toBe(true);
  });

  it('accepts custom options', () => {
    const order = makeOrder({
      color: '#ff0000',
      lineWidth: 2,
      lineStyle: 'solid',
      title: 'Buy AAPL',
      draggable: false,
    });
    expect(order.color).toBe('#ff0000');
    expect(order.lineWidth).toBe(2);
    expect(order.lineStyle).toBe('solid');
    expect(order.title).toBe('Buy AAPL');
    expect(order.draggable).toBe(false);
  });

  it('setPrice updates price and fires onModified', () => {
    const order = makeOrder();
    const cb = vi.fn();
    order.onModified(cb);
    order.setPrice(160);
    expect(order.price).toBe(160);
    expect(cb).toHaveBeenCalledWith(order);
  });

  it('setQuantity updates quantity and fires onModified', () => {
    const order = makeOrder();
    const cb = vi.fn();
    order.onModified(cb);
    order.setQuantity(200);
    expect(order.quantity).toBe(200);
    expect(cb).toHaveBeenCalledWith(order);
  });

  it('applyOptions merges partial options', () => {
    const order = makeOrder();
    order.applyOptions({ price: 155, title: 'Updated' });
    expect(order.price).toBe(155);
    expect(order.title).toBe('Updated');
    expect(order.quantity).toBe(100); // unchanged
  });

  it('cancel sets cancelled state and fires callbacks', () => {
    const order = makeOrder();
    const cb = vi.fn();
    order.onCancelled(cb);
    order.cancel();
    expect(order.isCancelled).toBe(true);
    expect(cb).toHaveBeenCalledWith(order);
  });

  it('cancel is idempotent', () => {
    const order = makeOrder();
    const cb = vi.fn();
    order.onCancelled(cb);
    order.cancel();
    order.cancel();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('ignores modifications after cancel', () => {
    const order = makeOrder();
    const modCb = vi.fn();
    order.onModified(modCb);
    order.cancel();
    order.setPrice(999);
    expect(order.price).toBe(150); // unchanged
    expect(modCb).not.toHaveBeenCalled();
  });

  it('offModified removes callback', () => {
    const order = makeOrder();
    const cb = vi.fn();
    order.onModified(cb);
    order.offModified(cb);
    order.setPrice(160);
    expect(cb).not.toHaveBeenCalled();
  });

  it('offCancelled removes callback', () => {
    const order = makeOrder();
    const cb = vi.fn();
    order.onCancelled(cb);
    order.offCancelled(cb);
    order.cancel();
    expect(cb).not.toHaveBeenCalled();
  });

  it('generates unique IDs', () => {
    const a = makeOrder();
    const b = makeOrder();
    expect(a.id).not.toBe(b.id);
  });

  it('serializes to plain object', () => {
    const order = makeOrder({ title: 'Test' });
    const data = order.serialize();
    expect(data.id).toBe(order.id);
    expect(data.price).toBe(150);
    expect(data.quantity).toBe(100);
    expect(data.side).toBe('buy');
    expect(data.orderType).toBe('limit');
    expect(data.title).toBe('Test');
  });
});

// ─── PositionLine ───────────────────────────────────────────────────────────

describe('PositionLine', () => {
  function makePosition(overrides: Partial<PositionLineOptions> = {}): PositionLine {
    return new PositionLine({
      entryPrice: 100,
      quantity: 10,
      side: 'buy',
      ...overrides,
    });
  }

  it('creates with correct properties', () => {
    const pos = makePosition();
    expect(pos.entryPrice).toBe(100);
    expect(pos.quantity).toBe(10);
    expect(pos.side).toBe('buy');
    expect(pos.id).toMatch(/^position-/);
  });

  it('defaults color based on side', () => {
    const buyPos = makePosition({ side: 'buy' });
    expect(buyPos.color).toBe('#26a69a');
    const sellPos = makePosition({ side: 'sell' });
    expect(sellPos.color).toBe('#ef5350');
  });

  it('calculates unrealized P&L for long position', () => {
    const pos = makePosition({ entryPrice: 100, quantity: 10, side: 'buy' });
    expect(pos.unrealizedPnL(110)).toBe(100); // +$10 * 10 shares
    expect(pos.unrealizedPnL(90)).toBe(-100); // -$10 * 10 shares
    expect(pos.unrealizedPnL(100)).toBe(0);
  });

  it('calculates unrealized P&L for short position', () => {
    const pos = makePosition({ entryPrice: 100, quantity: 10, side: 'sell' });
    expect(pos.unrealizedPnL(90)).toBe(100);  // profit when price drops
    expect(pos.unrealizedPnL(110)).toBe(-100); // loss when price rises
    expect(pos.unrealizedPnL(100)).toBe(0); // zero at entry price
  });

  it('calculates unrealized P&L percentage', () => {
    const pos = makePosition({ entryPrice: 100, quantity: 10, side: 'buy' });
    expect(pos.unrealizedPnLPercent(110)).toBe(10); // 10%
    expect(pos.unrealizedPnLPercent(90)).toBe(-10); // -10%
  });

  it('handles zero entry price in P&L percentage', () => {
    const pos = makePosition({ entryPrice: 0, quantity: 10, side: 'buy' });
    expect(pos.unrealizedPnLPercent(110)).toBe(0);
  });

  it('applyOptions updates properties', () => {
    const pos = makePosition();
    pos.applyOptions({ entryPrice: 105, title: 'AAPL Long' });
    expect(pos.entryPrice).toBe(105);
    expect(pos.title).toBe('AAPL Long');
    expect(pos.quantity).toBe(10); // unchanged
  });

  it('serializes to plain object', () => {
    const pos = makePosition({ title: 'My Position' });
    const data = pos.serialize();
    expect(data.id).toBe(pos.id);
    expect(data.entryPrice).toBe(100);
    expect(data.quantity).toBe(10);
    expect(data.side).toBe('buy');
    expect(data.title).toBe('My Position');
  });

  it('generates unique IDs', () => {
    const a = makePosition();
    const b = makePosition();
    expect(a.id).not.toBe(b.id);
  });
});
