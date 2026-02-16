import { prisma } from '@/utils/db.server'

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
