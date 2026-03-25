import { invariant } from '@epic-web/invariant'
import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'

import { type PairedAllocationData } from '@/components/compare-allocation.tsx'
import { MAX_PUBLIC_ID_RETRIES } from '@/constants'
import { FUNCTIONS } from '@/constants/budget-functions.ts'
import { getOmbBudgetByCodeForYear } from '@/utils/budget-data.ts'
import { prisma } from '@/utils/db.server.ts'
import { sum } from '@/utils/normalize-weights.ts'

export namespace AllocationService {
	export async function getAllocationByParticipantId(participantId: string) {
		return prisma.participantAllocation.findFirst({
			where: { participantId },
			include: { items: true },
		})
	}

	export async function getAllocationByPublicId(publicId: string) {
		return prisma.participantAllocation.findFirst({
			where: { publicId },
			include: { items: true },
		})
	}

	export async function publishAllocation(allocationId: string) {
		for (let attempt = 0; attempt < MAX_PUBLIC_ID_RETRIES; attempt++) {
			const publicId = nanoid()

			try {
				return await prisma.participantAllocation.update({
					where: { id: allocationId },
					data: {
						publicId,
						publishedAt: new Date(),
					},
				})
			} catch (error) {
				const isUniquePublicIdCollision =
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002' &&
					Array.isArray(error.meta?.target) &&
					error.meta.target.includes('publicId')

				if (isUniquePublicIdCollision) continue

				throw new AllocationServiceServer(
					'Unknown error',
					'UNKNOWN_ERROR',
					error,
				)
			}
		}

		throw new AllocationServiceServer(
			`Failed to generate a unique publicId after ${MAX_PUBLIC_ID_RETRIES} attempts`,
			'PUBLIC_ID_COLLISION',
		)
	}

	export async function unpublishAllocation(allocationId: string) {
		return prisma.participantAllocation.update({
			where: { id: allocationId },
			data: {
				publicId: null,
				publishedAt: null,
				unpublishedAt: new Date(),
			},
		})
	}

	export async function zipAllocationWithUsFiscalBudget(
		allocation: Awaited<ReturnType<typeof getAllocationByParticipantId>>,
		year: number = 2025,
	): Promise<PairedAllocationData[]> {
		invariant(allocation, 'Missing allocation')

		const usBudgetData = getOmbBudgetByCodeForYear(year)
		const allocatableFunctions = FUNCTIONS.filter((f) => f.allocatable !== false)
		const allocatableBudgetBpsTotal = sum(
			allocatableFunctions.map((f) => usBudgetData[f.id]?.bps ?? 0),
		)

		invariant(
			allocatableBudgetBpsTotal > 0,
			'Allocatable budget total must be greater than zero',
		)

		return allocatableFunctions.map((f) => {
			const participantAllocation = allocation.items.find(
				(a) => a.categoryCode === f.id,
			) || { weightBps: 0 }
			const budgetBps = usBudgetData[f.id]?.bps ?? 0
			const budgetPercent = (budgetBps / allocatableBudgetBpsTotal) * 100
			const participantPercent = participantAllocation.weightBps / 100
			const delta = participantPercent - budgetPercent

			return {
				code: f.code,
				category: f.name,
				participantPercent,
				budgetPercent,
				delta,
			}
		})
	}
}

export type AllocationServiceErrorCodes =
	| 'UNKNOWN_ERROR'
	| 'PUBLIC_ID_COLLISION'

export class AllocationServiceServer extends Error {
	public readonly code: AllocationServiceErrorCodes
	public readonly originalError?: Error | unknown

	constructor(
		message: string,
		code: AllocationServiceErrorCodes,
		originalError?: Error | unknown,
	) {
		super(message)
		this.code = code
		this.name = 'AllocationServiceServer'
		this.originalError = originalError
	}
}
