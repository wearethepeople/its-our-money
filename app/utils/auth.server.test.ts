import { describe, expect, test } from 'vitest'

describe.skip('timeout handling', () => {
	// normally we'd use fake timers for a test like this, but there's an issue
	// with AbortSignal.timeout() and fake timers: https://github.com/sinonjs/fake-timers/issues/418
	// beforeEach(() => vi.useFakeTimers())
	// afterEach(() => vi.useRealTimers())
})
