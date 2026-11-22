import { describe, expect, it } from 'vitest'
import {
  validateFoodListing,
  validateForgotPassword,
  validateLogin,
  validateRegistration,
} from './validation.js'
import { validateListingTransition } from './stateMachine.js'
import { rankListings } from './matching.js'
import { impactFromDeliveredListings } from './impactConfig.js'

describe('authentication validation', () => {
  it('accepts a valid login', () => {
    expect(validateLogin({ email: 'user@example.com', password: 'password1' })).toEqual({})
  })

  it('rejects invalid email addresses', () => {
    expect(validateForgotPassword({ email: 'not-email' }).email).toBeTruthy()
  })

  it('validates donor registration fields', () => {
    const errors = validateRegistration('donor', {})
    expect(errors.restaurantName).toBeTruthy()
    expect(errors.email).toBeTruthy()
  })
})

describe('food listing validation', () => {
  it('requires a future pickup deadline', () => {
    const errors = validateFoodListing({
      foodName: 'Rice',
      quantity: '10',
      pickupDeadline: new Date(Date.now() - 60000).toISOString(),
    })
    expect(errors.pickupDeadline).toBeTruthy()
  })

  it('accepts only food name, quantity and pickup-by as required', () => {
    const errors = validateFoodListing({
      foodName: 'Rice',
      quantity: '10',
      pickupDeadline: new Date(Date.now() + 7200000).toISOString(),
    })
    expect(errors).toEqual({})
  })

  it('rejects zero quantity', () => {
    expect(validateFoodListing({ quantity: '0' }).quantity).toBeTruthy()
  })

  it('rejects missing food name', () => {
    expect(validateFoodListing({ quantity: '10', pickupDeadline: 'x' }).foodName).toBeTruthy()
  })

  it('rejects empty submission', () => {
    expect(Object.keys(validateFoodListing({}))).toContain('foodName')
    expect(Object.keys(validateFoodListing({}))).toContain('quantity')
    expect(Object.keys(validateFoodListing({}))).toContain('pickupDeadline')
  })
})

describe('pickup state machine', () => {
  it('allows the posted-to-delivered progression', () => {
    expect(validateListingTransition('Active', 'Claimed')).toEqual({ ok: true })
    expect(validateListingTransition('Claimed', 'Collected')).toEqual({ ok: true })
    expect(validateListingTransition('Collected', 'Delivered')).toEqual({ ok: true })
  })

  it('rejects illegal transitions', () => {
    expect(validateListingTransition('Active', 'Delivered').ok).toBe(false)
    expect(validateListingTransition('Delivered', 'Cancelled').ok).toBe(false)
    expect(validateListingTransition('Cancelled', 'Active').ok).toBe(false)
    expect(validateListingTransition('Expired', 'Active').ok).toBe(false)
  })
})

describe('matching and impact', () => {
  it('orders stronger matches first', () => {
    const receiver = {
      location: 'Kothrud, Pune',
      capacityMealsPerDay: 300,
      preferredCategories: ['Cooked Meals'],
    }
    const listings = [
      {
        id: 'far',
        status: 'Active',
        quantity: 100,
        claimedQuantity: 0,
        category: 'Fruits',
        pickupLocation: 'Aundh, Pune',
        pickupDeadline: new Date(Date.now() + 4 * 3600000).toISOString(),
      },
      {
        id: 'near',
        status: 'Active',
        quantity: 30,
        claimedQuantity: 0,
        category: 'Cooked Meals',
        pickupLocation: 'Kothrud, Pune',
        pickupDeadline: new Date(Date.now() + 2 * 3600000).toISOString(),
      },
    ]
    expect(rankListings(listings, receiver)[0].id).toBe('near')
  })

  it('excludes expired listings', () => {
    const receiver = {
      location: 'Kothrud, Pune',
      capacityMealsPerDay: 300,
      preferredCategories: ['Cooked Meals'],
    }
    const listings = [
      {
        id: 'expired',
        status: 'Active',
        quantity: 10,
        claimedQuantity: 0,
        category: 'Cooked Meals',
        pickupLocation: 'Kothrud, Pune',
        pickupDeadline: new Date(Date.now() - 60000).toISOString(),
      },
    ]
    expect(rankListings(listings, receiver)).toEqual([])
  })

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
})
