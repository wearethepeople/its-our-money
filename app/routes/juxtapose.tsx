import { Route } from './+types/juxtapose'
import { getOrCreateParticipantSession } from '@/utils/participant-session.server.ts'
import { getParticipantAllocation } from '@/utils/participants-db.server.ts'
import { href, redirect } from 'react-router'
import { FUNCTIONS } from '@/constants/budget-functions.ts'
import { getOmbBudgetByCodeForYear } from '@/utils/budget-data.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const { headers, isNew, participantId } =
		await getOrCreateParticipantSession(request)

	if (!isNew) {
		const allocation = await getParticipantAllocation(participantId)

		if (allocation) {
			return { allocation }
		}
	}

	return redirect(
		href('/allocate/:year', { year: new Date().getFullYear().toString() }),
		{ headers },
	)
}

export default function JuxtaposeRoute({ loaderData }: Route.ComponentProps) {
	const { allocation } = loaderData
	const usBudgetData = getOmbBudgetByCodeForYear(2025)

	const formatPercent = (value: number | null) =>
		value == null ? '-' : `${value.toFixed(1)}%`
	const formatSignedPercent = (value: number | null) =>
		value == null ? '-' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

	const pairedData = FUNCTIONS.filter((f) => f.allocatable !== false).map(
		(f) => {
			const participantAllocation = allocation.items.find(
				(a) => a.categoryCode === f.id,
			)

			const budgetPercent =
				usBudgetData[f.id]?.bps != null ? usBudgetData[f.id].bps / 100 : null
			const participantPercent =
				participantAllocation?.weightBps != null
					? participantAllocation.weightBps / 100
					: null
			const delta =
				participantPercent != null && budgetPercent != null
					? participantPercent - budgetPercent
					: null

			return {
				code: f.code,
				category: f.name,
				participantPercent: formatPercent(participantPercent),
				budgetPercent: formatPercent(budgetPercent),
				delta: formatSignedPercent(delta),
			}
		},
	)

	return (
		<div>
			<h1>You & the US Fiscal Budget</h1>
			<table>
				<thead>
					<tr className="font-semibold">
						<td>Code</td>
						<td>Category</td>
						<td>Yours %</td>
						<td>Theirs %</td>
						<td>Delta %</td>
					</tr>
				</thead>
				<tbody>
					{pairedData.map((d) => (
						<tr key={d.code} className="text-center">
							<td>{d.code}</td>
							<td className="text-left">{d.category}</td>
							<td>{d.participantPercent}</td>
							<td>{d.budgetPercent}</td>
							<td>{d.delta}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
