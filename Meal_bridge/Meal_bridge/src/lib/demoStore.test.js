import { describe, expect, it } from 'vitest'
import {
  advanceTask,
  claimListing,
  getAuditLog,
  getState,
} from './demoStore.js'
import { seedListings } from '../data/receiverData.js'
import { rankListings } from './matching.js'
import { impactFromDeliveredListings } from './impactConfig.js'

const now = Date.now()

describe('demo store state machine — claimListing', () => {
  it('rejects zero and negative quantities', () => {
    expect(claimListing('no-such-id', 0)).toEqual({
      ok: false,
      error: 'Enter a whole number of at least 1',
    })
    expect(claimListing('no-such-id', -1)).toEqual({
      ok: false,
      error: 'Enter a whole number of at least 1',
    })
  })

  it('rejects claims for unknown listings', () => {
    expect(claimListing('does-not-exist', 1)).toEqual({
      ok: false,
      error: 'This listing is no longer available',
    })
  })

  it('rejects claims above remaining quantity', () => {
    const listing = seedListings[0] // r-201: qty 40, claimed 10, remaining 30
    expect(claimListing(listing.id, listing.quantity + 1)).toEqual({
      ok: false,
      error: expect.stringContaining('Only'),
    })
  })

  it('rejects claims past the pickup deadline', () => {
    // r-205 has pickupDeadline 30 minutes ago (past)
    const expiredListing = seedListings.find((l) => l.id === 'r-205')
    expect(claimListing(expiredListing.id, 1)).toEqual({
      ok: false,
      error: 'This pickup deadline has passed',
    })
  })

  it('successfully claims available quantity', () => {
    const result = claimListing('r-201', 5)
    expect(result.ok).toBe(true)
    const listing = getState().listings.find((l) => l.id === 'r-201')
    expect(listing.claimedQuantity).toBe(15)
  })
})

describe('demo store state machine — advanceTask', () => {
  // p-301 starts at 'Claimed' with null volunteerId (from seedAvailablePickups)
  it('accepts Claimed -> Pickup Assigned', () => {
    const result = advanceTask('p-301', 'Pickup Assigned', 'vol-1')
    expect(result.ok).toBe(true)
    expect(result.task.status).toBe('Pickup Assigned')
    expect(result.task.volunteerId).toBe('vol-1')
  })

  it('rejects a different volunteer taking an assigned task', () => {
    const result = advanceTask('p-301', 'Collected', 'vol-2')
    expect(result.ok).toBe(false)
  })

  it('completes Pickup Assigned -> Collected -> Delivered', () => {
    const collected = advanceTask('p-301', 'Collected', 'vol-1')
    expect(collected.ok).toBe(true)
    expect(collected.task.status).toBe('Collected')

    const delivered = advanceTask('p-301', 'Delivered', 'vol-1')
    expect(delivered.ok).toBe(true)
    expect(delivered.task.status).toBe('Delivered')
  })

  it('records transitions in the audit log', () => {
    const before = getAuditLog().length
    // p-302 is still 'Claimed' with null volunteerId
    advanceTask('p-302', 'Pickup Assigned', 'vol-1')
    expect(getAuditLog().length).toBe(before + 1)
    const last = getAuditLog()[getAuditLog().length - 1]
    expect(last.taskId).toBe('p-302')
    expect(last.from).toBe('Claimed')
    expect(last.to).toBe('Pickup Assigned')
    expect(last.actorId).toBe('vol-1')
  })
})

describe('matching score ordering', () => {
  const receiver = {
    id: 'rec-1',
    location: 'Kothrud, Pune',
    capacityMealsPerDay: 300,
    preferredCategories: ['Cooked Meals'],
  }

  it('orders stronger matches first', () => {
    const listings = [
      {
        id: 'far',
        status: 'Active',
        quantity: 100,
        claimedQuantity: 0,
        category: 'Fruits',
        pickupLocation: 'Aundh, Pune',
        pickupDeadline: new Date(now + 4 * 3600000).toISOString(),
      },
      {
        id: 'near',
        status: 'Active',
        quantity: 30,
        claimedQuantity: 0,
        category: 'Cooked Meals',
        pickupLocation: 'Kothrud, Pune',
        pickupDeadline: new Date(now + 2 * 3600000).toISOString(),
      },
    ]
    expect(rankListings(listings, receiver)[0].id).toBe('near')
  })

  it('accepts both Active and Available statuses', () => {
    const listings = [
      {
        id: 'active',
        status: 'Active',
        quantity: 10,
        claimedQuantity: 0,
        category: 'Cooked Meals',
        pickupLocation: 'Kothrud, Pune',
        pickupDeadline: new Date(now + 3600000).toISOString(),
      },
      {
        id: 'available',
        status: 'Available',
        quantity: 10,
        claimedQuantity: 0,
        category: 'Cooked Meals',
        pickupLocation: 'Kothrud, Pune',
        pickupDeadline: new Date(now + 3600000).toISOString(),
      },
    ]
    expect(rankListings(listings, receiver).map((l) => l.id)).toEqual(['active', 'available'])
  })

  it('excludes expired listings', () => {
    const listings = [
      {
        id: 'expired',
        status: 'Active',
        quantity: 10,
        claimedQuantity: 0,
        category: 'Cooked Meals',
        pickupLocation: 'Kothrud, Pune',
        pickupDeadline: new Date(now - 60000).toISOString(),
      },
    ]
    expect(rankListings(listings, receiver)).toEqual([])
  })
})

describe('impact calculations', () => {
  it('calculates impact only from delivered listings', () => {
    const result = impactFromDeliveredListings([
      { status: 'Delivered', unit: 'Meals', quantity: 50 },
      { status: 'Claimed', unit: 'Meals', quantity: 100 },
      { status: 'Delivered', unit: 'Kg', quantity: 5 },
    ])
    expect(result.mealsSaved).toBe(50)
    expect(result.kgRescued).toBe(15)
    expect(result.completedPickups).toBe(2)
  })

  it('returns zeros for empty input', () => {
    const result = impactFromDeliveredListings([])
    expect(result.mealsSaved).toBe(0)
    expect(result.kgRescued).toBe(0)
    expect(result.completedPickups).toBe(0)
  })
})
