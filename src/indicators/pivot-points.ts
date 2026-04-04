export interface PivotPointsResult {
  pp: Float64Array;
  r1: Float64Array;
  r2: Float64Array;
  r3: Float64Array;
  s1: Float64Array;
  s2: Float64Array;
  s3: Float64Array;
}

export function computePivotPoints(
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  length: number,
  variant: 'standard' | 'fibonacci' | 'woodie' = 'standard',
): PivotPointsResult {
  const pp = new Float64Array(length).fill(NaN);
  const r1 = new Float64Array(length).fill(NaN);
  const r2 = new Float64Array(length).fill(NaN);
  const r3 = new Float64Array(length).fill(NaN);
  const s1 = new Float64Array(length).fill(NaN);
  const s2 = new Float64Array(length).fill(NaN);
  const s3 = new Float64Array(length).fill(NaN);

  // Uses PREVIOUS bar's HLC. First bar = NaN.
  for (let i = 1; i < length; i++) {
    const H = high[i - 1];
    const L = low[i - 1];
    const C = close[i - 1];
    const range = H - L;

    if (variant === 'standard') {
      const pivot = (H + L + C) / 3;
      pp[i] = pivot;
      r1[i] = 2 * pivot - L;
      s1[i] = 2 * pivot - H;
      r2[i] = pivot + range;
      s2[i] = pivot - range;
      r3[i] = H + 2 * (pivot - L);
      s3[i] = L - 2 * (H - pivot);
    } else if (variant === 'fibonacci') {
      const pivot = (H + L + C) / 3;
      pp[i] = pivot;
      r1[i] = pivot + 0.382 * range;
      r2[i] = pivot + 0.618 * range;
      r3[i] = pivot + range;
      s1[i] = pivot - 0.382 * range;
      s2[i] = pivot - 0.618 * range;
      s3[i] = pivot - range;
    } else {
      // woodie
      const pivot = (H + L + 2 * C) / 4;
      pp[i] = pivot;
      r1[i] = 2 * pivot - L;
      s1[i] = 2 * pivot - H;
      r2[i] = pivot + range;
      s2[i] = pivot - range;
      r3[i] = H + 2 * (pivot - L);
      s3[i] = L - 2 * (H - pivot);
    }
  }

  return { pp, r1, r2, r3, s1, s2, s3 };
}
