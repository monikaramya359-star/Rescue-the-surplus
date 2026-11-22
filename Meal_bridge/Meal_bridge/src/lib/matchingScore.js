/**
 * Listing-to-receiver matching score used by the receiver feed.
 *
 * IMPORTANT: distances are APPROXIMATE. The schema has no latitude/longitude,
 * so distance is estimated from the area-name lookup table below. Every magic
 * number used for matching lives in this file.
 */

/** Relative importance of each component. Must sum to 1. */
export const MATCH_WEIGHTS = Object.freeze({
  distance: 0.4,
  quantityFit: 0.25,
  timing: 0.25,
  need: 0.1,
});

/** Average travel time used to estimate collection time (≈30 km/h city driving). */
export const TRAVEL_MINUTES_PER_KM = 2;
/** Time allowed at the pickup point on top of travel time. */
export const PICKUP_BUFFER_MINUTES = 10;
/** Slack (minutes between ready time and deadline) at which timing scores 1. */
export const TIMING_FULL_SLACK_MINUTES = 60;
/** Distance at which the distance component reaches 0. */
export const MAX_MATCH_DISTANCE_KM = 20;

/** Used when a receiver has no capacityMeals set. */
export const DEFAULT_RECEIVER_CAPACITY_MEALS = 20;
/** Used when a receiver has no need value set (0..1). */
export const DEFAULT_RECEIVER_NEED = 0.5;
/** Need values at or above this add a reason string. */
export const HIGH_NEED_THRESHOLD = 0.7;

/** Distance assumed when either area is missing or not in the table. */
export const UNKNOWN_AREA_DISTANCE_KM = 8;

/**
 * Approximate road distance in km between pairs of area names.
 * APPROXIMATE ONLY: the schema has no lat/lng. Pairs are symmetric (A→B and
 * B→A are both looked up). Same-area pairs are 0 km. Area names are matched
 * case-insensitively. Unlisted pairs fall back to UNKNOWN_AREA_DISTANCE_KM.
 * Align these names with the app's real area list.
 */
export const AREA_DISTANCE_KM = Object.freeze({
  Central: { North: 3, East: 2.5, South: 2.5, West: 3, Riverside: 1.5 },
  North: { East: 4, West: 5, Riverside: 4, South: 6 },
  East: { South: 5, West: 7, Riverside: 3 },
  South: { West: 4, Riverside: 3 },
  West: { Riverside: 3 },
});

function normalizeArea(name) {
  return typeof name === 'string' ? name.trim().toLowerCase() : '';
}

const DISTANCE_INDEX = new Map();
for (const [from, targets] of Object.entries(AREA_DISTANCE_KM)) {
  for (const [to, km] of Object.entries(targets)) {
    DISTANCE_INDEX.set(`${normalizeArea(from)}|${normalizeArea(to)}`, km);
    DISTANCE_INDEX.set(`${normalizeArea(to)}|${normalizeArea(from)}`, km);
  }
}

/** Approximate km between two area names (see AREA_DISTANCE_KM). */
export function estimateDistanceKm(areaA, areaB) {
  const a = normalizeArea(areaA);
  const b = normalizeArea(areaB);
  if (!a || !b) return UNKNOWN_AREA_DISTANCE_KM;
  if (a === b) return 0;
  return DISTANCE_INDEX.get(`${a}|${b}`) ?? UNKNOWN_AREA_DISTANCE_KM;
}

function toDate(value) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function positiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Score a listing for a receiver.
 * @returns {{ score: number, reasons: string[] }} score in 0..1, rounded to 2 decimals.
 */
export function scoreListing(listing, receiver, now = new Date()) {
  const pickupArea = listing.pickupArea ?? listing.pickup_location;
  const deadline = toDate(listing.pickupDeadline ?? listing.pickup_deadline);
  const capacity = positiveNumber(receiver.capacityMeals, DEFAULT_RECEIVER_CAPACITY_MEALS);
  const quantity = Number.isFinite(Number(listing.quantity)) ? Number(listing.quantity) : 0;
  const need = clamp01(
    Number.isFinite(receiver.need) ? receiver.need : DEFAULT_RECEIVER_NEED,
  );
  const reasons = [];

  // Distance: nearer is higher.
  const km = estimateDistanceKm(pickupArea, receiver.area);
  const distanceScore = clamp01(1 - km / MAX_MATCH_DISTANCE_KM);
  reasons.push(`~${km.toFixed(1)} km away (approx.)`);

  // Quantity fit: fitting listing = 1, exceeding capacity scores lower.
  let quantityScore = 0;
  if (quantity > 0 && quantity <= capacity) {
    quantityScore = 1;
    reasons.push(`fits your ${capacity}-meal capacity`);
  } else if (quantity > capacity) {
    quantityScore = capacity / quantity;
    reasons.push(`exceeds your ${capacity}-meal capacity`);
  } else {
    reasons.push('no quantity listed');
  }

  // Timing: can the receiver collect before the deadline, given travel time?
  let timingScore = 0;
  if (deadline) {
    const travelMinutes = km * TRAVEL_MINUTES_PER_KM + PICKUP_BUFFER_MINUTES;
    const readyAt = new Date(now.getTime() + travelMinutes * 60000);
    const slackMinutes = (deadline.getTime() - readyAt.getTime()) / 60000;
    if (slackMinutes >= 0) {
      timingScore = clamp01(slackMinutes / TIMING_FULL_SLACK_MINUTES);
      reasons.push(`ready before ${formatTime(deadline)}`);
    } else {
      reasons.push('cannot reach before pickup deadline');
    }
  } else {
    reasons.push('no pickup deadline set');
  }

  // Need: receiver-provided urgency, 0..1.
  const needScore = need;
  if (need >= HIGH_NEED_THRESHOLD) {
    reasons.push('high need');
  }

  const weighted =
    MATCH_WEIGHTS.distance * distanceScore +
    MATCH_WEIGHTS.quantityFit * quantityScore +
    MATCH_WEIGHTS.timing * timingScore +
    MATCH_WEIGHTS.need * needScore;

  return {
    score: Math.round(clamp01(weighted) * 100) / 100,
    reasons,
  };
}

/**
 * Statuses that may appear in the receiver feed. 'Available' is the legacy
 * name for 'Active' used by the receiver feed data.
 */
export const FEED_ELIGIBLE_STATUSES = ['Active', 'Available'];

/**
 * True only for listings whose status is feed-eligible (or missing) and whose
 * pickup deadline is still in the future.
 */
export function isListingFeedEligible(listing, now = new Date()) {
  if (listing.status != null && !FEED_ELIGIBLE_STATUSES.includes(listing.status)) return false;
  const deadline = toDate(listing.pickupDeadline ?? listing.pickup_deadline);
  if (!deadline) return false;
  return deadline.getTime() > now.getTime();
}
