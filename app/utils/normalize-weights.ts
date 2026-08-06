/**
 * Normalize a set of weights to a set of basis points.
 * @param weights
 * @param totalBps
 */
export function normalizeToBasisPoints(weights: number[], totalBps = 10000) {
  const total = sum(weights);

  if (total === 0) return weights.map(() => 0);

  const raw = weights.map((w) => deriveBasisPoints(w, total, totalBps));

  const floored = raw.map((n) => Math.floor(n));
  let remainder = totalBps - floored.reduce((sum, n) => sum + n, 0);

  const remainders = raw
    .map((value, index) => ({
      index,
      fractional: value - (floored[index] ?? 0),
    }))
    .sort((a, b) => b.fractional - a.fractional);

  const result = [...floored];

  for (let i = 0; i < remainder; i++) {
    const item = remainders[i];

    if (!item) break;

    result[item.index] = (result[item.index] ?? 0) + 1;
  }

  return result;
}

/**
 * Derive basis points for a value against a total.
 * Returns an unrounded basis-points value so callers can choose rounding behavior.
 */
export function deriveBasisPoints(value: number, total: number, totalBps = 10000) {
  if (total === 0) return 0;
  return (value * totalBps) / total;
}

/**
 * Normalize a set of weights to a set of percentages.
 * @param weights
 */
export function normalizeToPercent(weights: number[]) {
  const total = sum(weights);

  if (total === 0) return weights.map(() => 0);

  return weights.map((w) => (w / total) * 100);
}

/**
 * Convert basis points back to a slider weight on a 1..max scale (rounded, clamped).
 * A *stored* item is always >= 1 bps; this never returns 0 so an intentional small
 * allocation renders as at least a thin sliver rather than a visually-blank 0.
 * @param bps
 * @param max
 */
export function bpsToSliderWeight(bps: number, max: number) {
  return Math.min(max, Math.max(1, Math.round((bps * max) / 10000)));
}

/**
 * Map a display percentage onto the 1..max comparison-bar scale. A genuine 0%
 * (an untouched category) stays 0 so no bar renders; any nonzero value is
 * floored to 1 so very small priorities remain visible on the scale.
 * @param percent a 0..100 percentage
 * @param max
 */
export function percentToDisplayWeight(percent: number, max: number) {
  return percent === 0 ? 0 : bpsToSliderWeight(percent * 100, max);
}

/**
 * Normalize slider weights to per-category basis points and drop the zero-weight
 * categories. Untouched (weight 0) categories are simply not stored; the remaining
 * non-zero items always sum to exactly 10,000. Returns an empty array when every
 * weight is 0 (the caller blocks that case upstream).
 * @param items id + slider weight pairs
 */
export function toStoredAllocations(items: { id: string; weight: number }[]) {
  const basisPoints = normalizeToBasisPoints(items.map((item) => item.weight));

  return items
    .map((item, index) => ({ id: item.id, bps: basisPoints[index] ?? 0 }))
    .filter((item) => item.bps > 0);
}

/**
 * Sum an array of numbers.
 * @param arr
 */
export function sum(arr: number[]) {
  return arr.reduce((sum, n) => sum + n, 0);
}
