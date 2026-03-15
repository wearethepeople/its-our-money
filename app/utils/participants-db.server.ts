import { prisma } from '@/utils/db.server'

export type FinalAllocationItem = {
	id: string
	bps: number
}

type SaveParticipantAllocationsInput = {
	participantId: string
	allocations: FinalAllocationItem[]
}

export async function createParticipant() {
	return prisma.participant.create({
		data: {},
		select: {
			id: true,
			createdAt: true,
			updatedAt: true,
		},
	})
}

export async function getParticipantBySessionId(sessionId?: string | null) {
	if (!sessionId) return null

	const session = await prisma.session.findFirst({
		where: {
			id: sessionId,
			expirationDate: { gt: new Date() },
		},
		select: {
			participant: {
				select: {
					id: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	})

	return session?.participant ?? null
}

export async function saveParticipantAllocations({
	participantId,
	allocations,
}: SaveParticipantAllocationsInput) {
	if (!participantId) {
		throw new Error('participantId is required')
	}

	if (!allocations.length) {
		throw new Error('allocations must not be empty')
	}

	const totalBps = allocations.reduce(
		(total, allocation) => total + allocation.bps,
		0,
	)

	if (totalBps !== 10_000) {
		throw new Error('allocations must sum to exactly 10000 bps')
	}

	const seenIds = new Set<string>()

	for (const allocation of allocations) {
		if (!allocation.id) {
			throw new Error('allocation id is required')
		}

		if (!Number.isInteger(allocation.bps)) {
			throw new Error(`allocation "${allocation.id}" bps must be an integer`)
		}

		if (allocation.bps < 1 || allocation.bps > 10_000) {
			throw new Error(
				`allocation "${allocation.id}" bps must be between 1 and 10000`,
			)
		}

		if (seenIds.has(allocation.id)) {
			throw new Error(`duplicate allocation id "${allocation.id}"`)
		}

		seenIds.add(allocation.id)
	}

	return prisma.$transaction(async (tx) => {
		const allocation = await tx.participantAllocation.upsert({
			where: {
				participantId,
			},
			create: {
				participantId,
			},
			update: {},
			select: {
				id: true,
				participantId: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		await tx.participantAllocationItem.deleteMany({
			where: { allocationId: allocation.id },
		})

		await tx.participantAllocationItem.createMany({
			data: allocations.map((item) => ({
				allocationId: allocation.id,
				categoryCode: item.id,
				weightBps: item.bps,
			})),
		})

		return allocation
	})
}
