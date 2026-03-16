import { createCookieSessionStorage } from 'react-router'
import { prisma } from '@/utils/db.server'

const SESSION_COOKIE_NAME = 'iom_session'
const SESSION_ID_KEY = 'sessionId'

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: SESSION_COOKIE_NAME,
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: process.env.SESSION_SECRET.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
})

// Epic Stack-style: preserve `expires` and `maxAge` across commits
const originalCommitSession = sessionStorage.commitSession
Object.defineProperty(sessionStorage, 'commitSession', {
	value: async function commitSession(
		...args: Parameters<typeof originalCommitSession>
	) {
		const [session, options] = args
		if (options?.expires) session.set('expires', options.expires)
		if (options?.maxAge)
			session.set('expires', new Date(Date.now() + options.maxAge * 1000))
		const expires = session.has('expires')
			? new Date(session.get('expires'))
			: undefined
		return await originalCommitSession(session, { ...options, expires })
	},
})

export async function getCookieSession(request: Request) {
	const cookie = request.headers.get('Cookie')
	return sessionStorage.getSession(cookie)
}

export async function getSessionId(request: Request) {
	const session = await getCookieSession(request)
	const sessionId = session.get(SESSION_ID_KEY)
	return typeof sessionId === 'string' && sessionId.length ? sessionId : null
}

export async function createSessionRecord({
	participantId,
	ttlMs = 1000 * 60 * 60 * 24 * 30, // 30 days
}: {
	participantId: string
	ttlMs?: number
}) {
	const expirationDate = new Date(Date.now() + ttlMs)

	return prisma.session.create({
		data: { participantId, expirationDate },
		select: { id: true, expirationDate: true },
	})
}

export async function commitSessionIdCookie({
	request,
	sessionId,
	expirationDate,
}: {
	request: Request
	sessionId: string
	expirationDate: Date
}) {
	const session = await getCookieSession(request)
	session.set(SESSION_ID_KEY, sessionId)

	return sessionStorage.commitSession(session, {
		expires: expirationDate,
	})
}

export async function destroySessionCookie(request: Request) {
	const session = await getCookieSession(request)
	return sessionStorage.destroySession(session)
}
