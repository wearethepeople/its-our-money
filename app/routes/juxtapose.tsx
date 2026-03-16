import { Route } from './+types/juxtapose'
import { getParticipantBySession } from '@/utils/participant-session.server.ts'
import { href, redirect, Form, data } from 'react-router'
import { FUNCTIONS } from '@/constants/budget-functions.ts'
import { getOmbBudgetByCodeForYear } from '@/utils/budget-data.ts'
import { formatPercent, formatSignedPercent } from '@/utils/numbers.ts'
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
import CompareAllocation from '@/components/compare-allocation.tsx'

const manageAllocationSchema = z.object({
	intent: z.enum(['publish', 'unpublish']),
	allocationId: z.string(),
})

const inputFormSchema = manageAllocationSchema.omit({
	allocationId: true,
})

export async function loader({ request }: Route.LoaderArgs) {
	const participant = await getParticipantBySession(request)

	if (participant) {
		const allocation = await AllocationService.getAllocationByParticipantId(
			participant.id,
		)

		if (allocation) {
			const pairedData =
				await AllocationService.zipAllocationWithUsFiscalBudget(allocation)

			return { allocation, pairedData }
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
	const { allocation, pairedData } = loaderData
	const lastResult = actionData?.result
	const publishState =
		allocation.publicId && allocation.publishedAt ? 'Published' : 'Unpublished'
	const publishButtonText =
		publishState === 'Published' ? 'Unpublish' : 'Publish'

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
			<CompareAllocation className="mt-8" pairedData={pairedData} />
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
					<ShareInfo publicId={allocation.publicId} />
				)}
			</section>
		</div>
	)
}

function ShareInfo({ publicId }: { publicId: string }) {
	return (
		<div>
			{'Share this link with your friends to see how they compare to you: '}
			<br />
			<a href={`http://localhost:3000/s/${publicId}`}>
				http://localhost:3000/s/{publicId}
			</a>
		</div>
	)
}
