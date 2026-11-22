import { describe, expect, it } from 'vitest'
import { ALLERGEN_OPTIONS, validateAllergens } from './allergens.js'
import { validateFoodListing } from './validation.js'

const FUTURE_DEADLINE = '2099-01-01T18:00'
const PAST_DEADLINE = '2020-01-01T18:00'

const validListing = {
  foodName: 'Vegetable biryani',
  category: 'Cooked Meals',
  quantity: '20',
  unit: 'Meals',
  preparedAt: '2098-12-31T10:00',
  pickupDeadline: FUTURE_DEADLINE,
  storage: 'Chilled (0-5°C)',
  allergens: ['Milk', 'Tree nuts'],
  pickupLocation: 'Sector 5, Main Road',
}

describe('validateFoodListing', () => {
  it('rejects an empty food name', () => {
    const errors = validateFoodListing({ ...validListing, foodName: '   ' })
    expect(errors.foodName).toBeTruthy()
  })

  it('rejects a quantity of 0', () => {
    const errors = validateFoodListing({ ...validListing, quantity: '0' })
    expect(errors.quantity).toBeTruthy()
  })

  it('rejects a pickup-by time in the past', () => {
    const errors = validateFoodListing({ ...validListing, pickupDeadline: PAST_DEADLINE })
    expect(errors.pickupDeadline).toBeTruthy()
  })

  it('rejects an allergen that is not in the fixed list', () => {
    const errors = validateFoodListing({ ...validListing, allergens: ['Milk', 'Gluten-free'] })
    expect(errors.allergens).toBeTruthy()
  })

  it('rejects a category, unit or storage outside the database enums', () => {
    expect(validateFoodListing({ ...validListing, category: 'Dessert' }).category).toBeTruthy()
    expect(validateFoodListing({ ...validListing, unit: 'Litres' }).unit).toBeTruthy()
    expect(validateFoodListing({ ...validListing, storage: 'Warm' }).storage).toBeTruthy()
  })

  it('accepts a valid listing', () => {
    expect(validateFoodListing(validListing)).toEqual({})
  })

  it('accepts a listing with no storage condition and no allergens', () => {
    expect(validateFoodListing({ ...validListing, storage: '', allergens: [] })).toEqual({})
  })
})

describe('validateAllergens', () => {
  it('returns no entries for allowed allergens', () => {
    expect(validateAllergens(['Wheat/Gluten', 'Sesame'])).toEqual([])
  })

  it('returns the entries that are not in ALLERGEN_OPTIONS', () => {
    expect(validateAllergens(['Milk', 'Peanut'])).toEqual(['Peanut'])
  })

  it('exposes the nine fixed options', () => {
    expect(ALLERGEN_OPTIONS).toHaveLength(9)
  })
})
