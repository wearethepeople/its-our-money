/**
 * Normalize a set of weights to a set of basis points.
 * @param weights
 * @param totalBps
 */
export function normalizeToBasisPoints(weights: number[], totalBps = 10000) {
	const total = sum(weights)

	if (total === 0) return weights.map(() => 0)

	const raw = weights.map((w) => deriveBasisPoints(w, total, totalBps))

	const floored = raw.map((n) => Math.floor(n))
	let remainder = totalBps - floored.reduce((sum, n) => sum + n, 0)

	const remainders = raw
		.map((value, index) => ({
			index,
			fractional: value - (floored[index] ?? 0),
		}))
		.sort((a, b) => b.fractional - a.fractional)

	const result = [...floored]

	for (let i = 0; i < remainder; i++) {
		const item = remainders[i]

		if (!item) break

		result[item.index] = (result[item.index] ?? 0) + 1
	}

	return result
}

/**
 * Derive basis points for a value against a total.
 * Returns an unrounded basis-points value so callers can choose rounding behavior.
 */
export function deriveBasisPoints(value: number, total: number, totalBps = 10000) {
	if (total === 0) return 0
	return (value * totalBps) / total
}

/**
 * Normalize a set of weights to a set of percentages.
 * @param weights
 */
export function normalizeToPercent(weights: number[]) {
	const total = sum(weights)

	if (total === 0) return weights.map(() => 0)

	return weights.map((w) => (w / total) * 100)
}

/**
 * Sum an array of numbers.
 * @param arr
 */
export function sum(arr: number[]) {
	return arr.reduce((sum, n) => sum + n, 0)
}
