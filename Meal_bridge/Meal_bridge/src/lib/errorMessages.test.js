import { describe, expect, it } from 'vitest'
import { toFriendlyAuthError, toFriendlyDataError } from './errorMessages.js'

describe('toFriendlyAuthError', () => {
  it('maps wrong credentials to a friendly message', () => {
    const msg = toFriendlyAuthError({ message: 'Invalid login credentials' })
    expect(msg).toBe('Email or password is incorrect.')
  })

  it('maps an unconfirmed email to a friendly message', () => {
    const msg = toFriendlyAuthError({ message: 'Email not confirmed' })
    expect(msg).toBe('Please confirm your email before logging in.')
  })

  it('maps an already-registered email on sign-up', () => {
    const msg = toFriendlyAuthError({ message: 'User already registered' })
    expect(msg).toBe('An account with this email already exists.')
  })

  it('maps network failures to a connection message', () => {
    const msg = toFriendlyAuthError(new TypeError('Failed to fetch'))
    expect(msg).toBe('Network error. Check your connection and try again.')
  })

  it('never leaks raw error text for unknown errors', () => {
    const msg = toFriendlyAuthError({ message: 'relation "auth.users" does not exist at line 42' })
    expect(msg).toBe('Something went wrong. Please try again.')
    expect(msg).not.toMatch(/relation|line 42|stack/i)
  })

  it('returns the generic message when no error is given', () => {
    expect(toFriendlyAuthError(null)).toBe('Something went wrong. Please try again.')
  })
})

describe('toFriendlyDataError', () => {
  it('maps a permission error (SQLSTATE 42501) to a permission message', () => {
    const msg = toFriendlyDataError({ code: '42501', message: 'permission denied for table food_listings' })
    expect(msg).toBe("You don't have permission to do that.")
  })

  it('maps a claim on an unavailable listing to a friendly message', () => {
    const msg = toFriendlyDataError({ code: 'P0001', message: 'Listing is not available' })
    expect(msg).toBe('This listing is no longer available.')
  })

  it('maps an over-claim to a friendly message without exposing the count text', () => {
    const msg = toFriendlyDataError({ code: 'P0001', message: 'Only 3 left to claim' })
    expect(msg).toBe('Not enough quantity left to claim.')
  })

  it('maps a network failure to a connection message', () => {
    const msg = toFriendlyDataError(new TypeError('fetch failed'))
    expect(msg).toBe('Network error. Check your connection and try again.')
  })

  it('falls back to a generic message for unknown SQL errors', () => {
    const msg = toFriendlyDataError({ code: '23505', message: 'duplicate key value violates unique constraint "x"' })
    expect(msg).toBe('The request could not be completed. Please try again.')
    expect(msg).not.toMatch(/constraint|duplicate key/i)
  })
})
