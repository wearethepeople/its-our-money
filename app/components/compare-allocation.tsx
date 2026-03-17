import { sum } from '@/utils/normalize-weights.ts'

export type PairedAllocationData = {
	code: string
	category: string
	participantPercent: string
	budgetPercent: string
	delta: string
}

export default function CompareAllocation({
	className,
	pairedData,
}: {
	className?: string
	pairedData: PairedAllocationData[]
}) {
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
						<td>{d.participantPercent}</td>
						<td>{d.budgetPercent}</td>
						<td>{d.delta}</td>
					</tr>
				))}
				<tr className="border-t text-center">
					<td></td>
					<td></td>
					<td>
						{sum(pairedData.map((d) => parseFloat(d.participantPercent)))}%
					</td>
					<td>{sum(pairedData.map((d) => parseFloat(d.budgetPercent)))}%</td>
					<td></td>
				</tr>
			</tbody>
		</table>
	)
}
