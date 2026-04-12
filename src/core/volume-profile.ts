import type { ColumnStore } from './types';

export interface VolumeProfileBin {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
}

export interface VolumeProfileResult {
  bins: VolumeProfileBin[];
  poc: number; // Point of Control (price with highest volume)
  valueAreaHigh: number;
  valueAreaLow: number;
}

/**
 * Compute volume profile from OHLCV data.
 * Distributes each bar's volume across price levels.
 */
export function computeVolumeProfile(
  store: ColumnStore,
  fromIdx: number,
  toIdx: number,
  binCount: number = 50,
): VolumeProfileResult {
  const to = Math.min(toIdx, store.length - 1);

  let minPrice = Infinity, maxPrice = -Infinity;
  for (let i = fromIdx; i <= to; i++) {
    if (store.low[i] < minPrice) minPrice = store.low[i];
    if (store.high[i] > maxPrice) maxPrice = store.high[i];
  }

  if (minPrice === maxPrice) { minPrice -= 1; maxPrice += 1; }
  const binSize = (maxPrice - minPrice) / binCount;

  const bins: VolumeProfileBin[] = [];
  for (let b = 0; b < binCount; b++) {
    bins.push({
      price: minPrice + (b + 0.5) * binSize,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
    });
  }

  // Distribute volume across bins
  for (let i = fromIdx; i <= to; i++) {
    const vol = store.volume[i];
    const isUp = store.close[i] >= store.open[i];
    const low = store.low[i];
    const high = store.high[i];
    const barRange = high - low || 1;

    for (let b = 0; b < binCount; b++) {
      const binLow = minPrice + b * binSize;
      const binHigh = binLow + binSize;

      // Overlap between bar range and bin range
      const overlapLow = Math.max(low, binLow);
      const overlapHigh = Math.min(high, binHigh);
      if (overlapLow >= overlapHigh) continue;

      const fraction = (overlapHigh - overlapLow) / barRange;
      const binVol = vol * fraction;
      bins[b].volume += binVol;
      if (isUp) bins[b].buyVolume += binVol;
      else bins[b].sellVolume += binVol;
    }
  }

  // Find POC
  let maxVol = 0, pocIdx = 0;
  for (let b = 0; b < binCount; b++) {
    if (bins[b].volume > maxVol) { maxVol = bins[b].volume; pocIdx = b; }
  }

  // Value Area (70% of volume around POC)
  const totalVol = bins.reduce((s, b) => s + b.volume, 0);
  const targetVol = totalVol * 0.7;
  let vaLow = pocIdx, vaHigh = pocIdx, vaVol = bins[pocIdx].volume;
  while (vaVol < targetVol && (vaLow > 0 || vaHigh < binCount - 1)) {
    const addLow = vaLow > 0 ? bins[vaLow - 1].volume : 0;
    const addHigh = vaHigh < binCount - 1 ? bins[vaHigh + 1].volume : 0;
    if (addLow >= addHigh && vaLow > 0) { vaLow--; vaVol += addLow; }
    else if (vaHigh < binCount - 1) { vaHigh++; vaVol += addHigh; }
    else break;
  }

  return {
    bins,
    poc: bins[pocIdx].price,
    valueAreaHigh: bins[vaHigh].price + binSize / 2,
    valueAreaLow: bins[vaLow].price - binSize / 2,
  };
}
