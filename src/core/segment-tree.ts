/**
 * SegmentTree for O(log n) range min/max queries on Float64Array data.
 *
 * Supports incremental updates: when new data is appended, only the
 * affected tree nodes are rebuilt — no full reconstruction needed.
 */
export class MinMaxSegmentTree {
  private _minTree: Float64Array;
  private _maxTree: Float64Array;
  private _size: number; // number of leaves (rounded up to power of 2)
  private _n: number; // actual data length

  constructor(capacity: number) {
    this._size = nextPow2(Math.max(capacity, 1));
    this._minTree = new Float64Array(this._size * 2).fill(Infinity);
    this._maxTree = new Float64Array(this._size * 2).fill(-Infinity);
    this._n = 0;
  }

  get length(): number {
    return this._n;
  }

  /**
   * Build the tree from the given high/low arrays.
   * O(n) time.
   */
  build(high: Float64Array, low: Float64Array, length: number): void {
    this._n = length;

    // Ensure capacity
    if (length > this._size) {
      this._size = nextPow2(length);
      this._minTree = new Float64Array(this._size * 2).fill(Infinity);
      this._maxTree = new Float64Array(this._size * 2).fill(-Infinity);
    }

    // Fill leaves
    const offset = this._size;
    for (let i = 0; i < length; i++) {
      this._minTree[offset + i] = low[i];
      this._maxTree[offset + i] = high[i];
    }
    // Clear remaining leaves
    for (let i = length; i < this._size; i++) {
      this._minTree[offset + i] = Infinity;
      this._maxTree[offset + i] = -Infinity;
    }

    // Build internal nodes bottom-up
    for (let i = offset - 1; i >= 1; i--) {
      this._minTree[i] = Math.min(this._minTree[2 * i], this._minTree[2 * i + 1]);
      this._maxTree[i] = Math.max(this._maxTree[2 * i], this._maxTree[2 * i + 1]);
    }
  }

  /**
   * Update a single index (e.g., when the last bar is modified).
   * O(log n) time.
   */
  update(index: number, high: number, low: number): void {
    let pos = this._size + index;
    this._minTree[pos] = low;
    this._maxTree[pos] = high;
    pos >>= 1;
    while (pos >= 1) {
      this._minTree[pos] = Math.min(this._minTree[2 * pos], this._minTree[2 * pos + 1]);
      this._maxTree[pos] = Math.max(this._maxTree[2 * pos], this._maxTree[2 * pos + 1]);
      pos >>= 1;
    }
  }

  /**
   * Append a new value (for streaming data).
   * O(log n) time.
   */
  append(high: number, low: number): void {
    if (this._n >= this._size) {
      this._grow();
    }
    this._minTree[this._size + this._n] = low;
    this._maxTree[this._size + this._n] = high;
    this._n++;

    // Update ancestors
    let pos = (this._size + this._n - 1) >> 1;
    while (pos >= 1) {
      this._minTree[pos] = Math.min(this._minTree[2 * pos], this._minTree[2 * pos + 1]);
      this._maxTree[pos] = Math.max(this._maxTree[2 * pos], this._maxTree[2 * pos + 1]);
      pos >>= 1;
    }
  }

  /**
   * Query the min low and max high in the range [from, to] (inclusive).
   * O(log n) time.
   */
  query(from: number, to: number): { min: number; max: number } {
    if (from > to || from >= this._n || to < 0) {
      return { min: Infinity, max: -Infinity };
    }
    from = Math.max(0, from);
    to = Math.min(this._n - 1, to);

    let lo = from + this._size;
    let hi = to + this._size;
    let minVal = Infinity;
    let maxVal = -Infinity;

    while (lo <= hi) {
      if (lo & 1) {
        minVal = Math.min(minVal, this._minTree[lo]);
        maxVal = Math.max(maxVal, this._maxTree[lo]);
        lo++;
      }
      if (!(hi & 1)) {
        minVal = Math.min(minVal, this._minTree[hi]);
        maxVal = Math.max(maxVal, this._maxTree[hi]);
        hi--;
      }
      lo >>= 1;
      hi >>= 1;
    }

    return { min: minVal, max: maxVal };
  }

  private _grow(): void {
    const newSize = this._size * 2;
    const newMin = new Float64Array(newSize * 2).fill(Infinity);
    const newMax = new Float64Array(newSize * 2).fill(-Infinity);

    // Copy leaves
    for (let i = 0; i < this._n; i++) {
      newMin[newSize + i] = this._minTree[this._size + i];
      newMax[newSize + i] = this._maxTree[this._size + i];
    }

    this._size = newSize;
    this._minTree = newMin;
    this._maxTree = newMax;

    // Rebuild internal nodes
    for (let i = newSize - 1; i >= 1; i--) {
      this._minTree[i] = Math.min(this._minTree[2 * i], this._minTree[2 * i + 1]);
      this._maxTree[i] = Math.max(this._maxTree[2 * i], this._maxTree[2 * i + 1]);
    }
  }
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
