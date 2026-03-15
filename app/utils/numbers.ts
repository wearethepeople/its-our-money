export const formatPercent = (value: number | null) =>
	value == null ? '-' : `${value.toFixed(1)}%`

export const formatSignedPercent = (value: number | null) =>
	value == null ? '-' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
