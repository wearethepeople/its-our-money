import { sum } from '@/utils/normalize-weights.ts'
import { formatPercent, formatSignedPercent } from '@/utils/numbers.ts'

export type PairedAllocationData = {
	code: string
	category: string
	participantPercent: number
	budgetPercent: number
	delta: number
}

export default function CompareAllocation({
	className,
	pairedData,
}: {
	className?: string
	pairedData: PairedAllocationData[]
}) {
	const participantTotal = sum(pairedData.map((d) => d.participantPercent))
	const budgetTotal = sum(pairedData.map((d) => d.budgetPercent))

	return (
		<table className={className}>
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
						<td>{formatPercent(d.participantPercent)}</td>
						<td>{formatPercent(d.budgetPercent)}</td>
						<td>{formatSignedPercent(d.delta)}</td>
					</tr>
				))}
				<tr className="border-t text-center">
					<td></td>
					<td></td>
					<td>{formatPercent(participantTotal)}</td>
					<td>{formatPercent(budgetTotal)}</td>
					<td></td>
				</tr>
			</tbody>
		</table>
	)
}
