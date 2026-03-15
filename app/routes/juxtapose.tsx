import { Route } from './+types/juxtapose'
import { getOrCreateParticipantSession } from '@/utils/participant-session.server.ts'
import {
	getParticipantAllocation,
	getParticipantBySessionId,
} from '@/utils/participants-db.server.ts'
import { href, redirect, Form, data } from 'react-router'
import { FUNCTIONS } from '@/constants/budget-functions.ts'
import { getOmbBudgetByCodeForYear } from '@/utils/budget-data.ts'
import { formatPercent, formatSignedPercent } from '@/utils/numbers.ts'
import { Button } from '@/ui/button.tsx'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { z } from 'zod'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { getSessionId } from '@/utils/session.server.ts'

const manageAllocationSchema = z.object({
	intent: z.enum(['publish', 'unpublish']),
	allocationId: z.string(),
})

const inputFormSchema = manageAllocationSchema.omit({
	allocationId: true,
})

export async function loader({ request }: Route.LoaderArgs) {
	const { headers, isNew, participantId } =
		await getOrCreateParticipantSession(request)

	if (!isNew) {
		const allocation = await getParticipantAllocation(participantId)

		if (allocation) {
			const usBudgetData = getOmbBudgetByCodeForYear(2025)
			const pairedData = FUNCTIONS.filter((f) => f.allocatable !== false).map(
				(f) => {
					const participantAllocation = allocation.items.find(
						(a) => a.categoryCode === f.id,
					)
					const budgetEntry = usBudgetData[f.id]
					const budgetPercent = budgetEntry ? budgetEntry.bps / 100 : null
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

			return { allocation, pairedData }
		}
	}

	return redirect(
		href('/allocate/:year', { year: new Date().getFullYear().toString() }),
		{ headers },
	)
}

export async function action({ request }: Route.ActionArgs) {
	const sessionId = await getSessionId(request)
	const participant = await getParticipantBySessionId(sessionId)

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

	const allocation = await getParticipantAllocation(participant.id)

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

	const formData = await request.formData()
	formData.set('allocationId', allocation.id)

	const submission = parseWithZod(formData, {
		schema: manageAllocationSchema,
	})

	if (submission.status !== 'success') {
		return data({
			resultType: 'error' as const,
			result: submission.reply({
				formErrors: ['Unable to process allocation.'],
			}),
		})
	}

	return data({
		resultType: 'success' as const,
		result: submission.reply(),
	})
}

export default function JuxtaposeRoute({
	actionData,
	loaderData,
}: Route.ComponentProps) {
	const { allocation, pairedData } = loaderData
	const lastResult = actionData?.result
	const publishState =
		allocation.publicId && allocation.publishedAt && !allocation.unpublishedAt
			? 'Published'
			: 'Unpublished'
	const publishButtonText =
		publishState === 'Published' ? 'Unpublish' : 'Publish'

	const [form, fields] = useForm({
		defaultValue: {
			intent: publishButtonText.toLowerCase(),
		},
		lastResult,
		onValidate({ formData }) {
			console.log(
				'Validation',
				parseWithZod(formData, { schema: inputFormSchema }),
			)

			return parseWithZod(formData, { schema: inputFormSchema })
		},
		constraint: getZodConstraint(inputFormSchema),
	})

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
							<input
								{...getInputProps(fields.intent, {
									type: 'hidden',
								})}
							/>
							<Button>{publishButtonText}</Button>
						</Form>
					</div>
				</div>
			</section>
		</div>
	)
}
