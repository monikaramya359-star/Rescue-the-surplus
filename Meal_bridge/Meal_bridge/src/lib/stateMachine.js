export const LISTING_STATES = Object.freeze({
  POSTED: 'Active',
  CLAIMED: 'Claimed',
  COLLECTED: 'Collected',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
})

// Legacy status from the demo feed. Mapped to 'Active' in this one place.
export function normalizeListingStatus(status) {
  return status === 'Available' ? LISTING_STATES.POSTED : status
}

// Allowed next statuses. 'Claimed -> Cancelled' is conditional (see allowedTargets).
const EDGES = Object.freeze({
  Active: ['Claimed', 'Cancelled'],
  Claimed: ['Collected', 'Active'],
  Collected: ['Delivered'],
  Delivered: [],
  Cancelled: [],
  Expired: [],
})

// options.hasClaim: pass false to allow Claimed -> Cancelled (only when no claim is held).
function allowedTargets(from, options = {}) {
  const normalized = normalizeListingStatus(from)
  if (!Object.prototype.hasOwnProperty.call(EDGES, normalized)) return []
  const targets = [...EDGES[normalized]]
  if (normalized === 'Claimed' && options.hasClaim === false) targets.push('Cancelled')
  return targets
}

export function canTransition(from, to, options = {}) {
  return allowedTargets(from, options).includes(normalizeListingStatus(to))
}

export function nextAllowed(status, options = {}) {
  return allowedTargets(status, options)
}

export function validateListingTransition(from, to, options = {}) {
  const normalized = normalizeListingStatus(from)
  if (!Object.prototype.hasOwnProperty.call(EDGES, normalized)) {
    return { ok: false, error: `Unknown current status: ${from}` }
  }
  if (!canTransition(from, to, options)) {
    return { ok: false, error: `${from} cannot move to ${to}` }
  }
  return { ok: true }
}
