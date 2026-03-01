function sum(arr: number[]) {
	return arr.reduce((sum, n) => sum + n, 0)
}

export function normalizeToBasisPoints(weights: number[], totalBps = 10000) {
	const total = sum(weights)

	if (total === 0) return weights.map(() => 0)

	const raw = weights.map((w) => (w * totalBps) / total)

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

export function normalizeToPercent(weights: number[]) {
	const total = sum(weights)

	if (total === 0) return weights.map(() => 0)

	return weights.map((w) => (w / total) * 100)
}
