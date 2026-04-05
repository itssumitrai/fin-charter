// ─── Order Lines & Position Lines ───────────────────────────────────────────

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'stop' | 'market';

export type OrderModifiedCallback = (order: OrderLine) => void;
export type OrderCancelledCallback = (order: OrderLine) => void;

export interface OrderLineOptions {
  price: number;
  quantity: number;
  side: OrderSide;
  orderType: OrderType;
  color?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  title?: string;
  draggable?: boolean;
  axisLabelVisible?: boolean;
}

const DEFAULT_ORDER_LINE_OPTIONS: Required<
  Pick<OrderLineOptions, 'color' | 'lineWidth' | 'lineStyle' | 'title' | 'draggable' | 'axisLabelVisible'>
> = {
  color: '#2196F3',
  lineWidth: 1,
  lineStyle: 'dashed',
  title: '',
  draggable: true,
  axisLabelVisible: true,
};

let nextOrderId = 1;

/**
 * OrderLine represents a pending order on the chart (limit, stop, or market).
 * It extends the concept of PriceLine with trading-specific properties such as
 * quantity, side, order type, and drag-to-modify support.
 */
export class OrderLine {
  readonly id: string;
  private _price: number;
  private _quantity: number;
  private _side: OrderSide;
  private _orderType: OrderType;
  private _color: string;
  private _lineWidth: number;
  private _lineStyle: 'solid' | 'dashed' | 'dotted';
  private _title: string;
  private _draggable: boolean;
  private _axisLabelVisible: boolean;
  private _onModified: OrderModifiedCallback[] = [];
  private _onCancelled: OrderCancelledCallback[] = [];
  private _cancelled = false;

  constructor(options: OrderLineOptions) {
    this.id = `order-${nextOrderId++}`;
    this._price = options.price;
    this._quantity = options.quantity;
    this._side = options.side;
    this._orderType = options.orderType;
    this._color = options.color ?? DEFAULT_ORDER_LINE_OPTIONS.color;
    this._lineWidth = options.lineWidth ?? DEFAULT_ORDER_LINE_OPTIONS.lineWidth;
    this._lineStyle = options.lineStyle ?? DEFAULT_ORDER_LINE_OPTIONS.lineStyle;
    this._title = options.title ?? DEFAULT_ORDER_LINE_OPTIONS.title;
    this._draggable = options.draggable ?? DEFAULT_ORDER_LINE_OPTIONS.draggable;
    this._axisLabelVisible = options.axisLabelVisible ?? DEFAULT_ORDER_LINE_OPTIONS.axisLabelVisible;
  }

  get price(): number { return this._price; }
  get quantity(): number { return this._quantity; }
  get side(): OrderSide { return this._side; }
  get orderType(): OrderType { return this._orderType; }
  get color(): string { return this._color; }
  get lineWidth(): number { return this._lineWidth; }
  get lineStyle(): 'solid' | 'dashed' | 'dotted' { return this._lineStyle; }
  get title(): string { return this._title; }
  get draggable(): boolean { return this._draggable; }
  get axisLabelVisible(): boolean { return this._axisLabelVisible; }
  get isCancelled(): boolean { return this._cancelled; }

  /** Update the order price (e.g. after a drag). Fires onModified callbacks. */
  setPrice(price: number): void {
    if (this._cancelled) return;
    this._price = price;
    this._fireModified();
  }

  /** Update the order quantity. Fires onModified callbacks. */
  setQuantity(quantity: number): void {
    if (this._cancelled) return;
    this._quantity = quantity;
    this._fireModified();
  }

  /** Apply partial option updates. Fires onModified callbacks. */
  applyOptions(opts: Partial<OrderLineOptions>): void {
    if (this._cancelled) return;
    if (opts.price !== undefined) this._price = opts.price;
    if (opts.quantity !== undefined) this._quantity = opts.quantity;
    if (opts.side !== undefined) this._side = opts.side;
    if (opts.orderType !== undefined) this._orderType = opts.orderType;
    if (opts.color !== undefined) this._color = opts.color;
    if (opts.lineWidth !== undefined) this._lineWidth = opts.lineWidth;
    if (opts.lineStyle !== undefined) this._lineStyle = opts.lineStyle;
    if (opts.title !== undefined) this._title = opts.title;
    if (opts.draggable !== undefined) this._draggable = opts.draggable;
    if (opts.axisLabelVisible !== undefined) this._axisLabelVisible = opts.axisLabelVisible;
    this._fireModified();
  }

  /** Cancel this order. Fires onCancelled callbacks. */
  cancel(): void {
    if (this._cancelled) return;
    this._cancelled = true;
    for (const cb of this._onCancelled) cb(this);
  }

  onModified(callback: OrderModifiedCallback): void {
    this._onModified.push(callback);
  }

  offModified(callback: OrderModifiedCallback): void {
    const idx = this._onModified.indexOf(callback);
    if (idx >= 0) this._onModified.splice(idx, 1);
  }

  onCancelled(callback: OrderCancelledCallback): void {
    this._onCancelled.push(callback);
  }

  offCancelled(callback: OrderCancelledCallback): void {
    const idx = this._onCancelled.indexOf(callback);
    if (idx >= 0) this._onCancelled.splice(idx, 1);
  }

  /** Serialize to a plain object for persistence. */
  serialize(): {
    id: string;
    price: number;
    quantity: number;
    side: OrderSide;
    orderType: OrderType;
    color: string;
    lineStyle: string;
    title: string;
    draggable: boolean;
  } {
    return {
      id: this.id,
      price: this._price,
      quantity: this._quantity,
      side: this._side,
      orderType: this._orderType,
      color: this._color,
      lineStyle: this._lineStyle,
      title: this._title,
      draggable: this._draggable,
    };
  }

  private _fireModified(): void {
    for (const cb of this._onModified) cb(this);
  }
}

// ─── Position Line ──────────────────────────────────────────────────────────

export interface PositionLineOptions {
  entryPrice: number;
  quantity: number;
  side: OrderSide;
  color?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  title?: string;
  axisLabelVisible?: boolean;
}

let nextPositionId = 1;

/**
 * PositionLine represents an open trading position on the chart.
 * It shows the entry price, quantity, and calculates unrealized P&L
 * given a current market price.
 */
export class PositionLine {
  readonly id: string;
  private _entryPrice: number;
  private _quantity: number;
  private _side: OrderSide;
  private _color: string;
  private _lineWidth: number;
  private _lineStyle: 'solid' | 'dashed' | 'dotted';
  private _title: string;
  private _axisLabelVisible: boolean;

  constructor(options: PositionLineOptions) {
    this.id = `position-${nextPositionId++}`;
    this._entryPrice = options.entryPrice;
    this._quantity = options.quantity;
    this._side = options.side;
    this._color = options.color ?? (options.side === 'buy' ? '#26a69a' : '#ef5350');
    this._lineWidth = options.lineWidth ?? 1;
    this._lineStyle = options.lineStyle ?? 'solid';
    this._title = options.title ?? '';
    this._axisLabelVisible = options.axisLabelVisible ?? true;
  }

  get entryPrice(): number { return this._entryPrice; }
  get quantity(): number { return this._quantity; }
  get side(): OrderSide { return this._side; }
  get color(): string { return this._color; }
  get lineWidth(): number { return this._lineWidth; }
  get lineStyle(): 'solid' | 'dashed' | 'dotted' { return this._lineStyle; }
  get title(): string { return this._title; }
  get axisLabelVisible(): boolean { return this._axisLabelVisible; }

  /**
   * Calculate unrealized profit/loss given the current market price.
   * Positive means profit, negative means loss.
   */
  unrealizedPnL(currentPrice: number): number {
    const diff = currentPrice - this._entryPrice;
    return this._side === 'buy'
      ? diff * this._quantity
      : -diff * this._quantity;
  }

  /**
   * Calculate unrealized P&L as a percentage of the entry value.
   */
  unrealizedPnLPercent(currentPrice: number): number {
    if (this._entryPrice === 0) return 0;
    const pnl = this.unrealizedPnL(currentPrice);
    return (pnl / (this._entryPrice * this._quantity)) * 100;
  }

  /** Apply partial option updates. */
  applyOptions(opts: Partial<PositionLineOptions>): void {
    if (opts.entryPrice !== undefined) this._entryPrice = opts.entryPrice;
    if (opts.quantity !== undefined) this._quantity = opts.quantity;
    if (opts.side !== undefined) this._side = opts.side;
    if (opts.color !== undefined) this._color = opts.color;
    if (opts.lineWidth !== undefined) this._lineWidth = opts.lineWidth;
    if (opts.lineStyle !== undefined) this._lineStyle = opts.lineStyle;
    if (opts.title !== undefined) this._title = opts.title;
    if (opts.axisLabelVisible !== undefined) this._axisLabelVisible = opts.axisLabelVisible;
  }

  /** Serialize to a plain object for persistence. */
  serialize(): {
    id: string;
    entryPrice: number;
    quantity: number;
    side: OrderSide;
    color: string;
    lineStyle: string;
    title: string;
  } {
    return {
      id: this.id,
      entryPrice: this._entryPrice,
      quantity: this._quantity,
      side: this._side,
      color: this._color,
      lineStyle: this._lineStyle,
      title: this._title,
    };
  }
}
