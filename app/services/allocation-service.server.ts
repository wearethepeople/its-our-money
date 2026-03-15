import { prisma } from '@/utils/db.server.ts'

export async function getAllocationByParticipantId(participantId: string) {
	return prisma.participantAllocation.findFirst({
		where: {
			participantId,
		},
		orderBy: {
			createdAt: 'desc',
		},
		include: {
			items: true,
		},
	})
}
