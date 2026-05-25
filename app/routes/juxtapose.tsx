import { Route } from './+types/juxtapose'
import { getParticipantBySession } from '@/utils/participant-session.server.ts'
import { href, redirect, Form, data, Link } from 'react-router'
import {
	formatCurrency,
	formatPercent,
	formatSignedCurrency,
} from '@/utils/numbers.ts'
import { Button } from '@/ui/button.tsx'
import { getFormProps, useForm } from '@conform-to/react'
import { z } from 'zod'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { getSessionId } from '@/utils/session.server.ts'
import {
	AllocationService,
	AllocationServiceServer,
} from '@/services/allocation-service.server.ts'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { checkHoneypot } from '@/utils/honeypot.server.ts'
import { ParticipantService } from '@/services/participant-service.server.ts'
import { BulletVisualization } from '@/components/compare-allocation.tsx'
import { getOmbBudgetByCodeForYear } from '@/utils/budget-data.ts'
import { useMemo, useState } from 'react'
import { useTheme } from '@/routes/resources/theme-switch.tsx'
import { ViewSchemeToggle } from '@/components/view-scheme-toggle.tsx'
import {
	PUBLIC_DOMAIN_SCHEME,
	type ViewSchemeId,
} from '@/constants/grouping-schemes.ts'

const manageAllocationSchema = z.object({
	intent: z.enum(['publish', 'unpublish']),
	allocationId: z.string(),
})

const inputFormSchema = manageAllocationSchema.omit({
	allocationId: true,
})

type SortModes =
	| 'participantPercent'
	| 'budgetPercent'
	| 'delta'
	| 'category'
	| 'code'

export async function loader({ request }: Route.LoaderArgs) {
	const participant = await getParticipantBySession(request)
	const url =
		process.env.NODE_ENV === 'production'
			? 'https://itsourmoney.org'
			: 'http://localhost:3000'

	if (participant) {
		const allocation = await AllocationService.getAllocationByParticipantId(
			participant.id,
		)

		if (allocation) {
			const pairedData =
				await AllocationService.zipAllocationWithUsFiscalBudget(allocation)

			const ombData = getOmbBudgetByCodeForYear(2025)
			const netInterestBps = ombData['net_interest']?.bps ?? 0

			return { allocation, pairedData, url, netInterestBps }
		}
	}

	return redirect(
		href('/allocate/:year', { year: new Date().getFullYear().toString() }),
	)
}

export async function action({ request }: Route.ActionArgs) {
	const sessionId = await getSessionId(request)
	const participant =
		await ParticipantService.getParticipantBySessionId(sessionId)

	if (!participant) {
		return data({
			resultType: 'error' as const,
			result: {
				status: 'error' as const,
				error: {
					'': ['Unable to identify participant.'],
				},
			},
		})
	}

	const allocation = await AllocationService.getAllocationByParticipantId(
		participant.id,
	)

	if (!allocation) {
		return data({
			resultType: 'error' as const,
			result: {
				status: 'error' as const,
				error: {
					'': ['Unable to fetch allocation.'],
				},
			},
		})
	}

	const allocationOwnedByParticipant =
		allocation.participantId === participant.id
	const allocationId = allocation.id

	const formData = await request.formData()
	await checkHoneypot(formData)
	formData.set('allocationId', allocationId)

	const submission = parseWithZod(formData, {
		schema: manageAllocationSchema,
	})

	if (submission.status !== 'success' || !allocationOwnedByParticipant) {
		const formError = !allocationOwnedByParticipant
			? 'You do not own this allocation.'
			: 'Unable to process allocation.'

		return data({
			resultType: 'error' as const,
			result: submission.reply({
				formErrors: [formError],
			}),
		})
	}

	switch (submission.value.intent) {
		case 'unpublish': {
			await AllocationService.unpublishAllocation(allocationId)

			return data(
				{
					resultType: 'success' as const,
					result: submission.reply(),
				},
				{ status: 200 },
			)
		}
		case 'publish': {
			try {
				await AllocationService.publishAllocation(allocationId)

				return data(
					{
						resultType: 'success' as const,
						result: submission.reply(),
					},
					{ status: 200 },
				)
			} catch (error) {
				if (error instanceof AllocationServiceServer) {
					if (error.code === 'PUBLIC_ID_COLLISION') {
						return data({
							resultType: 'error' as const,
							result: submission.reply({
								formErrors: [
									'Unable to publish allocation due to a collision with another allocation. Please try again.',
								],
							}),
						})
					}
				}
			}
		}
	}

	return data({
		resultType: 'error' as const,
		result: submission.reply({
			formErrors: ['Unable to process allocation.'],
		}),
	})
}

export default function JuxtaposeRoute({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const { allocation, pairedData, url, netInterestBps } = loaderData
	const theme = useTheme()
	const [viewScheme, setViewScheme] = useState<ViewSchemeId>('flat')
	const [sortMode, setSortMode] = useState<SortModes>('participantPercent')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
	const [taxAmount, setTaxAmount] = useState<number | ''>('')
	const lastResult = actionData?.result
	const publishState =
		allocation.publicId && allocation.publishedAt ? 'Published' : 'Unpublished'
	const publishButtonText =
		publishState === 'Published' ? 'Unpublish' : 'Publish'
	const sortedPairedData = useMemo(() => {
		const direction = sortDirection === 'asc' ? 1 : -1
		return [...pairedData].sort((a, b) => {
			if (sortMode === 'category') {
				return a.category.localeCompare(b.category) * direction
			}
			if (sortMode === 'code') {
				return a.code.localeCompare(b.code) * direction
			}
			return (a[sortMode] - b[sortMode]) * direction
		})
	}, [pairedData, sortDirection, sortMode])

	const bulletPairedData = sortedPairedData.map((item) => ({
		id: item.id,
		title: `${item.code}: ${item.category}`,
		ranges: [0, item.budgetPercent, 100],
		measures: [item.participantPercent],
	}))

	function handleSortModeClick(mode: SortModes) {
		if (mode === sortMode) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
			return
		}
		setSortMode(mode)
		setSortDirection('desc')
	}

	const [form, fields] = useForm({
		defaultValue: {
			intent: publishButtonText.toLowerCase(),
		},
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: inputFormSchema })
		},
		constraint: getZodConstraint(inputFormSchema),
	})

	return (
		<div>
			<h1>You & the US Fiscal Budget</h1>
			<p>
				If you’d like to adjust your allocation you can{' '}
				<Link
					to={href('/allocate/:year', {
						year: new Date().getFullYear().toString(),
					})}
				>
					go here
				</Link>
				.
			</p>
			<div className="my-4 flex flex-wrap items-center gap-4">
				<ViewSchemeToggle value={viewScheme} onChange={setViewScheme} />
				<div className="flex flex-wrap gap-2 border p-1">
					<Button
						type="button"
						variant={sortMode === 'participantPercent' ? 'default' : 'outline'}
						onClick={() => handleSortModeClick('participantPercent')}
					>
						Me {sortMode === 'participantPercent' ? `(${sortDirection})` : ''}
					</Button>
					<Button
						type="button"
						variant={sortMode === 'budgetPercent' ? 'default' : 'outline'}
						onClick={() => handleSortModeClick('budgetPercent')}
					>
						Gov {sortMode === 'budgetPercent' ? `(${sortDirection})` : ''}
					</Button>
					<Button
						type="button"
						variant={sortMode === 'delta' ? 'default' : 'outline'}
						onClick={() => handleSortModeClick('delta')}
					>
						Delta {sortMode === 'delta' ? `(${sortDirection})` : ''}
					</Button>
					<div>-</div>
					<Button
						type="button"
						variant={sortMode === 'code' ? 'default' : 'outline'}
						onClick={() => handleSortModeClick('code')}
					>
						Code {sortMode === 'code' ? `(${sortDirection})` : ''}
					</Button>
					<Button
						type="button"
						variant={sortMode === 'category' ? 'default' : 'outline'}
						onClick={() => handleSortModeClick('category')}
					>
						Category {sortMode === 'category' ? `(${sortDirection})` : ''}
					</Button>
				</div>
			</div>
			{viewScheme === 'flat' ? (
				<BulletVisualization
					theme={theme}
					pairedBulletData={bulletPairedData}
				/>
			) : (
				<div className="flex flex-col gap-6">
					{PUBLIC_DOMAIN_SCHEME.groups.map((group) => {
						const groupItems = bulletPairedData.filter((d) =>
							group.functionIds.includes(String(d.id)),
						)
						if (!groupItems.length) return null
						return (
							<div key={group.id}>
								<h3 className="border-b border-gray-300 pb-1 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400">
									{group.label}
								</h3>
								<BulletVisualization
									theme={theme}
									pairedBulletData={groupItems}
									style={{
										minHeight: `${groupItems.length * 50 + 60}px`,
									}}
								/>
							</div>
						)
					})}
				</div>
			)}
			{netInterestBps > 0 && (
				<p className="mt-4 text-sm text-gray-500 italic">
					The priorities shown here — yours and the government's — each
					apply to {100 - Math.round(netInterestBps / 100)} cents of every
					federal dollar. The remaining {Math.round(netInterestBps / 100)}{' '}
					cents is committed to Net Interest, mandatory debt service on the
					national debt that cannot be redirected.
				</p>
			)}
			<section className="mt-12">
				<h2>Your Tax Breakdown</h2>
				<p className="mt-1 text-sm text-gray-500">
					Enter your total federal tax payment to see how the government spent
					it versus how you would have.
				</p>
				<div className="mt-4 flex items-center gap-2">
					<label htmlFor="tax-amount" className="text-sm font-medium">
						Federal taxes paid:
					</label>
					<div className="relative flex items-center">
						<span className="absolute left-3 text-sm text-gray-500">$</span>
						<input
							id="tax-amount"
							type="number"
							min="0"
							className="w-36 rounded border py-1.5 pr-3 pl-7 text-sm"
							value={taxAmount}
							onChange={(e) =>
								setTaxAmount(e.target.value === '' ? '' : Number(e.target.value))
							}
							placeholder="0"
						/>
					</div>
				</div>
				{taxAmount !== '' && taxAmount > 0 && (
					<table className="mt-4 w-full text-sm">
						<thead>
							<tr className="border-b font-semibold">
								<th className="pb-2 text-left font-semibold">Budget Function</th>
								<th className="pb-2 text-right font-semibold">Your Budget</th>
								<th className="pb-2 text-right font-semibold">Actual Budget</th>
								<th className="pb-2 text-right font-semibold">Difference</th>
							</tr>
						</thead>
						<tbody>
							{sortedPairedData.map((item) => {
								const yourDollars = (item.participantPercent / 100) * taxAmount
								const actualDollars = (item.budgetPercent / 100) * taxAmount
								const difference = yourDollars - actualDollars
								return (
									<tr key={item.code} className="border-b">
										<td className="py-1.5">{item.category}</td>
										<td className="py-1.5 text-right">
											{formatCurrency(yourDollars)}
										</td>
										<td className="py-1.5 text-right">
											{formatCurrency(actualDollars)}
										</td>
										<td className="py-1.5 text-right">
											{formatSignedCurrency(difference)}
										</td>
									</tr>
								)
							})}
						</tbody>
						<tfoot>
							<tr className="border-t font-semibold">
								<td className="pt-2">Total (excl. Net Interest)</td>
								<td className="pt-2 text-right">
									{formatCurrency(
										sortedPairedData.reduce(
											(acc, item) =>
												acc + (item.participantPercent / 100) * taxAmount,
											0,
										),
									)}
								</td>
								<td className="pt-2 text-right">
									{formatCurrency(
										sortedPairedData.reduce(
											(acc, item) =>
												acc + (item.budgetPercent / 100) * taxAmount,
											0,
										),
									)}
								</td>
								<td />
							</tr>
						</tfoot>
					</table>
				)}
			</section>
			<section className="mt-12">
				<h2>Publish settings</h2>
				<div className="flex flex-row gap-4">
					<div className="flex grow flex-col gap-2">
						<div>
							Your budget allocation is currently:{' '}
							<strong>{publishState}</strong>
						</div>
						<div id={form.errorId} className="text-red-500">
							{form.errors}
						</div>
					</div>
					<div>
						<Form method="post" {...getFormProps(form)}>
							<HoneypotInputs />
							<input
								type="hidden"
								name="intent"
								value={publishButtonText.toLowerCase()}
							/>
							<Button>{publishButtonText}</Button>
						</Form>
					</div>
				</div>
				{allocation.publicId && publishState === 'Published' && (
					<ShareInfo publicId={allocation.publicId} url={url} />
				)}
			</section>
		</div>
	)
}

function ShareInfo({ publicId, url }: { publicId: string; url: string }) {
	return (
		<div>
			{'Share this link with your friends to see how they compare to you: '}
			<br />
			<a href={`${url}/s/${publicId}`}>
				{url}/s/{publicId}
			</a>
		</div>
	)
}
