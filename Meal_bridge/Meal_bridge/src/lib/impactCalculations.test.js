import { describe, expect, it } from 'vitest'
import { IMPACT_CONFIG } from './impactConfig.js'
import { computeImpact } from './impactCalculations.js'

const NOW = Date.parse('2025-06-15T12:00:00Z')
const DAY = 86400000
const daysAgo = (days) => new Date(NOW - days * DAY).toISOString()

const delivered = (overrides) => ({
  status: 'Delivered',
  unit: 'Meals',
  quantity: 10,
  donorId: 'd-1',
  completedAt: daysAgo(1),
  ...overrides,
})

describe('computeImpact', () => {
  it('counts only Delivered listings', () => {
    const listings = [
      delivered({ quantity: 10 }),
      delivered({ quantity: 5, status: 'Claimed', donorId: 'd-2' }),
      delivered({ quantity: 7, status: 'Active', donorId: 'd-3' }),
    ]
    const result = computeImpact(listings, 'all', NOW)

    expect(result.completedPickups).toBe(1)
    expect(result.activeDonors).toBe(1)
    expect(result.kgRescued).toBeCloseTo(10 * IMPACT_CONFIG.gramsPerMeal / 1000, 10)
  })

  it('computes meals = kg * 1000 / gramsPerMeal exactly', () => {
    const listings = [delivered({ unit: 'Kg', quantity: 4 })]
    const result = computeImpact(listings, 'all', NOW)

    expect(result.kgRescued).toBe(4)
    expect(result.meals).toBe((4 * 1000) / IMPACT_CONFIG.gramsPerMeal)
  })

  it('computes co2e = kg * kgCo2ePerKgFood', () => {
    const listings = [delivered({ unit: 'Kg', quantity: 4 })]
    const result = computeImpact(listings, 'all', NOW)

    expect(result.co2eKg).toBe(4 * IMPACT_CONFIG.kgCo2ePerKgFood)
  })

  it('returns zero pickups and the empty flag for empty input', () => {
    const result = computeImpact([], 'all', NOW)

    expect(result.completedPickups).toBe(0)
    expect(result.activeDonors).toBe(0)
    expect(result.kgRescued).toBe(0)
    expect(result.meals).toBe(0)
    expect(result.co2eKg).toBe(0)
    expect(result.isEmpty).toBe(true)
  })

  it("period 'week' excludes older delivered items", () => {
    const listings = [
      delivered({ quantity: 10, completedAt: daysAgo(2) }),
      delivered({ quantity: 30, completedAt: daysAgo(20), donorId: 'd-2' }),
    ]

    const week = computeImpact(listings, 'week', NOW)
    expect(week.completedPickups).toBe(1)
    expect(week.isEmpty).toBe(false)

    const all = computeImpact(listings, 'all', NOW)
    expect(all.completedPickups).toBe(2)
  })
})
