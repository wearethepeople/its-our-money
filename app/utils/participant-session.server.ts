import {
	createParticipant,
	getParticipantBySessionId,
} from '@/utils/participants-db.server'
import {
	commitSessionIdCookie,
	creatSessionRecord,
	getSessionId,
} from '@/utils/session.server'

/**
 * Ensures this request is associated with a Participant.
 * - If a valid DB session exists (via cookie), returns its participant.
 * - Otherwise creates a new Participant + DB Session and returns Set-Cookie headers.
 *
 * IMPORTANT: Callers must pass the returned `headers` into their response (json/redirect).
 */
export async function getOrCreateParticipantSession(request: Request): Promise<{
	participantId: string
	headers: Headers
	isNew: boolean
}> {
	const headers = new Headers()

	// 1) Try to hydrate via an existing cookie-backed DB session
	const sessionId = await getSessionId(request)
	console.log('sessionId', sessionId)
	const participant = await getParticipantBySessionId(sessionId)

	if (participant) {
		return { participantId: participant.id, headers, isNew: false }
	}

	// 2) Otherwise, create a new Participant + DB Session and set the session cookie
	const newParticipant = await createParticipant()
	const dbSession = await creatSessionRecord({
		participantId: newParticipant.id,
	})

	const setCookie = await commitSessionIdCookie({
		request,
		sessionId: dbSession.id,
		expirationDate: dbSession.expirationDate,
	})

	headers.append('Set-Cookie', setCookie)

	return { participantId: newParticipant.id, headers, isNew: true }
}
