export const IMPACT_CONFIG = {
  gramsPerMeal: 200,
  kgCo2ePerKgFood: 2.5,
  kgPerMeal: 0.2,
  sourceNote: 'Illustrative planning factors for demo reporting; replace with a locally sourced life-cycle dataset before operational use.',
  sourceDate: '2026-11-22',
  lastUpdated: '2026-11-22',
}

export function impactFromDeliveredListings(deliveries) {
  const delivered = deliveries.filter((item) => item.status === 'Delivered')
  const mealsSaved = delivered
    .filter((item) => item.unit === 'Meals')
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const kgRescued = delivered.reduce((sum, item) => {
    if (item.unit === 'Kg') return sum + Number(item.quantity || 0)
    if (item.unit === 'Meals') return sum + (Number(item.quantity || 0) * IMPACT_CONFIG.gramsPerMeal) / 1000
    return sum
  }, 0)
  const kgCo2eAvoided = kgRescued * IMPACT_CONFIG.kgCo2ePerKgFood
  return {
    mealsSaved,
    kgRescued: Math.round(kgRescued * 10) / 10,
    kgCo2eAvoided: Math.round(kgCo2eAvoided * 10) / 10,
    completedPickups: delivered.length,
  }
}

export function mealsFromDelivered(deliveries) {
  const delivered = deliveries.filter((item) => item.status === 'Delivered')
  return delivered
    .filter((item) => item.unit === 'Meals')
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

export function kgFromDelivered(deliveries) {
  const delivered = deliveries.filter((item) => item.status === 'Delivered')
  return delivered.reduce((sum, item) => {
    if (item.unit === 'Kg') return sum + Number(item.quantity || 0)
    if (item.unit === 'Meals') return sum + (Number(item.quantity || 0) * IMPACT_CONFIG.gramsPerMeal) / 1000
    return sum
  }, 0)
}
