export const MATCH_WEIGHTS = Object.freeze({
  distance: 35,
  quantityFit: 25,
  timing: 25,
  need: 15,
})

const AREA_CODES = ['kothrud', 'fc road', 'baner', 'viman nagar', 'hadapsar', 'aundh']

export function approximateDistanceKm(fromArea, toArea) {
  if (!fromArea || !toArea) return null
  const from = String(fromArea).toLowerCase()
  const to = String(toArea).toLowerCase()
  if (from === to) return 0.8
  const fromIndex = AREA_CODES.findIndex((area) => from.includes(area))
  const toIndex = AREA_CODES.findIndex((area) => to.includes(area))
  if (fromIndex < 0 || toIndex < 0) return 4.5
  return Math.max(0.8, Math.abs(fromIndex - toIndex) * 1.8)
}

export function matchListing(listing, receiver, now = Date.now()) {
  const distanceKm = approximateDistanceKm(receiver.location, listing.pickupLocation)
  const quantity = Number(listing.availableQuantity ?? listing.quantity)
  const capacity = Number(receiver.capacityMealsPerDay || 300)
  const hoursLeft = (new Date(listing.pickupDeadline).getTime() - now) / 3600000

  const distanceScore = distanceKm == null
    ? MATCH_WEIGHTS.distance * 0.5
    : MATCH_WEIGHTS.distance * Math.max(0, 1 - distanceKm / 15)
  const quantityScore = MATCH_WEIGHTS.quantityFit * Math.max(
    0,
    1 - Math.abs(quantity - capacity * 0.1) / Math.max(capacity, 1),
  )
  const timingScore = hoursLeft > 0
    ? MATCH_WEIGHTS.timing * Math.min(1, hoursLeft / 2)
    : 0
  const categoryBonus = receiver.preferredCategories?.includes(listing.category) ? MATCH_WEIGHTS.need : 0

  return {
    distanceKm,
    score: Math.round(distanceScore + quantityScore + timingScore + categoryBonus),
    reasons: [
      `${distanceKm == null ? 'Area' : distanceKm.toFixed(1) + ' km'} away`,
      `fits your ${capacity}-meal daily capacity`,
      hoursLeft > 0 ? `pickup window has ${Math.max(1, Math.ceil(hoursLeft))}h left` : 'pickup window is closing',
    ],
  }
}

export function rankListings(listings, receiver, sort = 'best-match') {
  const ranked = listings
    .filter((listing) => {
      const deadline = new Date(listing.pickupDeadline).getTime()
      const isOpen = listing.status === 'Active' || listing.status === 'Available'
      return isOpen && deadline > Date.now() && Number(listing.availableQuantity ?? listing.quantity) > 0
    })
    .map((listing) => ({ ...listing, match: matchListing(listing, receiver) }))

  if (sort === 'soonest') {
    return ranked.sort((a, b) => new Date(a.pickupDeadline) - new Date(b.pickupDeadline))
  }
  if (sort === 'nearest') {
    return ranked.sort((a, b) => (a.match.distanceKm ?? 999) - (b.match.distanceKm ?? 999))
  }
  return ranked.sort((a, b) => b.match.score - a.match.score)
}
