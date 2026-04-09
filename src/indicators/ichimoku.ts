import { slidingMax, slidingMin } from './utils';

export interface IchimokuResult {
  tenkan: Float64Array;
  kijun: Float64Array;
  senkouA: Float64Array;
  senkouB: Float64Array;
  chikou: Float64Array;
}

export function computeIchimoku(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouPeriod = 52,
): IchimokuResult {
  const highMaxTenkan = slidingMax(high, length, tenkanPeriod);
  const lowMinTenkan = slidingMin(low, length, tenkanPeriod);
  const highMaxKijun = slidingMax(high, length, kijunPeriod);
  const lowMinKijun = slidingMin(low, length, kijunPeriod);
  const highMaxSenkou = slidingMax(high, length, senkouPeriod);
  const lowMinSenkou = slidingMin(low, length, senkouPeriod);

  const tenkan = new Float64Array(length);
  const kijun = new Float64Array(length);

  for (let i = 0; i < length; i++) {
    tenkan[i] = (highMaxTenkan[i] + lowMinTenkan[i]) / 2;
    kijun[i] = (highMaxKijun[i] + lowMinKijun[i]) / 2;
  }

  // SenkouA = (Tenkan + Kijun) / 2, shifted FORWARD by kijunPeriod positions
  // value computed at bar i is stored at index i + kijunPeriod
  const senkouA = new Float64Array(length).fill(NaN);
  for (let i = 0; i < length; i++) {
    if (i + kijunPeriod < length) {
      const a = (tenkan[i] + kijun[i]) / 2;
      senkouA[i + kijunPeriod] = isNaN(a) ? NaN : a;
    }
  }

  // SenkouB = (slidingMax(high, senkouPeriod) + slidingMin(low, senkouPeriod)) / 2, also shifted forward by kijunPeriod
  const senkouB = new Float64Array(length).fill(NaN);
  for (let i = 0; i < length; i++) {
    if (i + kijunPeriod < length) {
      const b = (highMaxSenkou[i] + lowMinSenkou[i]) / 2;
      senkouB[i + kijunPeriod] = isNaN(b) ? NaN : b;
    }
  }

  // Chikou = close shifted BEHIND by kijunPeriod positions
  // chikou[i] = close[i + kijunPeriod]
  const chikou = new Float64Array(length).fill(NaN);
  for (let i = 0; i < length - kijunPeriod; i++) {
    chikou[i] = close[i + kijunPeriod];
  }

  return { tenkan, kijun, senkouA, senkouB, chikou };
}
