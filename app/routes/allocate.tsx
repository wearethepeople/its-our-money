import { DrawerPreview as Drawer } from '@base-ui/react/drawer'
import { Dialog } from '@base-ui/react/dialog'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { type MouseEvent, useState } from 'react'
import { data, href, redirect, useActionData } from 'react-router'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'

import { ErrorList } from '@/components/forms'
import { FUNCTIONS } from '@/constants/budget-functions.ts'
import { Icon } from '@/ui/icon'
import { ConformSlider } from '@/ui/conform-slider.tsx'
import { checkHoneypot } from '@/utils/honeypot.server'
import { normalizeToBasisPoints, sum } from '@/utils/normalize-weights.ts'
import { getOrCreateParticipantSession } from '@/utils/participant-session.server.ts'

import { type Route } from './+types/allocate'
import {
	FinalAllocationItem,
	getParticipantAllocation,
	saveParticipantAllocations,
} from '@/utils/participants-db.server.ts'
import { getFunctionDetailsById } from '@/utils/budget-data.ts'

type OutlayDrawerPayload = {
	code: string
	description: string
	commonUses: string[]
	name: string
}

type PreviewAllocation = {
	id: string
	percent: number
}

const formSchema = z.object({
	allocations: z.array(
		z.object({
			id: z.string(),
			weight: z.coerce
				.number()
				.int()
				.min(1, 'Every outlay function must have an allocation.')
				.max(1000),
		}),
	),
})

export type AllocationFormInput = z.infer<typeof formSchema>

const SUMMARY_TRIGGER_ID = 'summary'

export async function loader({ request }: Route.LoaderArgs) {
	const { headers, isNew, participantId } =
		await getOrCreateParticipantSession(request)

	if (!isNew) {
		const currentAllocation = await getParticipantAllocation(participantId)

		if (currentAllocation) {
			return redirect(href('/juxtapose'))
		}
	}

	return data({}, { headers })
}

export async function action({ request }: Route.ActionArgs) {
	const { headers, participantId } =
		await getOrCreateParticipantSession(request)
	const formData = await request.formData()
	await checkHoneypot(formData)

	const submission = parseWithZod(formData, { schema: formSchema })

	if (submission.status !== 'success') {
		return data(
			{
				resultType: 'error',
				result: submission.reply({
					formErrors: ['There was a problem processing your allocations.'],
				}),
			},
			{ status: 400 },
		)
	}

	const weights = submission.value.allocations.map((a) => a.weight)
	const basisPoints = normalizeToBasisPoints(weights)
	let finalAllocation: FinalAllocationItem[]

	try {
		if (basisPoints.length !== submission.value.allocations.length) {
			throw new Error('Normalization output length mismatch')
		}

		finalAllocation = submission.value.allocations.map((allocation, i) => {
			const bps = basisPoints[i]

			if (bps === undefined) {
				throw new Error(`Missing basis points at index ${i}`)
			}

			return { id: allocation.id, bps }
		})
	} catch (error) {
		return data(
			{
				resultType: 'error',
				result: submission.reply({
					formErrors: ['Unable to normalize allocations.'],
				}),
			},
			{ status: 400 },
		)
	}

	// Ensure the basis points sum to 10,000
	if (sum(finalAllocation.map((a) => a.bps)) !== 10000) {
		return data(
			{
				resultType: 'error',
				result: submission.reply({
					formErrors: ['Unable to normalize allocations.'],
				}),
			},
			{ status: 400 },
		)
	}

	await saveParticipantAllocations({
		participantId,
		allocations: finalAllocation,
	})

	return redirect('/juxtapose')
}

const normalizedDialogHandle = Dialog.createHandle()

export default function AllocateRoute() {
	const actionData = useActionData<typeof action>()
	const outlaysDrawer = Drawer.createHandle<OutlayDrawerPayload>()
	const allocatableCategories = FUNCTIONS.filter((f) => f.allocatable !== false)
	const [previewAllocations, setPreviewAllocations] = useState<
		PreviewAllocation[]
	>([])

	const [form, fields] = useForm<AllocationFormInput>({
		defaultValue: {
			allocations: allocatableCategories.map((c) => ({ id: c.id, weight: 0 })),
		},
		lastResult: actionData?.result,
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onInput',
		onValidate: ({ formData }) => {
			return parseWithZod(formData, { schema: formSchema })
		},
	})
	const allocations = fields.allocations.getFieldList()

	const handleFinalizeClick = (event: MouseEvent<HTMLButtonElement>) => {
		form.validate()

		const formElement = event.currentTarget.form
		if (!formElement) return

		const submission = parseWithZod(new FormData(formElement), {
			schema: formSchema,
		})

		if (submission.status === 'success') {
			const basisPoints = normalizeToBasisPoints(
				submission.value.allocations.map((allocation) => allocation.weight),
			)

			if (basisPoints.length !== submission.value.allocations.length) return

			const preview = submission.value.allocations.map((allocation, i) => {
				const bps = basisPoints[i]
				if (bps === undefined) {
					throw new Error(`Missing basis points at index ${i}`)
				}
				return {
					id: allocation.id,
					percent: bps / 100,
				}
			})
			setPreviewAllocations(preview)
			normalizedDialogHandle.open(SUMMARY_TRIGGER_ID)
		}
	}

	return (
		<section>
			{/*<p>*/}
			{/*	The US fiscal budget is made up of outlay functions, think of them as*/}
			{/*	categories or buckets, where money is prioritized and, like any budget,*/}
			{/*	tradeoffs are made.*/}
			{/*</p>*/}
			{/*<p>*/}
			{/*	Each outlay function is comprised of a name and a distinct code which*/}
			{/*	helps segment the primary categories of the budget.*/}
			{/*</p>*/}
			{/*<p>*/}
			{/*	As you might imagine, the US budget is a complicated document and for*/}
			{/*	the purpose of this exercise it's been simplified.*/}
			{/*</p>*/}
			<form method="post" {...getFormProps(form)}>
				<HoneypotInputs />
				<div className="mt-8 [&>article:last-child>section]:border-b">
					{allocations.map((a, i) => {
						const categoryField = a.getFieldset()

						if (categoryField.id.initialValue === undefined) return null

						const data = getFunctionDetailsById(categoryField.id.initialValue)

						return (
							<article
								className="even:[&>section]:bg-muted flex w-full flex-col"
								key={categoryField.id.initialValue}
							>
								<div className="bg-secondary flex border border-gray-600">
									<h3 className="grow p-1 pl-2 font-extrabold">
										{i + 1}. {data?.name}
									</h3>
									<div className="pr-2">
										<Drawer.Trigger
											className="shrink"
											handle={outlaysDrawer}
											payload={{
												code: data?.code,
												description: data?.description,
												commonUses: data?.commonUses,
												name: data?.name,
											}}
											title={data?.name}
										>
											<Icon
												name="question-mark-circled"
												className="cursor-pointer text-gray-400 hover:text-gray-500"
											/>
										</Drawer.Trigger>
									</div>
								</div>
								<section className="ml-auto w-[95%] border-x border-gray-600">
									<div className="flex">
										<div className="mt-auto mb-auto grow px-6 py-2">
											<div className="flex flex-col">
												<ConformSlider
													meta={categoryField.weight}
													min={0}
													max={1000}
													step={5}
													ariaLabel="Category weight"
												/>
												<input
													{...getInputProps(categoryField.id, {
														type: 'hidden',
													})}
												/>
												<ErrorList
													id={categoryField.weight.errorId}
													errors={categoryField.weight.errors}
												/>
												<div className="px-2 py-4">
													<p className="text-sm">{data?.description}</p>
												</div>
											</div>
										</div>
										<cite className="flex shrink flex-col border-gray-600">
											<div>
												<div className="border-b border-l border-gray-600">
													<p className="px-2 text-center text-sm font-semibold">
														Code
													</p>
												</div>
												<div>
													<p className="border-b border-l border-gray-600 py-1 text-center text-xs">
														{data?.code}
													</p>
												</div>
											</div>
										</cite>
									</div>
								</section>
							</article>
						)
					})}
				</div>
				<ErrorList id={form.errorId} errors={form.errors} />
				<div className="border-primary mt-8 flex items-center justify-between gap-8 rounded-md border p-4">
					<div>
						<p>
							When you're finished prioritizing your budget, click the Finalize
							button and we'll turn your weighted allocations into percentages
							for your review.
						</p>
						<p>
							If you're happy with your allocations, you can proceed to the next
							step where you can compare your budget with the actual US fiscal
							budget.
						</p>
					</div>
					<button
						type="button"
						onClick={handleFinalizeClick}
						className="font-inherit m-0 flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base leading-6 font-medium text-gray-900 outline-0 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:border-t-gray-300 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] data-[disabled]:text-gray-500 hover:data-[disabled]:bg-gray-50 active:data-[disabled]:border-t-gray-200 active:data-[disabled]:bg-gray-50 active:data-[disabled]:shadow-none"
					>
						Finalize
					</button>
				</div>
				<Dialog.Root
					handle={normalizedDialogHandle}
					triggerId={SUMMARY_TRIGGER_ID}
				>
					<Dialog.Portal>
						<Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 supports-[-webkit-touch-callout:none]:absolute dark:opacity-70" />
						<Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-lg max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300">
							<Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
								Your allocations as percentages
							</Dialog.Title>
							<Dialog.Description className="mb-6 text-base text-gray-600">
								Your allocations have been converted to percentages and are
								shown below. If you want to make changes click the "Keep
								working" button otherwise click "Submit" to see how your budget
								compares to the actual US budget.
							</Dialog.Description>
							<div>
								{previewAllocations.map((allocation) => {
									const data = getFunctionDetailsById(allocation.id)

									return (
										<div className="even:[&>div]:bg-muted" key={allocation.id}>
											<div className="flex items-center p-2">
												<strong className="grow">{data?.name}</strong>
												<span>{allocation.percent}%</span>
											</div>
										</div>
									)
								})}
							</div>
							<div className="mt-8 flex justify-end gap-4">
								<Dialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
									Keep Working
								</Dialog.Close>
								<input
									type="submit"
									title={'Submit allocations'}
									className="border border-red-500"
									form={form.id}
									value={'Submit allocations'}
								/>
							</div>
						</Dialog.Popup>
					</Dialog.Portal>
				</Dialog.Root>
			</form>
			<Drawer.Root handle={outlaysDrawer}>
				{({ payload }) => {
					return (
						<Drawer.Portal>
							<Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] [--bleed:3rem] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute dark:[--backdrop-opacity:0.7]" />
							<Drawer.Viewport className="fixed inset-0 flex items-end">
								<Drawer.Popup className="duration-450ms -mb-12 max-h-[calc(80vh+3rem)] w-full transform-[translateY(var(--drawer-swipe-movement-y))] touch-auto overflow-y-auto overscroll-contain rounded-t-2xl bg-gray-50 px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+3rem)] text-gray-900 outline outline-gray-200 transition-transform ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:transform-[translateY(calc(100%-3rem))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:transform-[translateY(calc(100%-3rem))] data-swiping:select-none dark:outline-gray-300">
									<div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
									<Drawer.Content className="mx-auto w-full max-w-208">
										<Drawer.Title className="mb-1 text-lg font-medium">
											{payload?.code}: {payload?.name}
										</Drawer.Title>
										<Drawer.Description className="mb-6 text-base text-gray-600">
											{payload?.description}
										</Drawer.Description>
										<ul>
											{payload?.commonUses.map((use, i) => (
												<li className="ml-8 list-disc" key={i}>
													{use}
												</li>
											))}
										</ul>
										<div className="hidden justify-end gap-4 md:flex">
											<Drawer.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
												Close
											</Drawer.Close>
										</div>
									</Drawer.Content>
								</Drawer.Popup>
							</Drawer.Viewport>
						</Drawer.Portal>
					)
				}}
			</Drawer.Root>
		</section>
	)
}
