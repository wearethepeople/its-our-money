import omb2025BudgetData from '@/constants/omb-budgets/omb-2025.json' with { type: 'json' }

import { deriveBasisPoints } from '@/utils/normalize-weights'
import { FUNCTIONS } from '@/constants/budget-functions.ts'

type OmbByCodeYearValues = Record<string, number>

type OmbBudgetData = {
	taxonomy: {
		functions: Array<{
			code: string
			id: string
		}>
	}
	actual_outlays_by_function: {
		year_budget_state: Record<string, string>
		by_code: Record<string, OmbByCodeYearValues>
	}
}

export type OmbBudgetCodeBpsAndEstimate = {
	bps: number
	estimate: number
}

export function getOmbBudgetByCodeForYear(
	year: number,
): Record<string, OmbBudgetCodeBpsAndEstimate> {
	if (!Number.isInteger(year)) {
		throw new Error('Year must be an integer')
	}

	const budgetData = omb2025BudgetData as OmbBudgetData
	const outlaysByFunction = budgetData.actual_outlays_by_function
	const yearKey = String(year)
	const yearState = outlaysByFunction.year_budget_state[yearKey]

	if (!yearState) {
		throw new Error(`No year_budget_state entry found for year ${year}`)
	}

	const byCode = outlaysByFunction.by_code
	const codeToId = Object.fromEntries(
		budgetData.taxonomy.functions.map((f) => [f.code, f.id]),
	) as Record<string, string>
	const totalOutlaysEstimate = byCode.TOTAL_OUTLAYS?.[yearKey]

	if (
		typeof totalOutlaysEstimate !== 'number' ||
		!Number.isFinite(totalOutlaysEstimate) ||
		totalOutlaysEstimate === 0
	) {
		throw new Error(
			`TOTAL_OUTLAYS estimate is missing or invalid for year ${year}`,
		)
	}

	const byCodeForYear: Record<string, OmbBudgetCodeBpsAndEstimate> = {}

	for (const [code, values] of Object.entries(byCode)) {
		const estimate = values[yearKey]
		if (typeof estimate !== 'number' || !Number.isFinite(estimate)) continue

		const functionId = codeToId[code]
		if (!functionId) {
			throw new Error(`No taxonomy function id found for code "${code}"`)
		}

		byCodeForYear[functionId] = {
			bps: Math.round(deriveBasisPoints(estimate, totalOutlaysEstimate)),
			estimate,
		}
	}

	return byCodeForYear
}

export const getFunctionDetailsById = (id: string) =>
	FUNCTIONS.find((f) => f.id === id)
