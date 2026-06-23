import { describe, it, expect } from 'vitest'
import { friendlyAuthError } from './errors'

describe('friendlyAuthError', () => {
  it('maps known codes to specific, friendly messages', () => {
    expect(friendlyAuthError({ code: 'auth/invalid-email' })).toMatch(/invalid/i)
    expect(friendlyAuthError({ code: 'auth/weak-password' })).toMatch(/6 characters/i)
    expect(friendlyAuthError({ code: 'auth/email-already-in-use' })).toMatch(
      /already exists/i,
    )
    expect(friendlyAuthError({ code: 'auth/use-google-signin' })).toMatch(/google/i)
  })

  it('collapses the various bad-credential codes into one message', () => {
    const msg = friendlyAuthError({ code: 'auth/wrong-password' })
    expect(friendlyAuthError({ code: 'auth/invalid-credential' })).toBe(msg)
    expect(friendlyAuthError({ code: 'auth/user-not-found' })).toBe(msg)
    expect(msg).toMatch(/incorrect/i)
  })

  it('falls back for unknown, missing, or non-coded errors', () => {
    expect(friendlyAuthError({ code: 'auth/whatever' })).toMatch(/something went wrong/i)
    expect(friendlyAuthError(null)).toMatch(/something went wrong/i)
    expect(friendlyAuthError(new Error('boom'))).toMatch(/something went wrong/i)
  })
})
