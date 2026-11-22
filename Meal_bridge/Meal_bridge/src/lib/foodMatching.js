// Rule-based food matching. Pure JavaScript with no imports, so it can run under plain Node.
// Distances are great-circle estimates between the listing pickup point and the receiver location.

const EARTH_RADIUS_KM = 6371
const MS_PER_MINUTE = 60000
const MIN_MINUTES_TO_COLLECT = 30

const WEIGHTS = {
  distance: 0.35,
  quantity: 0.25,
  deadline: 0.2,
  category: 0.2,
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

// Great-circle distance in km between two {lat, lng} points.
export function haversineKm(a, b) {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function formatMinutesToDeadline(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `Pickup in ${hours} h ${minutes} min` : `Pickup in ${minutes} min`
}

// Checks one listing against one receiver. Hard filters run first; the weighted score runs only when all pass.
export function scoreMatch(listing, receiver, now = Date.now()) {
  // A listing without coordinates is treated as infinitely far, so it fails the radius filter.
  const distanceKm = listing.coords ? haversineKm(listing.coords, receiver) : Infinity
  const excluded = (excludedReason) => ({
    eligible: false,
    score: 0,
    reasons: [],
    excludedReason,
    distanceKm,
  })

  // Hard filters, in order.
  if (listing.status !== 'Active') {
    return excluded('Listing is not active')
  }

  const remaining = listing.quantity - listing.claimedQuantity
  if (remaining <= 0) {
    return excluded('No quantity left')
  }

  const deadlineMs = new Date(listing.pickupDeadline).getTime()
  if (deadlineMs <= now) {
    return excluded('Pickup deadline has passed')
  }

  if (distanceKm > receiver.maxRadiusKm) {
    return excluded("Outside this receiver's pickup radius")
  }

  const excludedCategories = receiver.excludedCategories || []
  if (excludedCategories.includes(listing.category)) {
    return excluded('Category not accepted by this receiver')
  }

  const minutesToDeadline = Math.floor((deadlineMs - now) / MS_PER_MINUTE)
  if (minutesToDeadline < MIN_MINUTES_TO_COLLECT) {
    return excluded('Too little time to collect')
  }

  const reasons = []

  // Distance: 1 at 0 km, falling linearly to 0 at the receiver's radius.
  const distanceComponent =
    receiver.maxRadiusKm > 0 ? clamp01(1 - distanceKm / receiver.maxRadiusKm) : 1
  reasons.push(`${distanceKm.toFixed(1)} km away`)

  // Quantity fit. Meal listings are compared with receiver capacity; other units are not converted.
  let need = remaining
  let quantityComponent
  if (listing.unit === 'Meals') {
    need = receiver.dailyCapacityMeals
    if (remaining <= need) {
      quantityComponent = 1
      reasons.push(`Receiver can take all ${remaining} meals`)
    } else {
      quantityComponent = need / remaining
      reasons.push(`Receiver can take about ${need} of ${remaining} meals`)
    }
  } else {
    quantityComponent = 1
    reasons.push(`${remaining} ${String(listing.unit).toLowerCase()} available (not converted to meals)`)
  }

  // Deadline window.
  let deadlineComponent
  if (minutesToDeadline >= 60 && minutesToDeadline <= 360) {
    deadlineComponent = 1
  } else if (minutesToDeadline >= MIN_MINUTES_TO_COLLECT && minutesToDeadline < 60) {
    deadlineComponent = 0.6
  } else {
    deadlineComponent = 0.8
  }
  reasons.push(formatMinutesToDeadline(minutesToDeadline))

  // Category preference.
  const preferred = receiver.preferredCategories || []
  let categoryComponent
  if (preferred.length === 0) {
    categoryComponent = 0.5
    reasons.push('No category preferences set')
  } else if (preferred.includes(listing.category)) {
    categoryComponent = 1
    reasons.push('Category matches your preferences')
  } else {
    categoryComponent = 0.2
    reasons.push('Category is not in your preferences')
  }

  const weighted =
    WEIGHTS.distance * distanceComponent +
    WEIGHTS.quantity * quantityComponent +
    WEIGHTS.deadline * deadlineComponent +
    WEIGHTS.category * categoryComponent

  return {
    eligible: true,
    score: Math.round(100 * weighted),
    reasons,
    distanceKm,
  }
}

// Returns the top `limit` eligible receivers for a listing, best first.
export function rankReceiversForListing(listing, receivers, now = Date.now(), limit = 3) {
  return receivers
    .map((receiver) => ({ receiver, ...scoreMatch(listing, receiver, now) }))
    .filter((result) => result.eligible)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
      if (a.receiver.id < b.receiver.id) return -1
      if (a.receiver.id > b.receiver.id) return 1
      return 0
    })
    .slice(0, limit)
}
