import { ResponsiveBullet, type Datum } from '@nivo/bullet'
import { sum } from '@/utils/normalize-weights.ts'
import { formatPercent, formatSignedPercent } from '@/utils/numbers.ts'
import { cn } from '@/utils/misc.tsx'

export type PairedAllocationData = {
	code: string
	category: string
	id: string
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
					{/*<td>Code</td>*/}
					<td>Category</td>
					<td>Yours %</td>
					<td>Theirs %</td>
					<td>Delta %</td>
				</tr>
			</thead>
			<tbody>
				{pairedData.map((d) => (
					<tr key={d.code} className="text-center">
						{/*<td>{d.code}</td>*/}
						<td className="text-left">{d.category}</td>
						<td>{formatPercent(d.participantPercent)}</td>
						<td>{formatPercent(d.budgetPercent)}</td>
						<td>{formatSignedPercent(d.delta)}</td>
					</tr>
				))}
				<tr className="border-t text-center">
					{/*<td></td>*/}
					<td></td>
					<td>{formatPercent(participantTotal)}</td>
					<td>{formatPercent(budgetTotal)}</td>
					<td></td>
				</tr>
			</tbody>
		</table>
	)
}

export function StackedVisualComparison({
	className,
	pairedData,
}: {
	className?: string
	pairedData: PairedAllocationData[]
}) {
	const classList = cn(className, 'border')

	return (
		<div className={classList}>
			{pairedData.map((d) => (
				// <div key={d.code} className="flex items-center justify-between">
				// 	<span>{d.category}</span>
				// 	<span>{formatPercent(d.participantPercent)}</span>
				// </div>
				<div key={d.code} className="items-center">
					<div>{d.category}</div>
					<div className="flex flex-col">
						<div className="flex flex-col border">
							<span
								className={cn('h-6 bg-orange-500 text-sm', `w-(--pct)`)}
								style={{
									[`--pct`]: formatPercent(d.participantPercent),
								}}
							>
								{formatPercent(d.participantPercent)}
							</span>
							<span
								className={cn('h-6 bg-lime-500 text-sm', `w-(--pct)`)}
								style={{
									[`--pct`]: formatPercent(d.budgetPercent),
								}}
							>
								{formatPercent(d.budgetPercent)}
							</span>
						</div>
					</div>
				</div>
			))}
			<div></div>
		</div>
	)
}

export function BulletVisualization({
	className,
	theme,
	pairedBulletData,
}: {
	className?: string
	theme: 'light' | 'dark'
	pairedBulletData: Datum[]
}) {
	const measureColors = theme === 'light' ? ['#a67d48'] : ['#7a7a5e']
	const rangeColors =
		theme === 'light' ? ['#231f20', '#e7e0d8'] : ['#e7e0d8', '#231f20']

	return (
		<div className={cn(className, 'min-h-150 w-full')}>
			<ResponsiveBullet
				data={pairedBulletData}
				// defaultHeight={600}
				minValue={1}
				maxValue={100}
				margin={{ top: 0, right: 0, bottom: 50, left: 140 }}
				spacing={20}
				titleAlign="start"
				titleOffsetX={-140}
				// rangeBorderColor={{ from: 'color', modifiers: [] }}
				// measureSize={0.7}
				// markerSize={0.7}
				// rangeBorderWidth={2}
				rangeColors={rangeColors}
				// rangeColors="category10"
				measureColors={measureColors}
				// measureColors="seq:viridis"
				// markerColors={['#15803d']}
				theme={{
					text: {
						fill: theme === 'light' ? '#231f20' : '#e7e0d8',
					},
					tooltip: {
						container: {
							backgroundColor: theme === 'light' ? '#ae987e' : '#574c4f',
						},
					},
				}}
			/>
		</div>
	)
}
