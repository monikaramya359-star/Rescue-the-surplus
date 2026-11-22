import { describe, expect, it } from 'vitest'
import { canTransition, nextAllowed } from './stateMachine.js'

describe('listing state machine — legal transitions', () => {
  it.each([
    ['Active', 'Claimed'],
    ['Claimed', 'Collected'],
    ['Claimed', 'Active'],
    ['Collected', 'Delivered'],
    ['Active', 'Cancelled'],
  ])('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it('allows Claimed -> Cancelled only when no claim is held', () => {
    expect(canTransition('Claimed', 'Cancelled')).toBe(false)
    expect(canTransition('Claimed', 'Cancelled', { hasClaim: true })).toBe(false)
    expect(canTransition('Claimed', 'Cancelled', { hasClaim: false })).toBe(true)
  })

  it('treats legacy Available as Active', () => {
    expect(canTransition('Available', 'Claimed')).toBe(true)
    expect(canTransition('Claimed', 'Available')).toBe(true)
  })
})

describe('listing state machine — illegal transitions', () => {
  it.each([
    ['Active', 'Delivered'],
    ['Delivered', 'Claimed'],
    ['Cancelled', 'Claimed'],
    ['Expired', 'Active'],
    ['Active', 'Expired'],
    ['Collected', 'Claimed'],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })

  it('rejects transitions from an unknown status', () => {
    expect(canTransition('Nonsense', 'Active')).toBe(false)
  })
})

describe('nextAllowed', () => {
  it('lists the moves available from each status', () => {
    expect(nextAllowed('Active')).toEqual(['Claimed', 'Cancelled'])
    expect(nextAllowed('Claimed')).toEqual(['Collected', 'Active'])
    expect(nextAllowed('Collected')).toEqual(['Delivered'])
  })

  it('adds Cancelled for a Claimed listing with no claim', () => {
    expect(nextAllowed('Claimed', { hasClaim: false })).toEqual(['Collected', 'Active', 'Cancelled'])
  })

  it('returns nothing for terminal or unknown statuses', () => {
    expect(nextAllowed('Delivered')).toEqual([])
    expect(nextAllowed('Cancelled')).toEqual([])
    expect(nextAllowed('Expired')).toEqual([])
    expect(nextAllowed('Nonsense')).toEqual([])
  })

  it('maps legacy Available to the Active list', () => {
    expect(nextAllowed('Available')).toEqual(nextAllowed('Active'))
  })
})
