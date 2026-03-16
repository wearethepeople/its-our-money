import { Route } from './+types/recovery.route'
import { redirect } from 'react-router'
import {
	commitSessionIdCookie,
	createSessionRecord,
} from '@/utils/session.server'
import { RecoveryTokenService } from '@/services/recovery-token-service.server.ts'
import { invariant } from '@epic-web/invariant'

export async function loader({ request, params }: Route.LoaderArgs) {
	invariant(params.token, 'Missing recovery token')

	const participantId = await RecoveryTokenService.verifyRecoveryToken(
		params.token,
	)

	if (!participantId) {
		// Keep response generic; don’t leak whether selector exists
		throw new Response('Invalid or expired recovery link', { status: 401 })
	}

	// Create a new DB session for this participant
	const { id: sessionId, expirationDate } = await createSessionRecord({
		participantId,
	})

	// Write sessionId into the cookie
	const setCookie = await commitSessionIdCookie({
		request,
		sessionId,
		expirationDate,
	})

	// @TODO: Redirect with toast and/or render a banner that describes the need to regenerate recovery link
	return redirect('/allocate', {
		headers: {
			'Set-Cookie': setCookie,
		},
	})
}
