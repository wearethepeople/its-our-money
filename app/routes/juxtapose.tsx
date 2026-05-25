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
import { Fragment, useMemo, useState } from 'react'
import { cn } from '@/utils/misc.tsx'
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
	const [activeTab, setActiveTab] = useState<'comparison' | 'tax-breakdown'>(
		'comparison',
	)
	const netInterestFraction = netInterestBps / 10000
	const allocatableFraction = 1 - netInterestFraction
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
			<div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
				<div className="flex-1 space-y-3">
					<h1>You & the US Fiscal Budget</h1>
					<p>
						When you moved the sliders, you distributed your priorities across
						the 18 allocatable federal budget functions. Those choices were
						converted into percentages, your personal allocation, and are shown
						here alongside the government's actual spending from the most recent
						OMB data.
					</p>
					<p>
						Use the <strong>Comparison</strong> tab to see where you and the
						federal government align or diverge — sort by difference to find
						where your priorities diverge most. The{' '}
						<strong>Tax Breakdown</strong> tab translates those percentages into
						dollar amounts based on your federal tax payment, making the
						abstract concrete.
					</p>
					<p>
						If you decide to publish, this page is exactly what gets shared:
						your percentage breakdown, nothing more. No name, no identifying
						information — just your priorities.
					</p>
					<p className="text-sm text-gray-500">
						Want to change your numbers?{' '}
						<Link
							to={href('/allocate/:year', {
								year: new Date().getFullYear().toString(),
							})}
						>
							Go back to the sliders
						</Link>
						.
					</p>
				</div>
				<div className="flex shrink-0 flex-row gap-4 rounded-lg border p-4">
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
						{allocation.publicId && publishState === 'Published' && (
							<div className="mt-3">
								<ShareInfo publicId={allocation.publicId} url={url} />
							</div>
						)}
					</div>
					<div>
						<p className="mb-1 text-base">
							Your allocation is{' '}
							<strong className="font-semibold">{publishState}</strong>.
						</p>
						<div id={form.errorId} className="mb-2 text-sm text-red-500">
							{form.errors}
						</div>
					</div>
				</div>
			</div>
			<div className="my-4 flex flex-wrap items-center gap-3">
				<span className="text-xs text-gray-500">Sort by:</span>
				<div className="flex">
					{(
						[
							{ mode: 'participantPercent', label: 'Yours' },
							{ mode: 'budgetPercent', label: 'Federal' },
							{ mode: 'delta', label: 'Difference' },
						] as const
					).map(({ mode, label }, i, arr) => (
						<button
							key={mode}
							type="button"
							className={cn(
								'-ml-px rounded-none border px-2.5 py-1 text-xs font-medium transition-colors',
								i === 0 && 'ml-0 rounded-l-md',
								i === arr.length - 1 && 'rounded-r-md',
								sortMode === mode
									? 'border-primary bg-primary text-primary-foreground relative z-10'
									: 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
							)}
							onClick={() => handleSortModeClick(mode)}
						>
							{label}
							{sortMode === mode ? ` (${sortDirection})` : ''}
						</button>
					))}
				</div>
				<div className="flex">
					{(
						[
							{ mode: 'code', label: 'Code' },
							{ mode: 'category', label: 'Category' },
						] as const
					).map(({ mode, label }, i, arr) => (
						<button
							key={mode}
							type="button"
							className={cn(
								'-ml-px rounded-none border px-2.5 py-1 text-xs font-medium transition-colors',
								i === 0 && 'ml-0 rounded-l-md',
								i === arr.length - 1 && 'rounded-r-md',
								sortMode === mode
									? 'border-primary bg-primary text-primary-foreground relative z-10'
									: 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
							)}
							onClick={() => handleSortModeClick(mode)}
						>
							{label}
							{sortMode === mode ? ` (${sortDirection})` : ''}
						</button>
					))}
				</div>
				<div className="ml-auto">
					<ViewSchemeToggle value={viewScheme} onChange={setViewScheme} />
				</div>
			</div>
			<div className="flex border-b">
				<button
					type="button"
					className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
						activeTab === 'comparison'
							? 'border-current'
							: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
					}`}
					onClick={() => setActiveTab('comparison')}
				>
					Comparison
				</button>
				<button
					type="button"
					className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
						activeTab === 'tax-breakdown'
							? 'border-current'
							: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
					}`}
					onClick={() => setActiveTab('tax-breakdown')}
				>
					Tax Breakdown
				</button>
			</div>
			{activeTab === 'comparison' && (
				<div>
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
				</div>
			)}
			{activeTab === 'tax-breakdown' && (
				<div className="mt-6">
					<p className="text-sm text-gray-500">
						Enter your total federal tax payment to see how the government spent
						it versus how you would have.
					</p>
					<p className="mt-1 text-xs text-gray-400">
						The figure you enter here is used only for this in-page calculation
						and is never stored or transmitted. No personal financial
						information is collected or retained — the math happens entirely in
						your browser.
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
									setTaxAmount(
										e.target.value === '' ? '' : Number(e.target.value),
									)
								}
								placeholder="0"
							/>
						</div>
					</div>
					{taxAmount !== '' && taxAmount > 0 && (
						<table className="mt-4 w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="pb-2 text-left font-semibold">
										Budget Function
									</th>
									<th className="pb-2 text-right font-semibold">Your Budget</th>
									<th className="pb-2 text-right font-semibold">
										Actual Budget
									</th>
									<th className="pb-2 text-right font-semibold">Difference</th>
								</tr>
							</thead>
							<tbody>
								{viewScheme === 'flat' ? (
									<>
										{sortedPairedData.map((item) => {
											const yourDollars =
												(item.participantPercent / 100) *
												allocatableFraction *
												taxAmount
											const actualDollars =
												(item.budgetPercent / 100) *
												allocatableFraction *
												taxAmount
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
										{netInterestBps > 0 && (
											<tr className="border-b text-gray-500 italic">
												<td className="py-1.5">Net Interest (mandatory)</td>
												<td className="py-1.5 text-right">
													{formatCurrency(netInterestFraction * taxAmount)}
												</td>
												<td className="py-1.5 text-right">
													{formatCurrency(netInterestFraction * taxAmount)}
												</td>
												<td className="py-1.5 text-right">
													{formatCurrency(0)}
												</td>
											</tr>
										)}
									</>
								) : (
									<>
										{PUBLIC_DOMAIN_SCHEME.groups.map((group) => {
											const groupItems = sortedPairedData.filter((item) =>
												group.functionIds.includes(String(item.id)),
											)
											if (!groupItems.length) return null
											const groupYours = groupItems.reduce(
												(sum, item) =>
													sum +
													(item.participantPercent / 100) *
														allocatableFraction *
														taxAmount,
												0,
											)
											const groupActual = groupItems.reduce(
												(sum, item) =>
													sum +
													(item.budgetPercent / 100) *
														allocatableFraction *
														taxAmount,
												0,
											)
											const groupDiff = groupYours - groupActual
											return (
												<Fragment key={group.id}>
													<tr>
														<td
															colSpan={4}
															className="border-b border-gray-300 pt-4 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400"
														>
															{group.label}
														</td>
													</tr>
													{groupItems.map((item) => {
														const yourDollars =
															(item.participantPercent / 100) *
															allocatableFraction *
															taxAmount
														const actualDollars =
															(item.budgetPercent / 100) *
															allocatableFraction *
															taxAmount
														const difference = yourDollars - actualDollars
														return (
															<tr
																key={item.code}
																className="border-b border-gray-100 dark:border-gray-800"
															>
																<td className="py-1.5 pl-3">
																	{item.category}
																</td>
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
													<tr className="border-b border-gray-300 dark:border-gray-600">
														<td className="py-1.5 pl-3 text-xs font-semibold text-gray-500">
															Subtotal
														</td>
														<td className="py-1.5 text-right font-semibold">
															{formatCurrency(groupYours)}
														</td>
														<td className="py-1.5 text-right font-semibold">
															{formatCurrency(groupActual)}
														</td>
														<td className="py-1.5 text-right font-semibold">
															{formatSignedCurrency(groupDiff)}
														</td>
													</tr>
												</Fragment>
											)
										})}
										{netInterestBps > 0 && (
											<tr className="border-b text-gray-500 italic">
												<td className="py-1.5">Net Interest (mandatory)</td>
												<td className="py-1.5 text-right">
													{formatCurrency(netInterestFraction * taxAmount)}
												</td>
												<td className="py-1.5 text-right">
													{formatCurrency(netInterestFraction * taxAmount)}
												</td>
												<td className="py-1.5 text-right">
													{formatCurrency(0)}
												</td>
											</tr>
										)}
									</>
								)}
							</tbody>
							<tfoot>
								<tr className="border-t font-semibold">
									<td className="pt-2">Total</td>
									<td className="pt-2 text-right">
										{formatCurrency(taxAmount)}
									</td>
									<td className="pt-2 text-right">
										{formatCurrency(taxAmount)}
									</td>
									<td />
								</tr>
							</tfoot>
						</table>
					)}
				</div>
			)}
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
