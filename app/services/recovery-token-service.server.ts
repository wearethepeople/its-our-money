import { prisma } from '@/utils/db.server.ts'
import { nanoid } from 'nanoid'
import argon2 from 'argon2'
import { invariant } from '@epic-web/invariant'
import { MAX_RECOVERY_TOKEN_CREATE_RETRIES } from '@/constants'

export type RecoveryTokenParts = {
	selector: string
	verifier: string
	token: string // `${selector}.${verifier}`
}

export namespace RecoveryTokenService {
	/**
	 * Generate selector + verifier.
	 * - selector is an index key (not secret, but unguessable enough)
	 * - verifier is the secret (treat like password)
	 */
	export function generateRecoveryTokenParts(): RecoveryTokenParts {
		const selector = nanoid(10) // short "handle" to find DB row
		const verifier = nanoid(32) // secret "password" portion
		return { selector, verifier, token: `${selector}.${verifier}` }
	}

	function parseRecoveryToken(token: string): {
		selector: string
		verifier: string
	} {
		const [selector, verifier, ...rest] = token.split('.')
		if (!selector || !verifier || rest.length)
			throw new Error('Invalid recovery token format')
		return { selector, verifier }
	}

	/**
	 * Create or rotate the recovery token for a participant.
	 * Returns PLAINTEXT token ONCE (show it to user; do not store it).
	 */
	export async function createOrRotateRecoveryToken(participantId: string) {
		invariant(participantId, 'participantId is required')

		const { selector, verifier, token } = generateRecoveryTokenParts()

		const verifierHash = await argon2.hash(verifier, {
			type: argon2.argon2id,
			memoryCost: 32768, // 32 MiB
			timeCost: 2,
			parallelism: 1,
		})

		// One token per participant: upsert by participantId
		// NOTE: selector must be unique too; collisions are extremely unlikely
		// Prisma will throw on collision; createOrRotateRecoveryTokenWithRetry implements retry logic
		await prisma.recoveryToken.upsert({
			where: { participantId },
			create: { participantId, selector, verifierHash },
			update: { selector, verifierHash, revokedAt: null, lastUsedAt: null },
		})

		return { token, selector } // token is what user saves; selector returned mainly for debug
	}

	/**
	 * Safer version with retries in case selector uniqueness collides (super rare).
	 */
	export async function createOrRotateRecoveryTokenWithRetry(
		participantId: string,
		maxAttempts = MAX_RECOVERY_TOKEN_CREATE_RETRIES,
	) {
		let lastError: unknown = null

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await createOrRotateRecoveryToken(participantId)
			} catch (err: any) {
				lastError = err
				// Prisma unique constraint error code (common): P2002
				if (err?.code === 'P2002') continue
				throw err
			}
		}

		throw new Error(
			`Failed to generate unique recovery token after ${maxAttempts} attempts: ${String(lastError)}`,
		)
	}

	/**
	 * Verify a recovery token. Returns participantId if valid, else null.
	 */
	export async function verifyRecoveryToken(token: string) {
		if (!token) return null

		let selector: string
		let verifier: string
		try {
			;({ selector, verifier } = parseRecoveryToken(token))
		} catch {
			return null
		}

		const record = await prisma.recoveryToken.findUnique({
			where: { selector },
			select: { participantId: true, verifierHash: true, revokedAt: true },
		})

		if (!record) return null
		if (record.revokedAt) return null

		const ok = await argon2.verify(record.verifierHash, verifier)
		if (!ok) return null

		await prisma.recoveryToken.update({
			where: { selector },
			data: { lastUsedAt: new Date() },
		})

		return record.participantId
	}

	/**
	 * Revoke recovery token (kills the link)
	 */
	export async function revokeRecoveryToken(participantId: string) {
		invariant(participantId, 'participantId is required')

		await prisma.recoveryToken.update({
			where: { participantId },
			data: { revokedAt: new Date() },
		})
	}
}
