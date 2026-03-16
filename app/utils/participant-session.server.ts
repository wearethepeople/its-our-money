import {
	commitSessionIdCookie,
	createSessionRecord,
	getSessionId,
} from '@/utils/session.server'
import { ParticipantService } from '@/services/participant-service.server.ts'

/**
 * Reads the current request's participant session without creating anything.
 * Returns the participant when the session cookie maps to a valid, non-expired DB session.
 */
export async function getParticipantBySession(request: Request) {
	const sessionId = await getSessionId(request)
	return ParticipantService.getParticipantBySessionId(sessionId)
}

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
	const participant =
		await ParticipantService.getParticipantBySessionId(sessionId)

	if (participant) {
		return { participantId: participant.id, headers, isNew: false }
	}

	// 2) Otherwise, create a new Participant + DB Session and set the session cookie
	const newParticipant = await ParticipantService.createParticipant()
	const dbSession = await createSessionRecord({
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
