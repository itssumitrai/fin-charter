import type { ColumnStore } from '../core/types';

export interface VolumeProfileBin {
  /** Price level at the center of this bin. */
  price: number;
  /** Price at bottom of bin. */
  low: number;
  /** Price at top of bin. */
  high: number;
  /** Total volume in this bin. */
  volume: number;
  /** Buy volume (close > open). */
  buyVolume: number;
  /** Sell volume (close < open). */
  sellVolume: number;
}

export interface VolumeProfileResult {
  bins: VolumeProfileBin[];
  /** Price level with highest volume (Point of Control). */
  poc: number;
  /** Value Area High — upper bound of the 70% volume area. */
  vah: number;
  /** Value Area Low — lower bound of the 70% volume area. */
  val: number;
  /** Total volume across all bins. */
  totalVolume: number;
}

export interface VolumeProfileOptions {
  /** Number of price bins (default: 24). */
  binCount?: number;
  /** Value area percentage (default: 0.7 = 70%). */
  valueAreaPercent?: number;
}

/**
 * Compute a volume profile (horizontal histogram of volume by price level)
 * for the given range of bars.
 */
export function computeVolumeProfile(
  store: ColumnStore,
  fromIdx: number,
  toIdx: number,
  options: VolumeProfileOptions = {},
): VolumeProfileResult {
  const binCount = options.binCount ?? 24;
  const valueAreaPercent = options.valueAreaPercent ?? 0.7;

  fromIdx = Math.max(0, fromIdx);
  toIdx = Math.min(store.length - 1, toIdx);

  if (fromIdx > toIdx || store.length === 0) {
    return { bins: [], poc: 0, vah: 0, val: 0, totalVolume: 0 };
  }

  // Find price range
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (let i = fromIdx; i <= toIdx; i++) {
    if (store.low[i] < minPrice) minPrice = store.low[i];
    if (store.high[i] > maxPrice) maxPrice = store.high[i];
  }

  if (minPrice === maxPrice) {
    const margin = Math.abs(minPrice) * 0.01 || 0.01;
    minPrice -= margin;
    maxPrice += margin;
  }

  const priceRange = maxPrice - minPrice;
  const binSize = priceRange / binCount;

  // Initialize bins
  const bins: VolumeProfileBin[] = [];
  for (let b = 0; b < binCount; b++) {
    const low = minPrice + b * binSize;
    const high = low + binSize;
    bins.push({
      price: (low + high) / 2,
      low,
      high,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
    });
  }

  // Distribute volume into bins
  let totalVolume = 0;
  for (let i = fromIdx; i <= toIdx; i++) {
    const vol = store.volume[i];
    const typicalPrice = (store.high[i] + store.low[i] + store.close[i]) / 3;
    const binIdx = Math.min(binCount - 1, Math.max(0,
      Math.floor((typicalPrice - minPrice) / binSize),
    ));
    bins[binIdx].volume += vol;
    if (store.close[i] >= store.open[i]) {
      bins[binIdx].buyVolume += vol;
    } else {
      bins[binIdx].sellVolume += vol;
    }
    totalVolume += vol;
  }

  // Find Point of Control (highest volume bin)
  let pocIdx = 0;
  for (let b = 1; b < binCount; b++) {
    if (bins[b].volume > bins[pocIdx].volume) pocIdx = b;
  }
  const poc = bins[pocIdx].price;

  // Compute Value Area (70% of total volume centered on POC)
  const targetVolume = totalVolume * valueAreaPercent;
  let vaVolume = bins[pocIdx].volume;
  let vaLow = pocIdx;
  let vaHigh = pocIdx;

  while (vaVolume < targetVolume && (vaLow > 0 || vaHigh < binCount - 1)) {
    const addLow = vaLow > 0 ? bins[vaLow - 1].volume : 0;
    const addHigh = vaHigh < binCount - 1 ? bins[vaHigh + 1].volume : 0;

    if (addLow >= addHigh && vaLow > 0) {
      vaLow--;
      vaVolume += bins[vaLow].volume;
    } else if (vaHigh < binCount - 1) {
      vaHigh++;
      vaVolume += bins[vaHigh].volume;
    } else {
      vaLow--;
      vaVolume += bins[vaLow].volume;
    }
  }

  return {
    bins,
    poc,
    vah: bins[vaHigh].high,
    val: bins[vaLow].low,
    totalVolume,
  };
}
